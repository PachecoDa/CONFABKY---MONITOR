// Encuesta adaptativa: una pregunta por pantalla. Las preguntas del nicho se
// insertan según la industria y la actividad elegidas. El avance se guarda
// como borrador en el navegador para poder retomarlo.

import { esc, local, $, $$ } from '../util.js';
import { guardarEncuesta } from '../datos.js';
import { construirFlujo, INDUSTRIAS, industriaPorId, ESLABONES, SECCIONES } from '../motor/contenido.js';

const CLAVE = 'radar:borrador';
const LETRAS = 'ABCDEFGH';
const SEGUNDOS_POR_PREGUNTA = 14;
// Preguntas del nicho que aparecen después de elegir la actividad.
const PREGUNTAS_NICHO = 4;

export function vistaEncuesta(app, query = '') {
  const params = new URLSearchParams(query);
  const guardado = local.leer(CLAVE);
  const estado = guardado || { respuestas: {}, pos: 0, modo: 'autoguiado' };
  if (params.get('modo') === 'consultor') estado.modo = 'consultor';

  let temporizador = null;

  function persistir() {
    local.escribir(CLAVE, estado);
  }

  // Quita respuestas que ya no aplican (p. ej. al cambiar de industria).
  function depurar() {
    const ids = new Set(construirFlujo(estado.respuestas).map((p) => p.id));
    for (const k of Object.keys(estado.respuestas)) {
      if (!ids.has(k)) delete estado.respuestas[k];
    }
  }

  function respondida(p) {
    const v = estado.respuestas[p.id];
    if (p.tipo === 'contacto') return !!(v?.empresa?.trim() && v?.autoriza);
    if (p.tipo === 'multiple') return Array.isArray(v) && v.length > 0;
    return v != null && v !== '';
  }

  function render() {
    clearTimeout(temporizador);
    const flujo = construirFlujo(estado.respuestas);
    estado.pos = Math.min(estado.pos, flujo.length - 1);
    const p = flujo[estado.pos];
    const ultima = estado.pos === flujo.length - 1;
    const seccionActual = SECCIONES.indexOf(p.seccion);
    // Antes de elegir la actividad se cuentan también las preguntas del nicho.
    const total = flujo.length + (estado.respuestas.actividad ? 0 : PREGUNTAS_NICHO);
    const restantes = total - estado.pos;
    const minutos = Math.max(1, Math.round((restantes * SEGUNDOS_POR_PREGUNTA) / 60));

    app.innerHTML = `
      <div class="encuesta">
        <div class="contenedor angosto">
          <div class="enc-cabecera">
            <div class="enc-secciones" aria-label="Secciones">
              ${SECCIONES.map((s, i) => `<span class="${i < seccionActual ? 'hecha' : i === seccionActual ? 'actual' : ''}">${s}</span>`).join('')}
            </div>
            <label class="interruptor" title="Muestra notas de apoyo para quien aplica la encuesta">
              <input type="checkbox" id="modo" ${estado.modo === 'consultor' ? 'checked' : ''}> Modo consultor
            </label>
          </div>
          <div class="progreso" role="progressbar" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${estado.pos}">
            <div style="width:${(estado.pos / total) * 100}%"></div>
          </div>
          <div class="enc-meta">
            <span>Pregunta ${estado.pos + 1} de ${total}</span>
            <span>≈ ${minutos} min restante${minutos === 1 ? '' : 's'}</span>
          </div>
          <form class="tarjeta pregunta" id="form-pregunta" novalidate>
            <div class="etiqueta">${esc(p.seccion)}</div>
            <h2 id="titulo-pregunta">${esc(p.titulo)}</h2>
            ${p.ayuda ? `<p class="ayuda">${esc(p.ayuda)}</p>` : '<div style="height:12px"></div>'}
            ${estado.modo === 'consultor' && p.nota ? `<div class="nota-consultor"><strong>Consultor:</strong><span>${esc(p.nota)}</span></div>` : ''}
            <div id="cuerpo">${cuerpo(p)}</div>
            <div class="error-msg" id="error" role="alert"></div>
            <div class="enc-pie">
              <button type="button" class="btn btn-texto" id="atras" ${estado.pos === 0 ? 'disabled' : ''}>← Atrás</button>
              <span class="atajo">${p.opciones ? 'Use las teclas A, B, C… o Enter' : ''}</span>
              <button type="submit" class="btn btn-primario" id="siguiente" ${respondida(p) ? '' : 'disabled'}>
                ${ultima ? 'Generar diagnóstico ✓' : 'Siguiente →'}
              </button>
            </div>
          </form>
        </div>
      </div>`;

    conectar(p, ultima);
  }

  function cuerpo(p) {
    const r = estado.respuestas;
    if (p.tipo === 'contacto') {
      const c = r.contacto || {};
      return `
        <div class="form-grid">
          <div class="campo ancho"><label for="empresa">Nombre de la empresa <span class="req">*</span></label>
            <input id="empresa" name="empresa" maxlength="120" autocomplete="organization" required value="${esc(c.empresa || '')}" placeholder="Ej.: Panadería Carlitos"></div>
          <div class="campo"><label for="nombre">Nombre de contacto</label>
            <input id="nombre" name="nombre" maxlength="120" autocomplete="name" value="${esc(c.nombre || '')}"></div>
          <div class="campo"><label for="correo">Correo electrónico</label>
            <input id="correo" name="correo" type="email" maxlength="120" autocomplete="email" value="${esc(c.correo || '')}"></div>
          <div class="campo"><label for="telefono">Teléfono / WhatsApp</label>
            <input id="telefono" name="telefono" type="tel" maxlength="30" autocomplete="tel" value="${esc(c.telefono || '')}"></div>
          <div class="campo"><label for="ciudad">Ciudad</label>
            <input id="ciudad" name="ciudad" maxlength="60" autocomplete="address-level2" value="${esc(c.ciudad || '')}"></div>
          <label class="check ancho"><input type="checkbox" id="autoriza" ${c.autoriza ? 'checked' : ''}>
            <span>Autorizo el tratamiento de mis datos personales para fines de este diagnóstico y para recibir información sobre los resultados y cursos, conforme a la Ley 1581 de 2012. <span class="req" style="color:var(--alto)">*</span></span></label>
        </div>`;
    }
    if (p.tipo === 'industria') {
      return `<div class="tarjetas-sel" role="radiogroup" aria-labelledby="titulo-pregunta">
        ${INDUSTRIAS.map((i) => `
          <button type="button" class="tarjeta-sel ${r.industria === i.id ? 'sel' : ''}" role="radio" aria-checked="${r.industria === i.id}" data-v="${i.id}">
            <span class="ico" aria-hidden="true">${i.icono}</span><strong>${esc(i.nombre)}</strong><span>${esc(i.desc)}</span>
          </button>`).join('')}
      </div>`;
    }
    if (p.tipo === 'actividad') {
      const ind = industriaPorId(r.industria);
      return `<div class="tarjetas-sel" role="radiogroup" aria-labelledby="titulo-pregunta">
        ${ind.actividades.map((a) => `
          <button type="button" class="tarjeta-sel ${r.actividad === a.id ? 'sel' : ''}" role="radio" aria-checked="${r.actividad === a.id}" data-v="${a.id}">
            <strong>${esc(a.nombre)}</strong><span>${esc(a.desc)}</span>
            <span class="chip">${esc(ESLABONES[a.eslabon])}</span>
          </button>`).join('')}
      </div>`;
    }
    const multiple = p.tipo === 'multiple';
    const sel = multiple ? r[p.id] || [] : [r[p.id]];
    return `<div class="opciones" role="${multiple ? 'group' : 'radiogroup'}" aria-labelledby="titulo-pregunta">
      ${p.opciones.map((o, i) => `
        <button type="button" class="opcion ${sel.includes(o.v) ? 'sel' : ''}" role="${multiple ? 'checkbox' : 'radio'}" aria-checked="${sel.includes(o.v)}" data-v="${esc(o.v)}">
          <span class="tecla">${LETRAS[i]}</span>
          <span class="txt">${esc(o.t)}${o.d ? `<small>${esc(o.d)}</small>` : ''}</span>
        </button>`).join('')}
    </div>
    ${multiple ? `<p class="ayuda" style="margin:12px 0 0;font-size:.9rem">Seleccione hasta ${p.max}.</p>` : ''}`;
  }

  function avanzar() {
    estado.pos += 1;
    persistir();
    render();
  }

  function conectar(p, ultima) {
    const form = $('#form-pregunta', app);
    const btnSig = $('#siguiente', app);
    const actualizarBoton = () => { btnSig.disabled = !respondida(p); };

    $('#modo', app).addEventListener('change', (e) => {
      estado.modo = e.target.checked ? 'consultor' : 'autoguiado';
      persistir();
      render();
    });
    $('#atras', app).addEventListener('click', () => {
      estado.pos = Math.max(0, estado.pos - 1);
      persistir();
      render();
    });

    if (p.tipo === 'contacto') {
      const leer = () => {
        estado.respuestas.contacto = {
          empresa: $('#empresa', app).value,
          nombre: $('#nombre', app).value,
          correo: $('#correo', app).value,
          telefono: $('#telefono', app).value,
          ciudad: $('#ciudad', app).value,
          autoriza: $('#autoriza', app).checked
        };
        persistir();
        actualizarBoton();
      };
      form.addEventListener('input', leer);
      form.addEventListener('change', leer);
      $('#empresa', app).focus();
    }

    // Selección única (opciones, industria, actividad): marca y avanza sola.
    if (p.tipo === 'unica' || p.tipo === 'industria' || p.tipo === 'actividad') {
      const botones = $$('[data-v]', app);
      const elegir = (v) => {
        const anterior = estado.respuestas[p.id];
        estado.respuestas[p.id] = v;
        if (anterior !== v && (p.tipo === 'industria' || p.tipo === 'actividad')) depurar();
        persistir();
        for (const b of botones) {
          const on = b.dataset.v === v;
          b.classList.toggle('sel', on);
          b.setAttribute('aria-checked', on);
        }
        actualizarBoton();
        if (!ultima) temporizador = setTimeout(avanzar, 260);
      };
      botones.forEach((b) => b.addEventListener('click', () => elegir(b.dataset.v)));
      (botones.find((b) => b.classList.contains('sel')) || botones[0])?.focus({ preventScroll: true });
      if (p.opciones) teclas((i) => botones[i] && elegir(botones[i].dataset.v));
    }

    if (p.tipo === 'multiple') {
      const botones = $$('[data-v]', app);
      const alternar = (v) => {
        const actual = new Set(estado.respuestas[p.id] || []);
        if (actual.has(v)) actual.delete(v);
        else if (actual.size < p.max) actual.add(v);
        else { $('#error', app).textContent = `Puede elegir máximo ${p.max}.`; return; }
        $('#error', app).textContent = '';
        estado.respuestas[p.id] = [...actual];
        persistir();
        for (const b of botones) {
          const on = actual.has(b.dataset.v);
          b.classList.toggle('sel', on);
          b.setAttribute('aria-checked', on);
        }
        actualizarBoton();
      };
      botones.forEach((b) => b.addEventListener('click', () => alternar(b.dataset.v)));
      botones[0]?.focus({ preventScroll: true });
      teclas((i) => botones[i] && alternar(botones[i].dataset.v));
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!respondida(p)) {
        $('#error', app).textContent = p.tipo === 'contacto'
          ? 'Escriba el nombre de la empresa y acepte el tratamiento de datos.'
          : 'Seleccione una respuesta para continuar.';
        return;
      }
      if (ultima) enviar();
      else avanzar();
    });
  }

  // Atajos de teclado A, B, C… mientras la vista esté activa.
  function teclas(fn) {
    const manejador = (e) => {
      if (!document.body.contains(app) || !$('#form-pregunta', app)) return;
      if (e.target.matches('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return;
      const i = LETRAS.indexOf(e.key.toUpperCase());
      if (i >= 0 && e.key.length === 1) { e.preventDefault(); fn(i); }
    };
    document.addEventListener('keydown', manejador);
    window.addEventListener('hashchange', () => document.removeEventListener('keydown', manejador), { once: true });
    // Se quita al volver a pintar la pregunta.
    const quitar = new MutationObserver(() => {
      document.removeEventListener('keydown', manejador);
      quitar.disconnect();
    });
    quitar.observe(app, { childList: true });
  }

  async function enviar() {
    app.innerHTML = `<div class="cargando"><div class="giro"></div><div><h2>Analizando respuestas…</h2><p>Calculando el nivel de riesgo y preparando los casos para ${esc(estado.respuestas.contacto?.empresa)}.</p></div></div>`;
    try {
      const [registro] = await Promise.all([
        guardarEncuesta(estado.respuestas, estado.modo),
        new Promise((r) => setTimeout(r, 900))
      ]);
      local.borrar(CLAVE);
      local.escribir('radar:ultimo', registro.id);
      location.hash = `#/resultado/${registro.id}`;
    } catch (e) {
      render();
      $('#error', app).textContent = `No se pudo guardar la encuesta: ${e.message}. Revise la conexión e intente de nuevo.`;
    }
  }

  render();
}
