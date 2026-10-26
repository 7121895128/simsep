// Testes unitarios - executar com: npm test
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { validarMedicao, montarPeriodo, validarUsuario } = require('../../services/validacao');

describe('validarMedicao', () => {
  test('aceita medicao valida e preenche unidade padrao', () => {
    const r = validarMedicao({ ponto_id: '1', tipo: 'vibracao', valor: '3.2' });
    assert.equal(r.valido, true);
    assert.deepEqual(r.dados, { ponto_id: 1, tipo: 'vibracao', valor: 3.2, unidade: 'mm/s' });
  });

  test('rejeita valor negativo', () => {
    const r = validarMedicao({ ponto_id: 1, tipo: 'ruido', valor: -1, unidade: 'dB' });
    assert.equal(r.valido, false);
    assert.ok(r.erros.some((e) => e.includes('negativo')));
  });

  test('rejeita tipo desconhecido e valor nao numerico', () => {
    const r = validarMedicao({ ponto_id: 1, tipo: 'temperatura', valor: 'abc' });
    assert.equal(r.valido, false);
    assert.equal(r.erros.length, 2);
  });

  test('aceita valor zero', () => {
    const r = validarMedicao({ ponto_id: 2, tipo: 'ar', valor: 0 });
    assert.equal(r.valido, true);
    assert.equal(r.dados.valor, 0);
  });

  test('rejeita ponto ausente', () => {
    const r = validarMedicao({ tipo: 'ar', valor: 10 });
    assert.equal(r.valido, false);
  });
});

describe('montarPeriodo', () => {
  test('sem datas retorna periodo nulo', () => {
    assert.deepEqual(montarPeriodo(undefined, undefined), { ok: true, periodo: null });
  });

  test('inicio e fim viram intervalo fechado do dia', () => {
    const r = montarPeriodo('2026-10-19', '2026-10-25');
    assert.equal(r.ok, true);
    assert.equal(r.periodo.inicio, '2026-10-19 00:00:00');
    assert.equal(r.periodo.fim, '2026-10-25 23:59:59');
  });

  test('so inicio usa fim aberto', () => {
    const r = montarPeriodo('2026-10-19', undefined);
    assert.equal(r.periodo.fim, '9999-12-31 23:59:59');
  });

  test('rejeita data invalida e intervalo invertido', () => {
    assert.equal(montarPeriodo('19/10/2026', '2026-10-25').ok, false);
    assert.equal(montarPeriodo('2026-10-26', '2026-10-25').ok, false);
  });
});

describe('validarUsuario', () => {
  test('aceita usuario valido', () => {
    assert.equal(validarUsuario({ nome: 'Ana Silva', email: 'ana@simsep.com', senha: '123456', perfil: 'operador' }).valido, true);
  });

  test('rejeita e-mail, senha curta e perfil invalido', () => {
    const r = validarUsuario({ nome: 'Jo', email: 'ana@', senha: '123', perfil: 'chefe' });
    assert.equal(r.valido, false);
    assert.equal(r.erros.length, 4);
  });
});
