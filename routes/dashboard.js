const express = require('express');
const router = express.Router();
const pool = require('../db');
const { autenticar } = require('../middleware/auth');
const { alertaAtrasado, HORAS_ALERTA_ATRASADO } = require('../services/regras');

router.use(autenticar);

router.get('/resumo', async (req, res) => {
  try {
    const [pontos, detonacoes, medicoes, alertasAbertos, ultimosAlertas] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM pontos_monitoramento'),
      pool.query('SELECT COUNT(*) FROM detonacoes'),
      pool.query('SELECT COUNT(*) FROM medicoes'),
      pool.query(`SELECT COUNT(*) FROM alertas WHERE status = 'aberto'`),
      pool.query(
        `SELECT a.id, a.mensagem, a.data_hora, a.nivel, a.status, p.nome AS ponto_nome
         FROM alertas a
         JOIN medicoes m ON m.id = a.medicao_id
         JOIN pontos_monitoramento p ON p.id = m.ponto_id
         WHERE a.status = 'aberto'
         ORDER BY a.data_hora DESC
         LIMIT 5`
      )
    ]);

    res.json({
      totalPontos: Number(pontos.rows[0].count),
      totalDetonacoes: Number(detonacoes.rows[0].count),
      totalMedicoes: Number(medicoes.rows[0].count),
      alertasAbertos: Number(alertasAbertos.rows[0].count),
      alertasAtrasados: ultimosAlertas.rows.filter((a) => alertaAtrasado(a.status, a.data_hora)).length,
      horasAtraso: HORAS_ALERTA_ATRASADO,
      ultimosAlertas: ultimosAlertas.rows.map((a) => ({ ...a, atrasado: alertaAtrasado(a.status, a.data_hora) }))
    });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao carregar o resumo', orientacao: 'Tente novamente em alguns segundos. Se o problema continuar, avise o administrador informando o horário.' });
  }
});

module.exports = router;
