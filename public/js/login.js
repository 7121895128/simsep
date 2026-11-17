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

// AH-01: explica por que o usuario voltou para o login
(function () {
  const motivo = new URLSearchParams(window.location.search).get('motivo');
  if (motivo === 'sessao_expirada') {
    document.getElementById('msgErro').textContent = 'Sua sessão expirou. Entre novamente para continuar.';
  }
})();

// E6 (teste com usuarios): botao mostrar/ocultar senha
document.getElementById('botaoMostrarSenha').addEventListener('click', function () {
  const campo = document.getElementById('senha');
  const visivel = campo.type === 'text';
  campo.type = visivel ? 'password' : 'text';
  this.textContent = visivel ? 'mostrar' : 'ocultar';
  this.setAttribute('aria-label', visivel ? 'Mostrar senha' : 'Ocultar senha');
});
