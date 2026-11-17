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

  // DEF-03: Number(true) === 1 e Number('Infinity') passavam na validacao antiga.
  // Aceita apenas numero ou texto numerico finito, dentro de NUMERIC(10,2).
  // E4: aceita virgula decimal ("7,4") alem de ponto
  const textoValor = typeof valor === 'number' ? String(valor) : (typeof valor === 'string' ? valor.trim().replace(',', '.') : '');
  const numero = /^-?\d+(\.\d+)?$/.test(textoValor) ? Number(textoValor) : NaN;
  if (Number.isNaN(numero) || !Number.isFinite(numero)) {
    erros.push('Valor deve ser numerico');
  } else if (numero < 0) {
    erros.push('Valor nao pode ser negativo');
  } else if (numero > 99999999.99) {
    erros.push('Valor acima do maximo permitido (99.999.999,99)');
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
  // DEF-01: Date.parse('2026-02-30') devolve 2 de marco em vez de erro.
  // Confere se a data reconstruida e identica ao texto informado.
  const dataValida = (d) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return false;
    const [a, m, dia] = d.split('-').map(Number);
    const dt = new Date(Date.UTC(a, m - 1, dia));
    return dt.getUTCFullYear() === a && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === dia;
  };

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

// DEF-04: e-mail e normalizado (sem espacos, minusculas) para que
// "Ana@X.com" e "ana@x.com" sejam o mesmo usuario no cadastro e no login.
function normalizarEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function validarUsuario({ nome, email, senha, perfil }) {
  const erros = [];
  const emailNormalizado = normalizarEmail(email);
  if (!nome || String(nome).trim().length < 3) erros.push('Nome deve ter ao menos 3 caracteres');
  if (!emailNormalizado || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNormalizado)) erros.push('E-mail invalido');
  if (!senha || String(senha).length < 6) erros.push('Senha deve ter ao menos 6 caracteres');
  if (!PERFIS.includes(perfil)) erros.push('Perfil invalido');
  return {
    valido: erros.length === 0,
    erros,
    dados: { nome: String(nome || '').trim(), email: emailNormalizado, senha, perfil }
  };
}

module.exports = { TIPOS_MEDICAO, PERFIS, UNIDADE_PADRAO, validarMedicao, montarPeriodo, validarUsuario, normalizarEmail };
