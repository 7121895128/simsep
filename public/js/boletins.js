let previaAtual = null;

function periodoSelecionado() {
  return {
    inicio: document.getElementById('inicio').value,
    fim: document.getElementById('fim').value
  };
}

async function carregarPrevia() {
  const { inicio, fim } = periodoSelecionado();
  const msgErro = document.getElementById('msgErro');
  msgErro.textContent = '';
  previaAtual = null;
  document.getElementById('botaoEmitir').disabled = true;

  if (!inicio || !fim) {
    msgErro.textContent = 'Informe o início e o fim do período.';
    return;
  }

  const resposta = await apiFetch(`/api/boletins/previa?inicio=${inicio}&fim=${fim}`);
  if (!resposta) return;

  if (!resposta.ok) {
    msgErro.textContent = resposta.dados?.erro || 'Não foi possível montar a prévia.';
    return;
  }

  previaAtual = resposta.dados;
  document.getElementById('previa').innerHTML = renderizarBoletim(previaAtual);
  document.getElementById('botaoEmitir').disabled = !podeLancar();
}

async function carregarBoletins() {
  const resposta = await apiFetch('/api/boletins');
  if (!resposta) return;

  const corpo = document.getElementById('corpoTabela');

  if (!resposta.ok) {
    corpo.innerHTML = '<tr><td colspan="6" class="erro">Não foi possível carregar os boletins.</td></tr>';
    return;
  }

  if (resposta.dados.length === 0) {
    corpo.innerHTML = '<tr><td colspan="6" class="vazio">Nenhum boletim emitido ainda.</td></tr>';
    return;
  }

  corpo.innerHTML = resposta.dados.map((b) => `
    <tr>
      <td>${esc(b.titulo)}</td>
      <td class="dado">${dataCurta(b.periodo_inicio)} a ${dataCurta(b.periodo_fim)}</td>
      <td>${esc(b.resumo)}</td>
      <td>${esc(b.emitido_por_nome)}</td>
      <td class="dado">${formatarDataHora(b.emitido_em)}</td>
      <td><a href="boletim.html?id=${Number(b.id)}" target="_blank" rel="noopener">Abrir</a></td>
    </tr>
  `).join('');
}

document.getElementById('botaoPrevia').addEventListener('click', carregarPrevia);

document.getElementById('formBoletim').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!previaAtual) return;

  const { inicio, fim } = periodoSelecionado();
  const titulo = document.getElementById('titulo').value;
  const msgErro = document.getElementById('msgErro');

  const resposta = await apiFetch('/api/boletins', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ titulo, inicio, fim })
  });

  if (!resposta) return;

  if (!resposta.ok) {
    msgErro.textContent = resposta.dados?.erro || 'Não foi possível emitir o boletim.';
    return;
  }

  msgErro.style.color = 'var(--success)';
  msgErro.textContent = 'Boletim emitido e publicado no painel público.';
  previaAtual = null;
  document.getElementById('previa').innerHTML = '';
  document.getElementById('botaoEmitir').disabled = true;
  carregarBoletins();
});

if (!podeLancar()) {
  document.getElementById('botaoEmitir').style.display = 'none';
}

carregarBoletins();
