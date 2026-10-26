// Biblioteca de casos hipotéticos por nivel de riesgo.
//
// Campos:
//   niveles     niveles de riesgo en los que aplica el caso
//   eslabon     produccion | comercial | logistica | servicio (null = general)
//   industria   id de industria (null = cualquiera)
//   objetivos   objetivos del cliente con los que se relaciona
//   kpi         indicador que se simula con datos sintéticos:
//               base = valor actual típico; fav / desf = cambio relativo a 12
//               meses con y sin intervención (fav < 0 → menor es mejor).
//
// Los textos admiten {empresa}, {productos}, {clientes} y {punto}.

export const CASOS = [
  // ───────────── Riesgo alto: fundamentos ─────────────
  {
    id: 'a-g1', niveles: ['alto'], eslabon: null, industria: null, objetivos: ['automatizar', 'explorar'],
    titulo: 'Información dispersa en papel, chats y memoria',
    problema: 'En {empresa} las ventas, compras y gastos viven en cuadernos, mensajes y en la memoria del equipo. Cerrar el mes toma días y nadie sabe con certeza cuánto se ganó.',
    solucion: 'Diseñar una base de datos mínima (ventas, {productos}, {clientes}, gastos) alimentada con formularios digitales y un tablero básico de cierre mensual.',
    tecnica: 'Modelo de datos relacional · formularios digitales · hoja maestra',
    kpi: { nombre: 'Días para cerrar el mes', unidad: 'días', base: 10, fav: -0.7, desf: 0.2 }
  },
  {
    id: 'a-g2', niveles: ['alto'], eslabon: null, industria: null, objetivos: ['costos'],
    titulo: 'Duplicados y errores de digitación',
    problema: 'El mismo cliente aparece tres veces con nombres distintos y un mismo producto tiene precios diferentes según quién lo registre. Los totales nunca cuadran.',
    solucion: 'Crear catálogos maestros de {productos} y {clientes}, listas desplegables y reglas de validación en la captura para eliminar el error en el origen.',
    tecnica: 'Limpieza de datos · llaves únicas · validación en captura',
    kpi: { nombre: 'Registros con errores', unidad: '%', base: 22, fav: -0.75, desf: 0.25 }
  },
  {
    id: 'a-g3', niveles: ['alto'], eslabon: null, industria: null, objetivos: ['automatizar'],
    titulo: 'El negocio depende de una sola persona',
    problema: 'Solo el dueño o un empleado clave sabe cómo funcionan los precios, los proveedores y los clientes. Si esa persona falta, la operación se detiene.',
    solucion: 'Documentar los procesos clave, definir responsables de cada dato y construir un diccionario de datos que cualquiera del equipo pueda consultar.',
    tecnica: 'Gobierno de datos básico · diccionario de datos · roles',
    kpi: { nombre: 'Horas semanales en tareas manuales', unidad: 'h', base: 18, fav: -0.5, desf: 0.2 }
  },
  {
    id: 'a-g4', niveles: ['alto'], eslabon: null, industria: null, objetivos: ['costos'],
    titulo: 'Riesgo de perder toda la información',
    problema: 'Los archivos están en un solo computador o una USB, sin copias de seguridad. Un daño, un robo o un virus borra años de información del negocio.',
    solucion: 'Migrar los archivos a la nube con respaldo automático, control de accesos por rol y una política de tratamiento de datos personales (Ley 1581 de 2012).',
    tecnica: 'Almacenamiento en la nube · copias de seguridad · permisos',
    kpi: { nombre: 'Probabilidad anual de pérdida de datos', unidad: '%', base: 35, fav: -0.85, desf: 0.15 }
  },
  {
    id: 'a-g5', niveles: ['alto'], eslabon: null, industria: null, objetivos: ['ventas', 'costos'],
    titulo: 'Precios fijados sin conocer el costo real',
    problema: '{empresa} no conoce el margen de cada uno de sus {productos}: algunos se venden por debajo del costo y se compensan con otros sin que nadie lo note.',
    solucion: 'Registrar insumos y gastos por producto, construir un modelo de costeo y un tablero de margen que identifique ganadores y perdedores.',
    tecnica: 'Costeo por producto · análisis de Pareto · tablero de márgenes',
    kpi: { nombre: 'Margen bruto', unidad: '%', base: 22, fav: 0.35, desf: -0.15 }
  },
  {
    id: 'a-g6', niveles: ['alto'], eslabon: null, industria: null, objetivos: ['explorar', 'ventas'],
    titulo: 'Decisiones sin indicadores',
    problema: 'No hay indicadores definidos: se decide por intuición qué comprar, a quién contratar o dónde invertir, y los errores se descubren cuando ya costaron.',
    solucion: 'Definir de 5 a 7 indicadores clave con meta, alimentarlos desde la nueva base de datos y revisarlos cada semana en un tablero sencillo.',
    tecnica: 'Mapa de KPI · tablero en Looker Studio o Excel',
    kpi: { nombre: 'Decisiones soportadas en datos', unidad: '%', base: 10, fav: 4, desf: 0 }
  },
  {
    id: 'a-p1', niveles: ['alto'], eslabon: 'produccion', industria: null, objetivos: ['costos', 'pronostico'],
    titulo: 'Producción «al ojo»: sobrantes y faltantes',
    problema: 'Se produce lo mismo todos los días sin registrar cuánto se vende ni cuánto sobra. Unos días se bota producto y otros se queda sin inventario.',
    solucion: 'Registrar a diario producción vs. venta por producto. Con 8 a 12 semanas de datos se ajustan cantidades por día de la semana y se prepara un pronóstico.',
    tecnica: 'Registro estructurado · promedios móviles por día',
    kpi: { nombre: 'Merma sobre producción', unidad: '%', base: 15, fav: -0.45, desf: 0.2 }
  },
  {
    id: 'a-p2', niveles: ['alto'], eslabon: 'produccion', industria: null, objetivos: ['costos'],
    titulo: 'Insumos que se agotan o se vencen',
    problema: 'Las compras de materia prima se hacen cuando «se ve» que falta. Hay paros por faltantes y, al mismo tiempo, insumos vencidos en bodega.',
    solucion: 'Implementar un kárdex digital de insumos con punto de reorden y fechas de vencimiento (primero en vencer, primero en salir).',
    tecnica: 'Inventario mínimo-máximo · PEPS / FEFO',
    kpi: { nombre: 'Pérdida por insumos vencidos', unidad: '% compras', base: 8, fav: -0.6, desf: 0.25 }
  },
  {
    id: 'a-c1', niveles: ['alto'], eslabon: 'comercial', industria: null, objetivos: ['ventas'],
    titulo: 'No se sabe qué se vende más',
    problema: 'Las ventas se registran como un total diario, sin detalle por producto. Los {productos} estrella se agotan y los de baja rotación ocupan espacio.',
    solucion: 'Registrar cada venta por ítem (POS sencillo o planilla estructurada) y hacer un análisis ABC mensual para priorizar compras y exhibición.',
    tecnica: 'Punto de venta · análisis ABC',
    kpi: { nombre: 'Agotados de productos estrella', unidad: 'por mes', base: 14, fav: -0.6, desf: 0.2 }
  },
  {
    id: 'a-c2', niveles: ['alto'], eslabon: 'comercial', industria: null, objetivos: ['clientes', 'ventas'],
    titulo: 'Clientes anónimos',
    problema: '{empresa} no tiene una base de {clientes}: no puede volver a contactarlos, saber quién dejó de comprar ni avisar de novedades.',
    solucion: 'Capturar datos de contacto con autorización (Habeas Data), registrar compras por cliente y lanzar mensajes de recompra sencillos.',
    tecnica: 'CRM básico · política de datos personales · mensajería',
    kpi: { nombre: 'Clientes que vuelven a comprar', unidad: '%', base: 18, fav: 0.6, desf: -0.15 }
  },
  {
    id: 'a-l1', niveles: ['alto'], eslabon: 'logistica', industria: null, objetivos: ['costos'],
    titulo: 'Rutas armadas a mano',
    problema: 'Los despachos se organizan según la experiencia de cada conductor. No se sabe cuánto cuesta cada entrega ni qué zonas son rentables.',
    solucion: 'Registrar cada entrega (dirección, hora, kilómetros, costo) en una planilla digital y georreferenciar a los {clientes} como base para optimizar rutas.',
    tecnica: 'Planilla digital · georreferenciación',
    kpi: { nombre: 'Costo por entrega', unidad: 'mil COP', base: 12, fav: -0.25, desf: 0.15 }
  },
  {
    id: 'a-l2', niveles: ['alto'], eslabon: 'logistica', industria: null, objetivos: ['clientes'],
    titulo: 'Pedidos sin trazabilidad',
    problema: 'Cuando un cliente pregunta por su pedido hay que llamar al conductor. Los pedidos perdidos o retrasados generan reclamos y devoluciones.',
    solucion: 'Asignar un código único a cada pedido con estados (recibido, despachado, entregado) y avisos automáticos al cliente.',
    tecnica: 'Trazabilidad por estados · notificaciones automáticas',
    kpi: { nombre: 'Reclamos por pedidos', unidad: 'por mes', base: 25, fav: -0.6, desf: 0.2 }
  },
  {
    id: 'a-s1', niveles: ['alto'], eslabon: 'servicio', industria: null, objetivos: ['clientes'],
    titulo: 'Quejas que se pierden en WhatsApp',
    problema: 'Las solicitudes llegan por WhatsApp, llamadas y correo, y nadie lleva el registro. Algunas quedan sin respuesta y el cliente no vuelve.',
    solucion: 'Centralizar las solicitudes en un formulario o mesa de ayuda con categorías y tiempos, y revisar cada semana las causas más frecuentes.',
    tecnica: 'Mesa de ayuda · categorización de solicitudes',
    kpi: { nombre: 'Tiempo de respuesta', unidad: 'h', base: 30, fav: -0.6, desf: 0.2 }
  },
  {
    id: 'a-s2', niveles: ['alto'], eslabon: 'servicio', industria: null, objetivos: ['clientes'],
    titulo: 'La satisfacción no se mide',
    problema: 'No se pregunta a los {clientes} cómo les fue. Los insatisfechos se van en silencio y los problemas se repiten.',
    solucion: 'Enviar una encuesta corta y automática después de cada servicio (NPS) y revisar el resultado en un tablero mensual.',
    tecnica: 'Net Promoter Score · encuestas automáticas',
    kpi: { nombre: 'NPS', unidad: 'pts', base: 12, fav: 1.5, desf: -0.5 }
  },

  // ───────────── Riesgo moderado: integración y tableros ─────────────
  {
    id: 'm-g1', niveles: ['moderado'], eslabon: null, industria: null, objetivos: ['automatizar'],
    titulo: 'Reportes que tardan días en Excel',
    problema: 'Cada mes alguien consolida a mano archivos de varias áreas. El informe llega tarde, con errores, y consume decenas de horas.',
    solucion: 'Automatizar la extracción y transformación de datos y publicar un tablero en Power BI con actualización programada.',
    tecnica: 'ETL con Power Query · Power BI · actualización programada',
    kpi: { nombre: 'Horas al mes armando reportes', unidad: 'h', base: 40, fav: -0.75, desf: 0.15 }
  },
  {
    id: 'm-g2', niveles: ['moderado'], eslabon: null, industria: null, objetivos: ['automatizar'],
    titulo: 'Cada área tiene su propia verdad',
    problema: 'Ventas, contabilidad y operaciones reportan cifras distintas para el mismo mes. Las reuniones se van en discutir cuál número es el correcto.',
    solucion: 'Construir una fuente única de datos con definiciones comunes de cada indicador y un modelo semántico compartido.',
    tecnica: 'Bodega de datos ligera · capa semántica · glosario de KPI',
    kpi: { nombre: 'Diferencia entre reportes de áreas', unidad: '%', base: 9, fav: -0.8, desf: 0.3 }
  },
  {
    id: 'm-g3', niveles: ['moderado'], eslabon: null, industria: null, objetivos: ['ventas'],
    titulo: 'Las caídas en ventas se detectan tarde',
    problema: 'Una caída de ventas en un producto, {punto} o vendedor se nota semanas después, cuando el informe mensual ya no permite reaccionar.',
    solucion: 'Tablero diario de ventas con alertas automáticas cuando un indicador sale de su rango normal.',
    tecnica: 'Tableros · alertas por umbral · control estadístico',
    kpi: { nombre: 'Días para detectar una caída', unidad: 'días', base: 25, fav: -0.8, desf: 0.1 }
  },
  {
    id: 'm-g4', niveles: ['moderado'], eslabon: null, industria: null, objetivos: ['clientes', 'ventas'],
    titulo: 'Todos los clientes reciben el mismo trato',
    problema: '{empresa} tiene historial de compras, pero envía las mismas ofertas a todos sus {clientes}. Los mejores no se sienten reconocidos y los inactivos no se recuperan.',
    solucion: 'Segmentar a los clientes según recencia, frecuencia y valor (RFM) y diseñar acciones diferentes para cada segmento.',
    tecnica: 'Análisis RFM · clustering k-means',
    kpi: { nombre: 'Tasa de recompra', unidad: '%', base: 24, fav: 0.35, desf: -0.12 }
  },
  {
    id: 'm-g5', niveles: ['moderado'], eslabon: null, industria: null, objetivos: ['automatizar'],
    titulo: 'Calidad de datos irregular',
    problema: 'Campos vacíos, fechas en formatos distintos y códigos que cambian. Cada análisis empieza con días de limpieza manual.',
    solucion: 'Definir reglas de calidad, perfilar los datos de forma automática y asignar responsables que corrijan en el origen.',
    tecnica: 'Perfilamiento de datos · reglas de calidad · monitoreo',
    kpi: { nombre: 'Completitud de datos clave', unidad: '%', base: 68, fav: 0.35, desf: -0.08 }
  },
  {
    id: 'm-g6', niveles: ['moderado'], eslabon: null, industria: null, objetivos: ['costos'],
    titulo: 'Presupuesto sin seguimiento',
    problema: 'El presupuesto se hace a principio de año y se revisa al final. Los sobrecostos se descubren cuando ya no hay margen para corregir.',
    solucion: 'Tablero de presupuesto vs. ejecución por centro de costo con detalle hasta la transacción y alertas de desviación.',
    tecnica: 'Modelo financiero · Power BI · análisis de variaciones',
    kpi: { nombre: 'Desviación del presupuesto', unidad: '%', base: 18, fav: -0.55, desf: 0.2 }
  },
  {
    id: 'm-p1', niveles: ['moderado'], eslabon: 'produccion', industria: null, objetivos: ['costos'],
    titulo: 'Paros y cuellos de botella invisibles',
    problema: 'Se sabe que la producción «no rinde», pero no cuánto se pierde por paros, velocidad reducida o calidad.',
    solucion: 'Tablero de eficiencia general de los equipos (OEE) con causas de paro y un Pareto semanal para atacar las principales.',
    tecnica: 'OEE · Pareto de paros · tablero de producción',
    kpi: { nombre: 'Eficiencia (OEE)', unidad: '%', base: 58, fav: 0.22, desf: -0.06 }
  },
  {
    id: 'm-p2', niveles: ['moderado'], eslabon: 'produccion', industria: null, objetivos: ['pronostico'],
    titulo: 'Plan de producción desconectado de ventas',
    problema: 'Producción planea con lo que vendió el mes pasado y ventas promete lo que no hay. El resultado: urgencias, horas extra e inventario de lo que no se pide.',
    solucion: 'Integrar ventas y producción en un proceso mensual de planeación (S&OP) con un pronóstico estadístico sencillo.',
    tecnica: 'S&OP · suavizamiento exponencial',
    kpi: { nombre: 'Exactitud del plan', unidad: '%', base: 62, fav: 0.3, desf: -0.1 }
  },
  {
    id: 'm-c1', niveles: ['moderado'], eslabon: 'comercial', industria: null, objetivos: ['costos'],
    titulo: 'Capital inmovilizado en inventario',
    problema: 'Una parte importante del dinero de {empresa} está quieta en {productos} de baja rotación, mientras faltan los que más se venden.',
    solucion: 'Tablero de rotación y días de inventario por producto, con clasificación ABC/XYZ para definir políticas de compra.',
    tecnica: 'Análisis de rotación · ABC/XYZ',
    kpi: { nombre: 'Días de inventario', unidad: 'días', base: 75, fav: -0.35, desf: 0.15 }
  },
  {
    id: 'm-c2', niveles: ['moderado'], eslabon: 'comercial', industria: null, objetivos: ['ventas'],
    titulo: 'Promociones sin medir el resultado',
    problema: 'Se hacen descuentos y campañas, pero nadie sabe si vendieron más o solo regalaron margen.',
    solucion: 'Medir las ventas incrementales de cada campaña frente a una línea base o un grupo de control, y priorizar las que funcionan.',
    tecnica: 'Análisis antes/después · grupos de control',
    kpi: { nombre: 'Retorno de las promociones', unidad: '%', base: 40, fav: 0.8, desf: -0.3 }
  },
  {
    id: 'm-l1', niveles: ['moderado'], eslabon: 'logistica', industria: null, objetivos: ['clientes', 'costos'],
    titulo: 'Flota sin indicadores',
    problema: 'Hay GPS y planillas, pero la información no se cruza: no se sabe qué rutas cumplen, cuáles cuestan más ni por qué se retrasan.',
    solucion: 'Integrar GPS, pedidos y costos en un tablero de cumplimiento, kilómetros y costo por entrega.',
    tecnica: 'Integración de datos de telemetría · Power BI',
    kpi: { nombre: 'Entregas a tiempo', unidad: '%', base: 78, fav: 0.18, desf: -0.06 }
  },
  {
    id: 'm-l2', niveles: ['moderado'], eslabon: 'logistica', industria: null, objetivos: ['costos'],
    titulo: 'Bodega sin orden por rotación',
    problema: 'Los productos se ubican donde hay espacio. Los de alta salida están al fondo y alistar un pedido toma demasiado tiempo.',
    solucion: 'Reubicar el inventario según su rotación y medir el alistamiento con mapas de calor.',
    tecnica: 'Slotting ABC · mapas de calor de alistamiento',
    kpi: { nombre: 'Tiempo de alistamiento por pedido', unidad: 'min', base: 22, fav: -0.35, desf: 0.1 }
  },
  {
    id: 'm-s1', niveles: ['moderado'], eslabon: 'servicio', industria: null, objetivos: ['clientes'],
    titulo: 'Clientes que se van sin avisar',
    problema: '{empresa} capta {clientes} nuevos, pero no sabe cuántos se quedan después del tercer mes ni en qué momento se pierden.',
    solucion: 'Tablero de retención por cohortes que muestre cuándo y por qué se van los clientes, para intervenir a tiempo.',
    tecnica: 'Análisis de cohortes · embudo de retención',
    kpi: { nombre: 'Abandono mensual (churn)', unidad: '%', base: 6, fav: -0.4, desf: 0.25 }
  },
  {
    id: 'm-s2', niveles: ['moderado'], eslabon: 'servicio', industria: null, objetivos: ['costos', 'clientes'],
    titulo: 'Capacidad mal dimensionada',
    problema: 'En horas pico hay filas y clientes molestos; en horas valle, personal sin trabajo. Los turnos se hacen igual todas las semanas.',
    solucion: 'Analizar la demanda por día y hora y ajustar los turnos a los picos reales.',
    tecnica: 'Mapas de calor de demanda · programación de turnos',
    kpi: { nombre: 'Tiempo de espera promedio', unidad: 'min', base: 25, fav: -0.45, desf: 0.15 }
  },

  // ───────────── Riesgo bajo: modelos e IA ─────────────
  {
    id: 'b-g1', niveles: ['bajo'], eslabon: null, industria: null, objetivos: ['pronostico'],
    titulo: 'Pronóstico de demanda con machine learning',
    problema: '{empresa} tiene años de historia de ventas, pero planea con promedios. Las variaciones por temporada, festivos o promociones no se anticipan.',
    solucion: 'Modelo de pronóstico por producto y {punto} que incorpora calendario, clima y promociones, integrado al proceso de compras.',
    tecnica: 'Gradient boosting · Prophet · variables de calendario',
    kpi: { nombre: 'Error de pronóstico (MAPE)', unidad: '%', base: 28, fav: -0.5, desf: 0.1 }
  },
  {
    id: 'b-g2', niveles: ['bajo'], eslabon: null, industria: null, objetivos: ['clientes'],
    titulo: 'Predicción de abandono de clientes',
    problema: 'Los {clientes} que se van dan señales antes (compran menos, se quejan, dejan de abrir mensajes), pero nadie las está leyendo.',
    solucion: 'Modelo que calcula cada mes la probabilidad de abandono de cada cliente y dispara campañas de retención para los de mayor riesgo.',
    tecnica: 'Clasificación (XGBoost) · scoring mensual',
    kpi: { nombre: 'Clientes perdidos por mes', unidad: '%', base: 5, fav: -0.35, desf: 0.2 }
  },
  {
    id: 'b-g3', niveles: ['bajo'], eslabon: null, industria: null, objetivos: ['ventas'],
    titulo: 'Precios basados en elasticidad',
    problema: 'Los precios se ajustan una vez al año igual para todos los {productos}, sin considerar cómo responde la demanda de cada uno.',
    solucion: 'Estimar la elasticidad precio de cada producto y optimizar precios y descuentos por segmento y temporada.',
    tecnica: 'Modelos de elasticidad · optimización de precios',
    kpi: { nombre: 'Margen bruto', unidad: '%', base: 30, fav: 0.15, desf: -0.08 }
  },
  {
    id: 'b-g4', niveles: ['bajo'], eslabon: null, industria: null, objetivos: ['automatizar', 'clientes'],
    titulo: 'Asistente de IA generativa para atención',
    problema: 'El equipo responde todos los días las mismas preguntas sobre precios, disponibilidad y horarios. Fuera de horario nadie responde.',
    solucion: 'Asistente con IA generativa conectado al catálogo y a las políticas de {empresa}, que responde 24/7 y escala a una persona cuando hace falta.',
    tecnica: 'IA generativa · RAG · WhatsApp Business API',
    kpi: { nombre: 'Consultas resueltas sin intervención', unidad: '%', base: 5, fav: 9, desf: 0 }
  },
  {
    id: 'b-g5', niveles: ['bajo'], eslabon: null, industria: null, objetivos: ['ventas'],
    titulo: 'Recomendaciones personalizadas',
    problema: 'Cada cliente ve los mismos productos, aunque el historial muestra qué combinaciones compran juntos personas parecidas.',
    solucion: 'Sistema de recomendación para venta cruzada en tienda, e-commerce y mensajes personalizados.',
    tecnica: 'Filtrado colaborativo · reglas de asociación',
    kpi: { nombre: 'Ticket promedio', unidad: 'mil COP', base: 85, fav: 0.18, desf: -0.05 }
  },
  {
    id: 'b-g6', niveles: ['bajo'], eslabon: null, industria: null, objetivos: ['costos'],
    titulo: 'Detección de anomalías y fraude',
    problema: 'Descuentos no autorizados, gastos atípicos o transacciones duplicadas pasan desapercibidos entre miles de registros.',
    solucion: 'Modelo que aprende el comportamiento normal y genera alertas automáticas sobre transacciones atípicas.',
    tecnica: 'Isolation Forest · alertas automáticas',
    kpi: { nombre: 'Pérdidas por anomalías', unidad: '% ingresos', base: 2.5, fav: -0.6, desf: 0.3 }
  },
  {
    id: 'b-p1', niveles: ['bajo'], eslabon: 'produccion', industria: null, objetivos: ['costos'],
    titulo: 'Mantenimiento predictivo',
    problema: 'Las máquinas se reparan cuando fallan. Cada paro no planificado detiene la producción y obliga a pagar repuestos urgentes.',
    solucion: 'Modelo que anticipa fallas a partir de sensores e historial de mantenimiento para intervenir antes de que ocurran.',
    tecnica: 'Análisis de supervivencia · IoT · clasificación',
    kpi: { nombre: 'Horas de paro no planificado', unidad: 'h/mes', base: 30, fav: -0.45, desf: 0.2 }
  },
  {
    id: 'b-p2', niveles: ['bajo'], eslabon: 'produccion', industria: null, objetivos: ['costos'],
    titulo: 'Control de calidad con visión artificial',
    problema: 'La inspección es visual y por muestreo. Algunos defectos llegan al cliente y generan devoluciones.',
    solucion: 'Cámaras en línea y un modelo de visión por computador que detecta defectos en el 100 % de las unidades.',
    tecnica: 'Visión por computador · redes neuronales convolucionales',
    kpi: { nombre: 'Defectos que llegan al cliente', unidad: '%', base: 4, fav: -0.65, desf: 0.15 }
  },
  {
    id: 'b-c1', niveles: ['bajo'], eslabon: 'comercial', industria: null, objetivos: ['pronostico', 'costos'],
    titulo: 'Reabastecimiento automático',
    problema: 'Los pedidos a proveedores se hacen a criterio del comprador. Se repiten agotados en lo que más rota y excesos en lo que no.',
    solucion: 'Pronóstico por producto y {punto} conectado a reglas automáticas de reposición que sugieren la orden de compra.',
    tecnica: 'Pronóstico jerárquico · optimización de inventarios',
    kpi: { nombre: 'Agotados', unidad: '%', base: 9, fav: -0.55, desf: 0.15 }
  },
  {
    id: 'b-c2', niveles: ['bajo'], eslabon: 'comercial', industria: null, objetivos: ['ventas'],
    titulo: 'Priorización de prospectos (lead scoring)',
    problema: 'El equipo comercial dedica el mismo esfuerzo a todos los prospectos, aunque solo unos pocos tienen alta probabilidad de compra.',
    solucion: 'Modelo que califica cada prospecto según su probabilidad de cierre para enfocar el tiempo del equipo comercial.',
    tecnica: 'Regresión logística · árboles de decisión',
    kpi: { nombre: 'Tasa de conversión', unidad: '%', base: 12, fav: 0.45, desf: -0.1 }
  },
  {
    id: 'b-l1', niveles: ['bajo'], eslabon: 'logistica', industria: null, objetivos: ['costos'],
    titulo: 'Optimización de rutas',
    problema: 'Las rutas se planean con buena información, pero a mano. Con más pedidos, la combinación óptima es imposible de calcular sin un algoritmo.',
    solucion: 'Algoritmo de ruteo con ventanas de tiempo, capacidad de los vehículos y tráfico, que genera las rutas del día en minutos.',
    tecnica: 'Problema de ruteo de vehículos (VRP) · OR-Tools',
    kpi: { nombre: 'Kilómetros por entrega', unidad: 'km', base: 9, fav: -0.22, desf: 0.08 }
  },
  {
    id: 'b-l2', niveles: ['bajo'], eslabon: 'logistica', industria: null, objetivos: ['clientes'],
    titulo: 'Hora de llegada predictiva',
    problema: 'El cliente recibe una franja de entrega amplia y poco confiable, lo que genera llamadas y entregas fallidas.',
    solucion: 'Modelo que predice la hora de llegada con GPS y tráfico, y avisa automáticamente al cliente.',
    tecnica: 'Regresión con datos de GPS y tráfico',
    kpi: { nombre: 'Entregas tardías o fallidas', unidad: '%', base: 14, fav: -0.5, desf: 0.15 }
  },
  {
    id: 'b-s1', niveles: ['bajo'], eslabon: 'servicio', industria: null, objetivos: ['clientes'],
    titulo: 'Análisis de sentimiento de opiniones',
    problema: 'Hay miles de comentarios en encuestas, chats y reseñas que nadie alcanza a leer. Los problemas recurrentes se detectan tarde.',
    solucion: 'Clasificar automáticamente cada comentario por tema y sentimiento, con alertas cuando un tema negativo crece.',
    tecnica: 'Procesamiento de lenguaje natural · modelos de lenguaje',
    kpi: { nombre: 'Días para detectar un problema recurrente', unidad: 'días', base: 30, fav: -0.8, desf: 0.1 }
  },
  {
    id: 'b-s2', niveles: ['bajo'], eslabon: 'servicio', industria: null, objetivos: ['costos', 'pronostico'],
    titulo: 'Agenda y personal según la demanda prevista',
    problema: 'La demanda de servicio varía por día, hora y temporada, pero el personal se programa igual todas las semanas.',
    solucion: 'Pronosticar la demanda por franja horaria y optimizar la agenda y los turnos del personal.',
    tecnica: 'Series de tiempo · optimización de turnos',
    kpi: { nombre: 'Costo de personal por servicio', unidad: 'mil COP', base: 38, fav: -0.15, desf: 0.08 }
  },

  // ───────────── Casos específicos por industria ─────────────
  {
    id: 'i-moda-1', niveles: ['alto', 'moderado'], eslabon: null, industria: 'moda', objetivos: ['costos', 'ventas'],
    titulo: 'Tallas y colores que no rotan',
    problema: '{empresa} compra o produce la misma curva de tallas para todas las referencias. Al final de la temporada sobran tallas extremas y colores poco vendidos.',
    solucion: 'Registrar ventas por referencia, talla y color, y construir la curva de tallas real de cada tipo de prenda para la siguiente colección.',
    tecnica: 'Curva de tallas · ABC por referencia',
    kpi: { nombre: 'Prendas que terminan en liquidación', unidad: '%', base: 30, fav: -0.4, desf: 0.2 }
  },
  {
    id: 'i-moda-2', niveles: ['moderado', 'bajo'], eslabon: null, industria: 'moda', objetivos: ['pronostico', 'ventas'],
    titulo: 'Pronóstico de tendencias por temporada',
    problema: 'Las colecciones se definen por intuición del equipo de diseño y compras; los éxitos se agotan rápido y no hay tiempo de reponer.',
    solucion: 'Modelo de demanda por colección que combina ventas históricas, señales de redes sociales y búsquedas en internet.',
    tecnica: 'Machine learning · Google Trends · datos de e-commerce',
    kpi: { nombre: 'Venta a precio completo', unidad: '%', base: 55, fav: 0.25, desf: -0.1 }
  },
  {
    id: 'i-alim-1', niveles: ['alto', 'moderado'], eslabon: null, industria: 'alimentos', objetivos: ['costos', 'pronostico'],
    titulo: 'Producto que sobra al cierre',
    problema: 'En {empresa} se prepara la misma cantidad cada día: los lunes sobra producto que se bota y los sábados se agota antes del mediodía.',
    solucion: 'Registrar producción, venta y sobrante por producto y franja horaria, y ajustar las cantidades por día de la semana con un tablero de merma.',
    tecnica: 'Promedios por día de la semana · tablero de merma',
    kpi: { nombre: 'Merma diaria', unidad: '%', base: 18, fav: -0.5, desf: 0.15 }
  },
  {
    id: 'i-alim-2', niveles: ['moderado', 'bajo'], eslabon: null, industria: 'alimentos', objetivos: ['pronostico', 'ventas'],
    titulo: 'Pronóstico por clima, festivos y quincena',
    problema: 'La demanda cambia con la lluvia, los puentes festivos y los días de pago, pero la producción no lo anticipa.',
    solucion: 'Modelo de pronóstico con el calendario colombiano (festivos, quincenas, temporada escolar) y el pronóstico del clima.',
    tecnica: 'Gradient boosting · variables de calendario y clima',
    kpi: { nombre: 'Ventas perdidas por agotados', unidad: '%', base: 7, fav: -0.6, desf: 0.15 }
  },
  {
    id: 'i-ret-1', niveles: ['alto', 'moderado'], eslabon: null, industria: 'retail', objetivos: ['ventas'],
    titulo: 'Surtido igual en todas las tiendas',
    problema: 'Todas las tiendas reciben el mismo surtido aunque sus clientes compran distinto. El espacio de exhibición no se asigna según lo que vende.',
    solucion: 'Análisis de ventas por categoría y metro cuadrado en cada tienda para ajustar surtido y exhibición.',
    tecnica: 'Análisis de surtido · ventas por m²',
    kpi: { nombre: 'Ventas por m²', unidad: 'mil COP/mes', base: 420, fav: 0.2, desf: -0.08 }
  },
  {
    id: 'i-ret-2', niveles: ['moderado', 'bajo'], eslabon: null, industria: 'retail', objetivos: ['ventas'],
    titulo: 'Canasta de mercado y venta cruzada',
    problema: 'Los tiquetes de venta muestran qué se compra junto, pero esa información no se usa para exhibir, combinar ni promocionar.',
    solucion: 'Identificar combinaciones frecuentes de productos para diseñar combos, ubicación en góndola y ofertas cruzadas.',
    tecnica: 'Reglas de asociación (Apriori)',
    kpi: { nombre: 'Productos por tiquete', unidad: 'und', base: 2.4, fav: 0.25, desf: -0.05 }
  },
  {
    id: 'i-sal-1', niveles: ['alto', 'moderado'], eslabon: null, industria: 'salud', objetivos: ['clientes', 'costos'],
    titulo: 'Inasistencia a citas',
    problema: 'Una de cada cinco citas se pierde porque el paciente no llega y nadie lo había confirmado. Esa capacidad no se recupera.',
    solucion: 'Registrar las citas y su asistencia, enviar recordatorios automáticos y habilitar una lista de espera para reasignar cupos.',
    tecnica: 'Tablero de inasistencia · recordatorios automáticos',
    kpi: { nombre: 'Inasistencia a citas', unidad: '%', base: 22, fav: -0.45, desf: 0.15 }
  },
  {
    id: 'i-sal-2', niveles: ['moderado', 'bajo'], eslabon: null, industria: 'salud', objetivos: ['clientes'],
    titulo: 'Identificación temprana de pacientes en riesgo',
    problema: 'Los pacientes con mayor riesgo de complicación o reingreso se identifican cuando ya están graves.',
    solucion: 'Modelo de riesgo con información clínica y de uso de servicios, con estricta protección de datos sensibles, para priorizar seguimiento.',
    tecnica: 'Modelos de clasificación · anonimización de datos',
    kpi: { nombre: 'Reingresos a 30 días', unidad: '%', base: 11, fav: -0.3, desf: 0.1 }
  },
  {
    id: 'i-man-1', niveles: ['alto', 'moderado'], eslabon: null, industria: 'manufactura', objetivos: ['costos'],
    titulo: 'Costos de producción sin desagregar',
    problema: 'Se conoce el costo total de la planta, pero no el costo real de cada orden o producto. Las cotizaciones se hacen con costos estándar desactualizados.',
    solucion: 'Registrar materiales, horas y tiempos de máquina por orden de producción y comparar costo real vs. estándar.',
    tecnica: 'Costeo por órdenes · análisis de variaciones',
    kpi: { nombre: 'Variación costo real vs. estándar', unidad: '%', base: 14, fav: -0.6, desf: 0.2 }
  },
  {
    id: 'i-man-2', niveles: ['moderado', 'bajo'], eslabon: null, industria: 'manufactura', objetivos: ['costos'],
    titulo: 'Consumo de energía optimizado',
    problema: 'La energía es uno de los mayores costos de la planta y se paga sin saber qué equipos, turnos o productos la consumen.',
    solucion: 'Medidores por equipo y un modelo que recomienda horarios y parámetros de operación de menor consumo.',
    tecnica: 'IoT · modelos de regresión · optimización',
    kpi: { nombre: 'Energía por unidad producida', unidad: 'kWh', base: 3.2, fav: -0.18, desf: 0.08 }
  },
  {
    id: 'i-log-1', niveles: ['alto', 'moderado'], eslabon: null, industria: 'logistica', objetivos: ['costos'],
    titulo: 'Viajes de regreso vacíos',
    problema: 'Muchos vehículos regresan sin carga después de entregar. Ese trayecto se paga completo y no genera ingreso.',
    solucion: 'Registrar cada viaje con su origen, destino y ocupación, e identificar rutas de retorno para ofrecer carga.',
    tecnica: 'Tablero de ocupación · análisis origen-destino',
    kpi: { nombre: 'Kilómetros recorridos en vacío', unidad: '%', base: 38, fav: -0.35, desf: 0.1 }
  },
  {
    id: 'i-log-2', niveles: ['moderado', 'bajo'], eslabon: null, industria: 'logistica', objetivos: ['costos'],
    titulo: 'Combustible y hábitos de conducción',
    problema: 'El consumo de combustible varía mucho entre conductores y rutas, pero no se sabe qué lo explica.',
    solucion: 'Analizar la telemetría (aceleraciones, ralentí, velocidad) para identificar patrones de consumo y entrenar a los conductores.',
    tecnica: 'Telemetría · machine learning de patrones',
    kpi: { nombre: 'Combustible por 100 km', unidad: 'L', base: 34, fav: -0.12, desf: 0.05 }
  },
  {
    id: 'i-agro-1', niveles: ['alto', 'moderado'], eslabon: null, industria: 'agro', objetivos: ['costos'],
    titulo: 'Rendimiento por lote sin registro',
    problema: 'Unos lotes rinden el doble que otros, pero no hay registros de insumos, labores ni cosecha por lote para saber por qué.',
    solucion: 'Libreta de campo digital por lote (insumos, labores, clima, cosecha) y tablero de rentabilidad por lote.',
    tecnica: 'Aplicación de campo · tablero por lote',
    kpi: { nombre: 'Variación de rendimiento sin explicar', unidad: '%', base: 35, fav: -0.5, desf: 0.1 }
  },
  {
    id: 'i-agro-2', niveles: ['moderado', 'bajo'], eslabon: null, industria: 'agro', objetivos: ['costos', 'pronostico'],
    titulo: 'Agricultura de precisión',
    problema: 'Riego y fertilización se aplican igual en todo el terreno, aunque el suelo y la humedad varían.',
    solucion: 'Imágenes satelitales (NDVI), datos de clima y sensores para predecir la cosecha y aplicar insumos solo donde se necesitan.',
    tecnica: 'Imágenes satelitales · NDVI · modelos predictivos',
    kpi: { nombre: 'Insumos por tonelada (índice)', unidad: 'pts', base: 100, fav: -0.2, desf: 0.05 }
  },
  {
    id: 'i-serv-1', niveles: ['alto', 'moderado'], eslabon: null, industria: 'servicios', objetivos: ['costos'],
    titulo: 'Proyectos que pierden dinero',
    problema: 'Las horas del equipo no se registran por proyecto. Algunos {clientes} consumen el doble de lo cotizado y nadie lo sabe hasta fin de año.',
    solucion: 'Registro de horas por proyecto y tablero de rentabilidad que compare lo cotizado con lo ejecutado.',
    tecnica: 'Registro de tiempos · rentabilidad por proyecto',
    kpi: { nombre: 'Rentabilidad por proyecto', unidad: '%', base: 12, fav: 0.6, desf: -0.25 }
  },
  {
    id: 'i-serv-2', niveles: ['moderado', 'bajo'], eslabon: null, industria: 'servicios', objetivos: ['automatizar'],
    titulo: 'Propuestas e informes con IA generativa',
    problema: 'El equipo dedica muchas horas a escribir propuestas, informes y contratos que se parecen entre sí.',
    solucion: 'Asistente de IA generativa alimentado con plantillas y la base de conocimiento de {empresa} para producir primeros borradores.',
    tecnica: 'Modelos de lenguaje · plantillas · base de conocimiento',
    kpi: { nombre: 'Horas por propuesta', unidad: 'h', base: 16, fav: -0.6, desf: 0 }
  },
  {
    id: 'i-tur-1', niveles: ['alto', 'moderado'], eslabon: null, industria: 'turismo', objetivos: ['ventas', 'costos'],
    titulo: 'Comisiones sin control por canal',
    problema: 'Las reservas llegan por agencias en línea, teléfono y redes, pero no se sabe qué canal deja más margen después de comisiones.',
    solucion: 'Tablero de ocupación, tarifa promedio y RevPAR por canal para impulsar la venta directa.',
    tecnica: 'Tablero de ocupación · ADR · RevPAR',
    kpi: { nombre: 'Comisiones a intermediarios', unidad: '% ingresos', base: 18, fav: -0.3, desf: 0.1 }
  },
  {
    id: 'i-tur-2', niveles: ['moderado', 'bajo'], eslabon: null, industria: 'turismo', objetivos: ['ventas', 'pronostico'],
    titulo: 'Tarifas dinámicas (revenue management)',
    problema: 'Las tarifas se fijan por temporada alta y baja, sin responder a la demanda real de cada fecha ni a los eventos de la ciudad.',
    solucion: 'Pronóstico de ocupación por fecha y recomendación automática de tarifas según demanda y competencia.',
    tecnica: 'Pronóstico de ocupación · optimización tarifaria',
    kpi: { nombre: 'RevPAR', unidad: 'mil COP', base: 160, fav: 0.18, desf: -0.07 }
  }
];

// Elige los casos más pertinentes para la empresa: primero los de su
// industria, luego los de su eslabón y por último los generales; dentro de
// cada grupo, los que coinciden con sus objetivos.
export function seleccionarCasos({ nivel, industria, eslabon, objetivos = [] }, cantidad = 6) {
  return CASOS
    .filter((c) => c.niveles.includes(nivel))
    .filter((c) => !c.industria || c.industria === industria)
    .filter((c) => !c.eslabon || c.eslabon === eslabon)
    .map((c, orden) => ({
      c,
      orden,
      puntos: (c.industria ? 100 : 0) + (c.eslabon ? 50 : 0) +
        c.objetivos.filter((o) => objetivos.includes(o)).length * 10
    }))
    .sort((a, b) => b.puntos - a.puntos || a.orden - b.orden)
    .slice(0, cantidad)
    .map((x) => x.c);
}
