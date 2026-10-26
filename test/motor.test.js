import { test } from 'node:test';
import assert from 'node:assert/strict';
import { construirFlujo, INDUSTRIAS, PREGUNTAS_ESLABON } from '../public/js/motor/contenido.js';
import { evaluar, validarRespuestas } from '../public/js/motor/evaluacion.js';
import { CASOS, seleccionarCasos } from '../public/js/motor/casos.js';
import { seriesVentas, seriesKpi } from '../public/js/motor/sintetico.js';

// Responde todas las preguntas con el mismo puntaje (0..3).
function respuestasCon(puntaje, industria = 'alimentos', actividad = 'produccion') {
  const r = { contacto: { empresa: 'Panadería Carlitos', autoriza: true }, rol: 'gerente', tamano: 'micro', industria, actividad };
  for (const p of construirFlujo(r)) {
    if (p.tipo === 'multiple') r[p.id] = [p.opciones[0].v];
    else if (p.opciones && p.dimension) r[p.id] = p.opciones.find((o) => o.p === puntaje).v;
  }
  return r;
}

test('el flujo inserta las preguntas de la industria y del eslabón', () => {
  const sin = construirFlujo({});
  const con = construirFlujo({ industria: 'moda', actividad: 'comercializacion' });
  assert.equal(con.length - sin.length, 4);
  assert.ok(con.some((p) => p.id === 'moda_tallas'));
  assert.ok(con.some((p) => p.id === 'esl_inventario' && p.titulo.includes('prendas')));
});

test('la encuesta completa tiene unas 21 preguntas (≈5 minutos)', () => {
  assert.equal(construirFlujo({ industria: 'alimentos', actividad: 'produccion' }).length, 21);
});

test('clasifica en los tres niveles', () => {
  assert.equal(evaluar(respuestasCon(0)).nivel, 'alto');
  assert.equal(evaluar(respuestasCon(3)).nivel, 'bajo');
  assert.equal(evaluar(respuestasCon(3)).indice, 100);
  assert.equal(evaluar(respuestasCon(0)).indice, 0);
  const medio = evaluar(respuestasCon(1));
  assert.equal(medio.indice, 33);
  assert.equal(evaluar(respuestasCon(2)).nivel, 'bajo');
});

test('sin datos estructurados no puede quedar en riesgo bajo', () => {
  const r = respuestasCon(3);
  r.registro = 'papel'; r.historico = 'nada'; r.calidad = 'baja';
  const ev = evaluar(r);
  assert.equal(ev.dimensiones.datos, 0);
  assert.equal(ev.nivel, 'alto');
  assert.equal(ev.ajustes.length, 1);
});

test('los hallazgos críticos aparecen primero', () => {
  const r = respuestasCon(2);
  r.registro = 'papel';
  r.habilidades = 'intermedio';
  const ev = evaluar(r);
  assert.equal(ev.hallazgos[0].pregunta, 'registro');
  assert.equal(ev.hallazgos[0].gravedad, 'critico');
});

test('valida respuestas completas e incompletas', () => {
  assert.deepEqual(validarRespuestas(respuestasCon(1)), []);
  const r = respuestasCon(1);
  delete r.presupuesto;
  assert.ok(validarRespuestas(r).some((e) => e.includes('presupuesto')));
  assert.ok(validarRespuestas({ ...respuestasCon(1), industria: 'nope' }).length);
  assert.ok(validarRespuestas({ ...respuestasCon(1), objetivos: ['ventas', 'costos', 'clientes'] }).length);
});

test('siempre hay seis casos para cualquier industria, actividad y nivel', () => {
  for (const ind of INDUSTRIAS) {
    for (const act of ind.actividades) {
      for (const nivel of ['alto', 'moderado', 'bajo']) {
        const casos = seleccionarCasos({ nivel, industria: ind.id, eslabon: act.eslabon });
        assert.equal(casos.length, 6, `${ind.id}/${act.id}/${nivel}`);
        assert.equal(new Set(casos.map((c) => c.id)).size, 6);
        assert.ok(casos.every((c) => c.niveles.includes(nivel)));
      }
    }
  }
});

test('los casos de la industria y del eslabón van primero', () => {
  const casos = seleccionarCasos({ nivel: 'alto', industria: 'alimentos', eslabon: 'produccion', objetivos: ['costos'] });
  assert.equal(casos[0].industria, 'alimentos');
  assert.equal(casos[1].eslabon, 'produccion');
});

test('ids de casos únicos y eslabones válidos', () => {
  assert.equal(new Set(CASOS.map((c) => c.id)).size, CASOS.length);
  for (const c of CASOS) if (c.eslabon) assert.ok(PREGUNTAS_ESLABON[c.eslabon], c.id);
});

test('los datos sintéticos son deterministas y coherentes', () => {
  const a = seriesVentas({ id: 'x', tamano: 'micro', nivel: 'alto', estacionalidad: INDUSTRIAS[1].estacionalidad, fecha: '2026-10-01' });
  const b = seriesVentas({ id: 'x', tamano: 'micro', nivel: 'alto', estacionalidad: INDUSTRIAS[1].estacionalidad, fecha: '2026-10-01' });
  assert.deepEqual(a, b);
  assert.equal(a.etiquetas.length, 24);
  assert.ok(a.anualFavorable > a.anualDesfavorable);
  const k = seriesKpi({ base: 15, fav: -0.45, desf: 0.2 }, 'caso');
  assert.ok(k.conIntervencion < k.actual && k.sinIntervencion > k.actual);
  assert.equal(k.menorEsMejor, true);
});
