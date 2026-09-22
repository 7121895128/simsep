async function carregarPontosSelect() {
  const resposta = await apiFetch('/api/pontos');
  if (!resposta || !resposta.ok) return;

  const select = document.getElementById('pontoId');
  select.innerHTML = '';

  if (resposta.dados.length === 0) {
    select.innerHTML = '<option value="">Cadastre um ponto primeiro</option>';
    return;
  }

  resposta.dados.forEach((p) => {
    const opcao = document.createElement('option');
    opcao.value = p.id;
    opcao.textContent = p.nome;
    select.appendChild(opcao);
  });
}

async function carregarDetonacoes() {
  const resposta = await apiFetch('/api/detonacoes');
  if (!resposta) return;

  const corpo = document.getElementById('corpoTabela');

  if (!resposta.ok) {
    corpo.innerHTML = '<tr><td colspan="4" class="erro">Não foi possível carregar as detonações.</td></tr>';
    return;
  }

  if (resposta.dados.length === 0) {
    corpo.innerHTML = '<tr><td colspan="4" class="vazio">Nenhuma detonação cadastrada ainda.</td></tr>';
    return;
  }

  corpo.innerHTML = resposta.dados.map((d) => `
    <tr>
      <td>${d.identificador}</td>
      <td class="dado">${new Date(d.data_hora).toLocaleString('pt-BR')}</td>
      <td>${d.ponto_nome}</td>
      <td>${d.responsavel_nome}</td>
    </tr>
  `).join('');
}

document.getElementById('formDetonacao').addEventListener('submit', async (e) => {
  e.preventDefault();

  const identificador = document.getElementById('identificador').value;
  const data_hora = document.getElementById('dataHora').value;
  const ponto_id = document.getElementById('pontoId').value;
  const descricao = document.getElementById('descricao').value;
  const msgErro = document.getElementById('msgErro');
  msgErro.textContent = '';

  if (!ponto_id) {
    msgErro.textContent = 'Cadastre um ponto de monitoramento antes de continuar.';
    return;
  }

  const resposta = await apiFetch('/api/detonacoes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identificador, data_hora, ponto_id, descricao })
  });

  if (!resposta) return;

  if (!resposta.ok) {
    msgErro.textContent = resposta.dados?.erro || 'Não foi possível cadastrar a detonação.';
    return;
  }

  e.target.reset();
  carregarDetonacoes();
});

carregarPontosSelect();
carregarDetonacoes();
