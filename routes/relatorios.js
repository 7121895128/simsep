// US10 - Relatorios gerenciais basicos (apenas administrador)
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { autenticar, autorizar } = require('../middleware/auth');
const { montarPeriodo } = require('../services/validacao');

router.use(autenticar, autorizar('admin'));

router.get('/gerencial', async (req, res) => {
  const periodo = montarPeriodo(req.query.inicio, req.query.fim);
  if (!periodo.ok) return res.status(400).json({ erro: periodo.erro });

  // Padrao: ultimos 30 dias
  const inicio = periodo.periodo ? periodo.periodo.inicio : null;
  const fim = periodo.periodo ? periodo.periodo.fim : null;
  const params = [inicio, fim];
  const filtroMed = `m.data_hora BETWEEN COALESCE($1::timestamp, now() - interval '30 days') AND COALESCE($2::timestamp, now())`;
  const filtroAlerta = `a.data_hora BETWEEN COALESCE($1::timestamp, now() - interval '30 days') AND COALESCE($2::timestamp, now())`;
  const filtroDet = `d.data_hora BETWEEN COALESCE($1::timestamp, now() - interval '30 days') AND COALESCE($2::timestamp, now())`;

  try {
    const [totais, porTipo, porPonto, tempoResolucao, porSemana, detonacoes] = await Promise.all([
      pool.query(
        `SELECT
           (SELECT COUNT(*) FROM medicoes m WHERE ${filtroMed}) AS total_medicoes,
           (SELECT COUNT(*) FROM alertas a WHERE ${filtroAlerta}) AS total_alertas,
           (SELECT COUNT(*) FROM alertas a WHERE ${filtroAlerta} AND a.status = 'resolvido') AS alertas_resolvidos,
           (SELECT COUNT(*) FROM detonacoes d WHERE ${filtroDet}) AS total_detonacoes,
           (SELECT COUNT(*) FROM pontos_monitoramento) AS total_pontos`,
        params
      ),
      pool.query(
        `SELECT m.tipo, COUNT(*) AS medicoes,
                COUNT(a.id) AS alertas,
                ROUND(AVG(m.valor), 2) AS media, ROUND(MAX(m.valor), 2) AS maximo,
                l.valor_limite, l.unidade
         FROM medicoes m
         LEFT JOIN alertas a ON a.medicao_id = m.id
         LEFT JOIN limites_seguranca l ON l.tipo = m.tipo
         WHERE ${filtroMed}
         GROUP BY m.tipo, l.valor_limite, l.unidade
         ORDER BY m.tipo`,
        params
      ),
      pool.query(
        `SELECT p.nome AS ponto_nome, COUNT(m.id) AS medicoes, COUNT(a.id) AS alertas,
                COUNT(a.id) FILTER (WHERE a.status = 'aberto') AS alertas_abertos
         FROM pontos_monitoramento p
         LEFT JOIN medicoes m ON m.ponto_id = p.id AND ${filtroMed}
         LEFT JOIN alertas a ON a.medicao_id = m.id
         GROUP BY p.id, p.nome
         ORDER BY alertas DESC, p.nome`,
        params
      ),
      pool.query(
        `SELECT ROUND(AVG(EXTRACT(EPOCH FROM (a.resolvido_em - a.data_hora)) / 3600)::numeric, 1) AS horas_medias,
                ROUND(MAX(EXTRACT(EPOCH FROM (a.resolvido_em - a.data_hora)) / 3600)::numeric, 1) AS horas_maximas
         FROM alertas a
         WHERE ${filtroAlerta} AND a.status = 'resolvido' AND a.resolvido_em IS NOT NULL`,
        params
      ),
      pool.query(
        `SELECT to_char(date_trunc('week', m.data_hora), 'DD/MM') AS semana,
                COUNT(*) AS medicoes, COUNT(a.id) AS alertas
         FROM medicoes m
         LEFT JOIN alertas a ON a.medicao_id = m.id
         WHERE ${filtroMed}
         GROUP BY date_trunc('week', m.data_hora)
         ORDER BY date_trunc('week', m.data_hora)`,
        params
      ),
      pool.query(
        `SELECT d.identificador, d.data_hora, p.nome AS ponto_nome,
                COUNT(m.id) AS medicoes_vinculadas, COUNT(a.id) AS alertas_vinculados
         FROM detonacoes d
         JOIN pontos_monitoramento p ON p.id = d.ponto_id
         LEFT JOIN medicoes m ON m.detonacao_id = d.id
         LEFT JOIN alertas a ON a.medicao_id = m.id
         WHERE ${filtroDet}
         GROUP BY d.id, d.identificador, d.data_hora, p.nome
         ORDER BY d.data_hora DESC`,
        params
      )
    ]);

    const t = totais.rows[0];
    const totalAlertas = Number(t.total_alertas);
    const resolvidos = Number(t.alertas_resolvidos);

    res.json({
      periodo: { inicio: inicio || null, fim: fim || null, padrao: !inicio && !fim ? 'ultimos 30 dias' : null },
      totais: {
        pontos: Number(t.total_pontos),
        medicoes: Number(t.total_medicoes),
        detonacoes: Number(t.total_detonacoes),
        alertas: totalAlertas,
        alertas_resolvidos: resolvidos,
        percentual_resolvidos: totalAlertas === 0 ? 100 : Math.round((resolvidos / totalAlertas) * 100)
      },
      tempo_resolucao: tempoResolucao.rows[0],
      por_tipo: porTipo.rows,
      por_ponto: porPonto.rows,
      por_semana: porSemana.rows,
      detonacoes: detonacoes.rows
    });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao gerar relatorio gerencial' });
  }
});

module.exports = router;
