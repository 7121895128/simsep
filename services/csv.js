// Geracao de CSV para exportacao do historico (US09).
// Usa ponto e virgula como separador, que o Excel em portugues abre direto.

function escapar(valor) {
  if (valor === null || valor === undefined) return '';
  const texto = valor instanceof Date ? valor.toISOString() : String(valor);
  if (/[;"\n\r]/.test(texto)) {
    return '"' + texto.replace(/"/g, '""') + '"';
  }
  return texto;
}

function gerarCsv(colunas, linhas) {
  const cabecalho = colunas.map((c) => escapar(c.rotulo)).join(';');
  const corpo = linhas.map((linha) =>
    colunas.map((c) => escapar(typeof c.valor === 'function' ? c.valor(linha) : linha[c.campo])).join(';')
  );
  // BOM para o Excel reconhecer UTF-8 (acentos)
  return '\uFEFF' + [cabecalho, ...corpo].join('\r\n') + '\r\n';
}

module.exports = { gerarCsv, escapar };
