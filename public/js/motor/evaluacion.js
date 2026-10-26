// Motor de clasificación: convierte las respuestas en un índice de madurez
// (0-100), un puntaje por dimensión y un nivel de riesgo (bajo/moderado/alto).
// El servidor lo ejecuta de nuevo al guardar, así que el resultado guardado
// no depende de lo que calcule el navegador.

import { DIMENSIONES, construirFlujo, industriaPorId, actividadPorId } from './contenido.js';

export const NIVELES = {
  bajo: {
    id: 'bajo', nombre: 'Riesgo bajo', etiquetaCorta: 'Bajo', etiqueta: 'Lista para escalar con IA', icono: '▲',
    resumen: 'Ya cuenta con datos organizados y confiables. El siguiente paso es convertirlos en predicciones y automatización: modelos de pronóstico, segmentación e inteligencia artificial aplicada.',
    enfoque: 'Modelos predictivos e IA aplicada'
  },
  moderado: {
    id: 'moderado', nombre: 'Riesgo moderado', etiquetaCorta: 'Moderado', etiqueta: 'En transición analítica', icono: '◆',
    resumen: 'Tiene datos, pero dispersos, manuales o con calidad irregular. La prioridad es integrarlos, automatizar reportes y llevar los indicadores a tableros que se usen para decidir.',
    enfoque: 'Integración, tableros e indicadores'
  },
  alto: {
    id: 'alto', nombre: 'Riesgo alto', etiquetaCorta: 'Alto', etiqueta: 'Sin bases de datos para decidir', icono: '●',
    resumen: 'La información del negocio no está construida como base de datos. Antes de pensar en IA hay que digitalizar, estructurar y asegurar los datos: sin esa base, cualquier inversión en tecnología se pierde.',
    enfoque: 'Fundamentos y construcción de la base de datos'
  }
};

// Umbrales del índice de madurez.
export const UMBRALES = { bajo: 62, moderado: 35 };

export function nivelPorIndice(indice) {
  if (indice >= UMBRALES.bajo) return 'bajo';
  if (indice >= UMBRALES.moderado) return 'moderado';
  return 'alto';
}

export function evaluar(respuestas = {}) {
  const flujo = construirFlujo(respuestas);
  const acumulado = {};
  const hallazgos = [];

  for (const p of flujo) {
    if (!p.dimension) continue;
    const op = p.opciones.find((o) => o.v === respuestas[p.id]);
    if (!op) continue;
    (acumulado[p.dimension] ||= []).push(op.p);
    if (op.p <= 1 && p.hallazgo) {
      hallazgos.push({ pregunta: p.id, dimension: p.dimension, gravedad: op.p === 0 ? 'critico' : 'mejorable', texto: p.hallazgo, respuesta: op.t });
    }
  }

  const dimensiones = {};
  let suma = 0;
  let pesos = 0;
  for (const [id, def] of Object.entries(DIMENSIONES)) {
    const vals = acumulado[id];
    if (!vals?.length) continue;
    const puntaje = Math.round((vals.reduce((a, b) => a + b, 0) / (vals.length * 3)) * 100);
    dimensiones[id] = puntaje;
    suma += puntaje * def.peso;
    pesos += def.peso;
  }
  const indice = pesos ? Math.round(suma / pesos) : 0;

  // Reglas de coherencia: sin una base de datos mínima no se puede estar en
  // riesgo bajo, por alto que sea el resto del puntaje.
  let nivel = nivelPorIndice(indice);
  const ajustes = [];
  const datos = dimensiones.datos ?? 0;
  if (datos < 30 && nivel !== 'alto') {
    nivel = 'alto';
    ajustes.push('La dimensión de datos es muy baja; el nivel se ajusta a riesgo alto.');
  } else if (datos < 55 && nivel === 'bajo') {
    nivel = 'moderado';
    ajustes.push('La dimensión de datos aún no soporta modelos predictivos; el nivel se ajusta a riesgo moderado.');
  }

  // Los críticos primero, y entre ellos los de las dimensiones de más peso.
  hallazgos.sort((a, b) =>
    (a.gravedad === b.gravedad ? 0 : a.gravedad === 'critico' ? -1 : 1) ||
    DIMENSIONES[b.dimension].peso - DIMENSIONES[a.dimension].peso
  );

  const fortalezas = Object.entries(dimensiones)
    .filter(([, v]) => v >= 67)
    .map(([id]) => id);

  return { indice, nivel, dimensiones, hallazgos, fortalezas, ajustes };
}

// Verifica que las respuestas estén completas y sean válidas. Devuelve la
// lista de problemas (vacía si todo está bien).
export function validarRespuestas(r) {
  const errores = [];
  if (!r || typeof r !== 'object') return ['Respuestas vacías.'];
  const empresa = r.contacto?.empresa;
  if (!empresa || typeof empresa !== 'string' || !empresa.trim()) errores.push('Falta el nombre de la empresa.');
  const industria = industriaPorId(r.industria);
  if (!industria) errores.push('Industria no válida.');
  else if (!actividadPorId(industria, r.actividad)) errores.push('Actividad no válida.');
  for (const p of construirFlujo(r)) {
    if (p.tipo === 'contacto' || p.tipo === 'industria' || p.tipo === 'actividad') continue;
    const v = r[p.id];
    if (p.tipo === 'multiple') {
      if (!Array.isArray(v) || !v.length || v.length > (p.max || 99) || v.some((x) => !p.opciones.some((o) => o.v === x))) {
        errores.push(`Respuesta no válida: ${p.id}`);
      }
    } else if (!p.opciones.some((o) => o.v === v)) {
      errores.push(`Falta responder: ${p.id}`);
    }
  }
  return errores;
}
