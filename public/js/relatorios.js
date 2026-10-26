protegerPaginaAdmin();

const ROTULO_TIPO = { vibracao: 'Vibração', ruido: 'Ruído', ar: 'Qualidade do ar' };

function barra(valor, maximo) {
  const largura = maximo > 0 ? Math.round((Number(valor) / maximo) * 100) : 0;
  return `<div class="barra"><div class="barra-preenchida" style="width:${largura}%"></div></div>`;
}

async function gerarRelatorio() {
  const inicio = document.getElementById('inicio').value;
  const fim = document.getElementById('fim').value;
  const msgErro = document.getElementById('msgErro');
  msgErro.textContent = '';

  const params = new URLSearchParams();
  if (inicio) params.set('inicio', inicio);
  if (fim) params.set('fim', fim);

  const resposta = await apiFetch('/api/relatorios/gerencial?' + params.toString());
  if (!resposta) return;

  if (!resposta.ok) {
    msgErro.textContent = resposta.dados?.erro || 'Não foi possível gerar o relatório.';
    return;
  }

  const r = resposta.dados;
  const t = r.totais;

  document.getElementById('descricaoPeriodo').textContent = r.periodo.padrao
    ? 'Período: últimos 30 dias (informe datas para outro intervalo).'
    : `Período: ${inicio || 'início'} até ${fim || 'hoje'}.`;

  document.getElementById('gradeTotais').innerHTML = `
    <div class="cartao-resumo"><div class="numero">${t.medicoes}</div><div class="rotulo">Medições no período</div></div>
    <div class="cartao-resumo"><div class="numero">${t.detonacoes}</div><div class="rotulo">Detonações no período</div></div>
    <div class="cartao-resumo alerta"><div class="numero">${t.alertas}</div><div class="rotulo">Alertas gerados</div></div>
    <div class="cartao-resumo"><div class="numero">${t.percentual_resolvidos}%</div><div class="rotulo">Alertas resolvidos (${t.alertas_resolvidos}/${t.alertas})</div></div>
    <div class="cartao-resumo"><div class="numero">${r.tempo_resolucao.horas_medias ?? '—'}<span class="unidade">h</span></div><div class="rotulo">Tempo médio de resolução</div></div>
  `;

  const corpoTipo = document.getElementById('corpoTipo');
  corpoTipo.innerHTML = r.por_tipo.length === 0
    ? '<tr><td colspan="7" class="vazio">Sem medições no período.</td></tr>'
    : r.por_tipo.map((l) => {
      const taxa = Number(l.medicoes) ? Math.round((Number(l.alertas) / Number(l.medicoes)) * 100) : 0;
      return `<tr>
        <td>${esc(ROTULO_TIPO[l.tipo] || l.tipo)}</td>
        <td class="num dado">${esc(l.medicoes)}</td>
        <td class="num dado">${esc(l.alertas)}</td>
        <td class="num dado">${esc(l.media)} ${esc(l.unidade)}</td>
        <td class="num dado">${esc(l.maximo)} ${esc(l.unidade)}</td>
        <td class="num dado">${l.valor_limite === null ? '—' : esc(l.valor_limite) + ' ' + esc(l.unidade)}</td>
        <td><span class="status ${taxa > 0 ? 'acima_limite' : 'normal'}">${taxa}%</span></td>
      </tr>`;
    }).join('');

  const maxAlertasPonto = Math.max(0, ...r.por_ponto.map((p) => Number(p.alertas)));
  document.getElementById('corpoPonto').innerHTML = r.por_ponto.length === 0
    ? '<tr><td colspan="5" class="vazio">Nenhum ponto cadastrado.</td></tr>'
    : r.por_ponto.map((p) => `<tr>
        <td>${esc(p.ponto_nome)}</td>
        <td class="num dado">${esc(p.medicoes)}</td>
        <td class="num dado">${esc(p.alertas)}</td>
        <td class="num dado">${esc(p.alertas_abertos)}</td>
        <td style="width:30%">${barra(p.alertas, maxAlertasPonto)}</td>
      </tr>`).join('');

  const maxSemana = Math.max(0, ...r.por_semana.map((s) => Number(s.medicoes)));
  document.getElementById('corpoSemana').innerHTML = r.por_semana.length === 0
    ? '<tr><td colspan="4" class="vazio">Sem medições no período.</td></tr>'
    : r.por_semana.map((s) => `<tr>
        <td class="dado">${esc(s.semana)}</td>
        <td class="num dado">${esc(s.medicoes)}</td>
        <td class="num dado">${esc(s.alertas)}</td>
        <td style="width:30%">${barra(s.medicoes, maxSemana)}</td>
      </tr>`).join('');

  document.getElementById('corpoDetonacoes').innerHTML = r.detonacoes.length === 0
    ? '<tr><td colspan="5" class="vazio">Sem detonações no período.</td></tr>'
    : r.detonacoes.map((d) => `<tr>
        <td>${esc(d.identificador)}</td>
        <td class="dado">${formatarDataHora(d.data_hora)}</td>
        <td>${esc(d.ponto_nome)}</td>
        <td class="num dado">${esc(d.medicoes_vinculadas)}</td>
        <td class="num dado">${esc(d.alertas_vinculados)}</td>
      </tr>`).join('');
}

document.getElementById('formPeriodo').addEventListener('submit', (e) => {
  e.preventDefault();
  gerarRelatorio();
});

gerarRelatorio();
