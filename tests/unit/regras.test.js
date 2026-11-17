// Regras de negocio do dominio (RN13 a RN18) - versao 1.4
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const R = require('../../services/regras');

describe('RN13 validarLimite', () => {
  test('aceita numero positivo, inclusive com virgula, arredondando a 2 casas', () => {
    assert.deepEqual(R.validarLimite('5,555'), { ok: true, valor: 5.56 });
    assert.deepEqual(R.validarLimite(85), { ok: true, valor: 85 });
  });
  test('rejeita zero, negativo, texto e valor acima do maximo', () => {
    assert.equal(R.validarLimite(0).ok, false);
    assert.equal(R.validarLimite(-1).ok, false);
    assert.equal(R.validarLimite('abc').ok, false);
    assert.equal(R.validarLimite(1e9).ok, false);
  });
});

describe('RN14 nivelAlerta e validarResolucao', () => {
  test('ate o limite nao ha alerta; acima e alto; acima de 150% e critico', () => {
    assert.equal(R.nivelAlerta(5, 5), null);
    assert.equal(R.nivelAlerta(7.4, 5), 'alto');
    assert.equal(R.nivelAlerta(7.5, 5), 'alto');
    assert.equal(R.nivelAlerta(7.51, 5), 'critico');
  });
  test('alerta alto pode ser resolvido sem observacao', () => {
    assert.equal(R.validarResolucao('alto', '').ok, true);
  });
  test('alerta critico exige observacao com pelo menos 10 caracteres', () => {
    assert.equal(R.validarResolucao('critico', '').ok, false);
    assert.equal(R.validarResolucao('critico', 'ok').ok, false);
    const r = R.validarResolucao('critico', '  Area evacuada e detonacao suspensa  ');
    assert.equal(r.ok, true);
    assert.equal(r.observacao, 'Area evacuada e detonacao suspensa');
  });
});

describe('RN15 validarJanelaDetonacao', () => {
  const agora = new Date('2026-11-16T10:00:00'); // segunda-feira
  test('aceita dia util, dentro do horario, com 24h de antecedencia', () => {
    assert.equal(R.validarJanelaDetonacao('2026-11-18T10:30:00', agora).ok, true);
  });
  test('rejeita sabado e domingo', () => {
    assert.match(R.validarJanelaDetonacao('2026-11-21T10:00:00', agora).erro, /dias uteis/);
    assert.match(R.validarJanelaDetonacao('2026-11-22T10:00:00', agora).erro, /dias uteis/);
  });
  test('rejeita fora do horario 08:00-17:00', () => {
    assert.match(R.validarJanelaDetonacao('2026-11-18T07:59:00', agora).erro, /08:00 e 17:00/);
    assert.match(R.validarJanelaDetonacao('2026-11-18T17:00:00', agora).erro, /08:00 e 17:00/);
    assert.equal(R.validarJanelaDetonacao('2026-11-18T16:59:00', agora).ok, true);
  });
  test('rejeita com menos de 24h de antecedencia', () => {
    assert.match(R.validarJanelaDetonacao('2026-11-17T09:00:00', agora).erro, /24 h de antecedencia/);
    assert.equal(R.validarJanelaDetonacao('2026-11-17T10:00:00', agora).ok, true);
  });
  test('rejeita data invalida', () => {
    assert.equal(R.validarJanelaDetonacao('ontem', agora).ok, false);
  });
});

describe('RN16 validarVinculoDetonacao', () => {
  const agora = new Date('2026-11-16T10:00:00');
  test('aceita detonacao ocorrida nas ultimas 48h', () => {
    assert.equal(R.validarVinculoDetonacao('2026-11-15T09:00:00', agora).ok, true);
  });
  test('rejeita detonacao futura', () => {
    assert.match(R.validarVinculoDetonacao('2026-11-17T09:00:00', agora).erro, /ainda nao ocorreu/);
  });
  test('rejeita detonacao com mais de 48h', () => {
    assert.match(R.validarVinculoDetonacao('2026-11-14T09:59:00', agora).erro, /mais de 48 h/);
  });
  test('rejeita detonacao inexistente', () => {
    assert.equal(R.validarVinculoDetonacao(null, agora).ok, false);
  });
});

describe('RN17 validarPeriodoBoletim', () => {
  const hoje = new Date('2026-11-16T12:00:00Z');
  test('aceita periodo encerrado e inedito', () => {
    assert.equal(R.validarPeriodoBoletim('2026-11-09', '2026-11-15', hoje, []).ok, true);
  });
  test('rejeita periodo que inclui hoje ou futuro', () => {
    assert.match(R.validarPeriodoBoletim('2026-11-10', '2026-11-16', hoje, []).erro, /periodo terminar/);
    assert.match(R.validarPeriodoBoletim('2026-11-10', '2026-11-20', hoje, []).erro, /periodo terminar/);
  });
  test('rejeita periodo repetido', () => {
    const existentes = [{ inicio: '2026-11-09', fim: '2026-11-15' }];
    assert.match(R.validarPeriodoBoletim('2026-11-09', '2026-11-15', hoje, existentes).erro, /Ja existe/);
    assert.equal(R.validarPeriodoBoletim('2026-11-02', '2026-11-08', hoje, existentes).ok, true);
  });
});

describe('RN18 alertaAtrasado', () => {
  const agora = new Date('2026-11-16T10:00:00');
  test('aberto ha mais de 48h e atrasado; resolvido nunca e', () => {
    assert.equal(R.alertaAtrasado('aberto', '2026-11-14T09:00:00', agora), true);
    assert.equal(R.alertaAtrasado('aberto', '2026-11-15T09:00:00', agora), false);
    assert.equal(R.alertaAtrasado('resolvido', '2026-11-01T09:00:00', agora), false);
  });
});
