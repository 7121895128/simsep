const ITENS_MENU = [
  { pagina: 'dashboard.html', rotulo: 'Painel' },
  { pagina: 'pontos.html', rotulo: 'Pontos' },
  { pagina: 'detonacoes.html', rotulo: 'Detonações' },
  { pagina: 'medicoes.html', rotulo: 'Medições' },
  { pagina: 'alertas.html', rotulo: 'Alertas' }
];

function protegerPagina() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'index.html';
  }
}

function sair() {
  localStorage.clear();
  window.location.href = 'index.html';
}

function cabecalhoAutorizacao() {
  return { 'Authorization': 'Bearer ' + localStorage.getItem('token') };
}

async function apiFetch(url, opcoes = {}) {
  const resposta = await fetch(url, {
    ...opcoes,
    headers: { ...(opcoes.headers || {}), ...cabecalhoAutorizacao() }
  });

  if (resposta.status === 401 || resposta.status === 403) {
    sair();
    return null;
  }

  let dados = null;
  try {
    dados = await resposta.json();
  } catch (e) {
    dados = null;
  }

  return { ok: resposta.ok, status: resposta.status, dados };
}

function montarBarraLateral() {
  const alvo = document.getElementById('barraLateral');
  if (!alvo) return;

  const paginaAtual = window.location.pathname.split('/').pop();
  const nome = localStorage.getItem('nome') || '';
  const perfil = localStorage.getItem('perfil') || '';

  const links = ITENS_MENU.map((item) => {
    const classe = item.pagina === paginaAtual ? 'ativo' : '';
    return `<a href="${item.pagina}" class="${classe}">${item.rotulo}</a>`;
  }).join('');

  alvo.innerHTML = `
    <div class="marca">
      <img src="img/logo.svg" alt="" class="logo-marca">
      <div>
        <strong>SIMSEP</strong>
        <span>Monitoramento de pedreiras</span>
      </div>
    </div>
    <nav>${links}</nav>
    <div class="rodape-usuario">
      <div class="nome">${nome}</div>
      <div class="perfil">${perfil}</div>
      <button class="secundario" onclick="sair()">Sair</button>
    </div>
  `;
}

protegerPagina();
montarBarraLateral();
