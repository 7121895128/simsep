const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../db');
const { autenticar, autorizar } = require('../middleware/auth');
const { validarUsuario } = require('../services/validacao');

router.use(autenticar, autorizar('admin'));

router.get('/', async (req, res) => {
  try {
    const resultado = await pool.query(
      'SELECT id, nome, email, perfil, criado_em FROM usuarios ORDER BY nome'
    );
    res.json(resultado.rows);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao listar usuarios' });
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
      [nome, email, senhaHash, perfil]
    );

    res.status(201).json(resultado.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ erro: 'E-mail ja cadastrado' });
    }
    res.status(500).json({ erro: 'Erro ao cadastrar usuario' });
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
    res.status(500).json({ erro: 'Erro ao excluir usuario' });
  }
});

module.exports = router;
