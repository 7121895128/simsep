const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
require('dotenv').config();
const { normalizarEmail } = require('../services/validacao');

router.post('/registrar', async (req, res) => {
  try {
    const totalUsuarios = await pool.query('SELECT COUNT(*) FROM usuarios');

    if (Number(totalUsuarios.rows[0].count) > 0) {
      return res.status(403).json({
        erro: 'Cadastro público desabilitado. Peça a um administrador para criar seu acesso.'
      });
    }

    const { nome, senha } = req.body;
    const email = normalizarEmail(req.body.email);

    if (!nome || !email || !senha) {
      return res.status(400).json({ erro: 'Preencha todos os campos' });
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    const resultado = await pool.query(
      `INSERT INTO usuarios (nome, email, senha_hash, perfil)
       VALUES ($1, $2, $3, 'admin') RETURNING id, nome, email, perfil`,
      [nome, email, senhaHash]
    );

    res.status(201).json(resultado.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ erro: 'E-mail ja cadastrado' });
    }
    res.status(500).json({ erro: 'Erro ao registrar usuario', orientacao: 'Tente novamente em alguns segundos. Se o problema continuar, avise o administrador informando o horário.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { senha } = req.body;
    const email = normalizarEmail(req.body.email);

    if (!email || !senha) {
      return res.status(400).json({ erro: 'Preencha e-mail e senha' });
    }

    const resultado = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);

    if (resultado.rows.length === 0) {
      return res.status(401).json({ erro: 'Credenciais invalidas' });
    }

    const usuario = resultado.rows[0];
    const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash);

    if (!senhaCorreta) {
      return res.status(401).json({ erro: 'Credenciais invalidas' });
    }

    const token = jwt.sign(
      { id: usuario.id, nome: usuario.nome, perfil: usuario.perfil },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ token, nome: usuario.nome, perfil: usuario.perfil, trocar_senha: Boolean(usuario.trocar_senha) });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao fazer login', orientacao: 'Tente novamente em alguns segundos. Se o problema continuar, avise o administrador informando o horário.' });
  }
});

// US16: usuario autenticado troca a propria senha (obrigatorio apos redefinicao pelo admin)
const { autenticar } = require('../middleware/auth');
router.put('/senha', autenticar, async (req, res) => {
  try {
    const { senha_atual, senha_nova } = req.body;
    if (!senha_atual || !senha_nova) return res.status(400).json({ erro: 'Informe a senha atual e a nova' });
    if (String(senha_nova).length < 6) return res.status(400).json({ erro: 'Senha nova deve ter ao menos 6 caracteres' });
    if (senha_atual === senha_nova) return res.status(400).json({ erro: 'A senha nova deve ser diferente da atual' });
    const r = await pool.query('SELECT senha_hash FROM usuarios WHERE id = $1', [req.usuario.id]);
    if (r.rows.length === 0) return res.status(404).json({ erro: 'Usuario nao encontrado' });
    const ok = await bcrypt.compare(senha_atual, r.rows[0].senha_hash);
    if (!ok) return res.status(401).json({ erro: 'Senha atual incorreta' });
    const hash = await bcrypt.hash(senha_nova, 10);
    await pool.query('UPDATE usuarios SET senha_hash = $2, trocar_senha = FALSE WHERE id = $1', [req.usuario.id, hash]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao trocar senha', orientacao: 'Tente novamente em alguns segundos. Se o problema continuar, avise o administrador informando o horário.' });
  }
});

module.exports = router;
