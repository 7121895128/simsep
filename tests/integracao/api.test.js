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
let detonacaoFuturaId;

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

  test('DEF-04: login aceita e-mail com maiusculas e espacos', async () => {
    const r = await chamar('POST', '/api/auth/login', { email: '  ' + ADMIN.email.toUpperCase() + ' ', senha: ADMIN.senha });
    assert.equal(r.status, 200);
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

  test('DEF-01: historico com data inexistente (30/02) responde 400', async () => {
    assert.equal((await chamar('GET', '/api/medicoes?inicio=2026-02-30&fim=2026-03-01', null, tokenAdmin)).status, 400);
  });

  test('DEF-03: valor booleano e Infinity respondem 400', async () => {
    assert.equal((await chamar('POST', '/api/medicoes', { ponto_id: pontoId, tipo: 'ar', valor: true }, tokenAdmin)).status, 400);
    assert.equal((await chamar('POST', '/api/medicoes', { ponto_id: pontoId, tipo: 'ar', valor: 'Infinity' }, tokenAdmin)).status, 400);
  });

  test('DEF-02: CSV neutraliza nome de ponto que comeca com formula', async () => {
    const nome = `=HYPERLINK("http://x") ${Date.now()}`;
    const ponto = await chamar('POST', '/api/pontos', { nome, localizacao: 'Teste CSV' }, tokenAdmin);
    assert.equal(ponto.status, 201);
    await chamar('POST', '/api/medicoes', { ponto_id: ponto.dados.id, tipo: 'ar', valor: 1 }, tokenAdmin);
    const csv = await chamar('GET', `/api/medicoes/exportar?ponto_id=${ponto.dados.id}`, null, tokenAdmin);
    assert.equal(csv.status, 200);
    assert.ok(!csv.dados.includes(';=HYPERLINK'), 'formula chegou ao CSV sem neutralizar');
    assert.ok(csv.dados.includes("'=HYPERLINK"));
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

    // RN17: periodo encerrado e inedito (usa um intervalo aleatorio no passado distante)
    const dia = 1 + Math.floor(Math.random() * 28);
    const inicio = `2020-01-${String(dia).padStart(2, '0')}`;
    const emitido = await chamar('POST', '/api/boletins', { titulo: 'Boletim de teste', inicio, fim: inicio }, tokenAdmin);
    assert.equal(emitido.status, 201);

    const publico = await chamar('GET', `/api/publico/boletins/${emitido.dados.id}`);
    assert.equal(publico.status, 200);
    assert.equal(publico.dados.titulo, 'Boletim de teste');
    assert.ok(publico.dados.conteudo.pontos);
  });

  test('RN13: admin altera limite com historico; engenheiro nao pode; valor zero e rejeitado', async () => {
    const antes = await chamar('GET', '/api/limites', null, tokenAdmin);
    assert.equal(antes.status, 200);
    const atual = Number(antes.dados.find((l) => l.tipo === 'ar').valor_limite);

    assert.equal((await chamar('PUT', '/api/limites/ar', { valor_limite: 0 }, tokenAdmin)).status, 400);
    assert.equal((await chamar('PUT', '/api/limites/ar', { valor_limite: atual + 1 }, tokenEngenheiro)).status, 403);
    assert.equal((await chamar('PUT', '/api/limites/ar', { valor_limite: atual }, tokenAdmin)).status, 409);

    const alterado = await chamar('PUT', '/api/limites/ar', { valor_limite: atual + 1, motivo: 'teste automatizado' }, tokenAdmin);
    assert.equal(alterado.status, 200);
    assert.equal(Number(alterado.dados.valor_limite), atual + 1);

    const historico = await chamar('GET', '/api/limites/historico', null, tokenAdmin);
    assert.equal(historico.status, 200);
    assert.equal(historico.dados[0].motivo, 'teste automatizado');

    // volta ao valor original para nao interferir nos demais testes
    assert.equal((await chamar('PUT', '/api/limites/ar', { valor_limite: atual, motivo: 'reversao do teste' }, tokenAdmin)).status, 200);
  });

  test('RN14: medicao acima de 150% do limite gera alerta critico, que exige observacao para resolver', async () => {
    const r = await chamar('POST', '/api/medicoes', { ponto_id: pontoId, tipo: 'ruido', valor: 130 }, tokenAdmin); // limite 85 -> 153%
    assert.equal(r.status, 201);
    assert.equal(r.dados.alerta.nivel, 'critico');

    const semObs = await chamar('PUT', `/api/alertas/${r.dados.alerta.id}/resolver`, { observacao: '' }, tokenAdmin);
    assert.equal(semObs.status, 400);

    const comObs = await chamar('PUT', `/api/alertas/${r.dados.alerta.id}/resolver`, { observacao: 'Britador parado para manutencao' }, tokenAdmin);
    assert.equal(comObs.status, 200);
    assert.equal(comObs.dados.resolucao_obs, 'Britador parado para manutencao');
  });

  test('RN15: detonacao fora da janela (domingo, 19h, ou para daqui a 2h) responde 400', async () => {
    const base = { ponto_id: pontoId };
    const proximoDomingo = new Date(); proximoDomingo.setDate(proximoDomingo.getDate() + ((7 - proximoDomingo.getDay()) % 7 || 7)); proximoDomingo.setHours(10, 0, 0, 0);
    assert.equal((await chamar('POST', '/api/detonacoes', { ...base, identificador: 'T-DOM-' + Date.now(), data_hora: proximoDomingo.toISOString() }, tokenAdmin)).status, 400);

    const daqui2h = new Date(Date.now() + 2 * 36e5);
    assert.equal((await chamar('POST', '/api/detonacoes', { ...base, identificador: 'T-2H-' + Date.now(), data_hora: daqui2h.toISOString() }, tokenAdmin)).status, 400);

    // proximo dia util valido, 10:00, com mais de 24h
    const valida = new Date(); valida.setDate(valida.getDate() + 2); valida.setHours(10, 0, 0, 0);
    while (valida.getDay() === 0 || valida.getDay() === 6) valida.setDate(valida.getDate() + 1);
    const ok = await chamar('POST', '/api/detonacoes', { ...base, identificador: 'T-OK-' + Date.now(), data_hora: valida.toISOString() }, tokenAdmin);
    assert.equal(ok.status, 201);
    detonacaoFuturaId = ok.dados.id;
  });

  test('RN16: medicao nao pode ser vinculada a detonacao futura', async () => {
    const r = await chamar('POST', '/api/medicoes', { ponto_id: pontoId, tipo: 'ar', valor: 10, detonacao_id: detonacaoFuturaId }, tokenAdmin);
    assert.equal(r.status, 400);
    assert.match(r.dados.erro, /ainda nao ocorreu/);
  });

  test('RN17: boletim nao pode cobrir periodo em aberto nem repetir periodo', async () => {
    const hoje = new Date().toISOString().slice(0, 10);
    assert.equal((await chamar('POST', '/api/boletins', { inicio: hoje, fim: hoje }, tokenAdmin)).status, 409);

    const fim = new Date(); fim.setDate(fim.getDate() - 1);
    const inicio = new Date(); inicio.setDate(inicio.getDate() - 7);
    const periodo = { inicio: inicio.toISOString().slice(0, 10), fim: fim.toISOString().slice(0, 10) };
    const primeiro = await chamar('POST', '/api/boletins', { titulo: 'Boletim RN17', ...periodo }, tokenAdmin);
    assert.ok([201, 409].includes(primeiro.status));
    assert.equal((await chamar('POST', '/api/boletins', { titulo: 'Repetido', ...periodo }, tokenAdmin)).status, 409);
  });

  test('RN18: listagem de alertas informa se esta atrasado (campo booleano)', async () => {
    const r = await chamar('GET', '/api/alertas', null, tokenAdmin);
    assert.equal(r.status, 200);
    assert.ok(r.dados.every((a) => typeof a.atrasado === 'boolean'));
  });

  test('painel publico nao exige token e nao expoe dados de usuarios', async () => {
    const r = await chamar('GET', '/api/publico/medicoes-atuais');
    assert.equal(r.status, 200);
    const texto = JSON.stringify(r.dados);
    assert.ok(!texto.includes('senha'));
    assert.ok(!texto.includes('@'));
  });
});
