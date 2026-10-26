// Carga encuestas de ejemplo para ver el panel con datos.
// Uso: npm run demo   (agrega registros; no borra los existentes)
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Almacen } from '../lib/almacen.js';
import { construirFlujo } from '../public/js/motor/contenido.js';
import { evaluar } from '../public/js/motor/evaluacion.js';
import { aleatorio, semilla } from '../public/js/motor/sintetico.js';

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const almacen = new Almacen(process.env.DATA_FILE || path.join(raiz, 'data', 'encuestas.json'));

// [empresa, ciudad, industria, actividad, tamaño, rol, madurez promedio 0..3]
const EMPRESAS = [
  ['Panadería Carlitos', 'Bogotá', 'alimentos', 'produccion', 'micro', 'gerente', 0.5],
  ['Confecciones La 14 Sur', 'Medellín', 'moda', 'confeccion', 'pequena', 'gerente', 0.9],
  ['Boutique Valeria', 'Cali', 'moda', 'comercializacion', 'micro', 'gerente', 1.2],
  ['Supermercados El Ahorro', 'Barranquilla', 'retail', 'tienda', 'mediana', 'director', 1.9],
  ['Clínica Dental Sonríe', 'Bucaramanga', 'salud', 'clinica', 'pequena', 'gerente', 1.4],
  ['Plásticos Andinos S.A.S.', 'Bogotá', 'manufactura', 'planta', 'mediana', 'director', 2.2],
  ['Transportes Cordillera', 'Pereira', 'logistica', 'carga', 'mediana', 'ti', 1.6],
  ['Café Finca El Mirador', 'Manizales', 'agro', 'cultivo', 'micro', 'gerente', 0.6],
  ['Contadores Asociados', 'Bogotá', 'servicios', 'consultoria', 'pequena', 'analista', 1.5],
  ['Hotel Mar Caribe', 'Cartagena', 'turismo', 'alojamiento', 'mediana', 'director', 2.0],
  ['Distribuidora Nacional de Alimentos', 'Bogotá', 'alimentos', 'domicilios', 'grande', 'ti', 2.6],
  ['Tienda Online Moda Urbana', 'Medellín', 'moda', 'online', 'pequena', 'analista', 2.4]
];

await almacen.iniciar();
const ahora = Date.now();
for (const [i, [empresa, ciudad, industria, actividad, tamano, rol, madurez]] of EMPRESAS.entries()) {
  const rnd = aleatorio(semilla(empresa));
  const respuestas = { contacto: { empresa, nombre: '', correo: '', telefono: '', ciudad, autoriza: true }, rol, tamano, industria, actividad };
  for (const p of construirFlujo(respuestas)) {
    if (p.tipo === 'multiple') {
      respuestas[p.id] = [p.opciones[Math.floor(rnd() * 5)].v];
    } else if (p.dimension) {
      const pts = Math.max(0, Math.min(3, Math.round(madurez + (rnd() - 0.5) * 1.6)));
      respuestas[p.id] = p.opciones.find((o) => o.p === pts).v;
    }
  }
  await almacen.crear({
    id: randomUUID(),
    creado: new Date(ahora - i * 86400000 * 2.3).toISOString(),
    modo: i % 3 ? 'consultor' : 'autoguiado',
    respuestas,
    resultado: evaluar(respuestas),
    interes: rnd() > 0.5 ? ['iagen'] : []
  });
}
console.log(`Se agregaron ${EMPRESAS.length} encuestas de ejemplo.`);
