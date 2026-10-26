// Contenido de la encuesta: industrias, actividades (eslabones) y preguntas.
// Este módulo no usa el DOM: lo comparten el navegador y el servidor.
//
// Cada pregunta puntuable tiene opciones con `p` de 0 a 3 (0 = sin madurez,
// 3 = madurez alta) y una `dimension`. `hallazgo` se muestra en el diagnóstico
// cuando la respuesta obtiene 0 o 1 punto.

export const DIMENSIONES = {
  nicho: { nombre: 'Prácticas del negocio', peso: 0.15, corto: 'Negocio' },
  datos: { nombre: 'Datos: disponibilidad y calidad', peso: 0.25, corto: 'Datos' },
  tecnologia: { nombre: 'Tecnología e integración', peso: 0.15, corto: 'Tecnología' },
  analitica: { nombre: 'Uso analítico actual', peso: 0.2, corto: 'Analítica' },
  talento: { nombre: 'Talento y cultura de datos', peso: 0.15, corto: 'Talento' },
  estrategia: { nombre: 'Estrategia e inversión', peso: 0.1, corto: 'Estrategia' }
};

// Eslabón de la cadena de valor al que pertenece cada actividad.
export const ESLABONES = {
  produccion: 'Producción / transformación',
  comercial: 'Comercialización y ventas',
  logistica: 'Logística y distribución',
  servicio: 'Servicio y atención al cliente'
};

export const OBJETIVOS = [
  { v: 'ventas', t: 'Vender más', d: 'Aumentar ingresos, ticket o conversión' },
  { v: 'costos', t: 'Reducir costos y desperdicio', d: 'Mermas, inventario, tiempos, errores' },
  { v: 'clientes', t: 'Conocer y retener clientes', d: 'Fidelizar, segmentar, atender mejor' },
  { v: 'automatizar', t: 'Automatizar tareas', d: 'Menos trabajo manual y reportes' },
  { v: 'pronostico', t: 'Anticipar la demanda', d: 'Saber cuánto producir, comprar o atender' },
  { v: 'explorar', t: 'Aún no lo sé', d: 'Quiero entender qué puedo hacer' }
];

// Estacionalidad mensual (ene..dic) usada por los datos sintéticos.
const EST_PLANA = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];

export const INDUSTRIAS = [
  {
    id: 'moda', nombre: 'Moda y textil', icono: '👗',
    desc: 'Confección, marcas, tiendas de ropa y calzado',
    vocab: { productos: 'prendas', clientes: 'compradores', punto: 'tienda' },
    estacionalidad: [0.85, 0.8, 0.9, 0.95, 1.15, 1.05, 0.95, 0.9, 0.9, 0.95, 1.1, 1.5],
    actividades: [
      { id: 'confeccion', nombre: 'Diseño y confección', desc: 'Producimos las prendas (taller o planta propia o maquila)', eslabon: 'produccion' },
      { id: 'comercializacion', nombre: 'Compra y venta de ropa', desc: 'Compramos a proveedores y vendemos; no producimos', eslabon: 'comercial' },
      { id: 'online', nombre: 'Marca o tienda online', desc: 'Vendemos principalmente por redes y e-commerce', eslabon: 'comercial' },
      { id: 'mayorista', nombre: 'Distribución mayorista', desc: 'Llevamos producto a tiendas y almacenes', eslabon: 'logistica' }
    ],
    preguntas: [
      {
        id: 'moda_tallas', titulo: '¿Registran las ventas por referencia, talla y color?',
        nota: 'Pida un ejemplo: «¿sabe cuántas camisas talla M azules vendió el mes pasado?»',
        opciones: [
          { v: 'no', t: 'No, solo el total vendido', p: 0 },
          { v: 'ref', t: 'Por referencia, sin talla ni color', p: 1 },
          { v: 'parcial', t: 'Sí, pero en archivos separados', p: 2 },
          { v: 'si', t: 'Sí, en un sistema con todo el detalle', p: 3 }
        ],
        hallazgo: 'Sin ventas por talla y color, las compras de temporada se hacen a ciegas y el inventario termina en liquidación.'
      },
      {
        id: 'moda_temporada', titulo: '¿Cómo deciden cuánto producir o comprar para cada temporada?',
        opciones: [
          { v: 'intuicion', t: 'Por intuición o lo que dice el proveedor', p: 0 },
          { v: 'anterior', t: 'Repetimos lo de la temporada anterior', p: 1 },
          { v: 'analisis', t: 'Analizamos ventas pasadas en Excel', p: 2 },
          { v: 'modelo', t: 'Con un pronóstico por referencia', p: 3 }
        ],
        hallazgo: 'La compra o producción de temporada no se apoya en datos históricos: alto riesgo de faltantes y sobrestock.'
      }
    ]
  },
  {
    id: 'alimentos', nombre: 'Alimentos y bebidas', icono: '🥐',
    desc: 'Panaderías, restaurantes, cafeterías, procesadores',
    vocab: { productos: 'productos', clientes: 'clientes', punto: 'local' },
    estacionalidad: [0.9, 0.88, 0.95, 0.97, 1.0, 1.05, 1.0, 0.98, 0.95, 1.0, 1.08, 1.3],
    actividades: [
      { id: 'produccion', nombre: 'Producción y transformación', desc: 'Panadería, pastelería, planta de alimentos o bebidas', eslabon: 'produccion' },
      { id: 'restaurante', nombre: 'Restaurante o cafetería', desc: 'Preparamos y servimos a la mesa o para llevar', eslabon: 'servicio' },
      { id: 'tienda', nombre: 'Punto de venta de alimentos', desc: 'Vendemos alimentos que compramos o producimos', eslabon: 'comercial' },
      { id: 'domicilios', nombre: 'Distribución y domicilios', desc: 'Llevamos producto a tiendas, empresas u hogares', eslabon: 'logistica' }
    ],
    preguntas: [
      {
        id: 'alim_merma', titulo: '¿Registran cuánto producto sobra, se daña o se bota cada día?',
        nota: 'La merma es el dato que más rápido muestra el valor de medir. Si no la conocen, pídales un estimado.',
        opciones: [
          { v: 'no', t: 'No lo registramos', p: 0 },
          { v: 'aprox', t: 'Lo calculamos «a ojo»', p: 1 },
          { v: 'planilla', t: 'En una planilla, por producto', p: 2 },
          { v: 'sistema', t: 'En el sistema, por producto y día', p: 3 }
        ],
        hallazgo: 'La merma no se mide: es dinero que se pierde todos los días sin que nadie lo cuantifique.'
      },
      {
        id: 'alim_cantidad', titulo: '¿Cómo deciden cuánto producir o preparar cada día?',
        opciones: [
          { v: 'igual', t: 'Lo mismo todos los días', p: 0 },
          { v: 'experiencia', t: 'Según la experiencia del encargado', p: 1 },
          { v: 'dia', t: 'Ajustamos según el día de la semana con registros', p: 2 },
          { v: 'pronostico', t: 'Con un pronóstico (clima, festivos, quincena)', p: 3 }
        ],
        hallazgo: 'La producción diaria no responde a la demanda real: unos días sobra y otros falta.'
      }
    ]
  },
  {
    id: 'retail', nombre: 'Comercio y retail', icono: '🛒',
    desc: 'Tiendas, supermercados, ferreterías, e-commerce',
    vocab: { productos: 'productos', clientes: 'clientes', punto: 'tienda' },
    estacionalidad: [0.88, 0.85, 0.92, 0.95, 1.02, 1.0, 0.98, 0.97, 0.95, 1.0, 1.1, 1.38],
    actividades: [
      { id: 'tienda', nombre: 'Tienda física', desc: 'Una o varias tiendas de venta al detal', eslabon: 'comercial' },
      { id: 'ecommerce', nombre: 'Comercio electrónico', desc: 'Vendemos principalmente en línea', eslabon: 'comercial' },
      { id: 'bodega', nombre: 'Bodega y distribución mayorista', desc: 'Abastecemos a otros comercios', eslabon: 'logistica' },
      { id: 'posventa', nombre: 'Atención y posventa', desc: 'Garantías, servicio técnico, fidelización', eslabon: 'servicio' }
    ],
    preguntas: [
      {
        id: 'ret_rotacion', titulo: '¿Conocen la rotación de cada producto (cuántos días dura en inventario)?',
        opciones: [
          { v: 'no', t: 'No', p: 0 },
          { v: 'principales', t: 'Solo de los productos principales, a ojo', p: 1 },
          { v: 'reporte', t: 'Sí, con un reporte que armamos', p: 2 },
          { v: 'sistema', t: 'Sí, el sistema lo calcula por producto', p: 3 }
        ],
        hallazgo: 'Sin rotación por producto, el capital queda inmovilizado en inventario que no se vende.'
      },
      {
        id: 'ret_fidelizacion', titulo: '¿Tienen un programa de fidelización o base de datos de clientes?',
        opciones: [
          { v: 'no', t: 'No', p: 0 },
          { v: 'informal', t: 'Algunos contactos en el celular', p: 1 },
          { v: 'base', t: 'Base de clientes con sus compras', p: 2 },
          { v: 'programa', t: 'Programa de puntos con historial y segmentos', p: 3 }
        ],
        hallazgo: 'No se identifican los clientes ni su historial: imposible personalizar ofertas o medir recompra.'
      }
    ]
  },
  {
    id: 'salud', nombre: 'Salud y bienestar', icono: '🩺',
    desc: 'IPS, consultorios, farmacias, laboratorios, estética',
    vocab: { productos: 'servicios', clientes: 'pacientes', punto: 'sede' },
    estacionalidad: [0.92, 1.0, 1.04, 1.02, 1.03, 0.98, 0.95, 1.0, 1.03, 1.03, 1.0, 0.9],
    actividades: [
      { id: 'clinica', nombre: 'IPS, clínica o consultorio', desc: 'Prestamos servicios médicos u odontológicos', eslabon: 'servicio' },
      { id: 'farmacia', nombre: 'Farmacia o droguería', desc: 'Vendemos medicamentos y productos de salud', eslabon: 'comercial' },
      { id: 'laboratorio', nombre: 'Laboratorio', desc: 'Toma y procesamiento de muestras o producción', eslabon: 'produccion' },
      { id: 'bienestar', nombre: 'Estética y bienestar', desc: 'Spa, gimnasio, centro de estética', eslabon: 'servicio' }
    ],
    preguntas: [
      {
        id: 'sal_historia', titulo: '¿Las historias clínicas o registros de atención están digitalizados?',
        nota: 'Recuerde que los datos de salud son sensibles (Ley 1581 de 2012). Indague si hay consentimiento informado.',
        opciones: [
          { v: 'papel', t: 'En papel', p: 0 },
          { v: 'mixto', t: 'Mixto: parte papel, parte digital', p: 1 },
          { v: 'software', t: 'Software de historia clínica', p: 2 },
          { v: 'integrado', t: 'Software integrado con agenda y facturación', p: 3 }
        ],
        hallazgo: 'Los registros de atención no están digitalizados: alto riesgo de pérdida y nula capacidad de análisis.'
      },
      {
        id: 'sal_inasistencia', titulo: '¿Miden la inasistencia a citas y los tiempos de espera?',
        opciones: [
          { v: 'no', t: 'No los medimos', p: 0 },
          { v: 'percepcion', t: 'Tenemos una idea general', p: 1 },
          { v: 'mensual', t: 'Los calculamos mensualmente', p: 2 },
          { v: 'tablero', t: 'Están en un tablero actualizado', p: 3 }
        ],
        hallazgo: 'No se mide la inasistencia: la agenda pierde capacidad sin que se pueda corregir.'
      }
    ]
  },
  {
    id: 'manufactura', nombre: 'Manufactura e industria', icono: '🏭',
    desc: 'Plantas de producción, metalmecánica, plásticos, químicos',
    vocab: { productos: 'productos', clientes: 'clientes', punto: 'planta' },
    estacionalidad: [0.9, 0.95, 1.0, 1.0, 1.02, 1.0, 0.98, 1.02, 1.03, 1.05, 1.05, 1.0],
    actividades: [
      { id: 'planta', nombre: 'Producción en planta', desc: 'Fabricamos productos en línea o por lotes', eslabon: 'produccion' },
      { id: 'abastecimiento', nombre: 'Compras y abastecimiento', desc: 'Materias primas, proveedores e inventarios', eslabon: 'logistica' },
      { id: 'ventas_b2b', nombre: 'Venta a empresas (B2B)', desc: 'Comercializamos a distribuidores o industrias', eslabon: 'comercial' },
      { id: 'mantenimiento', nombre: 'Mantenimiento y posventa', desc: 'Servicio técnico, garantías, repuestos', eslabon: 'servicio' }
    ],
    preguntas: [
      {
        id: 'man_paros', titulo: '¿Registran los paros de máquina y sus causas?',
        opciones: [
          { v: 'no', t: 'No', p: 0 },
          { v: 'cuaderno', t: 'En bitácora o cuaderno', p: 1 },
          { v: 'excel', t: 'En Excel, con causa y duración', p: 2 },
          { v: 'automatico', t: 'Automáticamente desde las máquinas', p: 3 }
        ],
        hallazgo: 'Los paros no se registran con su causa: no se puede atacar lo que más capacidad le quita a la planta.'
      },
      {
        id: 'man_sensores', titulo: '¿Capturan datos de forma automática en planta (sensores, PLC, MES)?',
        opciones: [
          { v: 'no', t: 'No, todo es manual', p: 0 },
          { v: 'algunos', t: 'Algunos equipos, pero no se guardan', p: 1 },
          { v: 'guardan', t: 'Sí, y se guardan en un sistema', p: 2 },
          { v: 'analizan', t: 'Sí, y se analizan para decidir', p: 3 }
        ],
        hallazgo: 'La planta no genera datos automáticamente: el registro manual limita la confiabilidad y la frecuencia.'
      }
    ]
  },
  {
    id: 'logistica', nombre: 'Transporte y logística', icono: '🚚',
    desc: 'Carga, mensajería, última milla, bodegaje',
    vocab: { productos: 'envíos', clientes: 'clientes', punto: 'centro de distribución' },
    estacionalidad: [0.85, 0.9, 0.97, 0.98, 1.0, 1.0, 0.98, 1.0, 1.0, 1.05, 1.12, 1.15],
    actividades: [
      { id: 'carga', nombre: 'Transporte de carga', desc: 'Movemos mercancía entre ciudades o regiones', eslabon: 'logistica' },
      { id: 'ultima_milla', nombre: 'Mensajería y última milla', desc: 'Entregas urbanas a hogares o comercios', eslabon: 'logistica' },
      { id: 'almacenamiento', nombre: 'Almacenamiento y bodegaje', desc: 'Operamos bodegas o centros de distribución', eslabon: 'logistica' },
      { id: 'agencia', nombre: 'Agencia u operador logístico', desc: 'Coordinamos y vendemos servicios logísticos', eslabon: 'comercial' }
    ],
    preguntas: [
      {
        id: 'log_gps', titulo: '¿Los vehículos tienen GPS o telemetría y se guarda esa información?',
        opciones: [
          { v: 'no', t: 'No tienen GPS', p: 0 },
          { v: 'gps', t: 'Tienen GPS pero solo lo miramos en el momento', p: 1 },
          { v: 'historico', t: 'Guardamos el histórico de recorridos', p: 2 },
          { v: 'integrado', t: 'Integrado con pedidos y costos', p: 3 }
        ],
        hallazgo: 'No hay datos de recorridos: no se pueden optimizar rutas ni controlar combustible.'
      },
      {
        id: 'log_ots', titulo: '¿Miden el porcentaje de entregas a tiempo y el costo por entrega?',
        opciones: [
          { v: 'no', t: 'No', p: 0 },
          { v: 'uno', t: 'Solo uno de los dos, aproximado', p: 1 },
          { v: 'ambos', t: 'Ambos, cada mes', p: 2 },
          { v: 'diario', t: 'Ambos, en un tablero diario', p: 3 }
        ],
        hallazgo: 'Sin indicadores de cumplimiento y costo por entrega, no se sabe qué rutas o clientes dan pérdida.'
      }
    ]
  },
  {
    id: 'agro', nombre: 'Agro y agroindustria', icono: '🌱',
    desc: 'Cultivos, pecuario, café, flores, transformación',
    vocab: { productos: 'cosechas', clientes: 'compradores', punto: 'finca' },
    estacionalidad: [0.8, 0.85, 0.95, 1.1, 1.2, 1.1, 0.95, 0.9, 0.95, 1.1, 1.15, 0.95],
    actividades: [
      { id: 'cultivo', nombre: 'Producción primaria', desc: 'Cultivo, cría o producción en finca', eslabon: 'produccion' },
      { id: 'transformacion', nombre: 'Transformación agroindustrial', desc: 'Procesamos lo que se cosecha (café, lácteos, pulpas)', eslabon: 'produccion' },
      { id: 'exportacion', nombre: 'Comercialización y exportación', desc: 'Compramos y vendemos producto agrícola', eslabon: 'comercial' },
      { id: 'acopio', nombre: 'Acopio y distribución', desc: 'Recogemos, almacenamos y transportamos', eslabon: 'logistica' }
    ],
    preguntas: [
      {
        id: 'agro_lotes', titulo: '¿Llevan registro por lote o cultivo (insumos, labores y rendimiento)?',
        opciones: [
          { v: 'no', t: 'No', p: 0 },
          { v: 'libreta', t: 'En libreta, de vez en cuando', p: 1 },
          { v: 'excel', t: 'En Excel, por lote', p: 2 },
          { v: 'app', t: 'En una aplicación de campo', p: 3 }
        ],
        hallazgo: 'No hay registro por lote: no se sabe qué lotes son rentables ni por qué rinden distinto.'
      },
      {
        id: 'agro_clima', titulo: '¿Usan datos de clima, suelo o imágenes satelitales?',
        opciones: [
          { v: 'no', t: 'No', p: 0 },
          { v: 'pronostico', t: 'Solo el pronóstico del tiempo', p: 1 },
          { v: 'estacion', t: 'Estación meteorológica o análisis de suelo', p: 2 },
          { v: 'precision', t: 'Agricultura de precisión (satélite, drones, sensores)', p: 3 }
        ],
        hallazgo: 'Las decisiones de riego, fertilización y cosecha no usan datos de clima ni suelo.'
      }
    ]
  },
  {
    id: 'servicios', nombre: 'Servicios profesionales y financieros', icono: '💼',
    desc: 'Consultoría, contabilidad, seguros, crédito, software',
    vocab: { productos: 'servicios', clientes: 'clientes', punto: 'oficina' },
    estacionalidad: [0.85, 0.95, 1.02, 1.0, 1.02, 1.0, 0.97, 1.02, 1.04, 1.05, 1.05, 1.03],
    actividades: [
      { id: 'consultoria', nombre: 'Consultoría y asesoría', desc: 'Contable, jurídica, empresarial', eslabon: 'servicio' },
      { id: 'financiero', nombre: 'Servicios financieros', desc: 'Crédito, seguros, cooperativas, fondos', eslabon: 'comercial' },
      { id: 'tecnologia', nombre: 'Tecnología y software', desc: 'Desarrollo, soporte, servicios TI', eslabon: 'servicio' },
      { id: 'educacion', nombre: 'Educación y formación', desc: 'Cursos, colegios, academias', eslabon: 'servicio' }
    ],
    preguntas: [
      {
        id: 'serv_crm', titulo: '¿Usan un CRM para el seguimiento de clientes y oportunidades?',
        opciones: [
          { v: 'no', t: 'No, cada quien lleva lo suyo', p: 0 },
          { v: 'excel', t: 'Una hoja de cálculo compartida', p: 1 },
          { v: 'crm', t: 'Sí, un CRM que usa el equipo comercial', p: 2 },
          { v: 'crm_integrado', t: 'CRM integrado con facturación y marketing', p: 3 }
        ],
        hallazgo: 'El seguimiento comercial depende de cada persona: se pierden oportunidades y no hay embudo medible.'
      },
      {
        id: 'serv_rentabilidad', titulo: '¿Conocen la rentabilidad por cliente o por proyecto?',
        opciones: [
          { v: 'no', t: 'No', p: 0 },
          { v: 'estimado', t: 'Una idea general', p: 1 },
          { v: 'cierre', t: 'Al cierre de cada proyecto', p: 2 },
          { v: 'tiempo_real', t: 'En tiempo real, con horas registradas', p: 3 }
        ],
        hallazgo: 'No se conoce la rentabilidad por cliente o proyecto: algunos podrían estar generando pérdidas.'
      }
    ]
  },
  {
    id: 'turismo', nombre: 'Turismo y hotelería', icono: '🏨',
    desc: 'Hoteles, hostales, agencias, eventos',
    vocab: { productos: 'reservas', clientes: 'huéspedes', punto: 'hotel' },
    estacionalidad: [1.25, 0.9, 0.95, 1.05, 0.85, 1.1, 1.2, 0.95, 0.8, 0.9, 0.9, 1.25],
    actividades: [
      { id: 'alojamiento', nombre: 'Hotel o alojamiento', desc: 'Hotel, hostal, glamping, apartamentos', eslabon: 'servicio' },
      { id: 'agencia', nombre: 'Agencia de viajes u operador', desc: 'Vendemos planes y paquetes', eslabon: 'comercial' },
      { id: 'eventos', nombre: 'Eventos y convenciones', desc: 'Organizamos eventos o alquilamos espacios', eslabon: 'servicio' },
      { id: 'transporte', nombre: 'Transporte turístico', desc: 'Traslados, tours, excursiones', eslabon: 'logistica' }
    ],
    preguntas: [
      {
        id: 'tur_ocupacion', titulo: '¿Registran a diario la ocupación y la tarifa por canal de venta?',
        opciones: [
          { v: 'no', t: 'No', p: 0 },
          { v: 'total', t: 'Solo la ocupación total', p: 1 },
          { v: 'canal', t: 'Ocupación y tarifa por canal, en Excel', p: 2 },
          { v: 'pms', t: 'En un PMS o channel manager con reportes', p: 3 }
        ],
        hallazgo: 'No se conoce la ocupación y tarifa por canal: se pagan comisiones sin saber qué canal es rentable.'
      },
      {
        id: 'tur_resenas', titulo: '¿Analizan las reseñas y opiniones en línea de sus huéspedes?',
        opciones: [
          { v: 'no', t: 'No', p: 0 },
          { v: 'leemos', t: 'Las leemos de vez en cuando', p: 1 },
          { v: 'respondemos', t: 'Las respondemos y llevamos un registro', p: 2 },
          { v: 'analizamos', t: 'Medimos temas y tendencias de forma sistemática', p: 3 }
        ],
        hallazgo: 'Las opiniones de los huéspedes no se analizan: se pierden alertas tempranas de problemas de servicio.'
      }
    ]
  },
  {
    id: 'otra', nombre: 'Otra industria', icono: '🧭',
    desc: 'Construcción, inmobiliario, energía, otros',
    vocab: { productos: 'productos o servicios', clientes: 'clientes', punto: 'sede' },
    estacionalidad: EST_PLANA,
    actividades: [
      { id: 'produccion', nombre: 'Producción u operación', desc: 'Fabricamos, construimos o ejecutamos', eslabon: 'produccion' },
      { id: 'comercial', nombre: 'Comercialización', desc: 'Vendemos productos o servicios', eslabon: 'comercial' },
      { id: 'logistica', nombre: 'Logística', desc: 'Movemos, almacenamos o distribuimos', eslabon: 'logistica' },
      { id: 'servicio', nombre: 'Servicio al cliente', desc: 'Atendemos y damos soporte', eslabon: 'servicio' }
    ],
    preguntas: [
      {
        id: 'otra_kpi', titulo: '¿Tienen indicadores clave (KPI) definidos y con meta?',
        opciones: [
          { v: 'no', t: 'No', p: 0 },
          { v: 'algunos', t: 'Algunos, sin meta clara', p: 1 },
          { v: 'definidos', t: 'Definidos y con meta', p: 2 },
          { v: 'seguimiento', t: 'Con meta y seguimiento periódico', p: 3 }
        ],
        hallazgo: 'No hay indicadores clave con meta: no hay forma objetiva de saber si el negocio mejora.'
      },
      {
        id: 'otra_rentables', titulo: '¿Saben cuáles son sus clientes o productos más rentables?',
        opciones: [
          { v: 'no', t: 'No', p: 0 },
          { v: 'idea', t: 'Tenemos una idea', p: 1 },
          { v: 'analisis', t: 'Lo analizamos una vez al año', p: 2 },
          { v: 'continuo', t: 'Lo monitoreamos continuamente', p: 3 }
        ],
        hallazgo: 'No se identifican los clientes y productos más rentables: los recursos se reparten sin criterio.'
      }
    ]
  }
];

// Preguntas según el eslabón de la actividad principal.
export const PREGUNTAS_ESLABON = {
  produccion: [
    {
      id: 'esl_planeacion', titulo: '¿Cómo planifican la producción de sus {productos}?',
      opciones: [
        { v: 'intuicion', t: 'Por experiencia o intuición', p: 0 },
        { v: 'pedidos', t: 'Según los pedidos del momento', p: 1 },
        { v: 'historico', t: 'Con históricos en hoja de cálculo', p: 2 },
        { v: 'sistema', t: 'Con un sistema de planeación y pronósticos', p: 3 }
      ],
      hallazgo: 'La planeación de la producción no se apoya en datos: genera sobrantes, faltantes y horas extra.'
    },
    {
      id: 'esl_desperdicio', titulo: '¿Miden desperdicios, reprocesos o productos defectuosos?',
      opciones: [
        { v: 'no', t: 'No', p: 0 },
        { v: 'ocasional', t: 'Ocasionalmente', p: 1 },
        { v: 'mensual', t: 'Sí, cada mes', p: 2 },
        { v: 'causa', t: 'Sí, por causa y en tiempo real', p: 3 }
      ],
      hallazgo: 'El desperdicio y los reprocesos no se miden: es un costo oculto en cada unidad producida.'
    }
  ],
  comercial: [
    {
      id: 'esl_inventario', titulo: '¿Cómo controlan el inventario de {productos}?',
      opciones: [
        { v: 'no', t: 'No llevamos control', p: 0 },
        { v: 'conteo', t: 'Conteos físicos de vez en cuando', p: 1 },
        { v: 'excel', t: 'Hoja de cálculo actualizada a mano', p: 2 },
        { v: 'sistema', t: 'Sistema que descuenta con cada venta', p: 3 }
      ],
      hallazgo: 'El inventario no se controla en línea: hay quiebres de stock y capital inmovilizado.'
    },
    {
      id: 'esl_clientes', titulo: '¿Qué información tienen de sus {clientes}?',
      opciones: [
        { v: 'nada', t: 'Prácticamente ninguna', p: 0 },
        { v: 'contacto', t: 'Nombre y teléfono de algunos', p: 1 },
        { v: 'historial', t: 'Historial de compras por cliente', p: 2 },
        { v: 'segmentos', t: 'Historial, segmentos y preferencias', p: 3 }
      ],
      hallazgo: 'Hay poca información de los clientes: las ventas dependen del cliente que «llegue solo».'
    }
  ],
  logistica: [
    {
      id: 'esl_rutas', titulo: '¿Cómo planifican las rutas y los despachos?',
      opciones: [
        { v: 'conductor', t: 'Cada conductor decide', p: 0 },
        { v: 'manual', t: 'El coordinador las arma a mano', p: 1 },
        { v: 'mapas', t: 'Con apoyo de mapas y planillas', p: 2 },
        { v: 'software', t: 'Con software de ruteo', p: 3 }
      ],
      hallazgo: 'Las rutas no se optimizan: más kilómetros, combustible y entregas tardías de las necesarias.'
    },
    {
      id: 'esl_trazabilidad', titulo: '¿Pueden saber en qué estado está un pedido en este momento?',
      opciones: [
        { v: 'no', t: 'No, hay que llamar al conductor', p: 0 },
        { v: 'parcial', t: 'Solo al despachar y al entregar', p: 1 },
        { v: 'estados', t: 'Sí, con estados que actualiza el equipo', p: 2 },
        { v: 'tiempo_real', t: 'Sí, en tiempo real y el cliente también lo ve', p: 3 }
      ],
      hallazgo: 'No hay trazabilidad de los pedidos: más reclamos y llamadas, menos confianza del cliente.'
    }
  ],
  servicio: [
    {
      id: 'esl_solicitudes', titulo: '¿Cómo registran las solicitudes, quejas o reservas de sus {clientes}?',
      opciones: [
        { v: 'no', t: 'No se registran; se atienden y ya', p: 0 },
        { v: 'whatsapp', t: 'Quedan en WhatsApp o correo', p: 1 },
        { v: 'planilla', t: 'En una planilla o agenda digital', p: 2 },
        { v: 'sistema', t: 'En un sistema con estados y tiempos', p: 3 }
      ],
      hallazgo: 'Las solicitudes de los clientes no quedan registradas: no se pueden medir tiempos ni problemas recurrentes.'
    },
    {
      id: 'esl_satisfaccion', titulo: '¿Miden la satisfacción de sus {clientes}?',
      opciones: [
        { v: 'no', t: 'No', p: 0 },
        { v: 'informal', t: 'Preguntamos de manera informal', p: 1 },
        { v: 'encuesta', t: 'Encuesta periódica', p: 2 },
        { v: 'nps', t: 'Encuesta automática (NPS) con seguimiento', p: 3 }
      ],
      hallazgo: 'No se mide la satisfacción: los clientes insatisfechos se van sin dejar rastro.'
    }
  ]
};

// Preguntas generales de madurez, iguales para todas las empresas.
export const PREGUNTAS_MADUREZ = [
  {
    id: 'registro', seccion: 'Datos', dimension: 'datos',
    titulo: '¿Cómo registran hoy la información del negocio (ventas, inventario, clientes)?',
    nota: 'Es la pregunta que más pesa. Si la respuesta es mixta, elija la que describe la mayor parte de la operación.',
    opciones: [
      { v: 'papel', t: 'En papel, cuadernos o de memoria', p: 0 },
      { v: 'excel', t: 'En hojas de Excel sueltas', p: 1 },
      { v: 'software', t: 'En software (POS, ERP, CRM) que no se conectan', p: 2 },
      { v: 'integrado', t: 'En sistemas integrados o una base de datos central', p: 3 }
    ],
    hallazgo: 'La información del negocio no está en una base de datos estructurada: es el primer obstáculo para cualquier análisis.'
  },
  {
    id: 'historico', seccion: 'Datos', dimension: 'datos',
    titulo: '¿Cuánto tiempo de historia de datos confiable tienen?',
    opciones: [
      { v: 'nada', t: 'Nada o menos de 6 meses', p: 0 },
      { v: '6_12', t: 'Entre 6 y 12 meses', p: 1 },
      { v: '1_3', t: 'Entre 1 y 3 años', p: 2 },
      { v: '3_mas', t: 'Más de 3 años', p: 3 }
    ],
    hallazgo: 'El histórico de datos es corto: los modelos predictivos necesitan al menos uno o dos ciclos anuales.'
  },
  {
    id: 'calidad', seccion: 'Datos', dimension: 'datos',
    titulo: '¿Qué tan confiables son sus datos?',
    nota: 'Pregunte: «si dos personas sacan el total de ventas del mes, ¿les da lo mismo?»',
    opciones: [
      { v: 'baja', t: 'Hay muchos errores, duplicados o vacíos', p: 0 },
      { v: 'limpiar', t: 'Sirven, pero hay que limpiarlos mucho', p: 1 },
      { v: 'buena', t: 'Mayormente confiables', p: 2 },
      { v: 'gobernada', t: 'Validados, con responsables y reglas', p: 3 }
    ],
    hallazgo: 'La calidad de los datos es baja: cualquier reporte o modelo heredará esos errores.'
  },
  {
    id: 'almacenamiento', seccion: 'Tecnología', dimension: 'tecnologia',
    titulo: '¿Dónde se guardan los datos?',
    opciones: [
      { v: 'pc', t: 'En un computador o una USB', p: 0 },
      { v: 'drive', t: 'En carpetas compartidas (Drive, OneDrive)', p: 1 },
      { v: 'nube', t: 'En el software o servidor de la empresa, con respaldo', p: 2 },
      { v: 'bd', t: 'En una base de datos o bodega de datos con accesos controlados', p: 3 }
    ],
    hallazgo: 'Los datos están en equipos personales o carpetas sin control: riesgo de pérdida y de fuga de información.'
  },
  {
    id: 'integracion', seccion: 'Tecnología', dimension: 'tecnologia',
    titulo: '¿Sus sistemas o archivos se comunican entre sí?',
    opciones: [
      { v: 'no', t: 'No; todo se transcribe a mano', p: 0 },
      { v: 'exportar', t: 'Exportamos y copiamos entre archivos', p: 1 },
      { v: 'algunas', t: 'Algunas integraciones automáticas', p: 2 },
      { v: 'api', t: 'Todo integrado (API o ERP único)', p: 3 }
    ],
    hallazgo: 'La información se transcribe entre sistemas: horas de trabajo manual y errores de digitación.'
  },
  {
    id: 'decisiones', seccion: 'Analítica', dimension: 'analitica',
    titulo: '¿Cómo toman las decisiones importantes del negocio?',
    opciones: [
      { v: 'intuicion', t: 'Por intuición y experiencia', p: 0 },
      { v: 'ocasional', t: 'Con reportes ocasionales', p: 1 },
      { v: 'indicadores', t: 'Con indicadores revisados periódicamente', p: 2 },
      { v: 'modelos', t: 'Con tableros y modelos predictivos', p: 3 }
    ],
    hallazgo: 'Las decisiones se toman sin datos: el negocio reacciona tarde a los cambios.'
  },
  {
    id: 'reportes', seccion: 'Analítica', dimension: 'analitica',
    titulo: '¿Cuánto tardan en tener el informe de resultados del mes?',
    opciones: [
      { v: 'no', t: 'No hacemos ese informe', p: 0 },
      { v: 'semana', t: 'Más de una semana', p: 1 },
      { v: 'dias', t: 'Entre 1 y 3 días', p: 2 },
      { v: 'tiempo_real', t: 'Está disponible en tiempo real', p: 3 }
    ],
    hallazgo: 'Los resultados del mes llegan tarde o no llegan: los problemas se detectan cuando ya costaron.'
  },
  {
    id: 'ia', seccion: 'Analítica', dimension: 'analitica',
    titulo: '¿Han usado inteligencia artificial o analítica avanzada?',
    opciones: [
      { v: 'nunca', t: 'Nunca', p: 0 },
      { v: 'chatgpt', t: 'Herramientas como ChatGPT, de forma individual', p: 1 },
      { v: 'piloto', t: 'Un piloto o proyecto puntual', p: 2 },
      { v: 'produccion', t: 'Modelos funcionando en la operación', p: 3 }
    ],
    hallazgo: 'No hay experiencia con IA: conviene empezar con casos de uso acotados y de retorno rápido.'
  },
  {
    id: 'equipo', seccion: 'Equipo', dimension: 'talento',
    titulo: '¿Quién se encarga de los datos en la empresa?',
    opciones: [
      { v: 'nadie', t: 'Nadie en particular', p: 0 },
      { v: 'dueno', t: 'El dueño o alguien en sus ratos libres', p: 1 },
      { v: 'analista', t: 'Una persona de sistemas o un analista', p: 2 },
      { v: 'equipo', t: 'Un equipo de datos o BI', p: 3 }
    ],
    hallazgo: 'No hay un responsable de los datos: nadie responde por su calidad ni por su uso.'
  },
  {
    id: 'habilidades', seccion: 'Equipo', dimension: 'talento',
    titulo: '¿Cuál es el nivel del equipo en herramientas de datos?',
    opciones: [
      { v: 'basico', t: 'Básico: Excel para listas', p: 0 },
      { v: 'intermedio', t: 'Intermedio: fórmulas y tablas dinámicas', p: 1 },
      { v: 'avanzado', t: 'Avanzado: Power BI o similares', p: 2 },
      { v: 'experto', t: 'Programación: SQL, Python o R', p: 3 }
    ],
    hallazgo: 'Las habilidades analíticas del equipo son básicas: la formación es parte de la solución.'
  },
  {
    id: 'objetivos', seccion: 'Estrategia', tipo: 'multiple', max: 2,
    titulo: '¿Qué quieren lograr con los datos? (máximo 2)',
    nota: 'No puntúa; sirve para priorizar los casos que se le presentan al cliente.',
    opciones: OBJETIVOS
  },
  {
    id: 'presupuesto', seccion: 'Estrategia', dimension: 'estrategia',
    titulo: '¿Tienen presupuesto o disposición para invertir en datos este año?',
    opciones: [
      { v: 'ninguno', t: 'Por ahora no', p: 0 },
      { v: 'bajo', t: 'Algo, si se ve el retorno', p: 1 },
      { v: 'moderado', t: 'Sí, un presupuesto moderado', p: 2 },
      { v: 'estrategico', t: 'Sí, es una prioridad estratégica', p: 3 }
    ],
    hallazgo: 'No hay presupuesto definido: conviene arrancar con proyectos pequeños que se paguen solos.'
  }
];

// Preguntas de perfil (no puntúan).
export const PREGUNTAS_PERFIL = [
  {
    id: 'contacto', seccion: 'Empresa', tipo: 'contacto',
    titulo: 'Cuéntenos de su empresa',
    ayuda: 'Con esta información personalizamos el diagnóstico.',
    nota: 'Confirme la autorización de tratamiento de datos antes de continuar.'
  },
  {
    id: 'rol', seccion: 'Empresa', tipo: 'unica',
    titulo: '¿Cuál es su rol en la empresa?',
    opciones: [
      { v: 'gerente', t: 'Dueño o gerente general' },
      { v: 'director', t: 'Director o jefe de área' },
      { v: 'analista', t: 'Analista, coordinador o profesional' },
      { v: 'ti', t: 'Sistemas o tecnología' },
      { v: 'otro', t: 'Otro' }
    ]
  },
  {
    id: 'tamano', seccion: 'Empresa', tipo: 'unica',
    titulo: '¿Cuántas personas trabajan en la empresa?',
    opciones: [
      { v: 'micro', t: '1 a 10', d: 'Microempresa' },
      { v: 'pequena', t: '11 a 50', d: 'Pequeña' },
      { v: 'mediana', t: '51 a 200', d: 'Mediana' },
      { v: 'grande', t: 'Más de 200', d: 'Grande' }
    ]
  },
  {
    id: 'industria', seccion: 'Sector', tipo: 'industria',
    titulo: '¿En qué industria está su empresa?',
    nota: 'La industria define las preguntas específicas y los casos que verá el cliente.'
  },
  {
    id: 'actividad', seccion: 'Sector', tipo: 'actividad',
    titulo: '¿Cuál es su actividad principal dentro de la industria?',
    ayuda: 'Elija la que genera la mayor parte de sus ingresos.',
    nota: 'Ejemplo: en moda, quien compra y vende ropa (no la produce) es «Compra y venta de ropa».'
  }
];

export function industriaPorId(id) {
  return INDUSTRIAS.find((i) => i.id === id) || null;
}

export function actividadPorId(industria, id) {
  return industria?.actividades.find((a) => a.id === id) || null;
}

// Reemplaza {productos}, {clientes}, {punto} y {empresa} en un texto.
export function plantilla(texto, ctx) {
  return String(texto).replace(/\{(\w+)\}/g, (m, k) => (ctx && ctx[k] != null ? ctx[k] : m));
}

// Construye la secuencia de preguntas según lo respondido hasta el momento.
export function construirFlujo(respuestas = {}) {
  const flujo = [...PREGUNTAS_PERFIL];
  const industria = industriaPorId(respuestas.industria);
  const actividad = actividadPorId(industria, respuestas.actividad);
  if (industria && actividad) {
    const ctx = industria.vocab;
    for (const p of industria.preguntas) {
      flujo.push({ ...p, seccion: 'Su negocio', dimension: 'nicho', tipo: 'unica' });
    }
    for (const p of PREGUNTAS_ESLABON[actividad.eslabon]) {
      flujo.push({ ...p, titulo: plantilla(p.titulo, ctx), seccion: 'Su negocio', dimension: 'nicho', tipo: 'unica' });
    }
  }
  for (const p of PREGUNTAS_MADUREZ) flujo.push({ tipo: 'unica', ...p });
  return flujo;
}

export const SECCIONES = ['Empresa', 'Sector', 'Su negocio', 'Datos', 'Tecnología', 'Analítica', 'Equipo', 'Estrategia'];
