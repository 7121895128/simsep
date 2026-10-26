// Regras de validação reutilizadas pelas rotas (sem dependência de banco).
// Mantidas puras para serem cobertas por testes unitários.

const TIPOS_MEDICAO = ['vibracao', 'ruido', 'ar'];
const PERFIS = ['operador', 'engenheiro', 'admin'];

// Unidade padrão de cada tipo. Antes a unidade era digitada livremente e
// podia divergir do limite (ex.: "mm/s" x "mm/seg"), quebrando a comparação.
const UNIDADE_PADRAO = {
  vibracao: 'mm/s',
  ruido: 'dB',
  ar: 'ug/m3'
};

function validarMedicao({ ponto_id, tipo, valor, unidade }) {
  const erros = [];

  if (!ponto_id || Number.isNaN(Number(ponto_id))) erros.push('Ponto de monitoramento invalido');
  if (!TIPOS_MEDICAO.includes(tipo)) erros.push('Tipo deve ser vibracao, ruido ou ar');

  const numero = Number(valor);
  if (valor === undefined || valor === null || valor === '' || Number.isNaN(numero)) {
    erros.push('Valor deve ser numerico');
  } else if (numero < 0) {
    erros.push('Valor nao pode ser negativo');
  }

  const unidadeFinal = (unidade && String(unidade).trim()) || UNIDADE_PADRAO[tipo];

  return {
    valido: erros.length === 0,
    erros,
    dados: { ponto_id: Number(ponto_id), tipo, valor: numero, unidade: unidadeFinal }
  };
}

// Converte "aaaa-mm-dd" (inicio/fim) em um intervalo fechado de timestamps.
// Aceita so inicio ou so fim; retorna null quando nenhum foi informado.
function montarPeriodo(inicio, fim) {
  const dataValida = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(Date.parse(d));

  if (!inicio && !fim) return { ok: true, periodo: null };
  if (inicio && !dataValida(inicio)) return { ok: false, erro: 'Data inicial invalida (use aaaa-mm-dd)' };
  if (fim && !dataValida(fim)) return { ok: false, erro: 'Data final invalida (use aaaa-mm-dd)' };
  if (inicio && fim && inicio > fim) return { ok: false, erro: 'Data inicial maior que a data final' };

  return {
    ok: true,
    periodo: {
      inicio: inicio ? `${inicio} 00:00:00` : '1970-01-01 00:00:00',
      fim: fim ? `${fim} 23:59:59` : '9999-12-31 23:59:59'
    }
  };
}

function validarUsuario({ nome, email, senha, perfil }) {
  const erros = [];
  if (!nome || String(nome).trim().length < 3) erros.push('Nome deve ter ao menos 3 caracteres');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) erros.push('E-mail invalido');
  if (!senha || String(senha).length < 6) erros.push('Senha deve ter ao menos 6 caracteres');
  if (!PERFIS.includes(perfil)) erros.push('Perfil invalido');
  return { valido: erros.length === 0, erros };
}

module.exports = { TIPOS_MEDICAO, PERFIS, UNIDADE_PADRAO, validarMedicao, montarPeriodo, validarUsuario };
