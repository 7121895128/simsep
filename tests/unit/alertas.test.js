const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { avaliarLimite, classificarSituacao } = require('../../services/alertas');

const LIMITE_VIBRACAO = { tipo: 'vibracao', valor_limite: '5.00', unidade: 'mm/s' };

describe('avaliarLimite (US06 - alerta automatico)', () => {
  test('valor acima do limite gera alerta com mensagem descritiva', () => {
    const r = avaliarLimite({ tipo: 'vibracao', valor: 7.4, unidade: 'mm/s' }, LIMITE_VIBRACAO);
    assert.equal(r.ultrapassou, true);
    assert.match(r.mensagem, /7\.4 mm\/s/);
    assert.match(r.mensagem, /limite de 5\.00 mm\/s/);
    assert.match(r.mensagem, /\+48\.0%/);
  });

  test('valor igual ao limite nao gera alerta', () => {
    const r = avaliarLimite({ tipo: 'vibracao', valor: 5, unidade: 'mm/s' }, LIMITE_VIBRACAO);
    assert.equal(r.ultrapassou, false);
    assert.equal(r.mensagem, null);
  });

  test('valor abaixo do limite nao gera alerta', () => {
    assert.equal(avaliarLimite({ tipo: 'vibracao', valor: 3.2, unidade: 'mm/s' }, LIMITE_VIBRACAO).ultrapassou, false);
  });

  test('sem limite cadastrado nunca gera alerta', () => {
    assert.equal(avaliarLimite({ tipo: 'outro', valor: 999, unidade: 'x' }, undefined).ultrapassou, false);
  });

  test('compara numericamente mesmo com strings vindas do banco', () => {
    const r = avaliarLimite({ tipo: 'ruido', valor: '90.5', unidade: 'dB' }, { valor_limite: '85.00', unidade: 'dB' });
    assert.equal(r.ultrapassou, true);
  });
});

describe('classificarSituacao', () => {
  test('acima do limite', () => assert.equal(classificarSituacao(6, 5), 'acima_limite'));
  test('atencao a partir de 80% do limite', () => assert.equal(classificarSituacao(4, 5), 'atencao'));
  test('normal abaixo de 80%', () => assert.equal(classificarSituacao(3.9, 5), 'normal'));
  test('sem limite', () => assert.equal(classificarSituacao(3, null), 'sem_limite'));
});
