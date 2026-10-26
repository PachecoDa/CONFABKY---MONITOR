// Diagnóstico de una empresa: clasificación, perfil, tablero con datos
// sintéticos, casos hipotéticos, ruta de intervención y cursos.

import { esc, api, numero, millones, fecha, $, $$ } from '../util.js';
import { CONFIG } from '../config.js';
import { industriaPorId, actividadPorId, plantilla, DIMENSIONES, ESLABONES, PREGUNTAS_PERFIL } from '../motor/contenido.js';
import { NIVELES, UMBRALES } from '../motor/evaluacion.js';
import { seleccionarCasos } from '../motor/casos.js';
import { cursosRecomendados, RUTAS } from '../motor/cursos.js';
import { seriesVentas, seriesKpi, etiquetasMeses } from '../motor/sintetico.js';
import { lineas, barras } from '../graficos.js';

const COLOR = {
  hist: 'var(--serie-hist)',
  fav: 'var(--serie-fav)',
  desf: 'var(--serie-desf)'
};

const TAMANOS = Object.fromEntries(PREGUNTAS_PERFIL.find((p) => p.id === 'tamano').opciones.map((o) => [o.v, o.d]));

export async function vistaResultado(app, id) {
  app.innerHTML = '<div class="cargando"><div class="giro"></div><p>Cargando diagnóstico…</p></div>';
  let reg;
  try {
    reg = await api(`/api/encuestas/${encodeURIComponent(id)}`);
  } catch (e) {
    app.innerHTML = `<div class="contenedor angosto"><div class="tarjeta bloque" style="margin-top:40px">
      <h2>No encontramos este diagnóstico</h2><p>${esc(e.message)}</p>
      <a class="btn btn-primario" href="#/encuesta">Hacer un diagnóstico</a></div></div>`;
    return;
  }

  const r = reg.respuestas;
  const res = reg.resultado;
  const ind = industriaPorId(r.industria);
  const act = actividadPorId(ind, r.actividad);
  const empresa = r.contacto.empresa;
  const ctx = { ...ind.vocab, empresa };
  const nivel = NIVELES[res.nivel];
  const ventas = seriesVentas({ id: reg.id, tamano: r.tamano, nivel: res.nivel, estacionalidad: ind.estacionalidad, fecha: reg.creado });
  const cursos = cursosRecomendados(res.nivel, r.rol);
  const crecFav = ventas.anualFavorable / ventas.anualActual - 1;
  const crecDesf = ventas.anualDesfavorable / ventas.anualActual - 1;
  const pct = (v) => `${v >= 0 ? '+' : '−'}${numero(Math.abs(v) * 100)} %`;

  app.innerHTML = `
    <section class="res-cabecera">
      <div class="contenedor">
        <div class="etiqueta">Diagnóstico de madurez en datos e IA</div>
        <h1>${esc(empresa)}</h1>
        <div class="res-meta">
          <span class="chip">${ind.icono} ${esc(ind.nombre)}</span>
          <span class="chip">${esc(act.nombre)}</span>
          <span class="chip">Eslabón: ${esc(ESLABONES[act.eslabon])}</span>
          <span class="chip">${esc(TAMANOS[r.tamano] || '')}</span>
          <span class="chip">${fecha(reg.creado)}</span>
        </div>
        <div class="res-acciones">
          <button class="btn btn-dorado" id="imprimir">Descargar PDF</button>
          <button class="btn btn-claro" id="copiar">Copiar enlace</button>
          <a class="btn btn-claro" href="#/encuesta">Nuevo diagnóstico</a>
        </div>
      </div>
    </section>

    <div class="contenedor res-cuerpo">
      <section class="tarjeta bloque">
        <div class="clasificacion">
          <div class="indice ${res.nivel}">
            <div class="num">${res.indice}<small>/100</small></div>
            <div class="lbl">Índice de madurez en datos e IA</div>
            <span class="nivel nivel-${res.nivel}" data-icono="${nivel.icono}">${nivel.nombre}</span>
          </div>
          <div>
            <div class="etiqueta">Clasificación</div>
            <h2>${esc(nivel.nombre)}: ${esc(nivel.etiqueta)}</h2>
            <p class="resumen">${esc(nivel.resumen)}</p>
            <div class="escala" aria-label="Escala de riesgo; índice ${res.indice} de 100">
              <div class="escala-barra">
                <span style="width:${UMBRALES.moderado}%;background:var(--alto)"></span>
                <span style="width:${UMBRALES.bajo - UMBRALES.moderado}%;background:var(--moderado)"></span>
                <span style="width:${100 - UMBRALES.bajo}%;background:var(--bajo)"></span>
                <i class="escala-marcador" style="left:${res.indice}%"></i>
              </div>
              <div class="escala-lbls">
                <span style="width:${UMBRALES.moderado}%">● Alto · 0–${UMBRALES.moderado - 1}</span>
                <span style="width:${UMBRALES.bajo - UMBRALES.moderado}%">◆ Moderado · ${UMBRALES.moderado}–${UMBRALES.bajo - 1}</span>
                <span style="width:${100 - UMBRALES.bajo}%">▲ Bajo · ${UMBRALES.bajo}–100</span>
              </div>
            </div>
            ${res.ajustes.map((a) => `<div class="aviso">ⓘ ${esc(a)}</div>`).join('')}
            <p style="margin:16px 0 0"><strong>Enfoque recomendado:</strong> ${esc(nivel.enfoque)}.</p>
          </div>
        </div>
      </section>

      <div class="dos-col">
        <section class="tarjeta bloque">
          <div class="bloque-titulo"><div><div class="etiqueta">Perfil</div><h2>Madurez por dimensión</h2></div></div>
          <div id="dimensiones"></div>
          ${res.fortalezas.length ? `<div class="fortalezas"><span style="font-size:.9rem;color:var(--tinta-2)">Fortalezas:</span>${res.fortalezas.map((f) => `<span class="chip">✓ ${esc(DIMENSIONES[f].corto)}</span>`).join('')}</div>` : ''}
        </section>
        <section class="tarjeta bloque">
          <div class="bloque-titulo"><div><div class="etiqueta">Hallazgos</div><h2>Lo que más frena hoy</h2></div></div>
          ${res.hallazgos.length ? `<ul class="hallazgos">
            ${res.hallazgos.slice(0, 5).map((h) => `
              <li><span class="marca-h ${h.gravedad}">${h.gravedad === 'critico' ? 'Crítico' : 'Mejorable'}</span>
              <div>${esc(h.texto)}<small>Respuesta: ${esc(h.respuesta)}</small></div></li>`).join('')}
          </ul>` : '<p>No se encontraron brechas críticas. El reto es escalar lo que ya funciona.</p>'}
        </section>
      </div>

      <section class="tarjeta bloque">
        <div class="bloque-titulo">
          <div>
            <div class="etiqueta">Tablero de ${esc(empresa)}</div>
            <h2>¿Qué pasa en los próximos 12 meses?</h2>
            <p>Simulación de ventas mensuales con y sin intervención en datos e IA, a partir del tamaño, la industria y el nivel de riesgo de la empresa.</p>
          </div>
          <span class="sintetico">◇ Datos sintéticos ilustrativos</span>
        </div>
        <div class="kpis">
          <div class="kpi"><div class="lbl">Ventas últimos 12 meses</div><div class="val">${millones(ventas.anualActual)}</div><div class="sub">Estimación sintética</div></div>
          <div class="kpi"><div class="lbl">Escenario favorable</div><div class="val" style="color:var(--serie-fav)">${pct(crecFav)}</div><div class="sub">${millones(ventas.anualFavorable)} con intervención</div></div>
          <div class="kpi"><div class="lbl">Escenario desfavorable</div><div class="val" style="color:var(--alto)">${pct(crecDesf)}</div><div class="sub">${millones(ventas.anualDesfavorable)} sin intervención</div></div>
          <div class="kpi destacado"><div class="lbl">Costo de no actuar</div><div class="val">${millones(ventas.brecha)}</div><div class="sub">Diferencia entre escenarios a 12 meses</div></div>
        </div>
        <div id="graf-ventas"></div>
      </section>

      <section class="tarjeta bloque">
        <div class="bloque-titulo">
          <div>
            <div class="etiqueta">Casos hipotéticos</div>
            <h2>Seis situaciones que podría estar viviendo ${esc(empresa)}</h2>
            <p>Casos típicos de ${esc(ind.nombre.toLowerCase())} en ${esc(ESLABONES[act.eslabon].toLowerCase())}, con la solución propuesta y el efecto esperado sobre un indicador.</p>
          </div>
          <div class="pestanas no-imprimir" role="tablist" aria-label="Nivel de los casos">
            ${['alto', 'moderado', 'bajo'].map((n) => `
              <button role="tab" data-nivel="${n}" aria-selected="${n === res.nivel}">${NIVELES[n].nombre}${n === res.nivel ? ' <small>· su nivel</small>' : ''}</button>`).join('')}
          </div>
        </div>
        <div class="casos" id="casos"></div>
      </section>

      <section class="tarjeta bloque">
        <div class="bloque-titulo"><div><div class="etiqueta">Ruta de intervención</div><h2>Hoja de ruta sugerida a 12 meses</h2></div></div>
        <div class="ruta">
          ${RUTAS[res.nivel].map((f) => `<div class="fase"><div class="cuando">${esc(f.fase)}</div><h3 style="margin:4px 0 0">${esc(f.titulo)}</h3><p>${esc(f.texto)}</p></div>`).join('')}
        </div>
      </section>

      <section class="tarjeta bloque">
        <div class="bloque-titulo">
          <div>
            <div class="etiqueta">Formación</div>
            <h2>Cursos recomendados para su nivel</h2>
            <p>Marque los que le interesan y le enviaremos fechas, costos y temario.</p>
          </div>
        </div>
        <form id="form-cursos">
          <div class="cursos">
            ${cursos.map((c) => `
              <label class="curso">
                <input type="checkbox" name="curso" value="${c.id}" ${reg.interes?.includes(c.id) ? 'checked' : ''}>
                <h3>${esc(c.nombre)}</h3>
                <div class="meta">${esc(c.duracion)} · ${esc(c.modalidad)}</div>
                <p>${esc(c.descripcion)}</p>
                <ul>${c.temas.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
              </label>`).join('')}
          </div>
          <div class="cursos-accion">
            <button class="btn btn-primario" type="submit">Me interesan estos cursos</button>
            <span id="cursos-msg" role="status"></span>
          </div>
        </form>
      </section>

      <section class="cta-final">
        <div class="etiqueta" style="color:var(--dorado-300)">Siguiente paso</div>
        <h2>Convirtamos este diagnóstico en resultados</h2>
        <p>${esc(CONFIG.contacto.texto)}</p>
        ${CONFIG.contacto.correo ? `<a class="btn btn-dorado" href="mailto:${esc(CONFIG.contacto.correo)}?subject=${encodeURIComponent('Diagnóstico de datos e IA: ' + empresa)}">Agendar sesión</a>` : ''}
      </section>
    </div>`;

  // Perfil por dimensión
  barras($('#dimensiones', app), Object.entries(res.dimensiones).map(([k, v]) => ({
    etiqueta: DIMENSIONES[k].corto, valor: v, detalle: DIMENSIONES[k].nombre
  })), { max: 100, formato: (v) => String(v) });

  // Tablero de ventas
  lineas($('#graf-ventas', app), {
    etiquetas: ventas.etiquetas,
    inicioProyeccion: 11,
    titulo: `Ventas mensuales de ${empresa}, en millones de pesos`,
    formato: millones,
    series: [
      { nombre: 'Histórico', corto: 'Histórico', valores: ventas.historico, color: COLOR.hist },
      { nombre: 'Con intervención (favorable)', corto: 'Favorable', valores: ventas.favorable, color: COLOR.fav },
      { nombre: 'Sin intervención (desfavorable)', corto: 'Desfavorable', valores: ventas.desfavorable, color: COLOR.desf, punteada: true }
    ]
  });

  // Casos
  const objetivos = Array.isArray(r.objetivos) ? r.objetivos : [];
  const etiquetasKpi = etiquetasMeses(new Date(reg.creado), 11, 18);
  function pintarCasos(nv) {
    const lista = seleccionarCasos({ nivel: nv, industria: ind.id, eslabon: act.eslabon, objetivos });
    const cont = $('#casos', app);
    cont.innerHTML = lista.map((c, i) => {
      const k = seriesKpi(c.kpi, `${reg.id}:${c.id}`);
      const fmt = (v) => `${numero(v, k.decimales)} ${c.kpi.unidad}`;
      return `
        <article class="caso">
          <div class="caso-cab">
            <span class="caso-num">${i + 1}</span>
            <div>
              <h3>${esc(plantilla(c.titulo, ctx))}</h3>
              <div class="tags">
                ${c.industria ? `<span class="chip">${ind.icono} ${esc(ind.nombre)}</span>` : ''}
                ${c.eslabon ? `<span class="chip">${esc(ESLABONES[c.eslabon])}</span>` : ''}
                ${!c.industria && !c.eslabon ? '<span class="chip">Transversal</span>' : ''}
              </div>
            </div>
          </div>
          <div class="parte"><b>Problema</b>${esc(plantilla(c.problema, ctx))}</div>
          <div class="parte"><b>Solución con datos</b>${esc(plantilla(c.solucion, ctx))}</div>
          <div class="tecnica">🛠 ${esc(c.tecnica)}</div>
          <div class="caso-kpi">
            <div class="tit">${esc(c.kpi.nombre)} <span style="font-weight:400;color:var(--tinta-3)">(${k.menorEsMejor ? 'menor es mejor' : 'mayor es mejor'})</span></div>
            <div class="graf-caso" data-i="${i}"></div>
            <div class="comparativo">
              <div><div class="l">Hoy</div><div class="v">${fmt(k.actual)}</div></div>
              <div><div class="l"><span class="linea-key" style="border-top-color:${COLOR.fav}"></span>Con intervención</div><div class="v">${fmt(k.conIntervencion)}</div></div>
              <div><div class="l"><span class="linea-key punteada" style="border-top-color:${COLOR.desf}"></span>Sin intervención</div><div class="v">${fmt(k.sinIntervencion)}</div></div>
            </div>
          </div>
        </article>`;
    }).join('');
    lista.forEach((c, i) => {
      const k = seriesKpi(c.kpi, `${reg.id}:${c.id}`);
      lineas($(`.graf-caso[data-i="${i}"]`, cont), {
        etiquetas: etiquetasKpi,
        inicioProyeccion: 11,
        alto: 150,
        compacto: true,
        titulo: c.kpi.nombre,
        formato: (v) => numero(v, k.decimales),
        series: [
          { nombre: 'Histórico', valores: k.historico, color: COLOR.hist },
          { nombre: 'Con intervención', valores: k.favorable, color: COLOR.fav },
          { nombre: 'Sin intervención', valores: k.desfavorable, color: COLOR.desf, punteada: true }
        ]
      });
    });
  }
  pintarCasos(res.nivel);
  for (const b of $$('[data-nivel]', app)) {
    b.addEventListener('click', () => {
      for (const o of $$('[data-nivel]', app)) o.setAttribute('aria-selected', o === b);
      pintarCasos(b.dataset.nivel);
    });
  }

  // Acciones
  $('#imprimir', app).addEventListener('click', () => window.print());
  $('#copiar', app).addEventListener('click', async (e) => {
    try {
      await navigator.clipboard.writeText(location.href);
      e.target.textContent = 'Enlace copiado ✓';
    } catch {
      e.target.textContent = 'Copie la URL del navegador';
    }
  });
  $('#form-cursos', app).addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = $('#cursos-msg', app);
    const elegidos = $$('input[name="curso"]:checked', e.target).map((i) => i.value);
    if (!elegidos.length) { msg.className = 'error-msg'; msg.textContent = 'Seleccione al menos un curso.'; return; }
    try {
      await api(`/api/encuestas/${reg.id}/interes`, { method: 'POST', body: { cursos: elegidos } });
      msg.className = 'ok-msg';
      msg.textContent = `✓ Registramos su interés en ${elegidos.length} curso${elegidos.length > 1 ? 's' : ''}.`;
    } catch (err) {
      msg.className = 'error-msg';
      msg.textContent = `No se pudo guardar: ${err.message}`;
    }
  });
}
