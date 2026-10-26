// Un caso a pantalla completa, para mostrárselo al cliente: tres escenarios
// (hoy, sin intervención y con intervención) y un control de horizonte que
// recorre los próximos meses sobre el indicador del caso.

import { esc, numero, $, $$ } from '../util.js';
import { industriaPorId, actividadPorId, plantilla, ESLABONES } from '../motor/contenido.js';
import { seleccionarCasos } from '../motor/casos.js';
import { seriesKpi, etiquetasMeses } from '../motor/sintetico.js';
import { lineas } from '../graficos.js';
import { cargarPanel } from './panel.js';

const MESES_PROYECCION = 6;
const ULTIMO_HISTORICO = 11;

const ESCENARIOS = {
  hoy: { nombre: 'Hoy', sub: 'Situación actual' },
  sin: { nombre: 'Sin intervención', sub: 'Si todo sigue igual' },
  con: { nombre: 'Con intervención', sub: 'Con datos e IA' }
};

export async function vistaCaso(app, id, numeroCaso) {
  const registros = await cargarPanel(app);
  if (!registros) return;
  const reg = registros.find((r) => r.id === id);
  if (!reg) {
    app.innerHTML = `<div class="contenedor angosto"><div class="tarjeta bloque" style="margin-top:40px">
      <h2>No encontramos este cliente</h2><a class="btn btn-primario" href="#/panel">Volver a la cartera</a></div></div>`;
    return;
  }
  const r = reg.respuestas;
  const empresa = r.contacto.empresa;
  const ind = industriaPorId(r.industria);
  const act = actividadPorId(ind, r.actividad);
  const ctx = { ...ind.vocab, empresa };
  const casos = seleccionarCasos({
    nivel: reg.resultado.nivel, industria: ind.id, eslabon: act.eslabon,
    objetivos: Array.isArray(r.objetivos) ? r.objetivos : []
  });
  const n = Math.min(Math.max(Number(numeroCaso) || 1, 1), casos.length);
  const caso = casos[n - 1];
  const k = seriesKpi(caso.kpi, `${reg.id}:${caso.id}`);
  const etiquetas = etiquetasMeses(new Date(reg.creado), ULTIMO_HISTORICO, ULTIMO_HISTORICO + 1 + MESES_PROYECCION);
  const unidad = caso.kpi.unidad;
  const fmt = (v) => `${numero(v, k.decimales)} ${unidad}`;
  const fmtCorto = (v) => numero(v, k.decimales);
  const nombreKpi = caso.kpi.nombre;
  const base = `#/panel/${reg.id}/caso/`;

  const estado = { escenario: 'hoy', meses: MESES_PROYECCION };

  app.innerHTML = `
    <section class="caso-hoja-cab">
      <div class="contenedor">
        <nav class="ficha-nav">
          <a href="#/panel/${reg.id}">← Ficha de ${esc(empresa)}</a>
          <span>
            ${n > 1 ? `<a href="${base}${n - 1}">‹ Caso ${n - 1}</a>` : ''}
            <b class="caso-contador">Caso ${n} de ${casos.length}</b>
            ${n < casos.length ? `<a href="${base}${n + 1}">Caso ${n + 1} ›</a>` : ''}
          </span>
        </nav>
        <div class="etiqueta">Caso para ${esc(empresa)}</div>
        <h1>${esc(plantilla(caso.titulo, ctx))}</h1>
        <div class="res-meta">
          ${caso.industria ? `<span class="chip">${ind.icono} ${esc(ind.nombre)}</span>` : ''}
          ${caso.eslabon ? `<span class="chip">${esc(ESLABONES[caso.eslabon])}</span>` : ''}
          ${!caso.industria && !caso.eslabon ? '<span class="chip">Caso transversal</span>' : ''}
          <span class="chip">Indicador: ${esc(nombreKpi)}</span>
        </div>
      </div>
    </section>

    <div class="contenedor caso-hoja">
      <section class="tarjeta escenario-panel">
        <div class="escenarios" role="tablist" aria-label="Escenario">
          ${Object.entries(ESCENARIOS).map(([key, e]) => `
            <button role="tab" class="esc-${key}" data-escenario="${key}" aria-selected="${key === estado.escenario}">
              <strong>${e.nombre}</strong><small>${e.sub}</small>
            </button>`).join('')}
        </div>
        <div class="escenario-grid">
          <div class="escenario-texto" id="esc-texto" aria-live="polite"></div>
          <div class="escenario-kpi" id="esc-kpi"></div>
        </div>
        <div class="horizonte" id="horizonte">
          <label for="meses">Horizonte: <strong id="meses-txt"></strong></label>
          <input type="range" id="meses" min="1" max="${MESES_PROYECCION}" step="1" value="${estado.meses}">
          <div class="horizonte-marcas" aria-hidden="true">${Array.from({ length: MESES_PROYECCION }, (_, i) => `<span>${i + 1}</span>`).join('')}</div>
        </div>
        <div id="graf-escenario" class="graf-escenario"></div>
      </section>

      <div class="dos-col caso-detalle">
        <section class="tarjeta bloque">
          <div class="etiqueta">El problema</div>
          <p class="caso-parrafo">${esc(plantilla(caso.problema, ctx))}</p>
        </section>
        <section class="tarjeta bloque">
          <div class="etiqueta">La solución con datos</div>
          <p class="caso-parrafo">${esc(plantilla(caso.solucion, ctx))}</p>
          <div class="tecnica">🛠 ${esc(caso.tecnica)}</div>
        </section>
      </div>

      <nav class="casos-nav" aria-label="Otros casos">
        ${casos.map((c, i) => `
          <a href="${base}${i + 1}" class="${i + 1 === n ? 'actual' : ''}" ${i + 1 === n ? 'aria-current="page"' : ''}>
            <span class="caso-num">${i + 1}</span><span>${esc(plantilla(c.titulo, ctx))}</span>
          </a>`).join('')}
      </nav>
    </div>`;

  const valorEn = (esc_, meses) => {
    if (esc_ === 'hoy') return k.actual;
    const serie = esc_ === 'con' ? k.favorable : k.desfavorable;
    return serie[ULTIMO_HISTORICO + meses];
  };
  const mejora = (desde, hasta) => (k.menorEsMejor ? hasta < desde : hasta > desde);
  const variacion = (desde, hasta) => (desde ? (hasta - desde) / Math.abs(desde) : 0);
  const textoMeses = (m) => `${m} ${m === 1 ? 'mes' : 'meses'}`;

  function cambioHtml(desde, hasta, rotulo) {
    const v = variacion(desde, hasta);
    if (Math.abs(v) < 0.005) return `<span class="cambio neutro">● Sin cambio ${rotulo}</span>`;
    const bien = mejora(desde, hasta);
    return `<span class="cambio ${bien ? 'mejora' : 'empeora'}">${bien ? '▲ Mejora' : '▼ Empeora'} ${numero(Math.abs(v) * 100)} % ${rotulo}</span>`;
  }

  function pintarTexto() {
    const m = estado.meses;
    const hoy = k.actual;
    const sin = valorEn('sin', m);
    const con = valorEn('con', m);
    let html;
    if (estado.escenario === 'hoy') {
      html = `<h2>Así está ${esc(empresa)} hoy</h2>
        <p>${esc(plantilla(caso.problema, ctx))}</p>
        <p class="esc-dato">Hoy, ${esc(nombreKpi.toLowerCase())} está en <strong>${fmt(hoy)}</strong>.</p>`;
    } else if (estado.escenario === 'sin') {
      const igual = Math.abs(variacion(hoy, sin)) < 0.005;
      html = `<h2>Si no hace nada</h2>
        <p>Si ${esc(empresa)} sigue operando igual, en ${textoMeses(m)} ${esc(nombreKpi.toLowerCase())} ${igual ? `se quedaría en <strong>${fmt(sin)}</strong>` : `pasaría de <strong>${fmt(hoy)}</strong> a <strong>${fmt(sin)}</strong>`}.</p>
        <p>${igual ? 'El problema no se corrige solo: el costo de oportunidad se acumula mes a mes.' : 'El problema se acumula: cada mes sin datos es otro mes de decisiones a ciegas, y la brecha con la competencia crece.'}</p>`;
    } else {
      html = `<h2>Con intervención</h2>
        <p>${esc(plantilla(caso.solucion, ctx))}</p>
        <p class="esc-dato">En ${textoMeses(m)}: <strong>${fmt(con)}</strong>, frente a <strong>${fmt(sin)}</strong> si no se hace nada.</p>
        <ol class="plan">
          <li><b>Semanas 1 y 2</b>Levantar y ordenar los datos que hoy existen.</li>
          <li><b>Semanas 3 a 8</b>Implementar: ${esc(caso.tecnica)}.</li>
          <li><b>Desde el mes 3</b>Medir ${esc(nombreKpi.toLowerCase())} cada mes y ajustar.</li>
        </ol>`;
    }
    $('#esc-texto', app).innerHTML = html;

    const valor = valorEn(estado.escenario, m);
    $('#esc-kpi', app).className = `escenario-kpi kpi-${estado.escenario}`;
    $('#esc-kpi', app).innerHTML = `
      <div class="lbl">${esc(nombreKpi)}</div>
      <div class="kpi-grande"><span>${fmtCorto(valor)}</span><small>${esc(unidad)}</small></div>
      <div class="kpi-cuando">${estado.escenario === 'hoy' ? 'Valor actual' : `En ${textoMeses(m)}`}</div>
      ${estado.escenario === 'hoy' ? `<span class="cambio neutro">${k.menorEsMejor ? 'Menor es mejor' : 'Mayor es mejor'}</span>` : cambioHtml(hoy, valor, 'frente a hoy')}
      ${estado.escenario === 'con' ? `<div class="kpi-brecha">Diferencia frente a no actuar: <strong>${fmt(Math.abs(con - sin))}</strong></div>` : ''}`;
  }

  // Escala fija con todos los valores, para que el eje no salte al cambiar.
  const escalaFija = [...k.historico, ...k.favorable, ...k.desfavorable];

  function pintarGrafico() {
    const e = estado.escenario;
    const series = [{ nombre: 'Histórico', corto: 'Histórico', valores: k.historico, color: 'var(--serie-hist)' }];
    if (e !== 'hoy') {
      series.push({
        nombre: 'Sin intervención', corto: 'Sin intervención', valores: k.desfavorable, color: 'var(--serie-desf)', punteada: true,
        atenuada: e === 'con', grosor: e === 'sin' ? 3 : 2
      });
    }
    if (e === 'con') {
      series.push({ nombre: 'Con intervención', corto: 'Con intervención', valores: k.favorable, color: 'var(--serie-fav)', grosor: 3 });
    }
    lineas($('#graf-escenario', app), {
      etiquetas,
      series,
      formato: fmtCorto,
      inicioProyeccion: ULTIMO_HISTORICO,
      alto: 300,
      titulo: `${nombreKpi} (${unidad})`,
      escalaFija,
      marcador: e === 'hoy' ? ULTIMO_HISTORICO : ULTIMO_HISTORICO + estado.meses
    });
  }

  function pintar() {
    $('#horizonte', app).classList.toggle('inactivo', estado.escenario === 'hoy');
    $('#meses', app).disabled = estado.escenario === 'hoy';
    $('#meses-txt', app).textContent = estado.escenario === 'hoy' ? 'hoy' : textoMeses(estado.meses);
    pintarTexto();
    pintarGrafico();
  }

  for (const b of $$('[data-escenario]', app)) {
    b.addEventListener('click', () => {
      estado.escenario = b.dataset.escenario;
      for (const o of $$('[data-escenario]', app)) o.setAttribute('aria-selected', o === b);
      pintar();
    });
  }
  $('#meses', app).addEventListener('input', (e) => {
    estado.meses = Number(e.target.value);
    pintar();
  });

  pintar();
}
