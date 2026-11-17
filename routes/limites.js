// RN13 - Limites de seguranca editaveis pelo administrador, com historico.
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { autenticar, autorizar } = require('../middleware/auth');
const { validarLimite } = require('../services/regras');
const { TIPOS_MEDICAO } = require('../services/validacao');

router.use(autenticar);

// Qualquer perfil consulta os limites vigentes
router.get('/', async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT l.tipo, l.valor_limite, l.unidade, l.atualizado_em, u.nome AS atualizado_por_nome
       FROM limites_seguranca l LEFT JOIN usuarios u ON u.id = l.atualizado_por
       ORDER BY l.tipo`
    );
    res.json(resultado.rows);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao listar limites' });
  }
});

// Historico de alteracoes (admin)
router.get('/historico', autorizar('admin'), async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT h.*, u.nome AS alterado_por_nome
       FROM limites_historico h JOIN usuarios u ON u.id = h.alterado_por
       ORDER BY h.alterado_em DESC LIMIT 100`
    );
    res.json(resultado.rows);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao listar historico de limites' });
  }
});

// Altera o limite de um tipo (admin). Alertas antigos nao mudam: o nivel e
// calculado no momento da medicao e fica gravado.
router.put('/:tipo', autorizar('admin'), async (req, res) => {
  const { tipo } = req.params;
  if (!TIPOS_MEDICAO.includes(tipo)) return res.status(400).json({ erro: 'Tipo invalido' });

  const validacao = validarLimite(req.body.valor_limite);
  if (!validacao.ok) return res.status(400).json({ erro: validacao.erro });

  const motivo = (req.body.motivo && String(req.body.motivo).trim()) || null;
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    const atual = await cliente.query('SELECT valor_limite FROM limites_seguranca WHERE tipo = $1 FOR UPDATE', [tipo]);
    if (atual.rows.length === 0) {
      await cliente.query('ROLLBACK');
      return res.status(404).json({ erro: 'Limite nao encontrado' });
    }
    const anterior = Number(atual.rows[0].valor_limite);
    if (anterior === validacao.valor) {
      await cliente.query('ROLLBACK');
      return res.status(409).json({ erro: 'O limite informado e igual ao atual' });
    }

    const novo = await cliente.query(
      `UPDATE limites_seguranca SET valor_limite = $2, atualizado_em = now(), atualizado_por = $3
       WHERE tipo = $1 RETURNING tipo, valor_limite, unidade, atualizado_em`,
      [tipo, validacao.valor, req.usuario.id]
    );
    await cliente.query(
      `INSERT INTO limites_historico (tipo, valor_anterior, valor_novo, alterado_por, motivo) VALUES ($1, $2, $3, $4, $5)`,
      [tipo, anterior, validacao.valor, req.usuario.id, motivo]
    );
    await cliente.query('COMMIT');
    res.json(novo.rows[0]);
  } catch (err) {
    await cliente.query('ROLLBACK');
    if (err.code === '23514') return res.status(400).json({ erro: 'Limite deve ser maior que zero' });
    res.status(500).json({ erro: 'Erro ao atualizar limite' });
  } finally {
    cliente.release();
  }
});

module.exports = router;
