// Gráficos SVG livianos, sin dependencias: líneas con proyección y barras
// horizontales. Incluyen tooltip con cruceta, navegación por teclado y una
// tabla de datos como alternativa accesible.

const NS = 'http://www.w3.org/2000/svg';

function svgEl(nombre, attrs = {}) {
  const el = document.createElementNS(NS, nombre);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

function escalaBonita(min, max, pasos = 4) {
  if (min === max) { min -= 1; max += 1; }
  const crudo = (max - min) / pasos;
  const mag = 10 ** Math.floor(Math.log10(crudo));
  const norm = crudo / mag;
  const paso = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * mag;
  const ini = Math.floor(min / paso) * paso;
  const fin = Math.ceil(max / paso) * paso;
  const ticks = [];
  for (let v = ini; v <= fin + paso / 2; v += paso) ticks.push(Number(v.toFixed(10)));
  return { ini, fin, ticks };
}

function claveLinea(color, punteada) {
  const s = document.createElement('span');
  s.className = 'linea-key' + (punteada ? ' punteada' : '');
  s.style.borderTopColor = color;
  return s;
}

function leyenda(series) {
  const div = document.createElement('div');
  div.className = 'leyenda';
  for (const s of series) {
    const item = document.createElement('span');
    item.append(claveLinea(s.color, s.punteada), document.createTextNode(s.nombre));
    div.append(item);
  }
  return div;
}

function tablaDatos(etiquetas, series, formato, titulo) {
  const det = document.createElement('details');
  det.className = 'tabla-datos';
  const sum = document.createElement('summary');
  sum.textContent = 'Ver datos en tabla';
  const envoltura = document.createElement('div');
  envoltura.className = 'tabla-scroll';
  const tabla = document.createElement('table');
  if (titulo) {
    const cap = document.createElement('caption');
    cap.className = 'oculto';
    cap.textContent = titulo;
    tabla.append(cap);
  }
  const cab = tabla.createTHead().insertRow();
  for (const t of ['Periodo', ...series.map((s) => s.nombre)]) {
    const th = document.createElement('th');
    th.textContent = t;
    cab.append(th);
  }
  const cuerpo = tabla.createTBody();
  etiquetas.forEach((et, i) => {
    if (series.every((s) => s.valores[i] == null)) return;
    const fila = cuerpo.insertRow();
    fila.insertCell().textContent = et;
    for (const s of series) fila.insertCell().textContent = s.valores[i] == null ? '' : formato(s.valores[i]);
  });
  envoltura.append(tabla);
  det.append(sum, envoltura);
  return det;
}

/**
 * Gráfico de líneas.
 * opts: { etiquetas, series: [{ nombre, valores, color, punteada, atenuada, grosor }],
 *         formato, inicioProyeccion, alto, compacto, titulo,
 *         escalaFija: valores que fijan el eje Y (para comparar escenarios sin que salte),
 *         marcador: índice que se resalta con una línea vertical y su valor }
 */
export function lineas(contenedor, opts) {
  const { etiquetas, series, formato = String, inicioProyeccion = null, alto = 300, compacto = false, titulo = '', escalaFija = null, marcador = null } = opts;
  contenedor.replaceChildren();
  if (series.length > 1) contenedor.append(leyenda(series));
  const marco = document.createElement('div');
  marco.className = 'grafico';
  const tip = document.createElement('div');
  tip.className = 'tooltip';
  tip.setAttribute('role', 'status');
  marco.append(tip);
  contenedor.append(marco);
  if (!compacto) contenedor.append(tablaDatos(etiquetas, series, formato, titulo));

  const valores = (escalaFija || series.flatMap((s) => s.valores)).filter((v) => v != null);
  const minV = Math.min(...valores);
  const maxV = Math.max(...valores);
  const holgura = (maxV - minV) * 0.08 || Math.abs(maxV) * 0.1 || 1;
  const piso = minV >= 0 && minV - holgura < 0 ? 0 : minV - holgura;
  const esc = escalaBonita(piso, maxV + holgura, compacto ? 3 : 4);

  let indiceActivo = null;

  function dibujar() {
    const ancho = Math.max(marco.clientWidth, 260);
    const directas = !compacto && ancho >= 560 && series.length <= 4;
    const m = { t: 22, r: directas ? 104 : 12, b: 28, l: compacto ? 44 : 60 };
    const w = ancho - m.l - m.r;
    const h = alto - m.t - m.b;
    const x = (i) => m.l + (etiquetas.length === 1 ? w / 2 : (i / (etiquetas.length - 1)) * w);
    const y = (v) => m.t + h - ((v - esc.ini) / (esc.fin - esc.ini)) * h;

    marco.querySelector('svg')?.remove();
    const svg = svgEl('svg', { viewBox: `0 0 ${ancho} ${alto}`, height: alto, role: 'img', 'aria-label': titulo || 'Gráfico de líneas' });

    if (inicioProyeccion != null) {
      const x0 = x(inicioProyeccion);
      svg.append(svgEl('rect', { class: 'zona-proy', x: x0, y: m.t - 14, width: m.l + w - x0, height: h + 14 }));
      const txt = svgEl('text', { class: 'zona-txt', x: x0 + 6, y: m.t - 3 });
      txt.textContent = 'PROYECCIÓN';
      svg.append(txt);
    }

    const rejilla = svgEl('g', { class: 'rejilla' });
    const eje = svgEl('g', { class: 'eje' });
    for (const t of esc.ticks) {
      rejilla.append(svgEl('line', { x1: m.l, x2: m.l + w, y1: y(t), y2: y(t) }));
      const tx = svgEl('text', { x: m.l - 8, y: y(t) + 4, 'text-anchor': 'end' });
      tx.textContent = formato(t);
      eje.append(tx);
    }
    const cadaN = Math.max(1, Math.ceil(etiquetas.length / Math.max(2, Math.floor(w / (compacto ? 70 : 62)))));
    etiquetas.forEach((et, i) => {
      if (i % cadaN !== 0 && i !== etiquetas.length - 1) return;
      if (i !== etiquetas.length - 1 && etiquetas.length - 1 - i < cadaN) return;
      const tx = svgEl('text', { x: x(i), y: alto - 8, 'text-anchor': 'middle' });
      tx.textContent = et;
      eje.append(tx);
    });
    svg.append(rejilla, eje);

    const etiquetasFin = [];
    for (const s of series) {
      let d = '';
      let abierto = false;
      s.valores.forEach((v, i) => {
        if (v == null) { abierto = false; return; }
        d += `${abierto ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`;
        abierto = true;
      });
      svg.append(svgEl('path', {
        d, fill: 'none', stroke: s.color, 'stroke-width': s.grosor || 2.25, 'stroke-linejoin': 'round', 'stroke-linecap': 'round',
        ...(s.punteada ? { 'stroke-dasharray': '6 5' } : {}),
        ...(s.atenuada ? { 'stroke-opacity': 0.35 } : {})
      }));
      const ult = s.valores.reduce((acc, v, i) => (v != null ? i : acc), -1);
      if (ult >= 0) {
        svg.append(svgEl('circle', { cx: x(ult), cy: y(s.valores[ult]), r: 4, fill: s.color, stroke: 'var(--superficie)', 'stroke-width': 2, ...(s.atenuada ? { 'fill-opacity': 0.35 } : {}) }));
        // Solo se rotulan las series que llegan al borde derecho.
        if (ult === etiquetas.length - 1) etiquetasFin.push({ s, yv: y(s.valores[ult]), xv: x(ult) });
      }
    }

    if (directas) {
      // Etiquetas al final de cada línea, separadas para que no se pisen.
      etiquetasFin.sort((a, b) => a.yv - b.yv);
      for (let i = 1; i < etiquetasFin.length; i++) {
        if (etiquetasFin[i].yv - etiquetasFin[i - 1].yv < 16) etiquetasFin[i].yv = etiquetasFin[i - 1].yv + 16;
      }
      for (const e of etiquetasFin) {
        const tx = svgEl('text', { class: 'etq-directa', x: e.xv + 10, y: e.yv + 4 });
        tx.textContent = e.s.corto || e.s.nombre;
        svg.append(tx);
      }
    }

    if (marcador != null) {
      const xm = x(marcador);
      svg.append(svgEl('line', { class: 'marcador', x1: xm, x2: xm, y1: m.t - 6, y2: m.t + h }));
      for (const s of series) {
        const v = s.valores[marcador];
        if (v == null || s.atenuada) continue;
        svg.append(svgEl('circle', { cx: xm, cy: y(v), r: 7, fill: s.color, stroke: 'var(--superficie)', 'stroke-width': 3 }));
        const tx = svgEl('text', { class: 'marcador-txt', x: xm + (xm > m.l + w * 0.75 ? -12 : 12), y: y(v) - 12, 'text-anchor': xm > m.l + w * 0.75 ? 'end' : 'start' });
        tx.textContent = formato(v);
        svg.append(tx);
      }
    }

    const cruz = svgEl('line', { class: 'cruz', y1: m.t, y2: m.t + h, visibility: 'hidden' });
    const puntos = series.map((s) => svgEl('circle', { r: 5, fill: s.color, stroke: 'var(--superficie)', 'stroke-width': 2, visibility: 'hidden' }));
    svg.append(cruz, ...puntos);

    const capa = svgEl('rect', { x: m.l - 10, y: 0, width: w + 20, height: alto, fill: 'transparent', tabindex: 0, 'aria-label': 'Explorar valores con las flechas' });
    svg.append(capa);
    marco.prepend(svg);

    function mostrar(i) {
      indiceActivo = i;
      const xi = x(i);
      cruz.setAttribute('x1', xi);
      cruz.setAttribute('x2', xi);
      cruz.setAttribute('visibility', 'visible');
      tip.replaceChildren();
      const tt = document.createElement('div');
      tt.className = 't-tit';
      tt.textContent = etiquetas[i];
      tip.append(tt);
      series.forEach((s, k) => {
        const v = s.valores[i];
        if (v == null) { puntos[k].setAttribute('visibility', 'hidden'); return; }
        puntos[k].setAttribute('cx', xi);
        puntos[k].setAttribute('cy', y(v));
        puntos[k].setAttribute('visibility', 'visible');
        const fila = document.createElement('div');
        fila.className = 't-fila';
        const nom = document.createElement('span');
        nom.append(claveLinea(s.color, s.punteada), document.createTextNode(s.nombre));
        const val = document.createElement('b');
        val.textContent = formato(v);
        fila.append(val, nom);
        tip.append(fila);
      });
      tip.classList.add('ver');
      const tw = tip.offsetWidth;
      const izq = xi + 14 + tw > ancho ? xi - 14 - tw : xi + 14;
      tip.style.left = `${Math.max(0, izq)}px`;
      tip.style.top = `${m.t}px`;
    }
    function ocultar() {
      indiceActivo = null;
      cruz.setAttribute('visibility', 'hidden');
      puntos.forEach((p) => p.setAttribute('visibility', 'hidden'));
      tip.classList.remove('ver');
    }
    const indicePorX = (px) => Math.round(((px - m.l) / w) * (etiquetas.length - 1));
    capa.addEventListener('pointermove', (ev) => {
      const r = svg.getBoundingClientRect();
      const px = ((ev.clientX - r.left) / r.width) * ancho;
      mostrar(Math.min(etiquetas.length - 1, Math.max(0, indicePorX(px))));
    });
    capa.addEventListener('pointerleave', ocultar);
    capa.addEventListener('blur', ocultar);
    capa.addEventListener('keydown', (ev) => {
      if (ev.key !== 'ArrowLeft' && ev.key !== 'ArrowRight') return;
      ev.preventDefault();
      const base = indiceActivo ?? (ev.key === 'ArrowLeft' ? etiquetas.length : -1);
      mostrar(Math.min(etiquetas.length - 1, Math.max(0, base + (ev.key === 'ArrowRight' ? 1 : -1))));
    });
  }

  dibujar();
  let anchoPrevio = marco.clientWidth;
  const obs = new ResizeObserver(() => {
    if (!marco.isConnected) { obs.disconnect(); return; }
    if (Math.abs(marco.clientWidth - anchoPrevio) > 4) { anchoPrevio = marco.clientWidth; dibujar(); }
  });
  obs.observe(marco);
}

/**
 * Barras horizontales en HTML (una sola serie).
 * items: [{ etiqueta, valor, color?, detalle? }]
 */
export function barras(contenedor, items, { max = null, formato = String } = {}) {
  const tope = max ?? Math.max(...items.map((i) => i.valor), 1);
  contenedor.replaceChildren();
  contenedor.classList.add('barras');
  for (const it of items) {
    const fila = document.createElement('div');
    fila.className = 'barra-fila';
    fila.title = `${it.etiqueta}: ${formato(it.valor)}${it.detalle ? ` · ${it.detalle}` : ''}`;
    const lbl = document.createElement('span');
    lbl.textContent = it.etiqueta;
    const pista = document.createElement('div');
    pista.className = 'pista';
    const relleno = document.createElement('div');
    relleno.className = 'relleno';
    relleno.style.width = '0%';
    if (it.color) relleno.style.background = it.color;
    pista.append(relleno);
    const val = document.createElement('span');
    val.className = 'valor';
    val.textContent = formato(it.valor);
    fila.append(lbl, pista, val);
    contenedor.append(fila);
    requestAnimationFrame(() => { relleno.style.width = `${(it.valor / tope) * 100}%`; });
  }
}
