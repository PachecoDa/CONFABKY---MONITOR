// Ficha de un cliente en el panel del consultor: quién es, qué le pasa, qué
// respondió, qué casos conversar y en qué va la relación comercial.

import { esc, numero, fecha, $, $$ } from '../util.js';
import { eliminarEncuesta, guardarSeguimiento, ESTADOS } from '../datos.js';
import {
  construirFlujo, industriaPorId, actividadPorId, plantilla, DIMENSIONES, ESLABONES, OBJETIVOS,
  PREGUNTAS_PERFIL, SECCIONES
} from '../motor/contenido.js';
import { NIVELES } from '../motor/evaluacion.js';
import { seleccionarCasos } from '../motor/casos.js';
import { CURSOS, cursosRecomendados } from '../motor/cursos.js';
import { seriesKpi } from '../motor/sintetico.js';
import { cargarPanel, iniciales, tonoAvatar, anilloIndice, estadoDe, promediosDimension, confirmarEnBoton } from './panel.js';

const opcionesDe = (id) => PREGUNTAS_PERFIL.find((p) => p.id === id).opciones;
const TAMANO_TEXTO = { micro: 'microempresa', pequena: 'empresa pequeña', mediana: 'empresa mediana', grande: 'empresa grande' };

export async function vistaFicha(app, id) {
  const registros = await cargarPanel(app);
  if (!registros) return;
  const orden = [...registros].sort((a, b) => b.creado.localeCompare(a.creado));
  const pos = orden.findIndex((r) => r.id === id);
  if (pos < 0) {
    app.innerHTML = `<div class="contenedor angosto"><div class="tarjeta bloque" style="margin-top:40px">
      <h2>No encontramos este cliente</h2><p>Puede que se haya eliminado.</p>
      <a class="btn btn-primario" href="#/panel">Volver a la cartera</a></div></div>`;
    return;
  }
  const reg = orden[pos];
  const anterior = orden[pos - 1];
  const siguiente = orden[pos + 1];
  const r = reg.respuestas;
  const c = r.contacto;
  const res = reg.resultado;
  const ind = industriaPorId(r.industria);
  const act = actividadPorId(ind, r.actividad);
  const nv = NIVELES[res.nivel];
  const ctx = { ...ind.vocab, empresa: c.empresa };
  const objetivos = Array.isArray(r.objetivos) ? r.objetivos : [];
  const casos = seleccionarCasos({ nivel: res.nivel, industria: ind.id, eslabon: act.eslabon, objetivos });
  const promedios = Object.fromEntries(promediosDimension(registros));
  const seg = { estado: estadoDe(reg).v, notas: reg.seguimiento?.notas || '' };
  const rol = opcionesDe('rol').find((o) => o.v === r.rol)?.t;
  const tamano = opcionesDe('tamano').find((o) => o.v === r.tamano);
  const recomendados = cursosRecomendados(res.nivel, r.rol);

  app.innerHTML = `
    <section class="ficha-cab">
      <div class="contenedor">
        <nav class="ficha-nav">
          <a href="#/panel">← Cartera de clientes</a>
          <span>
            ${anterior ? `<a href="#/panel/${anterior.id}" title="${esc(anterior.respuestas.contacto.empresa)}">‹ Anterior</a>` : ''}
            ${siguiente ? `<a href="#/panel/${siguiente.id}" title="${esc(siguiente.respuestas.contacto.empresa)}">Siguiente ›</a>` : ''}
          </span>
        </nav>
        <div class="ficha-top">
          <span class="avatar avatar-grande ${tonoAvatar(c.empresa)}" aria-hidden="true">${esc(iniciales(c.empresa))}</span>
          <div class="ficha-id">
            <div class="etiqueta">Ficha del cliente</div>
            <h1>${esc(c.empresa)}</h1>
            <div class="res-meta">
              <span class="chip">${ind.icono} ${esc(ind.nombre)}</span>
              <span class="chip">${esc(act.nombre)}</span>
              ${tamano ? `<span class="chip">${esc(tamano.d)} · ${esc(tamano.t)} personas</span>` : ''}
              ${c.ciudad ? `<span class="chip">${esc(c.ciudad)}</span>` : ''}
            </div>
          </div>
          <div class="ficha-indice">
            ${anilloIndice(res.indice, nv.id, 96)}
            <span class="nivel nivel-${nv.id}" data-icono="${nv.icono}">${nv.nombre}</span>
          </div>
        </div>
        <div class="res-acciones">
          <a class="btn btn-dorado" href="#/resultado/${reg.id}">Ver el diagnóstico del cliente</a>
          <span class="ficha-fecha">Diagnóstico del ${fecha(reg.creado, true)} · ${reg.modo === 'consultor' ? 'con consultor' : 'autoguiado'}</span>
        </div>
      </div>
    </section>

    <div class="contenedor ficha-cuerpo">
      <div class="ficha-grid">
        <div class="ficha-principal">
          <section class="tarjeta bloque">
            <div class="etiqueta">Problemática</div>
            <h2>Qué le está pasando a ${esc(c.empresa)}</h2>
            <p class="ficha-relato">${relato({ reg, ind, act, nv, tamano: r.tamano, objetivos })}</p>
            ${res.hallazgos.length ? `
              <h3 class="sub-titulo">Lo que más lo frena (${res.hallazgos.length})</h3>
              <ul class="hallazgos">${res.hallazgos.slice(0, VISIBLES).map(hallazgoHtml).join('')}</ul>
              ${res.hallazgos.length > VISIBLES ? `
                <details class="mas-hallazgos">
                  <summary>Ver ${res.hallazgos.length - VISIBLES} brecha${res.hallazgos.length - VISIBLES === 1 ? '' : 's'} más</summary>
                  <ul class="hallazgos">${res.hallazgos.slice(VISIBLES).map(hallazgoHtml).join('')}</ul>
                </details>` : ''}` : '<p class="ficha-ok">No se encontraron brechas críticas. El reto es escalar lo que ya funciona.</p>'}
          </section>

          <section class="tarjeta bloque">
            <div class="etiqueta">Para la conversación</div>
            <h2>Casos priorizados</h2>
            <p class="ficha-ayuda">Ordenados por pertinencia para su industria, su actividad y sus objetivos. Toque un caso para ver la solución.</p>
            <div class="acordeon">
              ${casos.map((caso, i) => {
                const k = seriesKpi(caso.kpi, `${reg.id}:${caso.id}`);
                const fmt = (v) => `${numero(v, k.decimales)} ${caso.kpi.unidad}`;
                return `
                <details ${i === 0 ? 'open' : ''}>
                  <summary>
                    <span class="caso-num">${i + 1}</span>
                    <span class="acordeon-tit">${esc(plantilla(caso.titulo, ctx))}
                      <small>${caso.industria ? esc(ind.nombre) : caso.eslabon ? esc(ESLABONES[caso.eslabon]) : 'Transversal'}</small></span>
                  </summary>
                  <div class="acordeon-cuerpo">
                    <div class="parte"><b>Problema</b>${esc(plantilla(caso.problema, ctx))}</div>
                    <div class="parte"><b>Solución con datos</b>${esc(plantilla(caso.solucion, ctx))}</div>
                    <div class="tecnica">🛠 ${esc(caso.tecnica)}</div>
                    <div class="kpi-linea">
                      <span>${esc(caso.kpi.nombre)}</span>
                      <strong>${fmt(k.actual)}</strong><span aria-hidden="true">→</span>
                      <strong class="fav">${fmt(k.conIntervencion)}</strong><span class="kpi-nota">con intervención · ${fmt(k.sinIntervencion)} sin ella</span>
                    </div>
                  </div>
                </details>`;
              }).join('')}
            </div>
          </section>

          <section class="tarjeta bloque">
            <div class="etiqueta">Entrevista</div>
            <h2>Lo que respondió</h2>
            <p class="ficha-ayuda">Los puntos muestran la madurez de cada respuesta (0 a 3). Las filas marcadas son brechas.</p>
            ${respuestasHtml(r, ind, act)}
          </section>
        </div>

        <aside class="ficha-lateral">
          <section class="tarjeta bloque">
            <h3>Contacto</h3>
            <dl class="datos-contacto">
              <dt>Nombre</dt><dd>${esc(c.nombre || 'Sin registrar')}</dd>
              <dt>Rol</dt><dd>${esc(rol || '–')}</dd>
              <dt>Correo</dt><dd class="seleccionable">${esc(c.correo || 'Sin registrar')}</dd>
              <dt>Teléfono</dt><dd class="seleccionable">${esc(c.telefono || 'Sin registrar')}</dd>
              <dt>Ciudad</dt><dd>${esc(c.ciudad || '–')}</dd>
            </dl>
          </section>

          <section class="tarjeta bloque">
            <h3>Seguimiento</h3>
            <form id="form-seg">
              <div class="estados" role="radiogroup" aria-label="Estado comercial">
                ${ESTADOS.map((e) => `
                  <label class="estado-op"><input type="radio" name="estado" value="${e.v}" ${seg.estado === e.v ? 'checked' : ''}><span class="estado estado-${e.v}">${e.t}</span></label>`).join('')}
              </div>
              <label class="oculto" for="notas">Notas del consultor</label>
              <textarea id="notas" class="control notas" rows="5" maxlength="4000" placeholder="Notas de la reunión, próximos pasos, presupuesto mencionado…">${esc(seg.notas)}</textarea>
              <div class="seg-acciones">
                <button class="btn btn-primario btn-sm" type="submit">Guardar</button>
                <span id="seg-msg" role="status">${reg.seguimiento?.actualizado ? `Actualizado el ${fecha(reg.seguimiento.actualizado, true)}` : ''}</span>
              </div>
            </form>
          </section>

          <section class="tarjeta bloque">
            <h3>Madurez por dimensión</h3>
            <div class="dim-comparada">
              ${Object.entries(res.dimensiones).map(([k, v]) => `
                <div class="dim-fila" title="${esc(DIMENSIONES[k].nombre)}: ${v} (promedio del estudio: ${promedios[k]})">
                  <span>${esc(DIMENSIONES[k].corto)}</span>
                  <div class="pista"><div class="relleno" style="width:${v}%"></div><i class="promedio" style="left:${promedios[k]}%"></i></div>
                  <b>${v}</b>
                </div>`).join('')}
            </div>
            <p class="leyenda-dim"><span class="muestra-relleno"></span>${esc(c.empresa)} <span class="muestra-promedio"></span>Promedio de ${registros.length} empresa${registros.length === 1 ? '' : 's'}</p>
          </section>

          <section class="tarjeta bloque">
            <h3>Cursos</h3>
            ${reg.interes?.length ? `
              <p class="ficha-ayuda">Le interesan:</p>
              <ul class="cursos-lista">${reg.interes.map((id) => `<li class="si">✓ ${esc(CURSOS.find((x) => x.id === id)?.nombre || id)}</li>`).join('')}</ul>` : '<p class="ficha-ayuda">Aún no ha marcado cursos. Recomendados para su nivel:</p>'}
            <ul class="cursos-lista">${recomendados.filter((x) => !reg.interes?.includes(x.id)).map((x) => `<li>${esc(x.nombre)} <small>${esc(x.duracion)}</small></li>`).join('')}</ul>
          </section>

          <div class="ficha-eliminar">
            <button class="btn btn-peligro" id="eliminar">Eliminar este cliente</button>
            <span class="error-msg" id="eliminar-msg" role="status"></span>
          </div>
        </aside>
      </div>
    </div>`;

  // Seguimiento
  const form = $('#form-seg', app);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = $('#seg-msg', app);
    const cambios = { estado: form.estado.value, notas: $('#notas', app).value };
    msg.className = '';
    msg.textContent = 'Guardando…';
    try {
      const { seguimiento } = await guardarSeguimiento(reg.id, cambios);
      reg.seguimiento = seguimiento;
      msg.className = 'ok-msg';
      msg.textContent = '✓ Guardado';
    } catch (err) {
      msg.className = 'error-msg';
      msg.textContent = `No se pudo guardar: ${err.message}`;
    }
  });
  for (const radio of $$('input[name="estado"]', form)) {
    radio.addEventListener('change', () => { $('#seg-msg', app).textContent = 'Cambios sin guardar'; $('#seg-msg', app).className = ''; });
  }

  // Eliminar
  $('#eliminar', app).addEventListener('click', async (e) => {
    if (!confirmarEnBoton(e.currentTarget, 'Toque de nuevo para eliminar')) return;
    try {
      await eliminarEncuesta(reg.id);
      location.hash = '#/panel';
    } catch (err) {
      $('#eliminar-msg', app).textContent = `No se pudo eliminar: ${err.message}`;
    }
  });
}

// Hallazgos visibles antes de «ver más»: los críticos de más peso van primero.
const VISIBLES = 5;

function hallazgoHtml(h) {
  return `<li><span class="marca-h ${h.gravedad}">${h.gravedad === 'critico' ? 'Crítico' : 'Mejorable'}</span>
    <div>${esc(h.texto)}<small>${esc(DIMENSIONES[h.dimension].corto)} · Respondió: ${esc(h.respuesta)}</small></div></li>`;
}

// Resumen en prosa de la situación del cliente, para leer antes de la reunión.
function relato({ reg, ind, act, nv, tamano, objetivos }) {
  const res = reg.resultado;
  const empresa = `<strong>${esc(reg.respuestas.contacto.empresa)}</strong>`;
  const dims = Object.entries(res.dimensiones).sort((a, b) => a[1] - b[1]);
  const debiles = dims.slice(0, 2).map(([k, v]) => `${DIMENSIONES[k].corto.toLowerCase()} (${v}/100)`);
  const fuerte = dims[dims.length - 1];
  const partes = [
    `${empresa} es una ${TAMANO_TEXTO[tamano] || 'empresa'} de ${esc(ind.nombre.toLowerCase())} dedicada a ${esc(act.nombre.toLowerCase())}.`,
    `Con un índice de ${res.indice}/100 está en <strong>${esc(nv.nombre.toLowerCase())}</strong>: ${esc(nv.etiqueta.toLowerCase())}.`,
    `Sus brechas más grandes están en ${debiles.join(' y ')}${fuerte && fuerte[1] >= 50 ? `, y su punto más fuerte es ${DIMENSIONES[fuerte[0]].corto.toLowerCase()} (${fuerte[1]}/100)` : ''}.`
  ];
  const criticos = res.hallazgos.filter((h) => h.gravedad === 'critico').length;
  if (criticos) partes.push(`Tiene ${criticos} brecha${criticos === 1 ? '' : 's'} crítica${criticos === 1 ? '' : 's'}.`);
  const metas = objetivos.filter((o) => o !== 'explorar').map((o) => OBJETIVOS.find((x) => x.v === o)?.t.toLowerCase()).filter(Boolean);
  if (metas.length) partes.push(`Con los datos quiere ${esc(metas.join(' y '))}.`);
  else if (objetivos.includes('explorar')) partes.push('Aún no tiene claro qué quiere lograr con los datos: conviene mostrarle casos concretos.');
  partes.push(`Enfoque recomendado: ${esc(nv.enfoque.toLowerCase())}.`);
  return partes.join(' ');
}

function respuestasHtml(r, ind, act) {
  const grupos = new Map();
  for (const p of construirFlujo(r)) {
    if (p.tipo === 'contacto') continue;
    let texto;
    let puntos = null;
    if (p.tipo === 'industria') texto = `${ind.icono} ${ind.nombre}`;
    else if (p.tipo === 'actividad') texto = `${act.nombre} (${ESLABONES[act.eslabon].toLowerCase()})`;
    else if (p.tipo === 'multiple') texto = (r[p.id] || []).map((v) => p.opciones.find((o) => o.v === v)?.t).filter(Boolean).join(' · ');
    else {
      const op = p.opciones.find((o) => o.v === r[p.id]);
      texto = op?.t || '–';
      if (p.dimension && op) puntos = op.p;
    }
    if (!grupos.has(p.seccion)) grupos.set(p.seccion, []);
    grupos.get(p.seccion).push({ pregunta: p.titulo, texto, puntos });
  }
  return SECCIONES.filter((s) => grupos.has(s)).map((s) => `
    <div class="resp-grupo">
      <h3 class="sub-titulo">${esc(s)}</h3>
      ${grupos.get(s).map((x) => `
        <div class="resp ${x.puntos != null && x.puntos <= 1 ? 'brecha' : ''}">
          <div class="resp-q">${esc(x.pregunta)}</div>
          <div class="resp-a">
            <span>${esc(x.texto)}</span>
            ${x.puntos != null ? `<span class="puntos" aria-label="${x.puntos} de 3">${[1, 2, 3].map((i) => `<i class="${i <= x.puntos ? 'lleno' : ''}"></i>`).join('')}</span>` : ''}
          </div>
        </div>`).join('')}
    </div>`).join('');
}
