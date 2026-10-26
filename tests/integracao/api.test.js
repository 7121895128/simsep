// Testes de integracao da API (caixa-preta, via HTTP).
// Pre-requisitos: servidor rodando (npm start) com banco PostgreSQL vazio ou
// de teste, e sql/schema.sql + sql/migracao_sprint1.sql aplicados.
// Executar: API_URL=http://localhost:3000 npm run test:integracao
const { test, describe, before } = require('node:test');
const assert = require('node:assert/strict');

const API = process.env.API_URL || 'http://localhost:3000';
const ADMIN = { nome: 'Admin Teste', email: `admin.${Date.now()}@teste.com`, senha: '123456' };

let tokenAdmin;
let tokenEngenheiro;
let pontoId;

async function chamar(metodo, rota, corpo, token) {
  const resposta = await fetch(API + rota, {
    method: metodo,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {})
    },
    body: corpo ? JSON.stringify(corpo) : undefined
  });
  const texto = await resposta.text();
  let dados = null;
  try { dados = JSON.parse(texto); } catch (e) { dados = texto; }
  return { status: resposta.status, dados, headers: resposta.headers };
}

before(async () => {
  const saude = await chamar('GET', '/api/saude');
  assert.equal(saude.status, 200, 'servidor nao esta rodando em ' + API);

  // primeiro acesso cria o admin; se ja existe, tenta logar com ADMIN_EMAIL/ADMIN_SENHA
  const registro = await chamar('POST', '/api/auth/registrar', ADMIN);
  const credenciais = registro.status === 201
    ? { email: ADMIN.email, senha: ADMIN.senha }
    : { email: process.env.ADMIN_EMAIL, senha: process.env.ADMIN_SENHA };

  const login = await chamar('POST', '/api/auth/login', credenciais);
  assert.equal(login.status, 200, 'informe ADMIN_EMAIL e ADMIN_SENHA de um admin existente');
  tokenAdmin = login.dados.token;
});

describe('Autenticacao e autorizacao', () => {
  test('login com senha errada responde 401 sem revelar o e-mail', async () => {
    const r = await chamar('POST', '/api/auth/login', { email: ADMIN.email, senha: 'errada' });
    assert.equal(r.status, 401);
    assert.equal(r.dados.erro, 'Credenciais invalidas');
  });

  test('rota protegida sem token responde 401', async () => {
    assert.equal((await chamar('GET', '/api/pontos')).status, 401);
  });

  test('token adulterado responde 403', async () => {
    assert.equal((await chamar('GET', '/api/pontos', null, tokenAdmin + 'x')).status, 403);
  });

  test('registro publico bloqueado apos o primeiro usuario', async () => {
    const r = await chamar('POST', '/api/auth/registrar', { nome: 'Intruso', email: 'x@x.com', senha: '123456' });
    assert.equal(r.status, 403);
  });

  test('admin cria engenheiro; engenheiro nao acessa /api/usuarios nem /api/relatorios', async () => {
    const eng = { nome: 'Eng Teste', email: `eng.${Date.now()}@teste.com`, senha: '123456', perfil: 'engenheiro' };
    const criado = await chamar('POST', '/api/usuarios', eng, tokenAdmin);
    assert.equal(criado.status, 201);

    const login = await chamar('POST', '/api/auth/login', { email: eng.email, senha: eng.senha });
    tokenEngenheiro = login.dados.token;

    assert.equal((await chamar('GET', '/api/usuarios', null, tokenEngenheiro)).status, 403);
    assert.equal((await chamar('GET', '/api/relatorios/gerencial', null, tokenEngenheiro)).status, 403);
  });

  test('rota /api inexistente responde JSON 404', async () => {
    const r = await chamar('GET', '/api/nao-existe', null, tokenAdmin);
    assert.equal(r.status, 404);
    assert.equal(r.dados.erro, 'Rota nao encontrada');
  });
});

describe('Pontos e medicoes', () => {
  test('cadastra ponto e rejeita duplicado com 409', async () => {
    const ponto = { nome: `Ponto Teste ${Date.now()}`, localizacao: 'Setor de testes' };
    const r = await chamar('POST', '/api/pontos', ponto, tokenAdmin);
    assert.equal(r.status, 201);
    pontoId = r.dados.id;
    assert.equal((await chamar('POST', '/api/pontos', ponto, tokenAdmin)).status, 409);
  });

  test('engenheiro nao lanca medicao (403), mas consulta historico (200)', async () => {
    const r = await chamar('POST', '/api/medicoes', { ponto_id: pontoId, tipo: 'vibracao', valor: 1 }, tokenEngenheiro);
    assert.equal(r.status, 403);
    assert.equal((await chamar('GET', '/api/medicoes', null, tokenEngenheiro)).status, 200);
  });

  test('medicao negativa e tipo invalido respondem 400', async () => {
    assert.equal((await chamar('POST', '/api/medicoes', { ponto_id: pontoId, tipo: 'vibracao', valor: -1 }, tokenAdmin)).status, 400);
    assert.equal((await chamar('POST', '/api/medicoes', { ponto_id: pontoId, tipo: 'temperatura', valor: 1 }, tokenAdmin)).status, 400);
  });

  test('medicao acima do limite gera alerta na mesma transacao', async () => {
    const r = await chamar('POST', '/api/medicoes', { ponto_id: pontoId, tipo: 'vibracao', valor: 6.8 }, tokenAdmin);
    assert.equal(r.status, 201);
    assert.ok(r.dados.alerta, 'alerta deveria ter sido criado');
    assert.equal(r.dados.alerta.status, 'aberto');
    assert.equal(r.dados.medicao.unidade, 'mm/s');
  });

  test('medicao dentro do limite nao gera alerta', async () => {
    const r = await chamar('POST', '/api/medicoes', { ponto_id: pontoId, tipo: 'vibracao', valor: 3.2 }, tokenAdmin);
    assert.equal(r.status, 201);
    assert.equal(r.dados.alerta, null);
  });

  test('historico filtra por ponto e tipo e traz situacao', async () => {
    const r = await chamar('GET', `/api/medicoes?ponto_id=${pontoId}&tipo=vibracao`, null, tokenAdmin);
    assert.equal(r.status, 200);
    assert.ok(r.dados.length >= 2);
    assert.ok(r.dados.every((m) => m.ponto_id === pontoId && m.tipo === 'vibracao'));
    assert.ok(r.dados.some((m) => m.situacao === 'acima_limite'));
  });

  test('filtro com data invalida responde 400', async () => {
    assert.equal((await chamar('GET', '/api/medicoes?inicio=19/10/2026&fim=2026-10-25', null, tokenAdmin)).status, 400);
  });

  test('estatisticas calculam min/media/max por ponto e tipo', async () => {
    const r = await chamar('GET', `/api/medicoes/estatisticas?ponto_id=${pontoId}`, null, tokenAdmin);
    assert.equal(r.status, 200);
    const vib = r.dados.find((e) => e.tipo === 'vibracao');
    assert.equal(Number(vib.minimo), 3.2);
    assert.equal(Number(vib.maximo), 6.8);
    assert.equal(Number(vib.acima_limite), 1);
  });

  test('exportacao CSV responde text/csv com cabecalho', async () => {
    const r = await chamar('GET', `/api/medicoes/exportar?ponto_id=${pontoId}`, null, tokenAdmin);
    assert.equal(r.status, 200);
    assert.match(r.headers.get('content-type'), /text\/csv/);
    assert.match(r.dados, /ID;Data\/Hora;Ponto;Tipo;Valor/);
  });

  test('excluir ponto com medicoes responde 409; ponto inexistente 404', async () => {
    assert.equal((await chamar('DELETE', `/api/pontos/${pontoId}`, null, tokenAdmin)).status, 409);
    assert.equal((await chamar('DELETE', '/api/pontos/999999', null, tokenAdmin)).status, 404);
  });
});

describe('Alertas, relatorios e boletins', () => {
  test('resolver alerta grava resolvido_por e impede resolver duas vezes', async () => {
    const lista = await chamar('GET', '/api/alertas?status=aberto', null, tokenAdmin);
    const alerta = lista.dados.find((a) => a.ponto_nome.startsWith('Ponto Teste'));
    assert.ok(alerta);

    const r = await chamar('PUT', `/api/alertas/${alerta.id}/resolver`, null, tokenAdmin);
    assert.equal(r.status, 200);
    assert.equal(r.dados.status, 'resolvido');
    assert.ok(r.dados.resolvido_em);

    assert.equal((await chamar('PUT', `/api/alertas/${alerta.id}/resolver`, null, tokenAdmin)).status, 409);
    assert.equal((await chamar('PUT', '/api/alertas/999999/resolver', null, tokenAdmin)).status, 404);
  });

  test('relatorio gerencial consolida totais e percentual de resolucao', async () => {
    const r = await chamar('GET', '/api/relatorios/gerencial', null, tokenAdmin);
    assert.equal(r.status, 200);
    assert.ok(r.dados.totais.medicoes >= 2);
    assert.ok(r.dados.totais.percentual_resolvidos >= 0 && r.dados.totais.percentual_resolvidos <= 100);
    assert.ok(Array.isArray(r.dados.por_tipo));
  });

  test('boletim: previa exige periodo, emissao grava e fica publico', async () => {
    assert.equal((await chamar('GET', '/api/boletins/previa', null, tokenAdmin)).status, 400);

    const hoje = new Date().toISOString().slice(0, 10);
    const previa = await chamar('GET', `/api/boletins/previa?inicio=${hoje}&fim=${hoje}`, null, tokenAdmin);
    assert.equal(previa.status, 200);
    assert.ok(previa.dados.resumo);

    assert.equal((await chamar('POST', '/api/boletins', { inicio: hoje, fim: hoje }, tokenEngenheiro)).status, 403);

    const emitido = await chamar('POST', '/api/boletins', { titulo: 'Boletim de teste', inicio: hoje, fim: hoje }, tokenAdmin);
    assert.equal(emitido.status, 201);

    const publico = await chamar('GET', `/api/publico/boletins/${emitido.dados.id}`);
    assert.equal(publico.status, 200);
    assert.equal(publico.dados.titulo, 'Boletim de teste');
    assert.ok(publico.dados.conteudo.pontos);
  });

  test('painel publico nao exige token e nao expoe dados de usuarios', async () => {
    const r = await chamar('GET', '/api/publico/medicoes-atuais');
    assert.equal(r.status, 200);
    const texto = JSON.stringify(r.dados);
    assert.ok(!texto.includes('senha'));
    assert.ok(!texto.includes('@'));
  });
});
