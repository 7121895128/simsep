protegerPaginaAdmin();

const ROTULO_TIPO = { vibracao: 'Vibração', ruido: 'Ruído', ar: 'Qualidade do ar' };

async function carregarLimites() {
  mostrarCarregando('corpoLimites', 7);
  const resposta = await apiFetch('/api/limites');
  if (!resposta) return;
  const corpo = document.getElementById('corpoLimites');
  if (!resposta.ok) {
    corpo.innerHTML = '<tr><td colspan="7" class="erro">Não foi possível carregar os limites.</td></tr>';
    return;
  }
  corpo.innerHTML = resposta.dados.map((l) => `
    <tr>
      <td>${esc(ROTULO_TIPO[l.tipo] || l.tipo)}</td>
      <td class="num dado"><b>${esc(l.valor_limite)}</b></td>
      <td>${esc(l.unidade)}</td>
      <td class="dado">${l.atualizado_em ? formatarDataHora(l.atualizado_em) + ' · ' + esc(l.atualizado_por_nome) : '—'}</td>
      <td><input type="text" inputmode="decimal" id="novo-${esc(l.tipo)}" placeholder="${esc(l.valor_limite)}" style="width:90px"></td>
      <td><input type="text" id="motivo-${esc(l.tipo)}" placeholder="ex.: nova norma / laudo" style="width:220px"></td>
      <td><button class="secundario" data-tipo="${esc(l.tipo)}" onclick="salvarLimite(this.dataset.tipo)">Salvar</button></td>
    </tr>
  `).join('');
}

async function carregarHistorico() {
  mostrarCarregando('corpoHistorico', 6);
  const resposta = await apiFetch('/api/limites/historico');
  if (!resposta) return;
  const corpo = document.getElementById('corpoHistorico');
  if (!resposta.ok || resposta.dados.length === 0) {
    corpo.innerHTML = '<tr><td colspan="6" class="vazio">Nenhuma alteração registrada.</td></tr>';
    return;
  }
  corpo.innerHTML = resposta.dados.map((h) => `
    <tr>
      <td class="dado">${formatarDataHora(h.alterado_em)}</td>
      <td>${esc(ROTULO_TIPO[h.tipo] || h.tipo)}</td>
      <td class="num dado">${esc(h.valor_anterior)}</td>
      <td class="num dado">${esc(h.valor_novo)}</td>
      <td>${esc(h.alterado_por_nome)}</td>
      <td>${esc(h.motivo) || '—'}</td>
    </tr>
  `).join('');
}

async function salvarLimite(tipo) {
  const msgErro = document.getElementById('msgErro');
  msgErro.style.color = '';
  msgErro.textContent = '';
  const valor = document.getElementById('novo-' + tipo).value.trim().replace(',', '.');
  const motivo = document.getElementById('motivo-' + tipo).value.trim();
  if (!valor) {
    msgErro.textContent = 'Informe o novo limite.';
    return;
  }
  if (!confirm(`Alterar o limite de ${ROTULO_TIPO[tipo]} para ${valor}? Novas medições passarão a ser comparadas com esse valor.`)) return;

  const resposta = await apiFetch('/api/limites/' + tipo, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ valor_limite: valor, motivo })
  });
  if (!resposta) return;
  if (!resposta.ok) {
    msgErro.textContent = resposta.dados?.erro || 'Não foi possível alterar o limite.';
    return;
  }
  msgErro.style.color = 'var(--success)';
  msgErro.textContent = 'Limite atualizado.';
  carregarLimites();
  carregarHistorico();
}

carregarLimites();
carregarHistorico();
