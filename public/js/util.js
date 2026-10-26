// Utilidades compartidas por las vistas.

const ENTIDADES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

// Escapa texto para insertarlo en HTML. Todo dato del usuario pasa por aquí.
export function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, (c) => ENTIDADES[c]);
}

export function $(sel, raiz = document) {
  return raiz.querySelector(sel);
}

export function $$(sel, raiz = document) {
  return [...raiz.querySelectorAll(sel)];
}

const nf0 = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const nf2 = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 2 });

export function numero(v, decimales = 0) {
  if (v == null || Number.isNaN(v)) return '–';
  return (decimales ? nf1 : nf0).format(v);
}

// Millones de pesos: «$ 1.250 M» o «$ 12,4 mil M».
export function millones(v) {
  if (v == null) return '–';
  if (Math.abs(v) >= 1000) return `$ ${nf2.format(v / 1000)} mil M`;
  return `$ ${nf0.format(v)} M`;
}

export function fecha(iso, conHora = false) {
  const d = new Date(iso);
  const opts = { day: 'numeric', month: 'short', year: 'numeric' };
  if (conHora) Object.assign(opts, { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('es-CO', opts);
}

export async function api(ruta, opciones = {}) {
  const res = await fetch(ruta, {
    ...opciones,
    headers: { 'Content-Type': 'application/json', ...(opciones.headers || {}) },
    body: opciones.body ? JSON.stringify(opciones.body) : undefined
  });
  if (res.status === 204) return null;
  const datos = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(datos.error || `Error ${res.status}`);
    err.status = res.status;
    err.detalles = datos.detalles;
    throw err;
  }
  return datos;
}

// localStorage puede no estar disponible (modo privado, bloqueos).
export const local = {
  leer(clave, porDefecto = null) {
    try {
      const v = localStorage.getItem(clave);
      return v == null ? porDefecto : JSON.parse(v);
    } catch {
      return porDefecto;
    }
  },
  escribir(clave, valor) {
    try { localStorage.setItem(clave, JSON.stringify(valor)); } catch { /* sin almacenamiento */ }
  },
  borrar(clave) {
    try { localStorage.removeItem(clave); } catch { /* sin almacenamiento */ }
  }
};

export const sesion = {
  leer(clave) {
    try { return sessionStorage.getItem(clave); } catch { return null; }
  },
  escribir(clave, valor) {
    try { sessionStorage.setItem(clave, valor); } catch { /* sin almacenamiento */ }
  },
  borrar(clave) {
    try { sessionStorage.removeItem(clave); } catch { /* sin almacenamiento */ }
  }
};
