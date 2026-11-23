const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../db');
const { autenticar, autorizar } = require('../middleware/auth');
const { validarUsuario, normalizarEmail } = require('../services/validacao');

router.use(autenticar, autorizar('admin'));

router.get('/', async (req, res) => {
  try {
    const resultado = await pool.query(
      'SELECT id, nome, email, perfil, criado_em FROM usuarios ORDER BY nome'
    );
    res.json(resultado.rows);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao listar usuarios', orientacao: 'Tente novamente em alguns segundos. Se o problema continuar, avise o administrador informando o horário.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { nome, email, senha, perfil } = req.body;

    const validacao = validarUsuario({ nome, email, senha, perfil });
    if (!validacao.valido) {
      return res.status(400).json({ erro: validacao.erros.join('; ') });
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    const resultado = await pool.query(
      `INSERT INTO usuarios (nome, email, senha_hash, perfil)
       VALUES ($1, $2, $3, $4) RETURNING id, nome, email, perfil, criado_em`,
      [validacao.dados.nome, validacao.dados.email, senhaHash, perfil]
    );

    res.status(201).json(resultado.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ erro: 'E-mail ja cadastrado' });
    }
    res.status(500).json({ erro: 'Erro ao cadastrar usuario', orientacao: 'Tente novamente em alguns segundos. Se o problema continuar, avise o administrador informando o horário.' });
  }
});

// US16: admin redefine a senha de um usuario; gera senha temporaria e exige troca no proximo login
router.post('/:id/redefinir-senha', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ erro: 'Id invalido' });
    const senhaTemporaria = 'simsep-' + Math.random().toString(36).slice(2, 8);
    const hash = await bcrypt.hash(senhaTemporaria, 10);
    const r = await pool.query(
      'UPDATE usuarios SET senha_hash = $2, trocar_senha = TRUE WHERE id = $1 RETURNING id, nome, email',
      [id, hash]
    );
    if (r.rows.length === 0) return res.status(404).json({ erro: 'Usuario nao encontrado' });
    res.json({ ...r.rows[0], senha_temporaria: senhaTemporaria });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao redefinir senha', orientacao: 'Tente novamente em alguns segundos. Se o problema continuar, avise o administrador informando o horário.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const idAlvo = Number(req.params.id);

    if (idAlvo === req.usuario.id) {
      return res.status(400).json({ erro: 'Você não pode excluir a própria conta' });
    }

    const alvo = await pool.query('SELECT perfil FROM usuarios WHERE id = $1', [idAlvo]);

    if (alvo.rows.length === 0) {
      return res.status(404).json({ erro: 'Usuario não encontrado' });
    }

    if (alvo.rows[0].perfil === 'admin') {
      const totalAdmins = await pool.query(`SELECT COUNT(*) FROM usuarios WHERE perfil = 'admin'`);
      if (Number(totalAdmins.rows[0].count) <= 1) {
        return res.status(400).json({ erro: 'Não é possível excluir o único administrador do sistema' });
      }
    }

    await pool.query('DELETE FROM usuarios WHERE id = $1', [idAlvo]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao excluir usuario', orientacao: 'Tente novamente em alguns segundos. Se o problema continuar, avise o administrador informando o horário.' });
  }
});

module.exports = router;
