const express = require('express');
const router = express.Router();
const pool = require('../db');
const { autenticar, autorizar } = require('../middleware/auth');
const { validarMedicao, montarPeriodo, TIPOS_MEDICAO } = require('../services/validacao');
const { avaliarLimite } = require('../services/alertas');
const { nivelAlerta, validarVinculoDetonacao, alertaAtrasado } = require('../services/regras');
const { gerarCsv } = require('../services/csv');

router.use(autenticar);

// Monta WHERE + params a partir dos filtros de historico (US09):
// periodo (inicio/fim), ponto_id e tipo. Reaproveitado por listagem, CSV e estatisticas.
function montarFiltros(query) {
  const { inicio, fim, ponto_id, tipo } = query;
  const condicoes = [];
  const params = [];

  const periodo = montarPeriodo(inicio, fim);
  if (!periodo.ok) return { erro: periodo.erro };

  if (periodo.periodo) {
    params.push(periodo.periodo.inicio, periodo.periodo.fim);
    condicoes.push(`m.data_hora BETWEEN $${params.length - 1} AND $${params.length}`);
  }
  if (ponto_id) {
    if (Number.isNaN(Number(ponto_id))) return { erro: 'ponto_id invalido' };
    params.push(Number(ponto_id));
    condicoes.push(`m.ponto_id = $${params.length}`);
  }
  if (tipo) {
    if (!TIPOS_MEDICAO.includes(tipo)) return { erro: 'tipo invalido' };
    params.push(tipo);
    condicoes.push(`m.tipo = $${params.length}`);
  }

  return { where: condicoes.length ? ' WHERE ' + condicoes.join(' AND ') : '', params };
}

const SQL_LISTAGEM = `
  SELECT m.*, p.nome AS ponto_nome, d.identificador AS detonacao_identificador,
         l.valor_limite,
         CASE WHEN l.valor_limite IS NOT NULL AND m.valor > l.valor_limite THEN 'acima_limite' ELSE 'normal' END AS situacao
  FROM medicoes m
  JOIN pontos_monitoramento p ON p.id = m.ponto_id
  LEFT JOIN detonacoes d ON d.id = m.detonacao_id
  LEFT JOIN limites_seguranca l ON l.tipo = m.tipo`;

// US04/US05/US09 - historico com filtros por periodo, ponto e tipo
router.get('/', async (req, res) => {
  try {
    const filtros = montarFiltros(req.query);
    if (filtros.erro) return res.status(400).json({ erro: filtros.erro });

    // US20: paginacao (pagina 1..N, 50 por pagina por padrao, maximo 200)
    const porPagina = Math.min(200, Math.max(1, Number(req.query.por_pagina) || 50));
    const pagina = Math.max(1, Number(req.query.pagina) || 1);
    const params = filtros.params.concat([porPagina, (pagina - 1) * porPagina]);
    const [resultado, total] = await Promise.all([
      pool.query(SQL_LISTAGEM + filtros.where + ` ORDER BY m.data_hora DESC LIMIT $${params.length - 1} OFFSET $${params.length}`, params),
      pool.query('SELECT COUNT(*) FROM medicoes m' + filtros.where, filtros.params)
    ]);
    res.setHeader('X-Total', total.rows[0].count);
    res.setHeader('X-Pagina', pagina);
    res.setHeader('X-Por-Pagina', porPagina);
    res.json(resultado.rows);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao listar medicoes', orientacao: 'Tente novamente em alguns segundos. Se o problema continuar, avise o administrador informando o horário.' });
  }
});

// US09 - estatisticas do periodo (min, media, max e quantidade por ponto e tipo)
router.get('/estatisticas', async (req, res) => {
  try {
    const filtros = montarFiltros(req.query);
    if (filtros.erro) return res.status(400).json({ erro: filtros.erro });

    const resultado = await pool.query(
      `SELECT p.id AS ponto_id, p.nome AS ponto_nome, m.tipo, m.unidade,
              COUNT(*) AS quantidade,
              ROUND(MIN(m.valor), 2) AS minimo,
              ROUND(AVG(m.valor), 2) AS media,
              ROUND(MAX(m.valor), 2) AS maximo,
              l.valor_limite,
              COUNT(*) FILTER (WHERE l.valor_limite IS NOT NULL AND m.valor > l.valor_limite) AS acima_limite
       FROM medicoes m
       JOIN pontos_monitoramento p ON p.id = m.ponto_id
       LEFT JOIN limites_seguranca l ON l.tipo = m.tipo
       ${filtros.where}
       GROUP BY p.id, p.nome, m.tipo, m.unidade, l.valor_limite
       ORDER BY p.nome, m.tipo`,
      filtros.params
    );
    res.json(resultado.rows);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao calcular estatisticas', orientacao: 'Tente novamente em alguns segundos. Se o problema continuar, avise o administrador informando o horário.' });
  }
});

// US09 - exportacao CSV do historico filtrado
router.get('/exportar', async (req, res) => {
  try {
    const filtros = montarFiltros(req.query);
    if (filtros.erro) return res.status(400).json({ erro: filtros.erro });

    const resultado = await pool.query(
      SQL_LISTAGEM + filtros.where + ' ORDER BY m.data_hora DESC',
      filtros.params
    );

    const csv = gerarCsv([
      { rotulo: 'ID', campo: 'id' },
      { rotulo: 'Data/Hora', valor: (m) => new Date(m.data_hora).toLocaleString('pt-BR') },
      { rotulo: 'Ponto', campo: 'ponto_nome' },
      { rotulo: 'Tipo', campo: 'tipo' },
      { rotulo: 'Valor', valor: (m) => String(m.valor).replace('.', ',') },
      { rotulo: 'Unidade', campo: 'unidade' },
      { rotulo: 'Limite', valor: (m) => (m.valor_limite === null ? '' : String(m.valor_limite).replace('.', ',')) },
      { rotulo: 'Situacao', campo: 'situacao' },
      { rotulo: 'Detonacao', campo: 'detonacao_identificador' }
    ], resultado.rows);

    const nome = `medicoes_${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${nome}"`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao exportar medicoes', orientacao: 'Tente novamente em alguns segundos. Se o problema continuar, avise o administrador informando o horário.' });
  }
});

// US04/US05/US06 - registrar medicao + alerta automatico na mesma transacao.
// Apenas operador e admin lancam medicoes; engenheiro consulta.
router.post('/', autorizar('operador', 'admin'), async (req, res) => {
  const validacao = validarMedicao(req.body);
  if (!validacao.valido) {
    return res.status(400).json({ erro: validacao.erros.join('; ') });
  }

  const { ponto_id, tipo, valor, unidade } = validacao.dados;
  const detonacao_id = req.body.detonacao_id ? Number(req.body.detonacao_id) : null;

  const cliente = await pool.connect();
  try {
    // RN16: so vincula a detonacao ja ocorrida, nas ultimas 48h
    if (detonacao_id) {
      const det = await cliente.query('SELECT data_hora FROM detonacoes WHERE id = $1', [detonacao_id]);
      const vinculo = validarVinculoDetonacao(det.rows[0] ? det.rows[0].data_hora : null);
      if (!vinculo.ok) {
        cliente.release();
        return res.status(400).json({ erro: vinculo.erro });
      }
    }

    await cliente.query('BEGIN');

    const medicao = await cliente.query(
      `INSERT INTO medicoes (ponto_id, detonacao_id, tipo, valor, unidade)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [ponto_id, detonacao_id, tipo, valor, unidade]
    );

    const limite = await cliente.query('SELECT * FROM limites_seguranca WHERE tipo = $1', [tipo]);
    const avaliacao = avaliarLimite({ tipo, valor, unidade }, limite.rows[0]);

    let alertaGerado = null;
    if (avaliacao.ultrapassou) {
      // RN14: nivel gravado no momento da medicao (nao muda se o limite mudar depois)
      const nivel = nivelAlerta(valor, limite.rows[0].valor_limite);
      const alerta = await cliente.query(
        `INSERT INTO alertas (medicao_id, mensagem, status, nivel) VALUES ($1, $2, 'aberto', $3) RETURNING *`,
        [medicao.rows[0].id, avaliacao.mensagem, nivel]
      );
      alertaGerado = alerta.rows[0];
    }

    await cliente.query('COMMIT');
    res.status(201).json({ medicao: medicao.rows[0], alerta: alertaGerado });
  } catch (err) {
    await cliente.query('ROLLBACK');
    if (err.code === '23503') {
      return res.status(400).json({ erro: 'Ponto ou detonacao informados nao existem' });
    }
    if (err.code === '23514') {
      return res.status(400).json({ erro: 'Valor fora das regras do banco' });
    }
    res.status(500).json({ erro: 'Erro ao registrar medicao', orientacao: 'Tente novamente em alguns segundos. Se o problema continuar, avise o administrador informando o horário.' });
  } finally {
    cliente.release();
  }
});

module.exports = router;
