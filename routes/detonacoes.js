const express = require('express');
const router = express.Router();
const pool = require('../db');
const { autenticar } = require('../middleware/auth');

router.use(autenticar);

router.get('/', async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT d.*, p.nome AS ponto_nome, u.nome AS responsavel_nome
       FROM detonacoes d
       JOIN pontos_monitoramento p ON p.id = d.ponto_id
       JOIN usuarios u ON u.id = d.responsavel_id
       ORDER BY d.data_hora DESC`
    );
    res.json(resultado.rows);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao listar detonacoes' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { identificador, data_hora, ponto_id, descricao } = req.body;

    if (!identificador || !data_hora || !ponto_id) {
      return res.status(400).json({ erro: 'Identificador, data/hora e ponto sao obrigatorios' });
    }

    const resultado = await pool.query(
      `INSERT INTO detonacoes (identificador, data_hora, ponto_id, responsavel_id, descricao)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [identificador, data_hora, ponto_id, req.usuario.id, descricao || null]
    );

    res.status(201).json(resultado.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ erro: 'Identificador de detonacao ja existe' });
    }
    res.status(500).json({ erro: 'Erro ao cadastrar detonacao' });
  }
});

module.exports = router;
