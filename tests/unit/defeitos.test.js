// Testes escritos na Entrega 4 (Testes e validacao) a partir de casos de borda.
// Cada bloco referencia o defeito registrado em docs/testes-e-validacao.md.
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { validarMedicao, montarPeriodo, validarUsuario } = require('../../services/validacao');
const { escapar } = require('../../services/csv');
const { avaliarLimite } = require('../../services/alertas');

describe('DEF-01 montarPeriodo - datas inexistentes', () => {
  test('rejeita 30 de fevereiro', () => {
    assert.equal(montarPeriodo('2026-02-30', '2026-03-01').ok, false);
  });
  test('rejeita 31 de abril', () => {
    assert.equal(montarPeriodo('2026-04-01', '2026-04-31').ok, false);
  });
  test('aceita 29 de fevereiro em ano bissexto e rejeita em ano comum', () => {
    assert.equal(montarPeriodo('2028-02-29', '2028-03-01').ok, true);
    assert.equal(montarPeriodo('2026-02-29', '2026-03-01').ok, false);
  });
});

describe('DEF-02 CSV - injecao de formula (Excel/LibreOffice)', () => {
  test('neutraliza celulas que comecam com = + - @', () => {
    for (const perigoso of ['=HYPERLINK("http://x")', '+1+1', '-2+3', '@SUM(A1)']) {
      const saida = escapar(perigoso);
      assert.ok(!/^"?[=+\-@]/.test(saida), `nao neutralizou: ${saida}`);
    }
  });
  test('nao altera numeros negativos legitimos nem texto comum', () => {
    assert.equal(escapar(-1.5), '-1.5');
    assert.equal(escapar('Frente Norte'), 'Frente Norte');
  });
});

describe('DEF-03 validarMedicao - valores nao numericos aceitos por coercao', () => {
  test('rejeita booleano', () => {
    assert.equal(validarMedicao({ ponto_id: 1, tipo: 'ar', valor: true }).valido, false);
  });
  test('rejeita Infinity e NaN textual', () => {
    assert.equal(validarMedicao({ ponto_id: 1, tipo: 'ar', valor: 'Infinity' }).valido, false);
    assert.equal(validarMedicao({ ponto_id: 1, tipo: 'ar', valor: 'NaN' }).valido, false);
  });
  test('rejeita valor acima da capacidade da coluna NUMERIC(10,2)', () => {
    assert.equal(validarMedicao({ ponto_id: 1, tipo: 'ar', valor: 123456789.99 }).valido, false);
  });
  test('aceita numero em texto com ponto decimal', () => {
    assert.equal(validarMedicao({ ponto_id: 1, tipo: 'ar', valor: '12.5' }).valido, true);
  });
  test('E4 (teste com usuarios): aceita virgula como separador decimal', () => {
    const r = validarMedicao({ ponto_id: 1, tipo: 'vibracao', valor: '7,4' });
    assert.equal(r.valido, true);
    assert.equal(r.dados.valor, 7.4);
  });
});

describe('DEF-04 validarUsuario - normalizacao do e-mail', () => {
  test('aceita e-mail com espacos nas pontas e devolve normalizado em minusculas', () => {
    const r = validarUsuario({ nome: 'Ana Silva', email: '  ANA@Simsep.COM ', senha: '123456', perfil: 'admin' });
    assert.equal(r.valido, true);
    assert.equal(r.dados.email, 'ana@simsep.com');
  });
});

describe('DEF-05 avaliarLimite - limite zero', () => {
  test('nao produz percentual infinito quando o limite e zero', () => {
    const r = avaliarLimite({ tipo: 'ar', valor: 1, unidade: 'ug/m3' }, { valor_limite: '0', unidade: 'ug/m3' });
    assert.equal(r.ultrapassou, true);
    assert.ok(!r.mensagem.includes('Infinity'), r.mensagem);
  });
});
