// Panel del consultor. Dos pestañas:
//   · Clientes: la cartera en tarjetas, con búsqueda y filtros; cada tarjeta
//     abre la ficha del cliente (vistas/ficha.js).
//   · Estudio de mercado: indicadores agregados, tabla y exportación a CSV.

import { esc, numero, fecha, $, $$ } from '../util.js';
import {
  listarEncuestas, eliminarEncuesta, verificarClavePanel, panelConClave, puedeAdministrar,
  origenDatos, clavePanel, descargarArchivo, ESTADOS
} from '../datos.js';
import { INDUSTRIAS, industriaPorId, actividadPorId, DIMENSIONES } from '../motor/contenido.js';
import { NIVELES } from '../motor/evaluacion.js';
import { CURSOS } from '../motor/cursos.js';
import { barras } from '../graficos.js';

const COLOR_NIVEL = { alto: 'var(--alto)', moderado: 'var(--moderado)', bajo: 'var(--bajo)' };
const ORIGEN = {
  servidor: '',
  nube: 'Encuestas guardadas en la base de datos de esta página.',
  navegador: 'Encuestas guardadas solo en este dispositivo.'
};
const RIESGO_ORDEN = { alto: 0, moderado: 1, bajo: 2 };

// Filtros y pestaña: se conservan al ir a una ficha y volver.
const estadoVista = { pestana: 'clientes', texto: '', nivel: '', estado: '', orden: 'recientes' };

// ───────────── Utilidades compartidas con la ficha ─────────────

export function iniciales(nombre) {
  const palabras = String(nombre).replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(Boolean);
  const utiles = palabras.filter((p) => !/^(de|del|la|las|el|los|y|s\.?a\.?s?)$/i.test(p));
  const base = utiles.length ? utiles : palabras;
  return (base.slice(0, 2).map((p) => p[0]).join('') || '?').toUpperCase();
}

// Tono del avatar: estable por empresa, siempre dentro de la paleta verde/dorado.
export function tonoAvatar(nombre) {
  let h = 0;
  for (const c of String(nombre)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return ['av-1', 'av-2', 'av-3', 'av-4', 'av-5'][h % 5];
}

export function anilloIndice(indice, nivel, tam = 56) {
  const r = tam / 2 - 5;
  const c = 2 * Math.PI * r;
  return `<svg class="anillo" viewBox="0 0 ${tam} ${tam}" width="${tam}" height="${tam}" role="img" aria-label="Índice ${indice} de 100">
    <circle class="anillo-pista" cx="${tam / 2}" cy="${tam / 2}" r="${r}" fill="none" stroke-width="5"/>
    <circle cx="${tam / 2}" cy="${tam / 2}" r="${r}" fill="none" stroke="${COLOR_NIVEL[nivel]}" stroke-width="5" stroke-linecap="round"
      stroke-dasharray="${(c * indice) / 100} ${c}" transform="rotate(-90 ${tam / 2} ${tam / 2})"/>
    <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" class="anillo-num">${indice}</text>
  </svg>`;
}

export function estadoDe(reg) {
  return ESTADOS.find((e) => e.v === reg.seguimiento?.estado) || ESTADOS[0];
}

// Carga las encuestas resolviendo clave y permisos. Devuelve null si ya pintó
// otra cosa (login o acceso restringido).
export async function cargarPanel(app) {
  if (panelConClave && !clavePanel.leer()) { login(app); return null; }
  app.innerHTML = '<div class="cargando"><div class="giro"></div><p>Cargando clientes…</p></div>';
  if (!(await puedeAdministrar())) {
    app.innerHTML = `<div class="contenedor"><div class="tarjeta login"><div class="etiqueta">Acceso restringido</div>
      <h2>Panel del consultor</h2><p style="color:var(--tinta-2)">Solo el dueño de esta página puede ver los clientes.</p>
      <a class="btn btn-primario" href="#/encuesta">Hacer un diagnóstico</a></div></div>`;
    return null;
  }
  try {
    return await listarEncuestas();
  } catch (e) {
    if (e.status === 401) { clavePanel.borrar(); login(app, 'La clave no es válida.'); return null; }
    throw e;
  }
}

function login(app, error = '') {
  app.innerHTML = `
    <div class="contenedor">
      <div class="tarjeta login">
        <div class="etiqueta">Acceso restringido</div>
        <h2>Panel del consultor</h2>
        <p style="color:var(--tinta-2)">Consulte sus clientes, su clasificación y el interés en cursos.</p>
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
    clavePanel.guardar($('#clave', app).value);
    try {
      await verificarClavePanel();
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    } catch {
      clavePanel.borrar();
      login(app, 'La clave no es válida.');
    }
  });
}

// ───────────── Vista principal ─────────────

export async function vistaPanel(app) {
  const registros = await cargarPanel(app);
  if (!registros) return;
  const notaOrigen = ORIGEN[await origenDatos()];
  pintar(app, registros, notaOrigen);
}

function pintar(app, registros, notaOrigen) {
  const n = registros.length;
  const alto = registros.filter((r) => r.resultado.nivel === 'alto').length;
  const interesados = registros.filter((r) => r.interes?.length).length;
  const porNivel = (nv) => registros.filter((r) => r.resultado.nivel === nv).length;

  app.innerHTML = `
    <div class="panel">
      <div class="contenedor">
        <header class="cartera-cab">
          <div>
            <div class="etiqueta">Panel del consultor</div>
            <h1>Cartera de clientes</h1>
            <p class="cartera-sub">${n ? `${n} empresa${n === 1 ? '' : 's'} diagnosticada${n === 1 ? '' : 's'} · ${alto} en riesgo alto · ${interesados} con interés en cursos` : 'Aún no hay empresas diagnosticadas.'}</p>
            ${notaOrigen ? `<p class="nota-origen">${esc(notaOrigen)}</p>` : ''}
          </div>
          <div class="cartera-acciones">
            <a class="btn btn-primario" href="#/encuesta?modo=consultor">+ Nuevo diagnóstico</a>
            ${panelConClave ? '<button class="btn btn-texto btn-sm" id="salir">Salir</button>' : ''}
          </div>
        </header>

        <div class="pestanas" role="tablist" aria-label="Secciones del panel">
          <button role="tab" data-pestana="clientes" aria-selected="${estadoVista.pestana === 'clientes'}">Clientes</button>
          <button role="tab" data-pestana="estudio" aria-selected="${estadoVista.pestana === 'estudio'}">Estudio de mercado</button>
        </div>

        <section id="vista-clientes" ${estadoVista.pestana === 'clientes' ? '' : 'hidden'}>
          <div class="cartera-filtros">
            <input class="control buscador" id="f-texto" type="search" placeholder="Buscar por empresa, contacto o ciudad" aria-label="Buscar cliente" value="${esc(estadoVista.texto)}">
            <div class="chips-filtro" role="group" aria-label="Nivel de riesgo">
              <button data-nivel="" aria-pressed="${estadoVista.nivel === ''}">Todos <span>${n}</span></button>
              ${['alto', 'moderado', 'bajo'].map((nv) => `
                <button data-nivel="${nv}" aria-pressed="${estadoVista.nivel === nv}"><i class="punto punto-${nv}" aria-hidden="true">${NIVELES[nv].icono}</i>${NIVELES[nv].etiquetaCorta} <span>${porNivel(nv)}</span></button>`).join('')}
            </div>
            <div class="selectores">
              <select class="control" id="f-estado" aria-label="Estado comercial">
                <option value="">Todos los estados</option>
                ${ESTADOS.map((e) => `<option value="${e.v}" ${estadoVista.estado === e.v ? 'selected' : ''}>${e.t}</option>`).join('')}
              </select>
              <select class="control" id="f-orden" aria-label="Ordenar">
                <option value="recientes" ${estadoVista.orden === 'recientes' ? 'selected' : ''}>Más recientes</option>
                <option value="riesgo" ${estadoVista.orden === 'riesgo' ? 'selected' : ''}>Mayor riesgo primero</option>
                <option value="nombre" ${estadoVista.orden === 'nombre' ? 'selected' : ''}>Nombre (A–Z)</option>
              </select>
            </div>
          </div>
          <div class="clientes" id="clientes"></div>
        </section>

        <section id="vista-estudio" ${estadoVista.pestana === 'estudio' ? '' : 'hidden'}>
          <div class="estudio-acciones">
            <p>Resultados agregados de todas las encuestas: sirven para el informe del estudio de mercado.</p>
            <button class="btn btn-borde btn-sm" id="csv">Exportar CSV</button>
          </div>
          <div class="error-msg" id="panel-msg" role="status"></div>
          <div id="resumen"></div>
          <section class="tarjeta bloque">
            <div class="bloque-titulo"><div><h2 style="font-size:1.2rem">Todas las encuestas</h2></div></div>
            <div class="tabla-wrap" id="tabla"></div>
          </section>
        </section>
      </div>
    </div>`;

  function clientesFiltrados() {
    const t = estadoVista.texto.toLowerCase();
    const lista = registros.filter((reg) => {
      const c = reg.respuestas.contacto;
      if (estadoVista.nivel && reg.resultado.nivel !== estadoVista.nivel) return false;
      if (estadoVista.estado && estadoDe(reg).v !== estadoVista.estado) return false;
      if (t && !`${c.empresa} ${c.nombre} ${c.ciudad} ${c.correo}`.toLowerCase().includes(t)) return false;
      return true;
    });
    if (estadoVista.orden === 'riesgo') {
      lista.sort((a, b) => RIESGO_ORDEN[a.resultado.nivel] - RIESGO_ORDEN[b.resultado.nivel] || a.resultado.indice - b.resultado.indice);
    } else if (estadoVista.orden === 'nombre') {
      lista.sort((a, b) => a.respuestas.contacto.empresa.localeCompare(b.respuestas.contacto.empresa, 'es'));
    } else {
      lista.sort((a, b) => b.creado.localeCompare(a.creado));
    }
    return lista;
  }

  function pintarClientes() {
    const lista = clientesFiltrados();
    const cont = $('#clientes', app);
    if (!registros.length) {
      cont.innerHTML = `<div class="vacio-cartera">
        <h3>Su cartera está vacía</h3>
        <p>Cada diagnóstico que haga o que un cliente responda aparecerá aquí como una tarjeta con su nivel de riesgo y su principal problema.</p>
        <a class="btn btn-primario" href="#/encuesta?modo=consultor">Hacer el primer diagnóstico</a></div>`;
      return;
    }
    if (!lista.length) {
      cont.innerHTML = '<div class="vacio-cartera"><h3>Ningún cliente coincide</h3><p>Pruebe con otro nombre o quite algún filtro.</p></div>';
      return;
    }
    cont.innerHTML = lista.map(tarjetaCliente).join('');
  }

  $('#f-texto', app).addEventListener('input', (e) => { estadoVista.texto = e.target.value.trim(); pintarClientes(); });
  $('#f-estado', app).addEventListener('change', (e) => { estadoVista.estado = e.target.value; pintarClientes(); });
  $('#f-orden', app).addEventListener('change', (e) => { estadoVista.orden = e.target.value; pintarClientes(); });
  for (const b of $$('[data-nivel]', app)) {
    b.addEventListener('click', () => {
      estadoVista.nivel = b.dataset.nivel;
      for (const o of $$('[data-nivel]', app)) o.setAttribute('aria-pressed', o === b);
      pintarClientes();
    });
  }
  for (const b of $$('[data-pestana]', app)) {
    b.addEventListener('click', () => {
      estadoVista.pestana = b.dataset.pestana;
      for (const o of $$('[data-pestana]', app)) o.setAttribute('aria-selected', o === b);
      $('#vista-clientes', app).hidden = estadoVista.pestana !== 'clientes';
      $('#vista-estudio', app).hidden = estadoVista.pestana !== 'estudio';
      if (estadoVista.pestana === 'estudio') pintarEstudio();
    });
  }
  $('#salir', app)?.addEventListener('click', () => { clavePanel.borrar(); vistaPanel(app); });
  $('#csv', app).addEventListener('click', async () => {
    try {
      await exportarCsv(registros);
    } catch (err) {
      $('#panel-msg', app).textContent = `No se pudo exportar: ${err.message}`;
    }
  });
  // Eliminar pide confirmación en la misma fila (los diálogos del navegador
  // no funcionan dentro de claude.ai).
  $('#tabla', app).addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-borrar]');
    if (!btn) return;
    if (!confirmarEnBoton(btn)) return;
    try {
      await eliminarEncuesta(btn.dataset.borrar);
      registros = registros.filter((x) => x.id !== btn.dataset.borrar);
      pintar(app, registros, notaOrigen);
    } catch (err) {
      $('#panel-msg', app).textContent = `No se pudo eliminar: ${err.message}`;
    }
  });

  function pintarEstudio() {
    pintarResumen($('#resumen', app), registros);
    pintarTabla($('#tabla', app), registros);
  }

  pintarClientes();
  if (estadoVista.pestana === 'estudio') pintarEstudio();
}

// Primer toque: pide confirmar. Segundo toque (antes de 4 s): confirma.
export function confirmarEnBoton(btn, texto = '¿Eliminar?') {
  if (btn.dataset.confirmar === 'si') return true;
  const original = btn.innerHTML;
  btn.dataset.confirmar = 'si';
  btn.textContent = texto;
  btn.classList.add('confirmando');
  setTimeout(() => {
    if (!btn.isConnected) return;
    btn.dataset.confirmar = '';
    btn.innerHTML = original;
    btn.classList.remove('confirmando');
  }, 4000);
  return false;
}

function tarjetaCliente(reg) {
  const r = reg.respuestas;
  const c = r.contacto;
  const ind = industriaPorId(r.industria);
  const act = actividadPorId(ind, r.actividad);
  const nv = NIVELES[reg.resultado.nivel];
  const est = estadoDe(reg);
  const problema = reg.resultado.hallazgos[0]?.texto || 'Sin brechas críticas: el reto es escalar lo que ya funciona.';
  return `
    <a class="cliente" href="#/panel/${reg.id}">
      <div class="cliente-cab">
        <span class="avatar ${tonoAvatar(c.empresa)}" aria-hidden="true">${esc(iniciales(c.empresa))}</span>
        <div class="cliente-id">
          <h3>${esc(c.empresa)}</h3>
          <span class="cliente-ind">${ind ? `${ind.icono} ${esc(ind.nombre)}` : ''}</span>
          <span class="cliente-act">${act ? esc(act.nombre) : ''}</span>
        </div>
        ${anilloIndice(reg.resultado.indice, nv.id)}
      </div>
      <p class="cliente-problema"><b>Principal problema</b>${esc(problema)}</p>
      <div class="cliente-pie">
        <span class="nivel nivel-${nv.id}" data-icono="${nv.icono}">${nv.nombre}</span>
        <span class="estado estado-${est.v}">${est.t}</span>
        <span class="cliente-fecha">${esc(c.ciudad ? `${c.ciudad} · ` : '')}${fecha(reg.creado)}</span>
      </div>
    </a>`;
}

// ───────────── Estudio de mercado ─────────────

function pintarResumen(cont, lista) {
  const n = lista.length;
  const porNivel = { alto: 0, moderado: 0, bajo: 0 };
  for (const reg of lista) porNivel[reg.resultado.nivel] += 1;
  const promedio = n ? lista.reduce((a, r) => a + r.resultado.indice, 0) / n : 0;
  const interesados = lista.filter((r) => r.interes?.length).length;
  const pct = (v) => (n ? `${numero((v / n) * 100)} %` : '–');

  cont.innerHTML = `
    <div class="panel-kpis">
      <div class="kpi destacado"><div class="lbl">Encuestas</div><div class="val">${n}</div><div class="sub">Índice promedio: ${numero(promedio)}</div></div>
      ${['alto', 'moderado', 'bajo'].map((nv) => `
        <div class="kpi"><div class="lbl"><span class="nivel nivel-${nv}" data-icono="${NIVELES[nv].icono}">${NIVELES[nv].nombre}</span></div>
        <div class="val">${porNivel[nv]}</div><div class="sub">${pct(porNivel[nv])} de las empresas</div></div>`).join('')}
      <div class="kpi"><div class="lbl">Interesados en cursos</div><div class="val">${interesados}</div><div class="sub">${pct(interesados)} de las empresas</div></div>
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

  barras($('#g-dim', cont), promediosDimension(lista).map(([k, v]) => ({ etiqueta: DIMENSIONES[k].corto, valor: v })), { max: 100 });

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

export function promediosDimension(lista) {
  return Object.keys(DIMENSIONES).map((k) => {
    const vals = lista.map((r) => r.resultado.dimensiones[k]).filter((v) => v != null);
    return [k, vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0];
  });
}

function pintarTabla(cont, lista) {
  if (!lista.length) {
    cont.innerHTML = '<div class="vacio">Aún no hay encuestas.</div>';
    return;
  }
  cont.innerHTML = `
    <table class="tabla">
      <thead><tr><th>Fecha</th><th>Empresa</th><th>Industria / actividad</th><th>Índice</th><th>Nivel</th><th>Estado</th><th></th></tr></thead>
      <tbody>
        ${lista.map((reg) => {
          const r = reg.respuestas;
          const ind = industriaPorId(r.industria);
          const act = actividadPorId(ind, r.actividad);
          const nv = NIVELES[reg.resultado.nivel];
          const est = estadoDe(reg);
          return `<tr>
            <td>${fecha(reg.creado, true)}<small>${reg.modo === 'consultor' ? 'Con consultor' : 'Autoguiada'}</small></td>
            <td><strong>${esc(r.contacto.empresa)}</strong><small>${esc([r.contacto.nombre, r.contacto.ciudad].filter(Boolean).join(' · '))}</small></td>
            <td>${ind ? `${ind.icono} ${esc(ind.nombre)}` : ''}<small>${esc(act?.nombre || '')}</small></td>
            <td class="num">${reg.resultado.indice}</td>
            <td><span class="nivel nivel-${nv.id}" data-icono="${nv.icono}">${nv.nombre.replace('Riesgo ', '')}</span></td>
            <td><span class="estado estado-${est.v}">${est.t}</span></td>
            <td><div class="acc"><a class="btn btn-borde btn-sm" href="#/panel/${reg.id}">Ficha</a><button class="btn btn-peligro" data-borrar="${reg.id}" aria-label="Eliminar la encuesta de ${esc(r.contacto.empresa)}">✕</button></div></td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>`;
}

function exportarCsv(lista) {
  const dims = Object.keys(DIMENSIONES);
  const cab = ['fecha', 'modo', 'empresa', 'contacto', 'correo', 'telefono', 'ciudad', 'rol', 'tamano', 'industria', 'actividad', 'indice', 'nivel', ...dims.map((d) => `dim_${d}`), 'objetivos', 'cursos_interes', 'estado', 'notas'];
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
      ...dims.map((d) => reg.resultado.dimensiones[d] ?? ''), (r.objetivos || []).join(' | '), (reg.interes || []).join(' | '),
      estadoDe(reg).t, reg.seguimiento?.notas || ''
    ].map(celda).join(',');
  });
  const contenido = '﻿' + [cab.join(','), ...filas].join('\n');
  return descargarArchivo(`encuestas-${new Date().toISOString().slice(0, 10)}.csv`, contenido, 'text/csv;charset=utf-8');
}
