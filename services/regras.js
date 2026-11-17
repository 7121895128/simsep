// Regras de negocio do dominio (pedreira) - versao 1.4.
// Funcoes puras: recebem dados ja carregados e devolvem { ok, erro } ou valores.
// Cada regra e referenciada pelo codigo RN no documento docs/requisitos.md.

const HORA_INICIO_DETONACAO = 8;   // 08:00
const HORA_FIM_DETONACAO = 17;     // ate 17:00 (exclusive)
const ANTECEDENCIA_MINIMA_HORAS = 24;
const JANELA_VINCULO_HORAS = 48;
const FATOR_CRITICO = 1.5;         // > 150% do limite = critico
const HORAS_ALERTA_ATRASADO = 48;

// RN13 - limite de seguranca editavel: valor > 0, numerico, dentro de NUMERIC(10,2)
function validarLimite(valor) {
  const texto = typeof valor === 'number' ? String(valor) : (typeof valor === 'string' ? valor.trim().replace(',', '.') : '');
  const numero = /^\d+(\.\d+)?$/.test(texto) ? Number(texto) : NaN;
  if (Number.isNaN(numero)) return { ok: false, erro: 'Limite deve ser numerico' };
  if (numero <= 0) return { ok: false, erro: 'Limite deve ser maior que zero' };
  if (numero > 99999999.99) return { ok: false, erro: 'Limite acima do maximo permitido' };
  return { ok: true, valor: Math.round(numero * 100) / 100 };
}

// RN14 - nivel do alerta: 'alto' acima do limite, 'critico' acima de 150% do limite
function nivelAlerta(valor, valorLimite) {
  const v = Number(valor);
  const l = Number(valorLimite);
  if (!(v > l)) return null;
  return v > l * FATOR_CRITICO ? 'critico' : 'alto';
}

// RN14 - resolver alerta critico exige observacao (minimo 10 caracteres)
function validarResolucao(nivel, observacao) {
  if (nivel !== 'critico') return { ok: true, observacao: (observacao && String(observacao).trim()) || null };
  const texto = (observacao || '').trim();
  if (texto.length < 10) {
    return { ok: false, erro: 'Alerta critico exige uma observacao de pelo menos 10 caracteres descrevendo a providencia tomada' };
  }
  return { ok: true, observacao: texto };
}

// RN15 - janela de detonacao: dia util, 08:00-17:00, com antecedencia minima de 24h
// `agora` e injetavel para os testes.
function validarJanelaDetonacao(dataHora, agora = new Date()) {
  const d = new Date(dataHora);
  if (Number.isNaN(d.getTime())) return { ok: false, erro: 'Data/hora invalida' };

  const diaSemana = d.getDay(); // 0 dom, 6 sab
  if (diaSemana === 0 || diaSemana === 6) {
    return { ok: false, erro: 'Detonacoes so podem ser programadas em dias uteis (segunda a sexta)' };
  }
  const hora = d.getHours() + d.getMinutes() / 60;
  if (hora < HORA_INICIO_DETONACAO || hora >= HORA_FIM_DETONACAO) {
    return { ok: false, erro: 'Detonacoes so podem ser programadas entre 08:00 e 17:00' };
  }
  const horasAte = (d - agora) / 36e5;
  if (horasAte < ANTECEDENCIA_MINIMA_HORAS) {
    return { ok: false, erro: `Detonacoes devem ser programadas com pelo menos ${ANTECEDENCIA_MINIMA_HORAS} h de antecedencia (para aviso a comunidade)` };
  }
  return { ok: true };
}

// RN16 - medicao so pode ser vinculada a detonacao ja ocorrida, nas ultimas 48h
function validarVinculoDetonacao(dataHoraDetonacao, agora = new Date()) {
  if (!dataHoraDetonacao) return { ok: false, erro: 'Detonacao informada nao existe' };
  const d = new Date(dataHoraDetonacao);
  const horasDesde = (agora - d) / 36e5;
  if (horasDesde < 0) return { ok: false, erro: 'Nao e possivel vincular medicao a uma detonacao que ainda nao ocorreu' };
  if (horasDesde > JANELA_VINCULO_HORAS) {
    return { ok: false, erro: `A detonacao ocorreu ha mais de ${JANELA_VINCULO_HORAS} h; a medicao nao pode ser vinculada a ela` };
  }
  return { ok: true };
}

// RN17 - boletim: periodo encerrado (fim < hoje) e nao repetido
function validarPeriodoBoletim(inicio, fim, hoje = new Date(), periodosExistentes = []) {
  const hojeTexto = hoje.toISOString().slice(0, 10);
  if (fim >= hojeTexto) {
    return { ok: false, erro: 'O boletim so pode ser emitido depois que o periodo terminar (data final anterior a hoje)' };
  }
  const repetido = periodosExistentes.some((p) => p.inicio === inicio && p.fim === fim);
  if (repetido) return { ok: false, erro: 'Ja existe um boletim emitido para este mesmo periodo' };
  return { ok: true };
}

// RN18 - alerta aberto ha mais de 48h e considerado atrasado
function alertaAtrasado(status, dataHora, agora = new Date()) {
  if (status !== 'aberto') return false;
  return (agora - new Date(dataHora)) / 36e5 > HORAS_ALERTA_ATRASADO;
}

module.exports = {
  HORA_INICIO_DETONACAO, HORA_FIM_DETONACAO, ANTECEDENCIA_MINIMA_HORAS, JANELA_VINCULO_HORAS, FATOR_CRITICO, HORAS_ALERTA_ATRASADO,
  validarLimite, nivelAlerta, validarResolucao, validarJanelaDetonacao, validarVinculoDetonacao, validarPeriodoBoletim, alertaAtrasado
};
