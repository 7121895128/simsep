// Regra de negocio central do SIMSEP: medicao acima do limite gera alerta.
// Extraida da rota para poder ser testada sem banco.

function avaliarLimite(medicao, limite) {
  if (!limite) return { ultrapassou: false, mensagem: null };

  const valor = Number(medicao.valor);
  const valorLimite = Number(limite.valor_limite);

  if (valor > valorLimite) {
    const excedente = (((valor - valorLimite) / valorLimite) * 100).toFixed(1);
    return {
      ultrapassou: true,
      mensagem: `Medicao de ${medicao.tipo} (${valor} ${medicao.unidade}) ultrapassou o limite de ` +
        `${valorLimite.toFixed(2)} ${limite.unidade} (+${excedente}%)`
    };
  }

  return { ultrapassou: false, mensagem: null };
}

// Classificacao usada no painel publico e nos relatorios.
function classificarSituacao(valor, valorLimite) {
  if (valorLimite === null || valorLimite === undefined) return 'sem_limite';
  const v = Number(valor);
  const l = Number(valorLimite);
  if (v > l) return 'acima_limite';
  if (v >= l * 0.8) return 'atencao';
  return 'normal';
}

module.exports = { avaliarLimite, classificarSituacao };
