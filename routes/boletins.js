// US07 - Boletins periodicos informativos.
// Operador/admin geram e emitem; a comunidade consulta via /api/publico/boletins.
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { autenticar, autorizar } = require('../middleware/auth');
const { montarPeriodo } = require('../services/validacao');
const { montarBoletim } = require('../services/boletim');

async function consultarDadosBoletim(periodo) {
  const params = [periodo.inicio, periodo.fim];

  const [estatisticas, detonacoes, alertas, pontos] = await Promise.all([
    pool.query(
      `SELECT p.nome AS ponto_nome, m.tipo, m.unidade,
              COUNT(*) AS quantidade, ROUND(AVG(m.valor), 2) AS media, ROUND(MAX(m.valor), 2) AS maximo,
              l.valor_limite
       FROM medicoes m
       JOIN pontos_monitoramento p ON p.id = m.ponto_id
       LEFT JOIN limites_seguranca l ON l.tipo = m.tipo
       WHERE m.data_hora BETWEEN $1 AND $2
       GROUP BY p.nome, m.tipo, m.unidade, l.valor_limite
       ORDER BY p.nome, m.tipo`,
      params
    ),
    pool.query(
      `SELECT d.identificador, d.data_hora, p.nome AS ponto_nome, p.localizacao
       FROM detonacoes d JOIN pontos_monitoramento p ON p.id = d.ponto_id
       WHERE d.data_hora BETWEEN $1 AND $2
       ORDER BY d.data_hora`,
      params
    ),
    pool.query(
      `SELECT a.status, a.mensagem, a.data_hora, p.nome AS ponto_nome
       FROM alertas a JOIN medicoes m ON m.id = a.medicao_id
       JOIN pontos_monitoramento p ON p.id = m.ponto_id
       WHERE a.data_hora BETWEEN $1 AND $2`,
      params
    ),
    pool.query('SELECT COUNT(*) FROM pontos_monitoramento')
  ]);

  return montarBoletim({
    periodo,
    estatisticas: estatisticas.rows,
    detonacoes: detonacoes.rows,
    alertas: alertas.rows,
    pontos: Number(pontos.rows[0].count)
  });
}

router.use(autenticar);

// Previa do boletim para um periodo (nao grava)
router.get('/previa', async (req, res) => {
  const periodo = montarPeriodo(req.query.inicio, req.query.fim);
  if (!periodo.ok) return res.status(400).json({ erro: periodo.erro });
  if (!periodo.periodo) return res.status(400).json({ erro: 'Informe inicio e fim do periodo' });

  try {
    res.json(await consultarDadosBoletim(periodo.periodo));
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao montar previa do boletim' });
  }
});

// Lista boletins emitidos (uso interno)
router.get('/', async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT b.id, b.titulo, b.periodo_inicio, b.periodo_fim, b.resumo, b.emitido_em, u.nome AS emitido_por_nome
       FROM boletins b JOIN usuarios u ON u.id = b.emitido_por
       ORDER BY b.emitido_em DESC`
    );
    res.json(resultado.rows);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao listar boletins' });
  }
});

// Emite (publica) o boletim do periodo: grava um "retrato" dos dados,
// para que o que a comunidade leu nao mude depois.
router.post('/', autorizar('operador', 'admin'), async (req, res) => {
  const { titulo, inicio, fim } = req.body;
  const periodo = montarPeriodo(inicio, fim);
  if (!periodo.ok) return res.status(400).json({ erro: periodo.erro });
  if (!periodo.periodo || !inicio || !fim) return res.status(400).json({ erro: 'Informe inicio e fim do periodo' });

  try {
    const conteudo = await consultarDadosBoletim(periodo.periodo);
    const tituloFinal = (titulo && String(titulo).trim()) || `Boletim de ${inicio} a ${fim}`;

    const resultado = await pool.query(
      `INSERT INTO boletins (titulo, periodo_inicio, periodo_fim, resumo, conteudo, emitido_por)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, titulo, periodo_inicio, periodo_fim, resumo, emitido_em`,
      [tituloFinal, inicio, fim, conteudo.resumo, JSON.stringify(conteudo), req.usuario.id]
    );
    res.status(201).json(resultado.rows[0]);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao emitir boletim' });
  }
});

module.exports = router;
