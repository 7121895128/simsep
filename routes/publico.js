const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/detonacoes', async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT d.identificador, d.data_hora, d.descricao, p.nome AS ponto_nome, p.localizacao
       FROM detonacoes d
       JOIN pontos_monitoramento p ON p.id = d.ponto_id
       WHERE d.data_hora >= now()
       ORDER BY d.data_hora ASC
       LIMIT 15`
    );
    res.json(resultado.rows);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao listar detonações programadas' });
  }
});

router.get('/medicoes-atuais', async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT DISTINCT ON (m.ponto_id, m.tipo)
         m.tipo, m.valor, m.unidade, m.data_hora,
         p.nome AS ponto_nome,
         l.valor_limite,
         CASE WHEN m.valor > l.valor_limite THEN 'acima_limite' ELSE 'normal' END AS situacao
       FROM medicoes m
       JOIN pontos_monitoramento p ON p.id = m.ponto_id
       LEFT JOIN limites_seguranca l ON l.tipo = m.tipo
       ORDER BY m.ponto_id, m.tipo, m.data_hora DESC`
    );
    res.json(resultado.rows);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao listar medições atuais' });
  }
});

router.get('/alertas', async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT a.mensagem, a.status, a.data_hora, m.tipo, p.nome AS ponto_nome
       FROM alertas a
       JOIN medicoes m ON m.id = a.medicao_id
       JOIN pontos_monitoramento p ON p.id = m.ponto_id
       ORDER BY a.data_hora DESC
       LIMIT 10`
    );
    res.json(resultado.rows);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao listar alertas' });
  }
});

module.exports = router;
