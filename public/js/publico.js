function esc(valor) {
  if (valor === null || valor === undefined) return '';
  return String(valor)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

const ROTULOS_TIPO = {
  vibracao: 'Vibração',
  ruido: 'Ruído',
  ar: 'Qualidade do ar'
};

async function carregarMedicoesAtuais() {
  const grade = document.getElementById('grade-medicoes');

  try {
    const resposta = await fetch('/api/publico/medicoes-atuais');
    const dados = await resposta.json();

    if (!resposta.ok) throw new Error();

    if (dados.length === 0) {
      grade.innerHTML = '<p class="vazio">Ainda não há leituras registradas.</p>';
      return;
    }

    grade.innerHTML = dados.map((m) => `
      <div class="cartao-medicao">
        <div class="topo">
          <span class="ponto-nome">${esc(m.ponto_nome)}</span>
          <span class="status ${m.situacao === 'acima_limite' ? 'acima_limite' : 'normal'}">
            <span class="ponto"></span>${m.situacao === 'acima_limite' ? 'acima do limite' : 'normal'}
          </span>
        </div>
        <div class="tipo">${ROTULOS_TIPO[m.tipo] || m.tipo}</div>
        <div class="valor">${m.valor} <span style="font-size:14px;color:var(--text-muted);">${esc(m.unidade)}</span></div>
        ${m.valor_limite ? `<div class="limite">Limite de segurança: ${m.valor_limite} ${esc(m.unidade)}</div>` : ''}
        <div class="atualizado">Atualizado em ${new Date(m.data_hora).toLocaleString('pt-BR')}</div>
      </div>
    `).join('');
  } catch (err) {
    grade.innerHTML = '<p class="erro">Não foi possível carregar as leituras no momento.</p>';
  }
}

async function carregarDetonacoes() {
  const corpo = document.getElementById('corpoDetonacoes');

  try {
    const resposta = await fetch('/api/publico/detonacoes');
    const dados = await resposta.json();

    if (!resposta.ok) throw new Error();

    if (dados.length === 0) {
      corpo.innerHTML = '<tr><td colspan="4" class="vazio">Nenhuma detonação programada no momento.</td></tr>';
      return;
    }

    corpo.innerHTML = dados.map((d) => `
      <tr>
        <td>${esc(d.identificador)}</td>
        <td class="dado">${new Date(d.data_hora).toLocaleString('pt-BR')}</td>
        <td>${esc(d.ponto_nome)} — ${esc(d.localizacao)}</td>
        <td>${esc(d.descricao) || '—'}</td>
      </tr>
    `).join('');
  } catch (err) {
    corpo.innerHTML = '<tr><td colspan="4" class="erro">Não foi possível carregar as detonações programadas.</td></tr>';
  }
}

async function carregarAlertas() {
  const corpo = document.getElementById('corpoAlertas');

  try {
    const resposta = await fetch('/api/publico/alertas');
    const dados = await resposta.json();

    if (!resposta.ok) throw new Error();

    if (dados.length === 0) {
      corpo.innerHTML = '<tr><td colspan="5" class="vazio">Nenhum alerta registrado.</td></tr>';
      return;
    }

    corpo.innerHTML = dados.map((a) => `
      <tr>
        <td>${esc(a.ponto_nome)}</td>
        <td>${ROTULOS_TIPO[a.tipo] || a.tipo}</td>
        <td>${esc(a.mensagem)}</td>
        <td><span class="status ${a.status}"><span class="ponto"></span>${a.status}</span></td>
        <td class="dado">${new Date(a.data_hora).toLocaleString('pt-BR')}</td>
      </tr>
    `).join('');
  } catch (err) {
    corpo.innerHTML = '<tr><td colspan="5" class="erro">Não foi possível carregar o boletim de alertas.</td></tr>';
  }
}

// US07 - boletins periodicos emitidos pela pedreira
async function carregarBoletins() {
  const corpo = document.getElementById('corpoBoletins');

  try {
    const resposta = await fetch('/api/publico/boletins');
    const dados = await resposta.json();

    if (!resposta.ok) throw new Error();

    if (dados.length === 0) {
      corpo.innerHTML = '<tr><td colspan="4" class="vazio">Nenhum boletim publicado ainda.</td></tr>';
      return;
    }

    corpo.innerHTML = dados.map((b) => `
      <tr>
        <td><a href="boletim.html?id=${Number(b.id)}">${esc(b.titulo)}</a></td>
        <td class="dado">${new Date(b.periodo_inicio).toLocaleDateString('pt-BR')} a ${new Date(b.periodo_fim).toLocaleDateString('pt-BR')}</td>
        <td>${esc(b.resumo)}</td>
        <td class="dado">${new Date(b.emitido_em).toLocaleDateString('pt-BR')}</td>
      </tr>
    `).join('');
  } catch (err) {
    corpo.innerHTML = '<tr><td colspan="4" class="erro">Não foi possível carregar os boletins.</td></tr>';
  }
}

carregarMedicoesAtuais();
carregarDetonacoes();
carregarAlertas();
carregarBoletins();
