document.getElementById('formLogin').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const senha = document.getElementById('senha').value;
  const msgErro = document.getElementById('msgErro');
  const botao = document.getElementById('botaoEntrar');
  msgErro.textContent = '';
  botao.disabled = true;
  botao.textContent = 'Entrando...';

  try {
    const resposta = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha })
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      msgErro.textContent = dados.erro || 'Não foi possível entrar';
      return;
    }

    localStorage.setItem('token', dados.token);
    localStorage.setItem('nome', dados.nome);
    localStorage.setItem('perfil', dados.perfil);

    window.location.href = 'dashboard.html';
  } catch (err) {
    msgErro.textContent = 'Não foi possível conectar ao servidor';
  } finally {
    botao.disabled = false;
    botao.textContent = 'Entrar';
  }
});
