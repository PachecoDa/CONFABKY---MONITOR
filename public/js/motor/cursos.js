// Catálogo de cursos y ruta de intervención por nivel.
// Edite este archivo para reflejar la oferta real de cursos: nombre, duración,
// modalidad y niveles para los que se recomienda.

export const CURSOS = [
  {
    id: 'fundamentos', nombre: 'Fundamentos de datos para empresas',
    duracion: '16 h', modalidad: 'Presencial o virtual', niveles: ['alto'],
    descripcion: 'Qué es un dato, cómo organizarlo y por dónde empezar a digitalizar el negocio.',
    temas: ['Tipos de datos y fuentes', 'Diseño de una base de datos sencilla', 'Formularios y captura digital', 'Ley 1581 de protección de datos']
  },
  {
    id: 'excel', nombre: 'Excel profesional y bases de datos',
    duracion: '24 h', modalidad: 'Virtual', niveles: ['alto', 'moderado'],
    descripcion: 'De listas sueltas a tablas estructuradas, validaciones y reportes con tablas dinámicas.',
    temas: ['Tablas y validación de datos', 'Funciones de búsqueda', 'Tablas dinámicas', 'Power Query básico']
  },
  {
    id: 'kpi', nombre: 'Indicadores para la toma de decisiones',
    duracion: '12 h', modalidad: 'Presencial', niveles: ['alto', 'moderado'],
    descripcion: 'Para gerentes y líderes: cómo definir, medir y usar indicadores clave.',
    temas: ['Mapa de indicadores', 'Metas y semáforos', 'Rutinas de seguimiento', 'Cultura de datos']
  },
  {
    id: 'powerbi', nombre: 'Visualización y tableros con Power BI',
    duracion: '32 h', modalidad: 'Virtual', niveles: ['moderado'],
    descripcion: 'Conectar fuentes, modelar datos y publicar tableros que se actualizan solos.',
    temas: ['Conexión y transformación', 'Modelo de datos', 'DAX esencial', 'Diseño de tableros', 'Publicación y actualización']
  },
  {
    id: 'gobierno', nombre: 'Gobierno y calidad de datos',
    duracion: '16 h', modalidad: 'Virtual', niveles: ['moderado'],
    descripcion: 'Roles, reglas y procesos para que los datos sean confiables y estén protegidos.',
    temas: ['Roles y responsables', 'Reglas de calidad', 'Catálogo y glosario', 'Seguridad y privacidad']
  },
  {
    id: 'sql', nombre: 'SQL para análisis de datos',
    duracion: '24 h', modalidad: 'Virtual', niveles: ['moderado', 'bajo'],
    descripcion: 'Consultar y combinar información directamente desde las bases de datos.',
    temas: ['Consultas y filtros', 'Uniones', 'Agregaciones', 'Vistas para reportes']
  },
  {
    id: 'python', nombre: 'Python para ciencia de datos',
    duracion: '40 h', modalidad: 'Virtual', niveles: ['moderado', 'bajo'],
    descripcion: 'Análisis, limpieza y visualización de datos con Python y pandas.',
    temas: ['Python esencial', 'pandas', 'Visualización', 'Análisis exploratorio']
  },
  {
    id: 'ml', nombre: 'Machine learning aplicado a negocios',
    duracion: '40 h', modalidad: 'Virtual con proyecto', niveles: ['bajo'],
    descripcion: 'Modelos de pronóstico, clasificación y segmentación sobre los datos de su empresa.',
    temas: ['Pronóstico de series de tiempo', 'Clasificación y churn', 'Segmentación', 'Puesta en producción']
  },
  {
    id: 'iagen', nombre: 'IA generativa para la productividad empresarial',
    duracion: '12 h', modalidad: 'Presencial o virtual', niveles: ['alto', 'moderado', 'bajo'],
    descripcion: 'Uso responsable de asistentes de IA para escribir, analizar y automatizar tareas.',
    temas: ['Instrucciones efectivas', 'Casos de uso por área', 'Automatización de tareas', 'Riesgos y uso responsable']
  }
];

export const RUTAS = {
  alto: [
    { fase: 'Mes 1 a 3', titulo: 'Construir la base', texto: 'Digitalizar la captura, crear catálogos maestros, respaldar la información en la nube y definir responsables.' },
    { fase: 'Mes 4 a 6', titulo: 'Medir lo esencial', texto: 'Definir de 5 a 7 indicadores y un tablero semanal alimentado por la nueva base de datos.' },
    { fase: 'Mes 7 a 12', titulo: 'Primer análisis', texto: 'Con 6 meses de datos limpios: análisis de márgenes, ABC y primeros pronósticos sencillos.' }
  ],
  moderado: [
    { fase: 'Mes 1 a 2', titulo: 'Integrar fuentes', texto: 'Conectar los sistemas y archivos en una fuente única, con reglas de calidad y definiciones comunes.' },
    { fase: 'Mes 3 a 5', titulo: 'Tableros que se usan', texto: 'Automatizar reportes y publicar tableros por área con alertas sobre los indicadores clave.' },
    { fase: 'Mes 6 a 12', titulo: 'Primer modelo', texto: 'Pilotear un modelo predictivo sobre el caso de mayor retorno (demanda, abandono o inventario).' }
  ],
  bajo: [
    { fase: 'Mes 1 a 2', titulo: 'Priorizar casos de IA', texto: 'Seleccionar 2 o 3 casos por impacto y factibilidad, y preparar los conjuntos de datos.' },
    { fase: 'Mes 3 a 6', titulo: 'Modelos en producción', texto: 'Desarrollar, validar y desplegar los modelos integrados a la operación diaria.' },
    { fase: 'Mes 7 a 12', titulo: 'Escalar y gobernar', texto: 'Monitorear el desempeño de los modelos, extender a otras áreas y formar al equipo interno.' }
  ]
};

export function cursosRecomendados(nivel, rol) {
  const lista = CURSOS.filter((c) => c.niveles.includes(nivel));
  // Para directivos se sube el curso de indicadores al inicio.
  if (rol === 'gerente' || rol === 'director') {
    lista.sort((a, b) => (b.id === 'kpi') - (a.id === 'kpi'));
  }
  return lista;
}
