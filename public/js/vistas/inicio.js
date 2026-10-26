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
        <div>
          <div class="etiqueta">Estudio de mercado · Inteligencia artificial y ciencia de datos</div>
          <h1>¿Qué tan preparada está su empresa para la <em>inteligencia artificial</em>?</h1>
          <p class="lead">Responda un diagnóstico de 5 minutos con preguntas específicas para su industria y su actividad. Al terminar verá su nivel de riesgo, un tablero con escenarios para su empresa, seis casos priorizados y la ruta de formación recomendada.</p>
          <div class="acciones">
            <a class="btn btn-dorado" href="#/encuesta">Iniciar diagnóstico →</a>
            <a class="btn btn-claro" href="#/encuesta?modo=consultor">Modo consultor (acompañado)</a>
          </div>
          <div class="hero-datos">
            <div><strong>≈ 5 min</strong>21 preguntas</div>
            <div><strong>10</strong>industrias y 40 nichos</div>
            <div><strong>3</strong>niveles de riesgo</div>
          </div>
        </div>
        ${radarSvg()}
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
    <section class="seccion" style="background:var(--superficie);border-top:1px solid var(--borde);border-bottom:1px solid var(--borde)">
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

function radarSvg() {
  const anillos = [170, 120, 70].map((r) => `<circle cx="200" cy="200" r="${r}" fill="none" stroke="rgb(255 255 255 / 16%)" stroke-width="1.5"/>`).join('');
  const puntos = [
    [120, 140, '#d9534f'], [270, 120, '#e6a817'], [250, 270, '#3fbf6f'], [150, 280, '#e6a817'], [300, 210, '#3fbf6f'], [95, 230, '#d9534f']
  ].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="7" fill="${c}" stroke="#0a3b2b" stroke-width="3"/>`).join('');
  return `
    <div class="radar-visual" aria-hidden="true">
      <svg viewBox="0 0 400 400">
        <defs>
          <radialGradient id="g-barrido" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(200 200) scale(170)">
            <stop offset="0" stop-color="#c8a24a" stop-opacity=".55"/><stop offset="1" stop-color="#c8a24a" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <circle cx="200" cy="200" r="170" fill="rgb(255 255 255 / 4%)"/>
        ${anillos}
        <line x1="30" y1="200" x2="370" y2="200" stroke="rgb(255 255 255 / 12%)"/>
        <line x1="200" y1="30" x2="200" y2="370" stroke="rgb(255 255 255 / 12%)"/>
        <g class="radar-barrido"><path d="M200 200 L200 30 A170 170 0 0 1 347 115 Z" fill="url(#g-barrido)"/></g>
        ${puntos}
        <circle cx="200" cy="200" r="6" fill="#c8a24a"/>
      </svg>
    </div>`;
}
