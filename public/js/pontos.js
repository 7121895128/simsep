let pontoEmEdicao = null;
let pontosCarregados = [];

function editarPontoPorId(id) {
  const ponto = pontosCarregados.find((p) => String(p.id) === String(id));
  if (ponto) editarPonto(ponto);
}

async function carregarPontos() {
  const resposta = await apiFetch('/api/pontos');
  if (!resposta) return;

  const corpo = document.getElementById('corpoTabela');

  if (!resposta.ok) {
    corpo.innerHTML = '<tr><td colspan="4" class="erro">Não foi possível carregar os pontos.</td></tr>';
    return;
  }

  const pontos = resposta.dados;
  pontosCarregados = pontos;

  if (pontos.length === 0) {
    corpo.innerHTML = '<tr><td colspan="4" class="vazio">Nenhum ponto cadastrado ainda. Use o formulário acima para cadastrar o primeiro.</td></tr>';
    return;
  }

  corpo.innerHTML = pontos.map((p) => `
    <tr>
      <td>${esc(p.nome)}</td>
      <td>${esc(p.localizacao)}</td>
      <td>${esc(p.descricao) || '—'}</td>
      <td class="acoes-linha">
        <button type="button" class="secundario" data-id="${Number(p.id)}" onclick="editarPontoPorId(this.dataset.id)">Editar</button>
        <button type="button" class="perigo" onclick="excluirPonto(${p.id})">Excluir</button>
      </td>
    </tr>
  `).join('');
}

function editarPonto(ponto) {
  pontoEmEdicao = ponto.id;
  document.getElementById('pontoId').value = ponto.id;
  document.getElementById('nome').value = ponto.nome;
  document.getElementById('localizacao').value = ponto.localizacao;
  document.getElementById('descricao').value = ponto.descricao || '';
  document.getElementById('botaoSalvar').textContent = 'Salvar alterações';
  document.getElementById('botaoCancelar').style.display = 'inline-block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelarEdicao() {
  pontoEmEdicao = null;
  document.getElementById('formPonto').reset();
  document.getElementById('pontoId').value = '';
  document.getElementById('botaoSalvar').textContent = 'Cadastrar ponto';
  document.getElementById('botaoCancelar').style.display = 'none';
}

async function excluirPonto(id) {
  if (!confirm('Excluir este ponto de monitoramento? Essa ação não pode ser desfeita.')) return;

  const resposta = await apiFetch('/api/pontos/' + id, { method: 'DELETE' });
  if (resposta && !resposta.ok) {
    alert(resposta.dados?.erro || 'Não foi possível excluir o ponto.');
    return;
  }
  carregarPontos();
}

document.getElementById('botaoCancelar').addEventListener('click', cancelarEdicao);

document.getElementById('formPonto').addEventListener('submit', async (e) => {
  e.preventDefault();

  const nome = document.getElementById('nome').value;
  const localizacao = document.getElementById('localizacao').value;
  const descricao = document.getElementById('descricao').value;
  const msgErro = document.getElementById('msgErro');
  msgErro.textContent = '';

  const corpo = { nome, localizacao, descricao };
  const resposta = pontoEmEdicao
    ? await apiFetch('/api/pontos/' + pontoEmEdicao, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpo)
      })
    : await apiFetch('/api/pontos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpo)
      });

  if (!resposta) return;

  if (!resposta.ok) {
    msgErro.textContent = resposta.dados?.erro || 'Não foi possível salvar o ponto.';
    return;
  }

  cancelarEdicao();
  carregarPontos();
});

carregarPontos();
