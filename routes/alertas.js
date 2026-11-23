const express = require('express');
const router = express.Router();
const pool = require('../db');
const { autenticar, autorizar } = require('../middleware/auth');
const { validarResolucao, alertaAtrasado } = require('../services/regras');

router.use(autenticar);

router.get('/', async (req, res) => {
  try {
    const { status } = req.query;

    let query = `SELECT a.*, m.tipo, m.valor, m.unidade, p.nome AS ponto_nome, u.nome AS resolvido_por_nome
       FROM alertas a
       JOIN medicoes m ON m.id = a.medicao_id
       JOIN pontos_monitoramento p ON p.id = m.ponto_id
       LEFT JOIN usuarios u ON u.id = a.resolvido_por`;
    const params = [];

    if (status === 'aberto' || status === 'resolvido') {
      params.push(status);
      query += ' WHERE a.status = $1';
    }

    query += ' ORDER BY a.data_hora DESC';

    const resultado = await pool.query(query, params);
    // RN18: marca alertas abertos ha mais de 48h
    res.json(resultado.rows.map((a) => ({ ...a, atrasado: alertaAtrasado(a.status, a.data_hora) })));
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao listar alertas', orientacao: 'Tente novamente em alguns segundos. Se o problema continuar, avise o administrador informando o horário.' });
  }
});

// Correcao: antes retornava 200 com undefined para id inexistente e nao
// registrava quem resolveu. Agora: 404 se nao existe, 409 se ja resolvido,
// e grava resolvido_em / resolvido_por para o relatorio gerencial (US10).
router.put('/:id/resolver', autorizar('operador', 'admin'), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ erro: 'Id invalido' });

    const atual = await pool.query('SELECT status, nivel FROM alertas WHERE id = $1', [id]);
    if (atual.rows.length === 0) return res.status(404).json({ erro: 'Alerta nao encontrado' });
    if (atual.rows[0].status === 'resolvido') return res.status(409).json({ erro: 'Alerta ja estava resolvido' });

    // RN14: alerta critico exige observacao da providencia tomada
    const resolucao = validarResolucao(atual.rows[0].nivel, req.body && req.body.observacao);
    if (!resolucao.ok) return res.status(400).json({ erro: resolucao.erro });

    const resultado = await pool.query(
      `UPDATE alertas SET status = 'resolvido', resolvido_em = now(), resolvido_por = $2, resolucao_obs = $3
       WHERE id = $1 RETURNING *`,
      [id, req.usuario.id, resolucao.observacao]
    );
    res.json(resultado.rows[0]);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao resolver alerta', orientacao: 'Tente novamente em alguns segundos. Se o problema continuar, avise o administrador informando o horário.' });
  }
});

module.exports = router;
