const express = require('express');
const router = express.Router();
const pool = require('../db');
const { autenticar } = require('../middleware/auth');

router.use(autenticar);

router.get('/', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM pontos_monitoramento ORDER BY nome');
    res.json(resultado.rows);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao listar pontos' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { nome, localizacao, descricao } = req.body;

    if (!nome || !localizacao) {
      return res.status(400).json({ erro: 'Nome e localizacao sao obrigatorios' });
    }

    const resultado = await pool.query(
      'INSERT INTO pontos_monitoramento (nome, localizacao, descricao) VALUES ($1, $2, $3) RETURNING *',
      [nome, localizacao, descricao || null]
    );

    res.status(201).json(resultado.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ erro: 'Ja existe um ponto com esse nome' });
    }
    res.status(500).json({ erro: 'Erro ao cadastrar ponto' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { nome, localizacao, descricao } = req.body;

    if (!nome || !localizacao) {
      return res.status(400).json({ erro: 'Nome e localizacao sao obrigatorios' });
    }

    const resultado = await pool.query(
      'UPDATE pontos_monitoramento SET nome = $1, localizacao = $2, descricao = $3 WHERE id = $4 RETURNING *',
      [nome, localizacao, descricao || null, req.params.id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ erro: 'Ponto não encontrado' });
    }

    res.json(resultado.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ erro: 'Ja existe um ponto com esse nome' });
    }
    res.status(500).json({ erro: 'Erro ao atualizar ponto' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM pontos_monitoramento WHERE id = $1', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao excluir ponto' });
  }
});

module.exports = router;
