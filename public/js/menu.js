const ITENS_MENU = [
  { pagina: 'dashboard.html', rotulo: 'Painel' },
  { pagina: 'pontos.html', rotulo: 'Pontos' },
  { pagina: 'detonacoes.html', rotulo: 'Detonações' },
  { pagina: 'medicoes.html', rotulo: 'Medições' },
  { pagina: 'alertas.html', rotulo: 'Alertas' },
  { pagina: 'boletins.html', rotulo: 'Boletins' },
  { pagina: 'relatorios.html', rotulo: 'Relatórios', somenteAdmin: true },
  { pagina: 'usuarios.html', rotulo: 'Usuários', somenteAdmin: true }
];

// Correcao (Sprint 1): dados vindos da API eram inseridos com innerHTML sem
// escape, permitindo XSS por um nome de ponto como "<img onerror=...>".
function esc(valor) {
  if (valor === null || valor === undefined) return '';
  return String(valor)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatarDataHora(valor) {
  return valor ? new Date(valor).toLocaleString('pt-BR') : '—';
}

function perfilLogado() {
  return localStorage.getItem('perfil') || '';
}

function podeLancar() {
  return ['operador', 'admin'].includes(perfilLogado());
}

function protegerPagina() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'index.html';
  }
}

function protegerPaginaAdmin() {
  protegerPagina();
  if (localStorage.getItem('perfil') !== 'admin') {
    window.location.href = 'dashboard.html';
  }
}

function sair() {
  localStorage.clear();
  window.location.href = 'index.html';
}

function idUsuarioLogado() {
  const token = localStorage.getItem('token');
  if (!token) return null;
  const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(atob(payload)).id;
}

function cabecalhoAutorizacao() {
  return { 'Authorization': 'Bearer ' + localStorage.getItem('token') };
}

async function apiFetch(url, opcoes = {}) {
  const resposta = await fetch(url, {
    ...opcoes,
    headers: { ...(opcoes.headers || {}), ...cabecalhoAutorizacao() }
  });

  // Correcao (Sprint 1): qualquer 403 derrubava a sessao, inclusive o 403 de
  // "perfil sem permissao". Agora so sai quando o token falta ou e invalido.
  if (resposta.status === 401) {
    sair();
    return null;
  }

  let dados = null;
  try {
    dados = await resposta.json();
  } catch (e) {
    dados = null;
  }

  if (resposta.status === 403 && dados && dados.erro === 'Token invalido') {
    sair();
    return null;
  }

  return { ok: resposta.ok, status: resposta.status, dados };
}

function montarBarraLateral() {
  const alvo = document.getElementById('barraLateral');
  if (!alvo) return;

  const paginaAtual = window.location.pathname.split('/').pop();
  const nome = localStorage.getItem('nome') || '';
  const perfil = localStorage.getItem('perfil') || '';

  const links = ITENS_MENU
    .filter((item) => !item.somenteAdmin || perfil === 'admin')
    .map((item) => {
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
      <div class="nome">${esc(nome)}</div>
      <div class="perfil">${esc(perfil)}</div>
      <button class="secundario" onclick="sair()">Sair</button>
    </div>
  `;
}

protegerPagina();
montarBarraLateral();
