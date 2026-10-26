// Genera docs/esquema-encuesta.md a partir del contenido real de la encuesta
// (preguntas, opciones, puntajes, pesos, casos y cursos), para que el
// documento nunca se desactualice frente a la aplicación.
// Uso: npm run esquema
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  INDUSTRIAS, PREGUNTAS_PERFIL, PREGUNTAS_MADUREZ, PREGUNTAS_ESLABON, DIMENSIONES, ESLABONES,
  OBJETIVOS, SECCIONES, construirFlujo, plantilla
} from '../public/js/motor/contenido.js';
import { NIVELES, UMBRALES, evaluar } from '../public/js/motor/evaluacion.js';
import { CASOS } from '../public/js/motor/casos.js';
import { CURSOS, RUTAS } from '../public/js/motor/cursos.js';

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const salida = path.join(raiz, 'docs', 'esquema-encuesta.md');
const L = [];
const w = (...x) => L.push(...x);
const celda = (t) => String(t ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
const tabla = (cab, filas) => {
  w(`| ${cab.join(' | ')} |`, `|${cab.map(() => '---').join('|')}|`);
  for (const f of filas) w(`| ${f.map(celda).join(' | ')} |`);
  w('');
};
const pct = (v) => `${(v * 100).toFixed(1).replace('.', ',')} %`;
const opcionesTabla = (p) => tabla(['Opción', 'Respuesta', 'Puntos'], p.opciones.map((o, i) => [String.fromCharCode(65 + i), o.t, o.p ?? '—']));

const ejemplo = INDUSTRIAS[1];
const flujoEjemplo = construirFlujo({ industria: ejemplo.id, actividad: ejemplo.actividades[0].id });
const porSeccion = Object.fromEntries(SECCIONES.map((s) => [s, flujoEjemplo.filter((p) => p.seccion === s).length]));
const puntuables = flujoEjemplo.filter((p) => p.dimension);
const porDimension = Object.fromEntries(Object.keys(DIMENSIONES).map((d) => [d, puntuables.filter((p) => p.dimension === d).length]));

w('# Esquema de la encuesta · Radar IA', '');
w('> Documento generado automáticamente desde el código (`npm run esquema`). Si cambia una pregunta en',
  '> `public/js/motor/`, vuelva a generarlo.', '');

// ───────── 1. Resumen ─────────
w('## 1. Resumen', '');
w(`- **${flujoEjemplo.length} preguntas** por empresa, una por pantalla (≈ 5 minutos, unos 14 segundos por pregunta).`);
w(`- **${PREGUNTAS_PERFIL.length} de perfil** (no puntúan), **4 del nicho** (dependen de la industria y la actividad) y **${PREGUNTAS_MADUREZ.length} de madurez** (iguales para todas las empresas).`);
w(`- **${puntuables.length} preguntas puntúan** de 0 a 3 y alimentan el índice de madurez (0–100). Una más (objetivos) no puntúa: sirve para priorizar casos.`);
w(`- **${INDUSTRIAS.length} industrias × 4 actividades = ${INDUSTRIAS.length * 4} nichos.** Cada actividad pertenece a uno de los 4 eslabones de la cadena de valor.`);
w('');
w('### Orden de las secciones', '');
tabla(['#', 'Sección', 'Preguntas', '¿Puntúa?', 'Qué decide'], [
  [1, 'Empresa', porSeccion.Empresa, 'No', 'Nombre (aparece en el diagnóstico), rol y tamaño (escala de los datos sintéticos)'],
  [2, 'Sector', porSeccion.Sector, 'No', 'La industria y la actividad definen las preguntas del nicho y los casos'],
  [3, 'Su negocio', porSeccion['Su negocio'], 'Sí · dimensión «Negocio»', '2 preguntas de la industria + 2 del eslabón de la actividad'],
  [4, 'Datos', porSeccion.Datos, 'Sí · «Datos»', 'Registro, histórico y calidad'],
  [5, 'Tecnología', porSeccion['Tecnología'], 'Sí · «Tecnología»', 'Almacenamiento e integración'],
  [6, 'Analítica', porSeccion['Analítica'], 'Sí · «Analítica»', 'Decisiones, reportes y uso de IA'],
  [7, 'Equipo', porSeccion.Equipo, 'Sí · «Talento»', 'Responsable y habilidades'],
  [8, 'Estrategia', porSeccion.Estrategia, '1 sí · 1 no', 'Presupuesto (puntúa) y objetivos (prioriza casos)']
]);

w('### Flujo adaptativo', '');
w('```mermaid', 'flowchart TD',
  '  A[Empresa: contacto, rol, tamaño] --> B{Industria}',
  ...INDUSTRIAS.map((i) => `  B --> I_${i.id}["${i.nombre}"]`),
  ...INDUSTRIAS.map((i) => `  I_${i.id} --> C{Actividad principal}`),
  '  C --> N1[2 preguntas de la industria]',
  '  C --> N2[2 preguntas del eslabón: producción · comercial · logística · servicio]',
  '  N1 --> M[12 preguntas de madurez]',
  '  N2 --> M',
  '  M --> R[Índice 0-100 y nivel de riesgo]',
  '  R --> D[Diagnóstico: tablero, 6 casos, ruta y cursos]',
  '```', '');

// ───────── 2. Distribución y pesos ─────────
w('## 2. Cómo se distribuye el puntaje', '');
w('Cada respuesta vale de 0 a 3 puntos. Por dimensión se promedia y se lleva a 0–100; el índice es el promedio ponderado de las dimensiones.', '');
tabla(['Dimensión', 'Peso', 'Preguntas', 'Peso de cada pregunta en el índice'],
  Object.entries(DIMENSIONES).map(([k, d]) => [d.nombre, `${d.peso * 100} %`, porDimension[k], pct(d.peso / porDimension[k])]));
w('**Fórmula:** `índice = Σ (puntaje de la dimensión × peso)`, donde `puntaje de la dimensión = suma de puntos ÷ (3 × preguntas) × 100`.', '');
const pesoPregunta = Object.entries(DIMENSIONES).map(([k, d]) => [k, d.peso / porDimension[k]]).sort((x, y) => y[1] - x[1]);
w(`Pasar una pregunta de 0 a 3 puntos sube el índice en su peso por pregunta. La que más pesa sola es la de **${DIMENSIONES[pesoPregunta[0][0]].corto.toLowerCase()}** (${pct(pesoPregunta[0][1])}); le siguen las de **${DIMENSIONES[pesoPregunta[1][0]].corto.toLowerCase()}** (${pct(pesoPregunta[1][1])} cada una). Las del nicho son las que menos pesan individualmente (${pct(pesoPregunta[pesoPregunta.length - 1][1])}).`, '');

w('### Niveles de riesgo', '');
tabla(['Nivel', 'Índice', 'Lectura', 'Enfoque'], [
  [`${NIVELES.alto.icono} ${NIVELES.alto.nombre}`, `0 – ${UMBRALES.moderado - 1}`, NIVELES.alto.etiqueta, NIVELES.alto.enfoque],
  [`${NIVELES.moderado.icono} ${NIVELES.moderado.nombre}`, `${UMBRALES.moderado} – ${UMBRALES.bajo - 1}`, NIVELES.moderado.etiqueta, NIVELES.moderado.enfoque],
  [`${NIVELES.bajo.icono} ${NIVELES.bajo.nombre}`, `${UMBRALES.bajo} – 100`, NIVELES.bajo.etiqueta, NIVELES.bajo.enfoque]
]);
w('**Reglas de coherencia** (se aplican después del índice):', '');
w('- Si la dimensión **Datos** es menor a 30, el nivel es **riesgo alto** sin importar el resto.');
w('- Si **Datos** es menor a 55, la empresa **no puede quedar en riesgo bajo** (pasa a moderado).');
w('- Toda respuesta con 0 puntos es un hallazgo **crítico**; con 1 punto, **mejorable**. Aparecen ordenados por gravedad y peso.', '');

// Ejemplo trabajado
const r = { contacto: { empresa: 'Panadería Carlitos', autoriza: true }, rol: 'gerente', tamano: 'micro', industria: 'alimentos', actividad: 'produccion' };
const elegidas = { alim_merma: 1, alim_cantidad: 0, esl_planeacion: 0, esl_desperdicio: 1, registro: 0, historico: 0, calidad: 1, almacenamiento: 0, integracion: 0, decisiones: 1, reportes: 0, ia: 1, equipo: 1, habilidades: 0, presupuesto: 1 };
for (const p of construirFlujo(r)) {
  if (p.tipo === 'multiple') r[p.id] = ['costos', 'pronostico'];
  else if (p.dimension) r[p.id] = p.opciones.find((o) => o.p === elegidas[p.id]).v;
}
const ev = evaluar(r);
w('### Ejemplo: Panadería Carlitos', '');
w('Microempresa de alimentos, actividad «Producción y transformación», que anota todo en cuadernos.', '');
tabla(['Dimensión', 'Puntaje', 'Peso', 'Aporte al índice'],
  Object.entries(ev.dimensiones).map(([k, v]) => [DIMENSIONES[k].corto, v, `${DIMENSIONES[k].peso * 100} %`, (v * DIMENSIONES[k].peso).toFixed(1).replace('.', ',')]));
w(`**Índice: ${ev.indice}/100 → ${NIVELES[ev.nivel].nombre}.** ${ev.hallazgos.length} hallazgos (${ev.hallazgos.filter((h) => h.gravedad === 'critico').length} críticos).`, '');

// ───────── 3. Perfil ─────────
w('## 3. Preguntas de perfil (no puntúan)', '');
for (const p of PREGUNTAS_PERFIL) {
  w(`### ${p.titulo}`, '');
  if (p.tipo === 'contacto') {
    w('Formulario: nombre de la empresa (obligatorio), nombre de contacto, correo, teléfono/WhatsApp, ciudad y autorización de tratamiento de datos (Ley 1581 de 2012, obligatoria).', '');
  } else if (p.tipo === 'industria') {
    w(`Tarjetas con las ${INDUSTRIAS.length} industrias (ver sección 4).`, '');
  } else if (p.tipo === 'actividad') {
    w('Tarjetas con las 4 actividades de la industria elegida (ver sección 4).', '');
  } else {
    tabla(['Opción', 'Respuesta'], p.opciones.map((o, i) => [String.fromCharCode(65 + i), o.d ? `${o.t} (${o.d})` : o.t]));
  }
  if (p.nota) w(`*Nota para el consultor:* ${p.nota}`, '');
}

// ───────── 4. Nicho ─────────
w('## 4. Preguntas del nicho', '');
w('Después de elegir la actividad aparecen 4 preguntas: **2 propias de la industria** y **2 del eslabón** al que pertenece la actividad. Todas puntúan en la dimensión «Negocio».', '');
w('### 4.1 Industrias, actividades y eslabón', '');
tabla(['Industria', 'Actividad', 'Descripción', 'Eslabón'],
  INDUSTRIAS.flatMap((i) => i.actividades.map((a, k) => [k === 0 ? `${i.icono} ${i.nombre}` : '', a.nombre, a.desc, ESLABONES[a.eslabon]])));
const conteoEsl = Object.fromEntries(Object.keys(ESLABONES).map((e) => [e, INDUSTRIAS.flatMap((i) => i.actividades).filter((a) => a.eslabon === e).length]));
w(`Distribución de los ${INDUSTRIAS.length * 4} nichos por eslabón: ${Object.entries(conteoEsl).map(([e, n]) => `${ESLABONES[e]} **${n}**`).join(' · ')}.`, '');

w('### 4.2 Preguntas por industria', '');
for (const i of INDUSTRIAS) {
  w(`#### ${i.icono} ${i.nombre}`, '');
  for (const p of i.preguntas) {
    w(`**${p.titulo}**`, '');
    opcionesTabla(p);
    if (p.nota) w(`*Nota para el consultor:* ${p.nota}`, '');
    w(`*Hallazgo si responde A o B:* ${p.hallazgo}`, '');
  }
}

w('### 4.3 Preguntas por eslabón', '');
w('Las palabras entre llaves se reemplazan con el vocabulario de cada industria:', '');
tabla(['Industria', '{productos}', '{clientes}', '{punto}'], INDUSTRIAS.map((i) => [i.nombre, i.vocab.productos, i.vocab.clientes, i.vocab.punto]));
for (const [e, preguntas] of Object.entries(PREGUNTAS_ESLABON)) {
  w(`#### ${ESLABONES[e]}`, '');
  for (const p of preguntas) {
    w(`**${p.titulo}**`, '');
    opcionesTabla(p);
    w(`*Hallazgo si responde A o B:* ${p.hallazgo}`, '');
  }
}

// ───────── 5. Madurez ─────────
w('## 5. Preguntas de madurez (todas las empresas)', '');
for (const s of ['Datos', 'Tecnología', 'Analítica', 'Equipo', 'Estrategia']) {
  w(`### ${s}`, '');
  for (const p of PREGUNTAS_MADUREZ.filter((x) => x.seccion === s)) {
    w(`**${p.titulo}**${p.dimension ? ` · dimensión ${DIMENSIONES[p.dimension].corto}` : ' · no puntúa'}`, '');
    if (p.tipo === 'multiple') {
      tabla(['Opción', 'Objetivo', 'Detalle'], OBJETIVOS.map((o, i) => [String.fromCharCode(65 + i), o.t, o.d]));
    } else {
      opcionesTabla(p);
    }
    if (p.nota) w(`*Nota para el consultor:* ${p.nota}`, '');
    if (p.hallazgo) w(`*Hallazgo si responde A o B:* ${p.hallazgo}`, '');
  }
}

// ───────── 6. Casos ─────────
w('## 6. Casos hipotéticos', '');
w(`La biblioteca tiene **${CASOS.length} casos**. A cada empresa se le muestran **6 de su nivel**, elegidos en este orden de prioridad:`, '');
w('1. Casos de **su industria** (+100 puntos).', '2. Casos de **su eslabón** (+50).', '3. Casos **transversales** (+0).', '4. Dentro de cada grupo, +10 por cada **objetivo** que coincida con los que marcó.', '');
w('Los casos de industria aplican a dos niveles cada uno, por eso la suma de la tabla es mayor que el total de la biblioteca.', '');
const tipo = (c) => (c.industria ? 'Industria' : c.eslabon ? 'Eslabón' : 'Transversal');
tabla(['Nivel', 'Transversales', 'Por eslabón', 'Por industria', 'Total'], ['alto', 'moderado', 'bajo'].map((n) => {
  const cs = CASOS.filter((c) => c.niveles.includes(n));
  return [NIVELES[n].nombre, cs.filter((c) => tipo(c) === 'Transversal').length, cs.filter((c) => tipo(c) === 'Eslabón').length, cs.filter((c) => tipo(c) === 'Industria').length, cs.length];
}));
for (const n of ['alto', 'moderado', 'bajo']) {
  w(`### ${NIVELES[n].nombre}`, '');
  tabla(['Caso', 'Tipo', 'Aplica a', 'Técnica', 'Indicador simulado'], CASOS.filter((c) => c.niveles.includes(n)).map((c) => [
    plantilla(c.titulo, { empresa: 'la empresa', productos: 'productos', clientes: 'clientes', punto: 'punto de venta' }),
    tipo(c),
    c.industria ? INDUSTRIAS.find((i) => i.id === c.industria).nombre : c.eslabon ? ESLABONES[c.eslabon] : 'Todas',
    c.tecnica,
    `${c.kpi.nombre} (${c.kpi.fav < 0 ? 'menor' : 'mayor'} es mejor)`
  ]));
}

// ───────── 7. Cursos y ruta ─────────
w('## 7. Cursos y ruta por nivel', '');
tabla(['Curso', 'Duración', 'Modalidad', 'Niveles'], CURSOS.map((c) => [c.nombre, c.duracion, c.modalidad, c.niveles.map((n) => NIVELES[n].nombre.replace('Riesgo ', '')).join(', ')]));
for (const n of ['alto', 'moderado', 'bajo']) {
  w(`**Ruta · ${NIVELES[n].nombre}:** ${RUTAS[n].map((f) => `${f.fase}: ${f.titulo}`).join(' → ')}`, '');
}

await fs.mkdir(path.dirname(salida), { recursive: true });
await fs.writeFile(salida, L.join('\n'));
console.log(`Listo: ${path.relative(raiz, salida)} (${L.length} líneas)`);
