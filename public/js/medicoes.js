const UNIDADE_POR_TIPO = { vibracao: 'mm/s', ruido: 'dB', ar: 'ug/m3' };
const ROTULO_TIPO = { vibracao: 'Vibração', ruido: 'Ruído', ar: 'Qualidade do ar' };

async function carregarSelects() {
  const respostaPontos = await apiFetch('/api/pontos');
  const selectPonto = document.getElementById('pontoId');
  const selectFiltroPonto = document.getElementById('filtroPonto');
  selectPonto.innerHTML = '';

  if (respostaPontos && respostaPontos.ok) {
    if (respostaPontos.dados.length === 0) {
      selectPonto.innerHTML = '<option value="">Cadastre um ponto primeiro</option>';
    } else {
      respostaPontos.dados.forEach((p) => {
        const opcao = document.createElement('option');
        opcao.value = p.id;
        opcao.textContent = p.nome;
        selectPonto.appendChild(opcao);
        selectFiltroPonto.appendChild(opcao.cloneNode(true));
      });
    }
  }

  const respostaDet = await apiFetch('/api/detonacoes');
  const selectDet = document.getElementById('detonacaoId');

  if (respostaDet && respostaDet.ok) {
    respostaDet.dados.forEach((d) => {
      const opcao = document.createElement('option');
      opcao.value = d.id;
      opcao.textContent = d.identificador;
      selectDet.appendChild(opcao);
    });
  }
}

function parametrosFiltro() {
  const params = new URLSearchParams();
  const inicio = document.getElementById('filtroInicio').value;
  const fim = document.getElementById('filtroFim').value;
  const ponto = document.getElementById('filtroPonto').value;
  const tipo = document.getElementById('filtroTipo').value;
  if (inicio) params.set('inicio', inicio);
  if (fim) params.set('fim', fim);
  if (ponto) params.set('ponto_id', ponto);
  if (tipo) params.set('tipo', tipo);
  const texto = params.toString();
  return texto ? '?' + texto : '';
}

async function carregarEstatisticas() {
  const resposta = await apiFetch('/api/medicoes/estatisticas' + parametrosFiltro());
  const grade = document.getElementById('gradeEstatisticas');
  if (!resposta || !resposta.ok || resposta.dados.length === 0) {
    grade.innerHTML = '';
    return;
  }

  grade.innerHTML = resposta.dados.map((e) => `
    <div class="cartao-resumo ${Number(e.acima_limite) > 0 ? 'alerta' : ''}">
      <div class="rotulo">${esc(e.ponto_nome)} · ${esc(ROTULO_TIPO[e.tipo] || e.tipo)}</div>
      <div class="numero">${esc(e.media)} <span class="unidade">${esc(e.unidade)}</span></div>
      <div class="rotulo">média de ${esc(e.quantidade)} leitura(s) · mín ${esc(e.minimo)} · máx ${esc(e.maximo)}
        ${Number(e.acima_limite) > 0 ? `· <span class="status acima_limite">${esc(e.acima_limite)} acima do limite</span>` : ''}
      </div>
    </div>
  `).join('');
}

async function carregarMedicoes() {
  document.getElementById('msgFiltro').textContent = '';
  const resposta = await apiFetch('/api/medicoes' + parametrosFiltro());
  if (!resposta) return;

  const corpo = document.getElementById('corpoTabela');
  const rodape = document.getElementById('rodapeTabela');

  if (!resposta.ok) {
    corpo.innerHTML = '';
    document.getElementById('msgFiltro').textContent = resposta.dados?.erro || 'Não foi possível carregar as medições.';
    return;
  }

  if (resposta.dados.length === 0) {
    corpo.innerHTML = '<tr><td colspan="8" class="vazio">Nenhuma medição encontrada para os filtros selecionados.</td></tr>';
    rodape.textContent = '';
    document.getElementById('gradeEstatisticas').innerHTML = '';
    return;
  }

  corpo.innerHTML = resposta.dados.map((m) => `
    <tr>
      <td>${esc(m.ponto_nome)}</td>
      <td>${esc(ROTULO_TIPO[m.tipo] || m.tipo)}</td>
      <td class="num dado">${esc(m.valor)}</td>
      <td>${esc(m.unidade)}</td>
      <td class="num dado">${m.valor_limite === null ? '—' : esc(m.valor_limite)}</td>
      <td><span class="status ${m.situacao === 'acima_limite' ? 'acima_limite' : 'normal'}"><span class="ponto"></span>${m.situacao === 'acima_limite' ? 'acima do limite' : 'normal'}</span></td>
      <td>${esc(m.detonacao_identificador) || '—'}</td>
      <td class="dado">${formatarDataHora(m.data_hora)}</td>
    </tr>
  `).join('');

  rodape.textContent = `${resposta.dados.length} medição(ões) listada(s)` + (resposta.dados.length === 1000 ? ' (limite de 1000 — refine o período)' : '');
  carregarEstatisticas();
}

async function exportarCsv() {
  const botao = document.getElementById('botaoExportar');
  botao.disabled = true;
  try {
    const resposta = await fetch('/api/medicoes/exportar' + parametrosFiltro(), { headers: cabecalhoAutorizacao() });
    if (!resposta.ok) {
      const dados = await resposta.json().catch(() => null);
      document.getElementById('msgFiltro').textContent = dados?.erro || 'Não foi possível exportar.';
      return;
    }
    const blob = await resposta.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medicoes_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } finally {
    botao.disabled = false;
  }
}

document.getElementById('tipo').addEventListener('change', (e) => {
  document.getElementById('unidade').value = UNIDADE_POR_TIPO[e.target.value] || '';
});

document.getElementById('formFiltro').addEventListener('submit', (e) => {
  e.preventDefault();
  carregarMedicoes();
});

document.getElementById('botaoLimparFiltro').addEventListener('click', () => {
  ['filtroInicio', 'filtroFim', 'filtroPonto', 'filtroTipo'].forEach((id) => { document.getElementById(id).value = ''; });
  carregarMedicoes();
});

document.getElementById('botaoExportar').addEventListener('click', exportarCsv);

document.getElementById('formMedicao').addEventListener('submit', async (e) => {
  e.preventDefault();

  const ponto_id = document.getElementById('pontoId').value;
  const detonacao_id = document.getElementById('detonacaoId').value || null;
  const tipo = document.getElementById('tipo').value;
  const valor = document.getElementById('valor').value;
  const unidade = document.getElementById('unidade').value;
  const msgErro = document.getElementById('msgErro');
  msgErro.textContent = '';
  msgErro.style.color = '';

  if (!ponto_id) {
    msgErro.textContent = 'Cadastre um ponto de monitoramento antes de continuar.';
    return;
  }

  const resposta = await apiFetch('/api/medicoes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ponto_id, detonacao_id, tipo, valor, unidade })
  });

  if (!resposta) return;

  if (!resposta.ok) {
    msgErro.textContent = resposta.dados?.erro || 'Não foi possível registrar a medição.';
    return;
  }

  if (resposta.dados.alerta) {
    msgErro.style.color = 'var(--danger)';
    msgErro.textContent = 'Alerta gerado: ' + resposta.dados.alerta.mensagem;
  } else {
    msgErro.style.color = 'var(--success)';
    msgErro.textContent = 'Medição registrada dentro do limite de segurança.';
  }

  document.getElementById('valor').value = '';
  carregarMedicoes();
});

// Engenheiro de Minas apenas consulta o histórico (US09); não lança medições.
if (!podeLancar()) {
  document.getElementById('painelLancamento').style.display = 'none';
}

carregarSelects();
carregarMedicoes();
