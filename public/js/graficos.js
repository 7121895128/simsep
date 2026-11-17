// E5 (teste com usuarios): graficos simples em SVG, sem biblioteca externa.
// Usado no historico de medicoes (linha) e no relatorio gerencial (barras).

function escG(v) {
  return String(v === null || v === undefined ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// pontos: [{x: Date|number, y: number, acima: bool, rotulo: string}] ordenados por x
// limite: numero ou null
function graficoLinha(pontos, limite, opcoes = {}) {
  const W = 760, H = 220, mL = 44, mR = 16, mT = 14, mB = 34;
  if (!pontos.length) return '<p class="vazio">Sem dados para o gráfico.</p>';

  const xs = pontos.map((p) => +p.x);
  const ys = pontos.map((p) => p.y).concat(limite !== null && limite !== undefined ? [Number(limite)] : []);
  const xMin = Math.min(...xs), xMax = Math.max(...xs) === xMin ? xMin + 1 : Math.max(...xs);
  const yMax = Math.max(...ys) * 1.15 || 1;

  const X = (x) => mL + ((+x - xMin) / (xMax - xMin)) * (W - mL - mR);
  const Y = (y) => H - mB - (y / yMax) * (H - mT - mB);

  const caminho = pontos.map((p, i) => `${i === 0 ? 'M' : 'L'}${X(p.x).toFixed(1)},${Y(p.y).toFixed(1)}`).join(' ');

  // 4 linhas de grade no eixo Y
  let grade = '';
  for (let i = 0; i <= 4; i++) {
    const v = (yMax / 4) * i;
    grade += `<line class="eixo" x1="${mL}" x2="${W - mR}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}"/>` +
      `<text class="rotulo" x="${mL - 6}" y="${(Y(v) + 4).toFixed(1)}" text-anchor="end">${v.toFixed(v >= 10 ? 0 : 1)}</text>`;
  }

  // rotulos do eixo X: primeiro, meio e ultimo
  // rotulos do eixo X sem sobreposicao: so desenha se houver >= 90px desde o anterior
  let ultimoX = -Infinity;
  const rotX = pontos.map((p, i) => {
    const px = X(p.x);
    if (px - ultimoX < 90 && i !== pontos.length - 1) return '';
    if (i === pontos.length - 1 && px - ultimoX < 90) return '';
    ultimoX = px;
    const anchor = px < mL + 40 ? 'start' : px > W - mR - 40 ? 'end' : 'middle';
    return `<text class="rotulo" x="${px.toFixed(1)}" y="${H - 10}" text-anchor="${anchor}">${escG(p.eixo || p.rotulo)}</text>`;
  }).join('');

  const linhaLimite = limite !== null && limite !== undefined
    ? `<line class="limite" x1="${mL}" x2="${W - mR}" y1="${Y(Number(limite)).toFixed(1)}" y2="${Y(Number(limite)).toFixed(1)}"/>` +
      `<text class="rotulo" x="${W - mR}" y="${(Y(Number(limite)) - 4).toFixed(1)}" text-anchor="end">limite ${limite}</text>`
    : '';

  const marcadores = pontos.map((p) =>
    `<circle class="${p.acima ? 'pontoA' : 'pontoN'}" cx="${X(p.x).toFixed(1)}" cy="${Y(p.y).toFixed(1)}" r="3.5"><title>${escG(p.rotulo)}: ${escG(p.y)}</title></circle>`
  ).join('');

  return `<p class="legenda-grafico">${escG(opcoes.titulo || '')}<i style="background:var(--accent)"></i>leitura <i style="background:var(--danger)"></i>acima do limite</p>` +
    `<svg class="grafico" viewBox="0 0 ${W} ${H}" role="img" aria-label="${escG(opcoes.titulo || 'Gráfico de linha')}">${grade}${linhaLimite}<path class="serie" d="${caminho}"/>${marcadores}${rotX}</svg>`;
}

// grupos: [{rotulo, a: numero, b: numero}] -> barras lado a lado (a = medicoes, b = alertas)
function graficoBarras(grupos, opcoes = {}) {
  const W = 760, H = 200, mL = 40, mR = 10, mT = 14, mB = 30;
  if (!grupos.length) return '<p class="vazio">Sem dados para o gráfico.</p>';

  const yMax = Math.max(...grupos.map((g) => Math.max(g.a, g.b))) * 1.15 || 1;
  const larguraGrupo = (W - mL - mR) / grupos.length;
  const larguraBarra = Math.min(28, larguraGrupo * 0.35);
  const Y = (y) => H - mB - (y / yMax) * (H - mT - mB);

  let grade = '';
  for (let i = 0; i <= 4; i++) {
    const v = Math.round((yMax / 4) * i);
    grade += `<line class="eixo" x1="${mL}" x2="${W - mR}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}"/>` +
      `<text class="rotulo" x="${mL - 6}" y="${(Y(v) + 4).toFixed(1)}" text-anchor="end">${v}</text>`;
  }

  const barras = grupos.map((g, i) => {
    const cx = mL + larguraGrupo * i + larguraGrupo / 2;
    return `<rect class="barra-med" x="${(cx - larguraBarra - 2).toFixed(1)}" y="${Y(g.a).toFixed(1)}" width="${larguraBarra}" height="${(H - mB - Y(g.a)).toFixed(1)}"><title>${escG(g.rotulo)}: ${g.a} ${escG(opcoes.rotuloA || '')}</title></rect>` +
      `<rect class="barra-al" x="${(cx + 2).toFixed(1)}" y="${Y(g.b).toFixed(1)}" width="${larguraBarra}" height="${(H - mB - Y(g.b)).toFixed(1)}"><title>${escG(g.rotulo)}: ${g.b} ${escG(opcoes.rotuloB || '')}</title></rect>` +
      `<text class="rotulo" x="${cx.toFixed(1)}" y="${H - 10}" text-anchor="middle">${escG(g.rotulo)}</text>`;
  }).join('');

  return `<p class="legenda-grafico">${escG(opcoes.titulo || '')}<i style="background:var(--accent)"></i>${escG(opcoes.rotuloA || 'A')} <i style="background:var(--danger)"></i>${escG(opcoes.rotuloB || 'B')}</p>` +
    `<svg class="grafico" viewBox="0 0 ${W} ${H}" role="img" aria-label="${escG(opcoes.titulo || 'Gráfico de barras')}">${grade}${barras}</svg>`;
}
