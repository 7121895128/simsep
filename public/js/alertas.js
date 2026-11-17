async function carregarAlertas() {
  const status = document.getElementById('filtroStatus').value;
  const url = status ? `/api/alertas?status=${status}` : '/api/alertas';

  const corpo = document.getElementById('corpoTabela');
  corpo.innerHTML = '<tr><td colspan="6" class="carregando">Carregando…</td></tr>';

  const resposta = await apiFetch(url);
  if (!resposta) return;

  if (!resposta.ok) {
    corpo.innerHTML = '<tr><td colspan="6" class="erro">Não foi possível carregar os alertas.</td></tr>';
    return;
  }

  if (resposta.dados.length === 0) {
    corpo.innerHTML = '<tr><td colspan="6" class="vazio">Nenhum alerta encontrado.</td></tr>';
    return;
  }

  corpo.innerHTML = resposta.dados.map((a) => {
    const botao = a.status === 'aberto' && podeLancar()
      ? `<button class="secundario" data-id="${Number(a.id)}" data-nivel="${esc(a.nivel)}" onclick="resolverAlerta(this.dataset.id, this.dataset.nivel)">Marcar como resolvido</button>`
      : (a.status === 'resolvido' && a.resolvido_por_nome ? `<span class="aviso">por ${esc(a.resolvido_por_nome)}${a.resolucao_obs ? ' — ' + esc(a.resolucao_obs) : ''}</span>` : '');
    const nivel = `<span class="status ${a.nivel === 'critico' ? 'acima_limite' : 'atencao'}"><span class="ponto"></span>${a.nivel === 'critico' ? 'crítico' : 'alto'}</span>`;
    const atrasado = a.atrasado ? '<br><span class="status acima_limite" title="Aberto há mais de 48 h">atrasado</span>' : '';

    return `
      <tr>
        <td>${esc(a.ponto_nome)}</td>
        <td>${esc(a.tipo)}<br>${nivel}</td>
        <td>${esc(a.mensagem)}</td>
        <td><span class="status ${a.status}"><span class="ponto"></span>${a.status}</span>${atrasado}</td>
        <td class="dado">${formatarDataHora(a.data_hora)}</td>
        <td>${botao}</td>
      </tr>
    `;
  }).join('');
}

async function resolverAlerta(id, nivel) {
  // RN14: alerta critico exige observacao da providencia tomada
  let observacao = null;
  if (nivel === 'critico') {
    observacao = prompt('Alerta CRÍTICO (mais de 150% do limite).\nDescreva a providência tomada (mínimo 10 caracteres):');
    if (observacao === null) return;
  } else if (!confirm('Marcar este alerta como resolvido? Essa ação não pode ser desfeita.')) {
    // E2 (teste com usuarios): resolver e irreversivel, entao pede confirmacao
    return;
  }
  const resposta = await apiFetch('/api/alertas/' + id + '/resolver', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ observacao })
  });
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
