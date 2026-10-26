// Genera docs/esquema-encuesta.pdf a partir de docs/esquema-encuesta.md.
// Requiere Playwright con Chromium instalado (npx playwright install chromium).
// Uso: npm run esquema:pdf   (primero regenera el .md)
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';
import { INDUSTRIAS } from '../public/js/motor/contenido.js';
import { CASOS } from '../public/js/motor/casos.js';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const md = await fs.readFile(path.join(raiz, 'docs', 'esquema-encuesta.md'), 'utf8');
const salida = path.join(raiz, 'docs', 'esquema-encuesta.pdf');

// El diagrama mermaid se reemplaza por un esquema en HTML (el PDF no ejecuta mermaid).
const diagrama = `
<div class="flujo">
  <div class="paso"><b>1 · Empresa</b><span>Contacto, rol y tamaño</span></div>
  <div class="flecha">↓</div>
  <div class="paso"><b>2 · Industria</b><span>Una de ${INDUSTRIAS.length}</span>
    <div class="chips">${INDUSTRIAS.map((i) => `<i>${i.nombre}</i>`).join('')}</div></div>
  <div class="flecha">↓</div>
  <div class="paso"><b>3 · Actividad principal</b><span>4 por industria, cada una en un eslabón: producción · comercial · logística · servicio</span></div>
  <div class="flecha">↓</div>
  <div class="dos">
    <div class="paso nicho"><b>2 preguntas de la industria</b></div>
    <div class="paso nicho"><b>2 preguntas del eslabón</b></div>
  </div>
  <div class="flecha">↓</div>
  <div class="paso"><b>4 · 12 preguntas de madurez</b><span>Datos · Tecnología · Analítica · Equipo · Estrategia</span></div>
  <div class="flecha">↓</div>
  <div class="paso final"><b>Índice 0–100 → nivel de riesgo</b><span>Diagnóstico: tablero, 6 casos, ruta y cursos</span></div>
</div>`;

const cuerpoMd = md
  .replace(/^# .*\n/, '')
  .replace(/^> .*\n(> .*\n)*/m, '')
  .replace(/```mermaid[\s\S]*?```/, diagrama);
const html = marked.parse(cuerpoMd)
  // Cada sección principal empieza en página nueva.
  .replace(/<h2>/g, '<h2 class="salto">')
  // Cada pregunta queda junto a su tabla de opciones (no se separan entre páginas).
  .replace(/(<p><strong>[^<]*<\/strong>[^<]*<\/p>\s*<table>[\s\S]*?<\/table>)/g, '<div class="bloque-pregunta">$1</div>')
  // Las tablas largas pueden partirse entre páginas; las cortas se mantienen enteras.
  .replace(/<table>([\s\S]*?)<\/table>/g, (t, dentro) => ((dentro.match(/<tr>/g) || []).length > 12 ? `<table class="larga">${dentro}</table>` : t));

const fecha = new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });

const documento = `<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800&family=Source+Sans+3:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  :root { --verde-950:#052419; --verde-900:#0a3b2b; --verde-700:#0f5c41; --verde-100:#e1f0e8; --verde-50:#f1f8f4;
          --dorado-700:#8a6a24; --dorado-500:#c8a24a; --dorado-300:#e3cb8c; --dorado-100:#f7efda;
          --tinta:#13201b; --tinta-2:#44524c; --tinta-3:#6b7872; --borde:#dbe4df; }
  @page { size: A4; margin: 20mm 16mm 18mm; }
  @page portada { margin: 0; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { margin: 0; font-family: 'Source Sans 3', 'Liberation Sans', Arial, sans-serif; font-size: 10.5pt; line-height: 1.45; color: var(--tinta); }
  h1, h2, h3, h4 { font-family: Montserrat, 'Liberation Sans', Arial, sans-serif; color: var(--verde-900); line-height: 1.2; break-after: avoid; }
  h2 { font-size: 19pt; margin: 0 0 10pt; padding-bottom: 6pt; border-bottom: 2.5pt solid var(--dorado-500); }
  h2.salto { break-before: page; }
  h3 { font-size: 13pt; margin: 18pt 0 6pt; }
  h4 { font-size: 11.5pt; margin: 16pt 0 6pt; padding: 5pt 9pt; background: var(--verde-50); border-left: 3pt solid var(--verde-700); border-radius: 3pt; }
  p { margin: 0 0 7pt; }
  p strong:only-child { color: var(--verde-900); }
  em { color: var(--tinta-2); }
  ul, ol { margin: 0 0 8pt; padding-left: 16pt; }
  li { margin-bottom: 2pt; }
  code { font-family: 'Liberation Mono', monospace; font-size: 9pt; background: var(--verde-50); padding: 1pt 4pt; border-radius: 3pt; }
  table { width: 100%; border-collapse: collapse; margin: 4pt 0 10pt; font-size: 9.5pt; break-inside: avoid; }
  table.larga { break-inside: auto; }
  .bloque-pregunta { break-inside: avoid; }
  thead { display: table-header-group; }
  tr { break-inside: avoid; }
  th { background: var(--verde-900); color: #fff; text-align: left; font-weight: 700; padding: 5pt 7pt; font-family: Montserrat, Arial, sans-serif; font-size: 8.5pt; letter-spacing: .02em; }
  td { padding: 4.5pt 7pt; border-bottom: .6pt solid var(--borde); vertical-align: top; }
  tr:nth-child(even) td { background: #fafcfb; }
  td:last-child:not(:only-child) { font-variant-numeric: tabular-nums; }

  /* Portada */
  .portada { page: portada; height: 297mm; padding: 34mm 22mm 24mm; color: #fff; position: relative; overflow: hidden;
    background: radial-gradient(420px 260px at 90% 8%, rgb(200 162 74 / 30%), transparent 70%), linear-gradient(160deg, var(--verde-900), var(--verde-950));
    display: flex; flex-direction: column; break-after: page; }
  .portada::after { content: ''; position: absolute; right: -60mm; bottom: -60mm; width: 170mm; height: 170mm; border-radius: 50%; border: 22mm solid rgb(200 162 74 / 10%); }
  .portada .marca { font-family: Montserrat, Arial, sans-serif; font-weight: 800; font-size: 13pt; color: var(--dorado-500); letter-spacing: .04em; }
  .portada .eti { margin-top: 48mm; font-size: 9.5pt; letter-spacing: .14em; text-transform: uppercase; color: var(--dorado-300); font-weight: 700; }
  .portada h1 { color: #fff; font-size: 38pt; margin: 6mm 0 6mm; font-weight: 800; max-width: 150mm; }
  .portada .sub { font-size: 13pt; color: #cfe3d9; max-width: 140mm; }
  .portada .cifras { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6mm; margin-top: auto; position: relative; z-index: 1; }
  .portada .cifras div { border-top: 1.5pt solid var(--dorado-500); padding-top: 3mm; font-size: 9.5pt; color: #b8d3c6; }
  .portada .cifras b { display: block; font-family: Montserrat, Arial, sans-serif; font-size: 24pt; color: #fff; }
  .portada .fecha { margin-top: 10mm; font-size: 9pt; color: #9fbcae; position: relative; z-index: 1; }

  /* Contenido de la portada interior */
  .indice-doc { columns: 2; column-gap: 10mm; font-size: 10.5pt; }
  .indice-doc li { break-inside: avoid; }

  /* Diagrama de flujo */
  .flujo { display: flex; flex-direction: column; align-items: center; gap: 2pt; margin: 8pt 0 12pt; break-inside: avoid; }
  .flujo .paso { width: 120mm; border: 1pt solid var(--borde); border-radius: 6pt; padding: 6pt 10pt; text-align: center; background: #fff; }
  .flujo .paso b { display: block; font-family: Montserrat, Arial, sans-serif; color: var(--verde-900); font-size: 10pt; }
  .flujo .paso span { font-size: 9pt; color: var(--tinta-2); }
  .flujo .paso.final { background: var(--verde-900); border-color: var(--verde-900); }
  .flujo .paso.final b { color: var(--dorado-500); }
  .flujo .paso.final span { color: #cfe3d9; }
  .flujo .dos { display: grid; grid-template-columns: 1fr 1fr; gap: 6pt; width: 120mm; }
  .flujo .dos .paso { width: auto; background: var(--dorado-100); border-color: var(--dorado-300); }
  .flujo .flecha { color: var(--dorado-700); font-size: 12pt; line-height: 1; }
  .flujo .chips { display: flex; flex-wrap: wrap; justify-content: center; gap: 3pt; margin-top: 4pt; }
  .flujo .chips i { font-style: normal; font-size: 8pt; padding: 1.5pt 6pt; border-radius: 99pt; background: var(--verde-50); color: var(--verde-700); border: .6pt solid var(--verde-100); }
</style></head>
<body>
  <section class="portada">
    <div class="marca">◎ RADAR IA</div>
    <div class="eti">Estudio de mercado · Inteligencia artificial y ciencia de datos</div>
    <h1>Esquema de la encuesta</h1>
    <p class="sub">Preguntas, opciones, puntajes, pesos, reglas de clasificación, casos y cursos del diagnóstico de madurez en datos e IA.</p>
    <div class="cifras">
      <div><b>21</b>preguntas (≈ 5 min)</div>
      <div><b>${INDUSTRIAS.length * 4}</b>nichos en ${INDUSTRIAS.length} industrias</div>
      <div><b>3</b>niveles de riesgo</div>
      <div><b>${CASOS.length}</b>casos hipotéticos</div>
    </div>
    <div class="fecha">Generado el ${fecha} a partir del código de la aplicación.</div>
  </section>
  ${html}
</body></html>`;

const navegador = await chromium.launch(process.env.HTTPS_PROXY ? { proxy: { server: process.env.HTTPS_PROXY } } : {});
const pagina = await navegador.newPage();
await pagina.setContent(documento, { waitUntil: 'networkidle' }).catch(() => {});
await pagina.evaluate(() => document.fonts.ready);
await pagina.pdf({
  path: salida,
  format: 'A4',
  printBackground: true,
  preferCSSPageSize: true,
  displayHeaderFooter: true,
  headerTemplate: '<div></div>',
  footerTemplate: `<div style="width:100%;font-family:Arial,sans-serif;font-size:7.5pt;color:#6b7872;padding:0 16mm;display:flex;justify-content:space-between">
    <span>Radar IA · Esquema de la encuesta</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`
});
await navegador.close();
console.log(`Listo: ${path.relative(raiz, salida)}`);
