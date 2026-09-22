const express = require('express');
const router = express.Router();
const pool = require('../db');
const { autenticar } = require('../middleware/auth');

router.use(autenticar);

router.get('/', async (req, res) => {
  try {
    const { status } = req.query;

    let query = `SELECT a.*, m.tipo, m.valor, m.unidade, p.nome AS ponto_nome
       FROM alertas a
       JOIN medicoes m ON m.id = a.medicao_id
       JOIN pontos_monitoramento p ON p.id = m.ponto_id`;
    const params = [];

    if (status === 'aberto' || status === 'resolvido') {
      params.push(status);
      query += ' WHERE a.status = $1';
    }

    query += ' ORDER BY a.data_hora DESC';

    const resultado = await pool.query(query, params);
    res.json(resultado.rows);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao listar alertas' });
  }
});

router.put('/:id/resolver', async (req, res) => {
  try {
    const resultado = await pool.query(
      `UPDATE alertas SET status = 'resolvido' WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    res.json(resultado.rows[0]);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao resolver alerta' });
  }
});

module.exports = router;
