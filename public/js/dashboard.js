async function carregarResumo() {
  const resposta = await apiFetch('/api/dashboard/resumo');
  if (!resposta) return;

  if (!resposta.ok) {
    document.getElementById('grade-resumo').innerHTML = '<p class="erro">Não foi possível carregar o resumo.</p>';
    return;
  }

  const r = resposta.dados;

  document.getElementById('grade-resumo').innerHTML = `
    <div class="cartao-resumo">
      <div class="numero">${r.totalPontos}</div>
      <div class="rotulo">Pontos de monitoramento</div>
    </div>
    <div class="cartao-resumo">
      <div class="numero">${r.totalDetonacoes}</div>
      <div class="rotulo">Detonações registradas</div>
    </div>
    <div class="cartao-resumo">
      <div class="numero">${r.totalMedicoes}</div>
      <div class="rotulo">Medições lançadas</div>
    </div>
    <div class="cartao-resumo alerta">
      <div class="numero">${r.alertasAbertos}</div>
      <div class="rotulo">Alertas em aberto</div>
    </div>
  `;

  const corpo = document.getElementById('corpoAlertas');

  if (r.ultimosAlertas.length === 0) {
    corpo.innerHTML = '<tr><td colspan="3" class="vazio">Nenhum alerta em aberto no momento.</td></tr>';
    return;
  }

  corpo.innerHTML = r.ultimosAlertas.map((a) => `
    <tr>
      <td>${a.ponto_nome}</td>
      <td>${a.mensagem}</td>
      <td class="dado">${new Date(a.data_hora).toLocaleString('pt-BR')}</td>
    </tr>
  `).join('');
}

carregarResumo();
