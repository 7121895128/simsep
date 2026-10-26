// Montagem do boletim periodico (US07) a partir das consultas do banco.
// Recebe linhas ja consultadas e produz um objeto pronto para exibicao/impressao.

const { classificarSituacao } = require('./alertas');

const ROTULOS_TIPO = { vibracao: 'Vibracao', ruido: 'Ruido', ar: 'Qualidade do ar' };

function montarBoletim({ periodo, estatisticas, detonacoes, alertas, pontos }) {
  const porPonto = {};

  for (const e of estatisticas) {
    if (!porPonto[e.ponto_nome]) porPonto[e.ponto_nome] = { ponto: e.ponto_nome, indicadores: [] };
    porPonto[e.ponto_nome].indicadores.push({
      tipo: e.tipo,
      rotulo: ROTULOS_TIPO[e.tipo] || e.tipo,
      quantidade: Number(e.quantidade),
      media: Number(e.media),
      maximo: Number(e.maximo),
      unidade: e.unidade,
      limite: e.valor_limite === null ? null : Number(e.valor_limite),
      situacao: classificarSituacao(e.maximo, e.valor_limite)
    });
  }

  const totalAlertas = alertas.length;
  const alertasResolvidos = alertas.filter((a) => a.status === 'resolvido').length;
  const pontosAcima = Object.values(porPonto)
    .filter((p) => p.indicadores.some((i) => i.situacao === 'acima_limite'))
    .map((p) => p.ponto);

  let resumo;
  if (estatisticas.length === 0) {
    resumo = 'Nenhuma medicao foi registrada no periodo.';
  } else if (pontosAcima.length === 0) {
    resumo = `Todas as leituras do periodo ficaram dentro dos limites de seguranca em ${pontos} ponto(s) monitorado(s).`;
  } else {
    resumo = `${pontosAcima.length} ponto(s) registraram leituras acima do limite (${pontosAcima.join(', ')}). ` +
      `${alertasResolvidos} de ${totalAlertas} alerta(s) ja foram resolvidos.`;
  }

  return {
    periodo,
    resumo,
    pontos: Object.values(porPonto),
    detonacoes,
    alertas: { total: totalAlertas, resolvidos: alertasResolvidos, abertos: totalAlertas - alertasResolvidos },
    gerado_em: new Date().toISOString()
  };
}

module.exports = { montarBoletim, ROTULOS_TIPO };
