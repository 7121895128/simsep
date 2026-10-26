const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { gerarCsv, escapar } = require('../../services/csv');
const { montarBoletim } = require('../../services/boletim');

describe('gerarCsv (US09 - exportacao)', () => {
  test('gera cabecalho, BOM e separador ponto e virgula', () => {
    const csv = gerarCsv(
      [{ rotulo: 'Ponto', campo: 'nome' }, { rotulo: 'Valor', valor: (l) => l.valor * 2 }],
      [{ nome: 'Frente Norte', valor: 2 }]
    );
    assert.equal(csv.charCodeAt(0), 0xFEFF, 'deve comecar com BOM');
    const linhas = csv.trim().split('\r\n');
    assert.equal(linhas[0], 'Ponto;Valor');
    assert.equal(linhas[1], 'Frente Norte;4');
  });

  test('escapa campos com ponto e virgula, aspas e quebra de linha', () => {
    assert.equal(escapar('a;b'), '"a;b"');
    assert.equal(escapar('diz "oi"'), '"diz ""oi"""');
    assert.equal(escapar('linha1\nlinha2'), '"linha1\nlinha2"');
    assert.equal(escapar(null), '');
  });
});

describe('montarBoletim (US07)', () => {
  const periodo = { inicio: '2026-10-19 00:00:00', fim: '2026-10-25 23:59:59' };

  test('sem medicoes informa periodo vazio', () => {
    const b = montarBoletim({ periodo, estatisticas: [], detonacoes: [], alertas: [], pontos: 4 });
    assert.equal(b.pontos.length, 0);
    assert.match(b.resumo, /Nenhuma medicao/);
  });

  test('todas dentro do limite gera resumo tranquilizador', () => {
    const b = montarBoletim({
      periodo,
      estatisticas: [{ ponto_nome: 'Frente Norte', tipo: 'vibracao', unidade: 'mm/s', quantidade: '3', media: '2.1', maximo: '3.2', valor_limite: '5.00' }],
      detonacoes: [], alertas: [], pontos: 4
    });
    assert.equal(b.pontos[0].indicadores[0].situacao, 'normal');
    assert.match(b.resumo, /dentro dos limites/);
    assert.equal(b.alertas.total, 0);
  });

  test('ponto acima do limite aparece no resumo com contagem de alertas', () => {
    const b = montarBoletim({
      periodo,
      estatisticas: [
        { ponto_nome: 'Britador', tipo: 'ruido', unidade: 'dB', quantidade: '2', media: '88', maximo: '92.5', valor_limite: '85.00' },
        { ponto_nome: 'Frente Sul', tipo: 'vibracao', unidade: 'mm/s', quantidade: '1', media: '1.9', maximo: '1.9', valor_limite: '5.00' }
      ],
      detonacoes: [{ identificador: 'DET-1' }],
      alertas: [{ status: 'resolvido' }, { status: 'aberto' }],
      pontos: 4
    });
    assert.match(b.resumo, /1 ponto\(s\)/);
    assert.match(b.resumo, /Britador/);
    assert.match(b.resumo, /1 de 2 alerta/);
    assert.deepEqual(b.alertas, { total: 2, resolvidos: 1, abertos: 1 });
    assert.equal(b.pontos.length, 2);
  });
});
