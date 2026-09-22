async function carregarAlertas() {
  const status = document.getElementById('filtroStatus').value;
  const url = status ? `/api/alertas?status=${status}` : '/api/alertas';

  const resposta = await apiFetch(url);
  if (!resposta) return;

  const corpo = document.getElementById('corpoTabela');

  if (!resposta.ok) {
    corpo.innerHTML = '<tr><td colspan="6" class="erro">Não foi possível carregar os alertas.</td></tr>';
    return;
  }

  if (resposta.dados.length === 0) {
    corpo.innerHTML = '<tr><td colspan="6" class="vazio">Nenhum alerta encontrado.</td></tr>';
    return;
  }

  corpo.innerHTML = resposta.dados.map((a) => {
    const botao = a.status === 'aberto'
      ? `<button class="secundario" onclick="resolverAlerta(${a.id})">Marcar como resolvido</button>`
      : '';

    return `
      <tr>
        <td>${a.ponto_nome}</td>
        <td>${a.tipo}</td>
        <td>${a.mensagem}</td>
        <td><span class="status ${a.status}"><span class="ponto"></span>${a.status}</span></td>
        <td class="dado">${new Date(a.data_hora).toLocaleString('pt-BR')}</td>
        <td>${botao}</td>
      </tr>
    `;
  }).join('');
}

async function resolverAlerta(id) {
  const resposta = await apiFetch('/api/alertas/' + id + '/resolver', { method: 'PUT' });
  if (resposta && !resposta.ok) {
    alert(resposta.dados?.erro || 'Não foi possível resolver o alerta.');
    return;
  }
  carregarAlertas();
}

document.getElementById('formFiltro').addEventListener('submit', (e) => {
  e.preventDefault();
  carregarAlertas();
});

carregarAlertas();
