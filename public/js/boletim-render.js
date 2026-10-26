// Renderizacao de um boletim (compartilhada entre a tela interna e a publica).
// Nao depende de menu.js: define o proprio escape.
function escB(valor) {
  if (valor === null || valor === undefined) return '';
  return String(valor)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function dataCurta(valor) {
  if (!valor) return '—';
  const d = new Date(valor);
  return Number.isNaN(d.getTime()) ? escB(valor) : d.toLocaleDateString('pt-BR');
}

const ROTULO_SITUACAO = {
  normal: 'normal',
  atencao: 'atenção',
  acima_limite: 'acima do limite',
  sem_limite: 'sem limite definido'
};

function renderizarBoletim(b) {
  const periodo = b.periodo || {};
  const pontos = (b.pontos || []).map((p) => `
    <div class="cartao-medicao">
      <div class="topo"><span class="ponto-nome">${escB(p.ponto)}</span></div>
      ${p.indicadores.map((i) => `
        <div class="linha-indicador">
          <span class="tipo">${escB(i.rotulo)}</span>
          <span class="valor-num">máx ${escB(i.maximo)} · média ${escB(i.media)} ${escB(i.unidade)}</span>
          <span class="status ${escB(i.situacao)}"><span class="ponto"></span>${ROTULO_SITUACAO[i.situacao] || escB(i.situacao)}</span>
        </div>`).join('')}
    </div>`).join('');

  const detonacoes = (b.detonacoes || []).length === 0
    ? '<p class="vazio">Nenhuma detonação no período.</p>'
    : `<table><thead><tr><th>Identificador</th><th>Data/Hora</th><th>Local</th></tr></thead><tbody>
        ${b.detonacoes.map((d) => `<tr><td>${escB(d.identificador)}</td><td class="dado">${new Date(d.data_hora).toLocaleString('pt-BR')}</td><td>${escB(d.ponto_nome)} — ${escB(d.localizacao)}</td></tr>`).join('')}
       </tbody></table>`;

  return `
    <div class="boletim">
      <p class="boletim-periodo">Período: ${dataCurta(periodo.inicio)} a ${dataCurta(periodo.fim)}</p>
      <p class="boletim-resumo">${escB(b.resumo)}</p>
      <div class="grade-resumo" style="margin:14px 0;">
        <div class="cartao-resumo"><div class="numero">${escB((b.pontos || []).length)}</div><div class="rotulo">Pontos com leituras</div></div>
        <div class="cartao-resumo"><div class="numero">${escB((b.detonacoes || []).length)}</div><div class="rotulo">Detonações</div></div>
        <div class="cartao-resumo ${b.alertas && b.alertas.total > 0 ? 'alerta' : ''}"><div class="numero">${escB(b.alertas ? b.alertas.total : 0)}</div><div class="rotulo">Alertas (${escB(b.alertas ? b.alertas.resolvidos : 0)} resolvidos)</div></div>
      </div>
      <h2 class="boletim-secao">Condições por ponto de monitoramento</h2>
      <div class="grade-cartoes">${pontos || '<p class="vazio">Sem medições no período.</p>'}</div>
      <h2 class="boletim-secao">Detonações realizadas</h2>
      ${detonacoes}
    </div>`;
}
