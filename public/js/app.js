// Enrutador por hash: #/ · #/encuesta · #/resultado/:id · #/panel
import { CONFIG } from './config.js';
import { $$ } from './util.js';
import { vistaInicio } from './vistas/inicio.js';
import { vistaEncuesta } from './vistas/encuesta.js';
import { vistaResultado } from './vistas/resultado.js';
import { vistaPanel } from './vistas/panel.js';

const app = document.getElementById('app');
document.getElementById('marca-org').textContent = CONFIG.organizacion;
document.getElementById('pie-org').textContent = `${CONFIG.organizacion} · ${CONFIG.subtitulo}`;

const rutas = [
  { patron: /^#\/encuesta(?:\?(.*))?$/, vista: vistaEncuesta, nombre: 'encuesta' },
  { patron: /^#\/resultado\/([\w-]+)$/, vista: vistaResultado, nombre: 'resultado' },
  { patron: /^#\/panel$/, vista: vistaPanel, nombre: 'panel' }
];

async function navegar() {
  const hash = location.hash || '#/';
  const ruta = rutas.find((r) => r.patron.test(hash));
  const params = ruta ? hash.match(ruta.patron).slice(1) : [];
  for (const a of $$('.barra-nav a')) a.classList.toggle('activo', a.dataset.ruta === ruta?.nombre);
  app.replaceChildren();
  window.scrollTo(0, 0);
  try {
    await (ruta ? ruta.vista : vistaInicio)(app, ...params);
  } catch (e) {
    console.error(e);
    app.innerHTML = '<div class="contenedor angosto"><div class="tarjeta bloque" style="margin-top:40px"><h2>Algo salió mal</h2><p>No se pudo cargar esta página. Intente de nuevo.</p><a class="btn btn-primario" href="#/">Volver al inicio</a></div></div>';
  }
  app.focus({ preventScroll: true });
}

window.addEventListener('hashchange', navegar);
navegar();
