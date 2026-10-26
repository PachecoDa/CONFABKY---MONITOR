// Generador de datos sintéticos. Es determinista: la misma empresa siempre ve
// los mismos números, porque la semilla sale del id de la encuesta.

export function semilla(texto) {
  let h = 1779033703 ^ String(texto).length;
  for (let i = 0; i < String(texto).length; i++) {
    h = Math.imul(h ^ String(texto).charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

export function aleatorio(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

// Etiquetas de `n` meses consecutivos que empiezan `atras` meses antes de `desde`.
export function etiquetasMeses(desde, atras, n) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(desde.getFullYear(), desde.getMonth() - atras + i, 1);
    out.push(`${MESES[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`);
  }
  return out;
}

// Ventas mensuales típicas (millones COP) por tamaño de empresa.
const VENTAS_BASE = { micro: 28, pequena: 160, mediana: 950, grande: 5200 };

// Crecimiento anual de las ventas con y sin intervención, según el nivel.
const ESCENARIOS = {
  alto: { fav: 0.2, desf: -0.12 },
  moderado: { fav: 0.15, desf: -0.07 },
  bajo: { fav: 0.12, desf: -0.03 }
};

// Ventas: 12 meses de histórico + 12 de proyección en dos escenarios.
// Los arreglos tienen 24 posiciones; `null` donde un escenario no aplica.
export function seriesVentas({ id, tamano, nivel, estacionalidad, fecha }) {
  const rnd = aleatorio(semilla(id + ':ventas'));
  const base = (VENTAS_BASE[tamano] || VENTAS_BASE.pequena) * (0.75 + rnd() * 0.5);
  const tendenciaHist = -0.04 + rnd() * 0.08;
  const esc = ESCENARIOS[nivel];
  const hoy = fecha ? new Date(fecha) : new Date();
  const mesInicio = (hoy.getMonth() - 11 + 12) % 12;

  const historico = [];
  for (let i = 0; i < 12; i++) {
    const est = estacionalidad[(mesInicio + i) % 12];
    const tend = 1 + tendenciaHist * (i / 12);
    historico.push(base * est * tend * (0.94 + rnd() * 0.12));
  }
  const ultimo = base * (1 + tendenciaHist);
  const favorable = Array(11).fill(null);
  const desfavorable = Array(11).fill(null);
  favorable.push(historico[11]);
  desfavorable.push(historico[11]);
  for (let i = 1; i <= 12; i++) {
    const est = estacionalidad[(mesInicio + 11 + i) % 12];
    // La intervención tarda ~3 meses en notarse (curva en S).
    const avance = 1 / (1 + Math.exp(-(i - 4) / 1.6));
    favorable.push(ultimo * est * (1 + esc.fav * avance) * (0.97 + rnd() * 0.06));
    desfavorable.push(ultimo * est * (1 + esc.desf * (i / 12)) * (0.96 + rnd() * 0.06));
  }

  const totalFav = favorable.slice(12).reduce((a, b) => a + b, 0);
  const totalDesf = desfavorable.slice(12).reduce((a, b) => a + b, 0);
  return {
    etiquetas: etiquetasMeses(hoy, 11, 24),
    historico: [...historico, ...Array(12).fill(null)],
    favorable,
    desfavorable,
    anualActual: historico.reduce((a, b) => a + b, 0),
    anualFavorable: totalFav,
    anualDesfavorable: totalDesf,
    brecha: totalFav - totalDesf
  };
}

// Serie de 18 meses (12 históricos + 6 proyectados) para el indicador de un caso.
export function seriesKpi(kpi, sem) {
  const rnd = aleatorio(semilla(sem));
  const base = kpi.base * (0.9 + rnd() * 0.2);
  const ruido = 0.06;
  const historico = [];
  for (let i = 0; i < 12; i++) historico.push(base * (1 + (rnd() - 0.5) * 2 * ruido));
  const favorable = Array(11).fill(null).concat(historico[11]);
  const desfavorable = Array(11).fill(null).concat(historico[11]);
  for (let i = 1; i <= 6; i++) {
    const avance = 1 / (1 + Math.exp(-(i - 2.5) / 0.9));
    favorable.push(base * (1 + kpi.fav * avance) * (1 + (rnd() - 0.5) * ruido));
    desfavorable.push(base * (1 + kpi.desf * (i / 6)) * (1 + (rnd() - 0.5) * ruido));
  }
  const decimales = kpi.base < 10 ? 1 : 0;
  const r = (v) => (v == null ? null : Number(v.toFixed(decimales)));
  return {
    historico: [...historico, ...Array(6).fill(null)].map(r),
    favorable: favorable.map(r),
    desfavorable: desfavorable.map(r),
    actual: r(historico[11]),
    conIntervencion: r(favorable[17]),
    sinIntervencion: r(desfavorable[17]),
    menorEsMejor: kpi.fav < 0,
    decimales
  };
}
