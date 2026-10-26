# Radar IA · Diagnóstico de madurez en datos e inteligencia artificial

Aplicación web para un **estudio de mercado** que clasifica empresas en tres niveles de
riesgo frente a la implementación de inteligencia artificial y ciencia de datos.

- **Encuesta adaptativa de ~5 minutos (21 preguntas).** Las preguntas cambian según la
  industria y la actividad principal de la empresa (p. ej. en moda, «confección» no recibe
  las mismas preguntas que «compra y venta de ropa»).
- **Dos modos de aplicación:** autoguiado (el cliente la responde solo) o **modo consultor**,
  que muestra notas de apoyo para quien hace la entrevista.
- **Clasificación en 3 niveles:** riesgo bajo, moderado y alto, con índice 0–100 y perfil
  por dimensión.
- **Diagnóstico con el nombre de la empresa:** tablero con datos sintéticos (escenario
  favorable vs. desfavorable), hallazgos, **6 casos hipotéticos** propios de su nicho
  con su solución, hoja de ruta a 12 meses y **cursos recomendados**.
- **Respuestas guardadas en el servidor** y **panel del consultor** con todas las
  encuestas, distribución por nivel e industria, interés en cursos y exportación a CSV.
- Colores inspirados en la identidad de la Universidad Externado de Colombia (verde y dorado).

## Cómo ejecutarla

Requiere Node.js 18 o superior.

```bash
npm install
npm start            # http://localhost:3000
```

Otros comandos:

```bash
npm run demo         # agrega 12 encuestas de ejemplo (Panadería Carlitos, etc.)
npm test             # pruebas del motor de clasificación
```

Variables de entorno:

| Variable      | Para qué sirve                                   | Por defecto              |
|---------------|--------------------------------------------------|--------------------------|
| `PORT`        | Puerto del servidor                              | `3000`                   |
| `PANEL_CLAVE` | Clave para entrar al panel del consultor         | `externado` (¡cámbiela!) |
| `DATA_FILE`   | Archivo donde se guardan las encuestas           | `data/encuestas.json`    |

## Versión para tablet (sin servidor)

```bash
npm run tablet       # genera dist/radar-ia-tablet.html
```

Empaqueta toda la aplicación en un solo archivo HTML que se publica como página
de claude.ai y se abre desde cualquier navegador (tablet, celular o PC) iniciando
sesión con la misma cuenta. En esa versión:

- Las encuestas se guardan en la base de datos de la página (si no está disponible,
  se guardan en el navegador del dispositivo y el panel lo indica).
- El panel del consultor no pide clave: solo el dueño de la página puede verlo.
- No hay botones de PDF ni de copiar enlace, y el CSV se descarga con confirmación.

El código es el mismo: `public/js/datos.js` decide si habla con el servidor o con la
base de datos de la página.

## Rutas de la aplicación

| Ruta                 | Vista                                                      |
|----------------------|------------------------------------------------------------|
| `#/`                 | Inicio                                                     |
| `#/encuesta`         | Encuesta autoguiada (`#/encuesta?modo=consultor` para el modo acompañado) |
| `#/resultado/<id>`   | Diagnóstico de una empresa (el enlace se puede compartir)  |
| `#/panel`            | Panel del consultor (pide la clave)                        |

## Cómo se clasifica

Cada respuesta puntúa de 0 a 3 y se agrupa en seis dimensiones con su peso:

| Dimensión                     | Peso |
|-------------------------------|------|
| Datos: disponibilidad y calidad | 25 % |
| Uso analítico actual          | 20 % |
| Prácticas del negocio (preguntas del nicho) | 15 % |
| Tecnología e integración      | 15 % |
| Talento y cultura de datos    | 15 % |
| Estrategia e inversión        | 10 % |

El **índice de madurez** (0–100) es el promedio ponderado. El nivel de riesgo es:

- **Riesgo bajo** (índice ≥ 62): ya tiene datos confiables → modelos predictivos e IA.
- **Riesgo moderado** (35–61): datos dispersos o manuales → integración y tableros.
- **Riesgo alto** (< 35): no hay base de datos construida → fundamentos y digitalización.

Reglas de coherencia: si la dimensión *Datos* es menor a 30, el nivel es alto; si es
menor a 55, no puede ser bajo. Las respuestas con 0 o 1 punto generan los **hallazgos**.

Los casos se eligen así: primero los de la industria, luego los del eslabón de la
actividad (producción, comercialización, logística o servicio) y después los
transversales, priorizando los que coinciden con los objetivos que marcó la empresa.

## Esquema de la encuesta

`docs/esquema-encuesta.md` documenta todas las preguntas, opciones, puntajes, pesos, casos y cursos.
Se genera desde el código con `npm run esquema`; vuelva a generarlo después de cambiar el contenido.
La versión en PDF (`docs/esquema-encuesta.pdf`) se genera con `npm run esquema:pdf` (requiere Playwright con Chromium).

## Cómo personalizar

Todo el contenido está en `public/js/motor/` y se puede editar sin tocar el resto:

| Archivo          | Qué contiene                                                          |
|------------------|-----------------------------------------------------------------------|
| `contenido.js`   | Industrias, actividades, preguntas, pesos de las dimensiones          |
| `evaluacion.js`  | Umbrales, reglas de nivel y textos de cada nivel                       |
| `casos.js`       | Biblioteca de casos hipotéticos (problema, solución, técnica, indicador) |
| `cursos.js`      | Catálogo de cursos y hoja de ruta por nivel                            |
| `sintetico.js`   | Generador de datos sintéticos de los tableros                         |

- **Nombre de la organización y contacto:** `public/js/config.js`.
- **Colores:** variables al inicio de `public/css/estilos.css`.

Los textos de casos admiten `{empresa}`, `{productos}`, `{clientes}` y `{punto}`, que se
reemplazan con el nombre de la empresa y el vocabulario de su industria.

## Estructura

```
server.js              Servidor Express y API
lib/almacen.js         Guardado de encuestas en archivo JSON
public/
  index.html
  css/estilos.css
  js/app.js            Enrutador
  js/vistas/           Inicio, encuesta, resultado y panel
  js/motor/            Contenido, clasificación, casos, cursos y datos sintéticos
  js/graficos.js       Gráficos SVG sin dependencias
scripts/demo.js        Datos de ejemplo
test/                  Pruebas
```

## API

| Método | Ruta                               | Descripción                              |
|--------|------------------------------------|------------------------------------------|
| POST   | `/api/encuestas`                   | Guarda una encuesta; el servidor recalcula el resultado |
| GET    | `/api/encuestas/:id`               | Diagnóstico de una encuesta              |
| POST   | `/api/encuestas/:id/interes`       | Registra los cursos que interesan        |
| GET    | `/api/panel/encuestas`             | Todas las encuestas (encabezado `x-panel-clave`) |
| DELETE | `/api/panel/encuestas/:id`         | Elimina una encuesta (encabezado `x-panel-clave`) |

## Despliegue

Funciona en cualquier servicio que ejecute Node.js (Render, Railway, una VM, etc.).
Como las encuestas se guardan en un archivo, el servidor necesita **disco persistente**
(apunte `DATA_FILE` a ese disco) y una `PANEL_CLAVE` propia. Para miles de encuestas o
varios servidores, conviene reemplazar `lib/almacen.js` por una base de datos
(PostgreSQL, SQLite, Firestore) manteniendo los mismos métodos.

## Datos personales

La encuesta pide autorización de tratamiento de datos (Ley 1581 de 2012) antes de
continuar. Los tableros del diagnóstico usan **datos sintéticos** generados a partir del
perfil de la empresa; no son datos reales del cliente.
