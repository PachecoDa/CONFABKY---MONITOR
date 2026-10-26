import { esc, local } from '../util.js';
import { NIVELES } from '../motor/evaluacion.js';

const EJEMPLOS = {
  bajo: 'Una cadena de tiendas con 4 años de ventas en su ERP quiere pronosticar la demanda por tienda.',
  moderado: 'Una distribuidora con ventas en Excel y un POS quiere un tablero que se actualice solo.',
  alto: 'Una panadería que anota la producción en un cuaderno quiere saber por qué le sobra pan.'
};

export function vistaInicio(app) {
  const borrador = local.leer('radar:borrador');
  const empresaBorrador = borrador?.respuestas?.contacto?.empresa;

  app.innerHTML = `
    <section class="hero">
      <div class="contenedor">
        <span class="insignia"><i></i>Diagnóstico empresarial con datos e IA</span>
        <h1>¿Qué tan lista está su empresa para la <em>IA</em>?</h1>
        <p class="lead">Responda un diagnóstico de 5 minutos con preguntas propias de su industria y su actividad. Al terminar verá su nivel de riesgo, un tablero con escenarios para su empresa, seis casos priorizados y la ruta de formación recomendada.</p>
        <div class="acciones">
          <a class="btn btn-dorado" href="#/encuesta">Comenzar diagnóstico →</a>
          <a class="btn btn-claro" href="#/encuesta?modo=consultor">Modo consultor</a>
        </div>
        <div class="hero-meta"><span>◷ 21 preguntas</span><span>·</span><span>10 industrias y 40 nichos</span><span>·</span><span>3 niveles de riesgo</span></div>
      </div>
    </section>
    ${empresaBorrador ? `
      <div class="contenedor">
        <div class="tarjeta borrador">
          <div><strong>Tiene un diagnóstico sin terminar</strong><br><span style="color:var(--tinta-2)">${esc(empresaBorrador)}</span></div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn btn-texto" id="descartar">Descartar</button>
            <a class="btn btn-primario" href="#/encuesta">Continuar</a>
          </div>
        </div>
      </div>` : ''}
    <section class="seccion">
      <div class="contenedor">
        <div class="seccion-titulo">
          <div class="etiqueta">Clasificación</div>
          <h2>Tres niveles de riesgo frente a la implementación de IA</h2>
          <p>El riesgo mide qué tan probable es que una inversión en IA o analítica no dé resultados por falta de bases. Cada nivel tiene problemas típicos y soluciones distintas.</p>
        </div>
        <div class="niveles-grid">
          ${['alto', 'moderado', 'bajo'].map((n) => `
            <article class="tarjeta nivel-tarjeta ${n}">
              <span class="nivel nivel-${n}" data-icono="${NIVELES[n].icono}">${NIVELES[n].nombre}</span>
              <h3 style="margin-top:12px">${NIVELES[n].etiqueta}</h3>
              <p>${NIVELES[n].resumen}</p>
              <div class="ejemplo"><strong>Ejemplo:</strong> ${EJEMPLOS[n]}</div>
            </article>`).join('')}
        </div>
      </div>
    </section>
    <section class="seccion banda">
      <div class="contenedor">
        <div class="seccion-titulo">
          <div class="etiqueta">Cómo funciona</div>
          <h2>De la encuesta a la ruta de formación, en una sola sesión</h2>
        </div>
        <div class="pasos">
          <div class="tarjeta paso"><h3>Perfil e industria</h3><p>Empresa, rol, tamaño, industria y actividad principal dentro de la cadena de valor.</p></div>
          <div class="tarjeta paso"><h3>Preguntas de su nicho</h3><p>Según la industria y la actividad aparecen preguntas específicas, más las de madurez en datos.</p></div>
          <div class="tarjeta paso"><h3>Clasificación y tablero</h3><p>Nivel de riesgo, perfil por dimensión y un tablero con escenarios favorable y desfavorable.</p></div>
          <div class="tarjeta paso"><h3>Casos y cursos</h3><p>Seis casos hipotéticos priorizados con su solución y los cursos para empezar.</p></div>
        </div>
      </div>
    </section>`;

  app.querySelector('#descartar')?.addEventListener('click', () => {
    local.borrar('radar:borrador');
    vistaInicio(app);
  });
}

