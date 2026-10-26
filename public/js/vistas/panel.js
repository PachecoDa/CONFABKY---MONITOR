// Panel del consultor: todas las encuestas guardadas, distribución por nivel
// e industria, filtros, interés en cursos y exportación a CSV.

import { esc, api, numero, fecha, sesion, $, $$ } from '../util.js';
import { INDUSTRIAS, industriaPorId, actividadPorId, DIMENSIONES } from '../motor/contenido.js';
import { NIVELES } from '../motor/evaluacion.js';
import { CURSOS } from '../motor/cursos.js';
import { barras } from '../graficos.js';

const CLAVE = 'radar:panel';
const COLOR_NIVEL = { alto: 'var(--alto)', moderado: 'var(--moderado)', bajo: 'var(--bajo)' };

function conClave(opciones = {}) {
  return { ...opciones, headers: { 'x-panel-clave': sesion.leer(CLAVE) || '' } };
}

export async function vistaPanel(app) {
  if (!sesion.leer(CLAVE)) return login(app);
  app.innerHTML = '<div class="cargando"><div class="giro"></div><p>Cargando encuestas…</p></div>';
  let registros;
  try {
    registros = await api('/api/panel/encuestas', conClave());
  } catch (e) {
    if (e.status === 401) { sesion.borrar(CLAVE); return login(app, 'La clave no es válida.'); }
    throw e;
  }
  pintar(app, registros);
}

function login(app, error = '') {
  app.innerHTML = `
    <div class="contenedor">
      <div class="tarjeta login">
        <div class="etiqueta">Acceso restringido</div>
        <h2>Panel del consultor</h2>
        <p style="color:var(--tinta-2)">Consulte todas las encuestas, su clasificación y el interés en cursos.</p>
        <form id="form-login">
          <div class="campo"><label for="clave">Clave del panel</label><input id="clave" type="password" autocomplete="current-password" required></div>
          <div class="error-msg" role="alert">${esc(error)}</div>
          <button class="btn btn-primario" type="submit">Entrar</button>
        </form>
      </div>
    </div>`;
  $('#clave', app).focus();
  $('#form-login', app).addEventListener('submit', async (e) => {
    e.preventDefault();
    sesion.escribir(CLAVE, $('#clave', app).value);
    try {
      await api('/api/panel/verificar', conClave());
      vistaPanel(app);
    } catch {
      sesion.borrar(CLAVE);
      login(app, 'La clave no es válida.');
    }
  });
}

function pintar(app, registros) {
  const filtro = { texto: '', nivel: '', industria: '', modo: '' };

  app.innerHTML = `
    <div class="panel">
      <div class="contenedor">
        <div class="panel-cab">
          <div><div class="etiqueta">Panel del consultor</div><h1>Estudio de mercado</h1></div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <a class="btn btn-primario btn-sm" href="#/encuesta?modo=consultor">+ Nueva encuesta</a>
            <button class="btn btn-borde btn-sm" id="csv">Exportar CSV</button>
            <button class="btn btn-texto btn-sm" id="salir">Salir</button>
          </div>
        </div>
        <div class="filtros">
          <input class="control" id="f-texto" type="search" placeholder="Buscar empresa, contacto o ciudad…" aria-label="Buscar">
          <select class="control" id="f-nivel" aria-label="Nivel">
            <option value="">Todos los niveles</option>
            ${['alto', 'moderado', 'bajo'].map((n) => `<option value="${n}">${NIVELES[n].nombre}</option>`).join('')}
          </select>
          <select class="control" id="f-industria" aria-label="Industria">
            <option value="">Todas las industrias</option>
            ${INDUSTRIAS.map((i) => `<option value="${i.id}">${esc(i.nombre)}</option>`).join('')}
          </select>
          <select class="control" id="f-modo" aria-label="Modo">
            <option value="">Ambos modos</option>
            <option value="consultor">Con consultor</option>
            <option value="autoguiado">Autoguiada</option>
          </select>
        </div>
        <div id="resumen"></div>
        <section class="tarjeta bloque">
          <div class="bloque-titulo"><div><h2 style="font-size:1.25rem">Encuestas</h2></div><span id="conteo" style="color:var(--tinta-3);font-size:.9rem"></span></div>
          <div class="tabla-wrap" id="tabla"></div>
        </section>
      </div>
    </div>`;

  const filtrados = () => registros.filter((reg) => {
    const r = reg.respuestas;
    if (filtro.nivel && reg.resultado.nivel !== filtro.nivel) return false;
    if (filtro.industria && r.industria !== filtro.industria) return false;
    if (filtro.modo && reg.modo !== filtro.modo) return false;
    if (filtro.texto) {
      const t = `${r.contacto.empresa} ${r.contacto.nombre} ${r.contacto.ciudad} ${r.contacto.correo}`.toLowerCase();
      if (!t.includes(filtro.texto.toLowerCase())) return false;
    }
    return true;
  });

  function actualizar() {
    const lista = filtrados();
    pintarResumen($('#resumen', app), lista);
    pintarTabla($('#tabla', app), lista);
    $('#conteo', app).textContent = `${lista.length} de ${registros.length}`;
  }

  $('#f-texto', app).addEventListener('input', (e) => { filtro.texto = e.target.value.trim(); actualizar(); });
  $('#f-nivel', app).addEventListener('change', (e) => { filtro.nivel = e.target.value; actualizar(); });
  $('#f-industria', app).addEventListener('change', (e) => { filtro.industria = e.target.value; actualizar(); });
  $('#f-modo', app).addEventListener('change', (e) => { filtro.modo = e.target.value; actualizar(); });
  $('#salir', app).addEventListener('click', () => { sesion.borrar(CLAVE); vistaPanel(app); });
  $('#csv', app).addEventListener('click', () => exportarCsv(filtrados()));
  $('#tabla', app).addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-borrar]');
    if (!btn) return;
    const reg = registros.find((x) => x.id === btn.dataset.borrar);
    if (!confirm(`¿Eliminar la encuesta de «${reg.respuestas.contacto.empresa}»? Esta acción no se puede deshacer.`)) return;
    await api(`/api/panel/encuestas/${reg.id}`, conClave({ method: 'DELETE' }));
    registros = registros.filter((x) => x.id !== reg.id);
    actualizar();
  });

  actualizar();
}

function pintarResumen(cont, lista) {
  const n = lista.length;
  const porNivel = { alto: 0, moderado: 0, bajo: 0 };
  for (const reg of lista) porNivel[reg.resultado.nivel] += 1;
  const promedio = n ? lista.reduce((a, r) => a + r.resultado.indice, 0) / n : 0;
  const interesados = lista.filter((r) => r.interes?.length).length;
  const pct = (v) => (n ? `${numero((v / n) * 100)} %` : '–');

  cont.innerHTML = `
    <div class="panel-kpis">
      <div class="kpi destacado"><div class="lbl">Encuestas</div><div class="val">${n}</div><div class="sub">en la selección</div></div>
      ${['alto', 'moderado', 'bajo'].map((nv) => `
        <div class="kpi"><div class="lbl"><span class="nivel nivel-${nv}" data-icono="${NIVELES[nv].icono}">${NIVELES[nv].nombre}</span></div>
        <div class="val">${porNivel[nv]}</div><div class="sub">${pct(porNivel[nv])} de las empresas</div></div>`).join('')}
      <div class="kpi"><div class="lbl">Interesados en cursos</div><div class="val">${interesados}</div><div class="sub">Índice promedio: ${numero(promedio)}</div></div>
    </div>
    ${n ? `
    <div class="panel-graficos">
      <section class="tarjeta bloque" style="margin:0">
        <h3>Distribución por nivel de riesgo</h3>
        <div class="distribucion" role="img" aria-label="Alto ${porNivel.alto}, moderado ${porNivel.moderado}, bajo ${porNivel.bajo}">
          ${['alto', 'moderado', 'bajo'].filter((nv) => porNivel[nv]).map((nv) => `
            <div style="flex:${porNivel[nv]};background:${COLOR_NIVEL[nv]}" title="${NIVELES[nv].nombre}: ${porNivel[nv]} (${pct(porNivel[nv])})">${porNivel[nv] / n >= 0.08 ? `${NIVELES[nv].icono} ${pct(porNivel[nv])}` : ''}</div>`).join('')}
        </div>
        <h3 style="margin-top:22px">Madurez promedio por dimensión</h3>
        <div id="g-dim"></div>
      </section>
      <section class="tarjeta bloque" style="margin:0">
        <h3>Encuestas por industria</h3>
        <div id="g-ind"></div>
        <h3 style="margin-top:22px">Cursos más solicitados</h3>
        <ul class="lista-simple" id="g-cursos"></ul>
      </section>
    </div>` : ''}`;
  if (!n) return;

  const dims = Object.keys(DIMENSIONES).map((k) => {
    const vals = lista.map((r) => r.resultado.dimensiones[k]).filter((v) => v != null);
    return { etiqueta: DIMENSIONES[k].corto, valor: vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0 };
  });
  barras($('#g-dim', cont), dims, { max: 100 });

  const porInd = INDUSTRIAS.map((i) => ({ etiqueta: `${i.icono} ${i.nombre}`, valor: lista.filter((r) => r.respuestas.industria === i.id).length }))
    .filter((x) => x.valor)
    .sort((a, b) => b.valor - a.valor);
  barras($('#g-ind', cont), porInd);

  const conteo = {};
  for (const r of lista) for (const c of r.interes || []) conteo[c] = (conteo[c] || 0) + 1;
  const top = Object.entries(conteo).sort((a, b) => b[1] - a[1]);
  $('#g-cursos', cont).innerHTML = top.length
    ? top.map(([id, v]) => `<li><span>${esc(CURSOS.find((c) => c.id === id)?.nombre || id)}</span><strong>${v}</strong></li>`).join('')
    : '<li style="color:var(--tinta-3)">Aún no hay solicitudes.</li>';
}

function pintarTabla(cont, lista) {
  if (!lista.length) {
    cont.innerHTML = '<div class="vacio">No hay encuestas que coincidan. Comparta el enlace del diagnóstico o haga una en modo consultor.</div>';
    return;
  }
  cont.innerHTML = `
    <table class="tabla">
      <thead><tr><th>Fecha</th><th>Empresa</th><th>Industria / actividad</th><th>Índice</th><th>Nivel</th><th>Cursos</th><th></th></tr></thead>
      <tbody>
        ${lista.map((reg) => {
          const r = reg.respuestas;
          const ind = industriaPorId(r.industria);
          const act = actividadPorId(ind, r.actividad);
          const nv = NIVELES[reg.resultado.nivel];
          return `<tr>
            <td>${fecha(reg.creado, true)}<small>${reg.modo === 'consultor' ? 'Con consultor' : 'Autoguiada'}</small></td>
            <td><strong>${esc(r.contacto.empresa)}</strong><small>${esc([r.contacto.nombre, r.contacto.ciudad].filter(Boolean).join(' · '))}</small></td>
            <td>${ind ? `${ind.icono} ${esc(ind.nombre)}` : ''}<small>${esc(act?.nombre || '')}</small></td>
            <td class="num">${reg.resultado.indice}</td>
            <td><span class="nivel nivel-${nv.id}" data-icono="${nv.icono}">${nv.nombre.replace('Riesgo ', '')}</span></td>
            <td>${reg.interes?.length || '–'}</td>
            <td><div class="acc"><a class="btn btn-borde btn-sm" href="#/resultado/${reg.id}">Ver</a><button class="btn btn-peligro" data-borrar="${reg.id}" aria-label="Eliminar">✕</button></div></td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>`;
}

function exportarCsv(lista) {
  const dims = Object.keys(DIMENSIONES);
  const cab = ['fecha', 'modo', 'empresa', 'contacto', 'correo', 'telefono', 'ciudad', 'rol', 'tamano', 'industria', 'actividad', 'indice', 'nivel', ...dims.map((d) => `dim_${d}`), 'objetivos', 'cursos_interes'];
  const celda = (v) => {
    let s = String(v ?? '');
    // Evita que Excel interprete el texto como fórmula.
    if (/^[=+\-@]/.test(s)) s = `'${s}`;
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const filas = lista.map((reg) => {
    const r = reg.respuestas;
    const ind = industriaPorId(r.industria);
    return [
      reg.creado, reg.modo, r.contacto.empresa, r.contacto.nombre, r.contacto.correo, r.contacto.telefono, r.contacto.ciudad,
      r.rol, r.tamano, ind?.nombre, actividadPorId(ind, r.actividad)?.nombre, reg.resultado.indice, reg.resultado.nivel,
      ...dims.map((d) => reg.resultado.dimensiones[d] ?? ''), (r.objetivos || []).join(' | '), (reg.interes || []).join(' | ')
    ].map(celda).join(',');
  });
  const blob = new Blob(['﻿' + [cab.join(','), ...filas].join('\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `encuestas-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}
