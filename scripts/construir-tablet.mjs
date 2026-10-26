// Empaqueta la aplicación en un solo archivo HTML para publicarla como
// artifact de claude.ai y abrirla desde la tablet o el celular, sin servidor.
// Las encuestas se guardan en la base de datos del artifact.
// Uso: npm run tablet   →   dist/radar-ia-tablet.html
import { build } from 'esbuild';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const salida = path.join(raiz, 'dist', 'radar-ia-tablet.html');

const js = await build({
  entryPoints: [path.join(raiz, 'public/js/app.js')],
  bundle: true,
  format: 'iife',
  target: 'es2020',
  minify: true,
  write: false,
  legalComments: 'none'
});
const css = await fs.readFile(path.join(raiz, 'public/css/estilos.css'), 'utf8');
const index = await fs.readFile(path.join(raiz, 'public/index.html'), 'utf8');

// Del index.html se toma solo el contenido visible (barra, main y pie).
const cuerpo = index.slice(index.indexOf('<header'), index.indexOf('<script'));
const fuentes = index.match(/<link href="https:\/\/fonts\.googleapis\.com[^>]+>/)[0];
const codigo = js.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');

const html = `<title>Radar IA</title>
${fuentes}
<style>
${css}
</style>
${cuerpo.trim()}
<script>window.RADAR_ARTIFACT = true;</script>
<script>
${codigo}
</script>
`;
await fs.mkdir(path.dirname(salida), { recursive: true });
await fs.writeFile(salida, html);
console.log(`Listo: ${path.relative(raiz, salida)} (${(html.length / 1024).toFixed(0)} KB)`);
