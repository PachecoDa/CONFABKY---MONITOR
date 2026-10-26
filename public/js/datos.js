// Acceso a los datos de las encuestas. La misma interfaz funciona con dos
// orígenes:
//   · servidor: la API de server.js (instalación propia).
//   · claude.ai: la versión publicada como artifact, que guarda en la base de
//     datos del artifact (o, si no está disponible, en este navegador).
// La versión claude.ai se activa con `globalThis.RADAR_ARTIFACT = true`.

import { api, local, sesion } from './util.js';
import { evaluar, validarRespuestas } from './motor/evaluacion.js';
import { CURSOS } from './motor/cursos.js';

export const enArtifact = globalThis.RADAR_ARTIFACT === true;

const CLAVE_PANEL = 'radar:panel';
const COLECCION = 'encuestas';
const CLAVE_LOCAL = 'radar:encuestas';

// ───────────── Servidor ─────────────

const servidor = {
  panelConClave: true,
  guardar: (respuestas, modo) => api('/api/encuestas', { method: 'POST', body: { respuestas, modo } }),
  obtener: (id) => api(`/api/encuestas/${encodeURIComponent(id)}`),
  interes: (id, cursos) => api(`/api/encuestas/${encodeURIComponent(id)}/interes`, { method: 'POST', body: { cursos } }),
  listar: () => api('/api/panel/encuestas', { headers: { 'x-panel-clave': sesion.leer(CLAVE_PANEL) || '' } }),
  eliminar: (id) => api(`/api/panel/encuestas/${encodeURIComponent(id)}`, { method: 'DELETE', headers: { 'x-panel-clave': sesion.leer(CLAVE_PANEL) || '' } }),
  verificarClave: () => api('/api/panel/verificar', { headers: { 'x-panel-clave': sesion.leer(CLAVE_PANEL) || '' } }),
  puedeAdministrar: async () => true,
  origen: async () => 'servidor'
};

// ───────────── Artifact de claude.ai ─────────────

let dbPromesa = null;
function obtenerDb() {
  dbPromesa ||= (globalThis.claude?.use ? globalThis.claude.use('db').catch(() => null) : Promise.resolve(null));
  return dbPromesa;
}

const navegador = {
  leer: () => local.leer(CLAVE_LOCAL, []),
  escribir: (lista) => local.escribir(CLAVE_LOCAL, lista)
};

function nuevoId() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function errorDb(e) {
  const err = new Error(e?.code === 'quota_exceeded'
    ? 'La base de datos está llena. Elimine encuestas antiguas desde el panel.'
    : 'No se pudo acceder a la base de datos. Revise la conexión e intente de nuevo.');
  err.status = 500;
  return err;
}

const artifact = {
  panelConClave: false,
  async guardar(respuestas, modo) {
    const errores = validarRespuestas(respuestas);
    if (errores.length) throw Object.assign(new Error('Encuesta incompleta.'), { detalles: errores });
    const registro = {
      id: nuevoId(),
      creado: new Date().toISOString(),
      modo: modo === 'consultor' ? 'consultor' : 'autoguiado',
      respuestas,
      resultado: evaluar(respuestas),
      interes: []
    };
    const db = await obtenerDb();
    if (db) {
      try { await db.collection(COLECCION).doc(registro.id).set(registro); } catch (e) { throw errorDb(e); }
    } else {
      navegador.escribir([...navegador.leer(), registro]);
    }
    return registro;
  },
  async obtener(id) {
    const db = await obtenerDb();
    let reg = null;
    if (db) {
      try {
        const snap = await db.collection(COLECCION).doc(id).get();
        reg = snap.exists ? structuredClone(snap.data()) : null;
      } catch (e) { throw errorDb(e); }
    } else {
      reg = navegador.leer().find((r) => r.id === id) || null;
    }
    if (!reg) throw Object.assign(new Error('Diagnóstico no encontrado.'), { status: 404 });
    return reg;
  },
  async interes(id, cursos) {
    const validos = [...new Set(cursos.filter((c) => CURSOS.some((x) => x.id === c)))];
    const cambios = { interes: validos, interesFecha: new Date().toISOString() };
    const db = await obtenerDb();
    if (db) {
      try { await db.collection(COLECCION).doc(id).update(cambios); } catch (e) { throw errorDb(e); }
    } else {
      navegador.escribir(navegador.leer().map((r) => (r.id === id ? { ...r, ...cambios } : r)));
    }
    return { interes: validos };
  },
  async listar() {
    const db = await obtenerDb();
    if (!db) return [...navegador.leer()].sort((a, b) => b.creado.localeCompare(a.creado));
    try {
      const snap = await db.collection(COLECCION).orderBy('creado', 'desc').limit(1000).get();
      return snap.docs.map((d) => structuredClone(d.data()));
    } catch (e) { throw errorDb(e); }
  },
  async eliminar(id) {
    const db = await obtenerDb();
    if (db) {
      try { await db.collection(COLECCION).doc(id).delete(); } catch (e) { throw errorDb(e); }
    } else {
      navegador.escribir(navegador.leer().filter((r) => r.id !== id));
    }
    return null;
  },
  verificarClave: async () => ({ ok: true }),
  // Solo quien puede editar el artifact (el dueño) ve el panel.
  async puedeAdministrar() {
    const user = globalThis.claude?.use ? await globalThis.claude.use('user').catch(() => null) : null;
    if (!user) return true;
    try { return await user.canEdit(); } catch { return false; }
  },
  async origen() {
    return (await obtenerDb()) ? 'nube' : 'navegador';
  }
};

const datos = enArtifact ? artifact : servidor;

export const guardarEncuesta = (respuestas, modo) => datos.guardar(respuestas, modo);
export const obtenerEncuesta = (id) => datos.obtener(id);
export const registrarInteres = (id, cursos) => datos.interes(id, cursos);
export const listarEncuestas = () => datos.listar();
export const eliminarEncuesta = (id) => datos.eliminar(id);
export const verificarClavePanel = () => datos.verificarClave();
export const panelConClave = datos.panelConClave;
export const puedeAdministrar = () => datos.puedeAdministrar();
export const origenDatos = () => datos.origen();

export const clavePanel = {
  leer: () => sesion.leer(CLAVE_PANEL),
  guardar: (v) => sesion.escribir(CLAVE_PANEL, v),
  borrar: () => sesion.borrar(CLAVE_PANEL)
};

// Descarga de archivos: en claude.ai pasa por la capacidad `downloads`.
export async function descargarArchivo(nombre, contenido, tipo) {
  if (enArtifact) {
    const downloads = globalThis.claude?.use ? await globalThis.claude.use('downloads').catch(() => null) : null;
    if (!downloads) throw new Error('La descarga no está disponible en esta vista.');
    await downloads.save({ filename: nombre, data: new Blob([contenido], { type: tipo }) });
    return;
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([contenido], { type: tipo }));
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(a.href);
}
