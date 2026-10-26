import express from 'express';
import path from 'node:path';
import { randomUUID, timingSafeEqual } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { Almacen } from './lib/almacen.js';
import { evaluar, validarRespuestas } from './public/js/motor/evaluacion.js';
import { CURSOS } from './public/js/motor/cursos.js';

const raiz = path.dirname(fileURLToPath(import.meta.url));
const PUERTO = Number(process.env.PORT) || 3000;
const CLAVE_PANEL = process.env.PANEL_CLAVE || 'externado';
const almacen = new Almacen(process.env.DATA_FILE || path.join(raiz, 'data', 'encuestas.json'));

if (!process.env.PANEL_CLAVE) {
  console.warn('⚠  PANEL_CLAVE no está definida: el panel usa la clave por defecto «externado». Defínala en producción.');
}

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '64kb' }));
app.use(express.static(path.join(raiz, 'public')));

function claveValida(clave) {
  const a = Buffer.from(String(clave || ''));
  const b = Buffer.from(CLAVE_PANEL);
  return a.length === b.length && timingSafeEqual(a, b);
}

function soloPanel(req, res, next) {
  if (claveValida(req.get('x-panel-clave'))) return next();
  res.status(401).json({ error: 'Clave del panel incorrecta.' });
}

function limpiarTexto(v, max = 120) {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

// Guarda una encuesta: el resultado se recalcula aquí, no se confía en el cliente.
app.post('/api/encuestas', async (req, res) => {
  const { respuestas, modo } = req.body || {};
  const errores = validarRespuestas(respuestas);
  if (errores.length) return res.status(400).json({ error: 'Encuesta incompleta.', detalles: errores });

  const c = respuestas.contacto || {};
  const contacto = {
    empresa: limpiarTexto(c.empresa),
    nombre: limpiarTexto(c.nombre),
    correo: limpiarTexto(c.correo),
    telefono: limpiarTexto(c.telefono, 30),
    ciudad: limpiarTexto(c.ciudad, 60),
    autoriza: c.autoriza === true
  };
  const registro = {
    id: randomUUID(),
    creado: new Date().toISOString(),
    modo: modo === 'consultor' ? 'consultor' : 'autoguiado',
    respuestas: { ...respuestas, contacto },
    resultado: evaluar(respuestas),
    interes: []
  };
  await almacen.crear(registro);
  res.status(201).json(registro);
});

// Un diagnóstico se consulta con su id (UUID aleatorio, no adivinable).
app.get('/api/encuestas/:id', (req, res) => {
  const r = almacen.obtener(req.params.id);
  if (!r) return res.status(404).json({ error: 'Diagnóstico no encontrado.' });
  res.json(r);
});

// El cliente marca los cursos que le interesan.
app.post('/api/encuestas/:id/interes', async (req, res) => {
  const ids = Array.isArray(req.body?.cursos) ? req.body.cursos : [];
  const validos = ids.filter((id) => CURSOS.some((c) => c.id === id));
  const r = await almacen.actualizar(req.params.id, { interes: [...new Set(validos)], interesFecha: new Date().toISOString() });
  if (!r) return res.status(404).json({ error: 'Diagnóstico no encontrado.' });
  res.json({ interes: r.interes });
});

app.get('/api/panel/verificar', soloPanel, (req, res) => res.json({ ok: true }));

app.get('/api/panel/encuestas', soloPanel, (req, res) => {
  const lista = [...almacen.listar()].sort((a, b) => b.creado.localeCompare(a.creado));
  res.json(lista);
});

app.delete('/api/panel/encuestas/:id', soloPanel, async (req, res) => {
  const ok = await almacen.eliminar(req.params.id);
  res.status(ok ? 204 : 404).end();
});

app.use('/api', (req, res) => res.status(404).json({ error: 'Ruta no encontrada.' }));

await almacen.iniciar();
app.listen(PUERTO, () => {
  console.log(`Diagnóstico de IA y datos en http://localhost:${PUERTO}`);
});
