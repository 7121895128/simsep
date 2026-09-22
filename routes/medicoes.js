const express = require('express');
const router = express.Router();
const pool = require('../db');
const { autenticar } = require('../middleware/auth');

router.use(autenticar);

router.get('/', async (req, res) => {
  try {
    const { inicio, fim } = req.query;
    let query = `SELECT m.*, p.nome AS ponto_nome
                 FROM medicoes m
                 JOIN pontos_monitoramento p ON p.id = m.ponto_id`;
    const params = [];

    if (inicio && fim) {
      params.push(inicio, fim);
      query += ' WHERE m.data_hora BETWEEN $1 AND $2';
    }

    query += ' ORDER BY m.data_hora DESC';

    const resultado = await pool.query(query, params);
    res.json(resultado.rows);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao listar medicoes' });
  }
});

router.post('/', async (req, res) => {
  const cliente = await pool.connect();
  try {
    const { ponto_id, detonacao_id, tipo, valor, unidade } = req.body;

    if (!ponto_id || !tipo || valor === undefined || !unidade) {
      return res.status(400).json({ erro: 'Ponto, tipo, valor e unidade sao obrigatorios' });
    }

    await cliente.query('BEGIN');

    const medicao = await cliente.query(
      `INSERT INTO medicoes (ponto_id, detonacao_id, tipo, valor, unidade)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [ponto_id, detonacao_id || null, tipo, valor, unidade]
    );

    const limite = await cliente.query(
      'SELECT * FROM limites_seguranca WHERE tipo = $1',
      [tipo]
    );

    let alertaGerado = null;

    if (limite.rows.length > 0 && Number(valor) > Number(limite.rows[0].valor_limite)) {
      const mensagem = `Medicao de ${tipo} (${valor} ${unidade}) ultrapassou o limite de ${limite.rows[0].valor_limite} ${limite.rows[0].unidade}`;

      const alerta = await cliente.query(
        `INSERT INTO alertas (medicao_id, mensagem, status)
         VALUES ($1, $2, 'aberto') RETURNING *`,
        [medicao.rows[0].id, mensagem]
      );

      alertaGerado = alerta.rows[0];
    }

    await cliente.query('COMMIT');

    res.status(201).json({ medicao: medicao.rows[0], alerta: alertaGerado });
  } catch (err) {
    await cliente.query('ROLLBACK');
    res.status(500).json({ erro: 'Erro ao registrar medicao' });
  } finally {
    cliente.release();
  }
});

module.exports = router;
