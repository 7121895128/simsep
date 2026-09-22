async function carregarSelects() {
  const respostaPontos = await apiFetch('/api/pontos');
  const selectPonto = document.getElementById('pontoId');
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

function montarUrlMedicoes() {
  const inicio = document.getElementById('filtroInicio').value;
  const fim = document.getElementById('filtroFim').value;

  if (inicio && fim) {
    return `/api/medicoes?inicio=${inicio}&fim=${fim}T23:59:59`;
  }
  return '/api/medicoes';
}

async function carregarMedicoes() {
  const resposta = await apiFetch(montarUrlMedicoes());
  if (!resposta) return;

  const corpo = document.getElementById('corpoTabela');

  if (!resposta.ok) {
    corpo.innerHTML = '<tr><td colspan="5" class="erro">Não foi possível carregar as medições.</td></tr>';
    return;
  }

  if (resposta.dados.length === 0) {
    corpo.innerHTML = '<tr><td colspan="5" class="vazio">Nenhuma medição encontrada para o período selecionado.</td></tr>';
    return;
  }

  corpo.innerHTML = resposta.dados.map((m) => `
    <tr>
      <td>${m.ponto_nome}</td>
      <td>${m.tipo}</td>
      <td class="num dado">${m.valor}</td>
      <td>${m.unidade}</td>
      <td class="dado">${new Date(m.data_hora).toLocaleString('pt-BR')}</td>
    </tr>
  `).join('');
}

document.getElementById('formFiltro').addEventListener('submit', (e) => {
  e.preventDefault();
  carregarMedicoes();
});

document.getElementById('botaoLimparFiltro').addEventListener('click', () => {
  document.getElementById('filtroInicio').value = '';
  document.getElementById('filtroFim').value = '';
  carregarMedicoes();
});

document.getElementById('formMedicao').addEventListener('submit', async (e) => {
  e.preventDefault();

  const ponto_id = document.getElementById('pontoId').value;
  const detonacao_id = document.getElementById('detonacaoId').value || null;
  const tipo = document.getElementById('tipo').value;
  const valor = document.getElementById('valor').value;
  const unidade = document.getElementById('unidade').value;
  const msgErro = document.getElementById('msgErro');
  msgErro.textContent = '';

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
  }

  e.target.reset();
  carregarMedicoes();
});

carregarSelects();
carregarMedicoes();
