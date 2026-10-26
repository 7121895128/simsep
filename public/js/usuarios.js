protegerPaginaAdmin();

async function carregarUsuarios() {
  const resposta = await apiFetch('/api/usuarios');
  if (!resposta) return;

  const corpo = document.getElementById('corpoTabela');

  if (!resposta.ok) {
    corpo.innerHTML = '<tr><td colspan="5" class="erro">Não foi possível carregar os usuários.</td></tr>';
    return;
  }

  if (resposta.dados.length === 0) {
    corpo.innerHTML = '<tr><td colspan="5" class="vazio">Nenhum usuário cadastrado.</td></tr>';
    return;
  }

  const meuId = idUsuarioLogado();

  corpo.innerHTML = resposta.dados.map((u) => `
    <tr>
      <td>${esc(u.nome)}${u.id === meuId ? ' (você)' : ''}</td>
      <td>${esc(u.email)}</td>
      <td>${esc(u.perfil)}</td>
      <td class="dado">${new Date(u.criado_em).toLocaleDateString('pt-BR')}</td>
      <td>${u.id === meuId ? '' : `<button class="perigo" onclick="excluirUsuario(${u.id})">Excluir</button>`}</td>
    </tr>
  `).join('');
}

async function excluirUsuario(id) {
  if (!confirm('Excluir este usuário? Ele perderá o acesso imediatamente.')) return;

  const resposta = await apiFetch('/api/usuarios/' + id, { method: 'DELETE' });
  if (resposta && !resposta.ok) {
    alert(resposta.dados?.erro || 'Não foi possível excluir o usuário.');
    return;
  }
  carregarUsuarios();
}

document.getElementById('formUsuario').addEventListener('submit', async (e) => {
  e.preventDefault();

  const nome = document.getElementById('nome').value;
  const email = document.getElementById('email').value;
  const senha = document.getElementById('senha').value;
  const perfil = document.getElementById('perfil').value;
  const msgErro = document.getElementById('msgErro');
  msgErro.textContent = '';

  const resposta = await apiFetch('/api/usuarios', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome, email, senha, perfil })
  });

  if (!resposta) return;

  if (!resposta.ok) {
    msgErro.textContent = resposta.dados?.erro || 'Não foi possível cadastrar o usuário.';
    return;
  }

  e.target.reset();
  carregarUsuarios();
});

carregarUsuarios();
