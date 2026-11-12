export const NETWORK = 'Red Ámbar';
export const SITES = [
  ['ambar', 'Sede Ámbar', 'Aurora', 'Urbano', 'Norte'],
  ['bruma', 'Sede Bruma', 'Aurora', 'Centro comercial', 'Norte'],
  ['delta', 'Sede Delta', 'Puerto Claro', 'Urbano', 'Costa'],
  ['faro', 'Sede Faro', 'Puerto Claro', 'Carretera', 'Costa'],
  ['lumen', 'Sede Lumen', 'Monte Azul', 'Centro comercial', 'Sierra'],
  ['vertice', 'Sede Vértice', 'Monte Azul', 'Urbano', 'Sierra'],
].map(([id, name, city, format, district], index) => ({ id, name, city, format, district, code: 'PO-' + (201 + index) }));
export const CHANNELS = [
  { id: 'sede', name: 'Consumo en sede', weight: .54, color: '#5751a6' },
  { id: 'retiro', name: 'Para llevar', weight: .28, color: '#1b897e' },
  { id: 'entrega', name: 'Entrega', weight: .18, color: '#bd8124' },
];
export const PRODUCTS = [
  ['arroz', 'Bowl de arroz', 'Platos', 21400, .36],
  ['panini', 'Panini de vegetales', 'Platos', 18700, .31],
  ['ensalada', 'Ensalada cítrica', 'Platos', 16900, .22],
  ['limonada', 'Limonada de jengibre', 'Bebidas', 6800, .56],
  ['cafe', 'Café filtrado', 'Bebidas', 5700, .37],
  ['tarta', 'Tarta de frutas', 'Postres', 9300, .19],
  ['mousse', 'Mousse de cacao', 'Postres', 8500, .16],
  ['sopa', 'Sopa de temporada', 'Platos', 13500, .14],
].map(([id, name, family, price, unitsPerOrder], index) => ({ id, name, family, price, unitsPerOrder, code: 'PD-' + (110 + index) }));
export const STATUSES = [
  { id: 'abierta', name: 'Abierta', color: '#bf872b' },
  { id: 'curso', name: 'En curso', color: '#6156ad' },
  { id: 'resuelta', name: 'Resuelta', color: '#1b897e' },
];
export const PRIORITIES = [
  { id: 'alta', name: 'Alta', color: '#ad435e' },
  { id: 'media', name: 'Media', color: '#bf872b' },
  { id: 'baja', name: 'Baja', color: '#6156ad' },
];
export const TYPES = [{ id: 'incidencia', name: 'Incidencia', color: '#6156ad' }, { id: 'solicitud', name: 'Solicitud', color: '#1b897e' }];
export const CATEGORIES = [
  ['acceso', 'Acceso', 'Revisión de acceso al tablero', 'El equipo de la sede solicita acceso de lectura al tablero de su turno.'],
  ['equipos', 'Equipos', 'Revisión de terminal de servicio', 'La terminal presenta interrupciones durante el registro de pedidos.'],
  ['conectividad', 'Conectividad', 'Intermitencia en la red de la sede', 'La sede informa que pierde conexión en el área de despacho.'],
  ['datos', 'Datos y reportes', 'Revisión del cierre del turno', 'Se solicita comprobar el resultado del último cierre de la sede.'],
  ['mantenimiento', 'Mantenimiento', 'Inspección de equipo de frío', 'Se programa una inspección por variaciones de temperatura.'],
].map(([id, name, subject, detail]) => ({ id, name, subject, detail }));
const STOCK_ITEMS = [
  ['AR-01', 'Arroz integral', 'Ingredientes', 'kg', 7400, 25],
  ['VE-02', 'Mezcla de vegetales', 'Ingredientes', 'kg', 9200, 18],
  ['PN-03', 'Pan de masa madre', 'Ingredientes', 'un', 3500, 45],
  ['CA-04', 'Café molido', 'Bebidas', 'kg', 28400, 12],
  ['TI-05', 'Tisana cítrica', 'Bebidas', 'L', 4100, 22],
  ['CB-06', 'Caja para llevar', 'Empaque', 'un', 870, 80],
  ['VV-07', 'Vaso de fibra', 'Empaque', 'un', 460, 85],
  ['FR-08', 'Pulpa de fruta', 'Ingredientes', 'kg', 13700, 16],
];

export const FIRST_DATE = '2026-07-06';
export const LAST_DATE = '2026-10-25';
export const STOCK_DATES = ['2026-08-31', '2026-09-30', LAST_DATE];
const DAY = 86400000;
const locale = 'es-CO';
const integer = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
const fractional = new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const short = new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', timeZone: 'UTC' });
const full = new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });
export const number = (value) => value == null ? '—' : integer.format(value);
export const decimal = (value) => value == null ? '—' : fractional.format(value);
export const money = (value) => value == null ? '—' : '$' + number(value);
export const percent = (value) => value == null ? '—' : decimal(Math.round(value * 1000) / 10 || 0) + '%';
export const compact = (value) => Math.abs(value) >= 1e6 ? decimal(value / 1e6) + ' M' : Math.abs(value) >= 1e3 ? decimal(value / 1e3) + ' mil' : number(value);
export const bigMoney = (value) => value == null ? '—' : value >= 1e6 ? '$' + decimal(value / 1e6) + ' M' : money(value);
export const shortDate = (date) => short.format(new Date(date));
export const fullDate = (date) => full.format(new Date(date));
export const shift = (date, days) => new Date(Date.parse(date) + days * DAY).toISOString().slice(0, 10);
export const daysBetween = (start, end) => (Date.parse(end) - Date.parse(start)) / DAY;
export const monthStart = (date) => date.slice(0, 7) + '-01';
export const dateList = (start, end) => Array.from({ length: Math.max(0, daysBetween(start, end) + 1) }, (_, index) => shift(start, index));
export const normalize = (value) => String(value ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
export const findName = (options, id) => options.find((option) => option.id === id)?.name ?? 'Todos';
export const unique = (items) => [...new Set(items)].map((value) => ({ id: value, name: value }));
export const CITIES = unique(SITES.map((site) => site.city));
export const FORMATS = unique(SITES.map((site) => site.format));
export const DISTRICTS = unique(SITES.map((site) => site.district));
export const FAMILIES = unique(PRODUCTS.map((product) => product.family));
export const STOCK_CATEGORIES = unique(STOCK_ITEMS.map((item) => item[2]));

const seed = (() => {
  let state = 817367;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
})();
const pick = (items) => items[Math.floor(seed() * items.length)];
const range = (a, b) => a + Math.floor(seed() * (b - a + 1));
const add = (rows, key) => rows.reduce((sum, row) => sum + row[key], 0);
const commercial = [], tickets = [];
const dates = dateList(FIRST_DATE, LAST_DATE);
dates.forEach((date, day) => {
  for (const [siteIndex, site] of SITES.entries()) {
    const weekend = [0, 5, 6].includes(new Date(date).getUTCDay()) ? 1.23 : 1;
    for (const channel of CHANNELS) {
      const baseOrders = Math.round((206 + siteIndex * 24) * weekend * channel.weight);
      const plannedOrders = Math.round(baseOrders * [1.12, 1.18, 1.22, 1.27, 1.15, 1.24][siteIndex]);
      const orders = Math.round(baseOrders * (.83 + day * .0019 + seed() * .28));
      const products = PRODUCTS.map((product) => {
        const units = Math.round(orders * product.unitsPerOrder * (.78 + seed() * .44));
        const price = product.price + (channel.id === 'entrega' ? 650 : 0);
        return { id: product.id, units, sales: price * units };
      });
      commercial.push({
        date, site: site.id, channel: channel.id, orders, sales: add(products, 'sales'),
        plannedOrders, plannedSales: plannedOrders * (27200 + siteIndex * 440), products,
      });
    }
  }
  for (let i = 0, count = range(3, 8); i < count; i++) {
    const category = pick(CATEGORIES);
    const status = seed() < .75 ? 'resuelta' : seed() < .55 ? 'curso' : 'abierta';
    const resolutionHours = status === 'resuelta' ? Math.min((daysBetween(date, LAST_DATE) + 1) * 24, range(3, seed() < .89 ? 52 : 145)) : null;
    tickets.push({
      id: 'PO-' + (4701 + tickets.length), date, site: pick(SITES).id, category: category.id,
      subject: category.subject, detail: category.detail, status, resolutionHours,
      priority: seed() < .16 ? 'alta' : seed() < .53 ? 'media' : 'baja',
      type: ['equipos', 'conectividad', 'mantenimiento'].includes(category.id) ? 'incidencia' : 'solicitud',
    });
  }
});
tickets.reverse();

const stock = STOCK_DATES.flatMap((date) => SITES.flatMap((site) =>
  STOCK_ITEMS.map(([code, name, category, unit, baseCost, minimum]) => {
    const quantity = Math.round(minimum * (.44 + seed() * 2.8));
    const unitCost = baseCost + range(-12, 16) * 10;
    const idealUse = minimum * range(3, 7);
    const actualUse = Math.round(idealUse * (.93 + seed() * .24));
    return { date, site: site.id, code, name, category, unit, quantity, minimum, unitCost, idealUse, actualUse,
      value: quantity * unitCost, actualCost: actualUse * unitCost, idealCost: idealUse * unitCost };
  })));

export function siteOptions(filters) {
  return SITES.filter((site) => ['city', 'format', 'district'].every((key) =>
    !filters[key] || filters[key] === 'all' || filters[key] === site[key]));
}

export function commercialRows(filters, start = filters.from, end = filters.to) {
  const sites = siteOptions({ ...filters, district: 'all' }).map((site) => site.id);
  return commercial.filter((row) => row.date >= start && row.date <= end && sites.includes(row.site)
    && (filters.site === 'all' || row.site === filters.site)
    && (filters.channel === 'all' || row.channel === filters.channel));
}

export function totals(rows) {
  return { sales: add(rows, 'sales'), orders: add(rows, 'orders'), plannedSales: add(rows, 'plannedSales'), plannedOrders: add(rows, 'plannedOrders') };
}

export function metricValue(summary, metric, planned = false) {
  const sales = planned ? summary.plannedSales : summary.sales;
  const orders = planned ? summary.plannedOrders : summary.orders;
  return metric === 'ticket' ? orders ? sales / orders : null : metric === 'orders' ? orders : sales;
}

export function group(rows, key, options, aggregate = totals) {
  return options.map((option) => ({ ...option, ...aggregate(rows.filter((row) => row[key] === option.id)) }));
}

export function comparison(filters, start, end) {
  const offset = 7 * Math.ceil((daysBetween(start, end) + 1) / 7);
  const from = shift(start, -offset), to = shift(end, -offset);
  return { from, to, rows: from < FIRST_DATE ? null : commercialRows(filters, from, to) };
}

export function productTotals(rows, family = 'all', search = '') {
  const term = normalize(search);
  const items = PRODUCTS.filter((product) => (family === 'all' || family === product.family)
    && normalize(product.code + ' ' + product.name).includes(term));
  const byProduct = new Map(items.map((product) => [product.id, { ...product, units: 0, sales: 0 }]));
  for (const row of rows) {
    for (const product of row.products) {
      const entry = byProduct.get(product.id);
      if (entry) { entry.units += product.units; entry.sales += product.sales; }
    }
  }
  return [...byProduct.values()].filter((item) => item.units).sort((a, b) => b.sales - a.sales);
}

// Reparte el total de cada fila entre las horas sin perder unidades ni pesos.
export function hourlyTotals(rows) {
  const weights = [2, 3, 5, 12, 17, 13, 6, 4, 5, 8, 11, 9, 5];
  const sum = weights.reduce((a, b) => a + b, 0);
  const points = weights.map((_, i) => ({ name: (10 + i) + ':00', sales: 0, orders: 0 }));
  for (const row of rows) {
    let cumulative = 0;
    weights.forEach((weight, i) => {
      const from = cumulative;
      cumulative += weight;
      for (const metric of ['sales', 'orders']) {
        points[i][metric] += Math.floor(row[metric] * cumulative / sum) - Math.floor(row[metric] * from / sum);
      }
    });
  }
  return points;
}

export function supportRows(filters) {
  const term = normalize(filters.search);
  return tickets.filter((ticket) => ticket.date >= filters.from && ticket.date <= filters.to
    && (filters.site === 'all' || ticket.site === filters.site)
    && ['status', 'priority', 'category', 'type'].every((key) => filters[key] === 'all' || filters[key] === ticket[key])
    && normalize(ticket.id + ' ' + ticket.subject + ' ' + findName(SITES, ticket.site)).includes(term));
}

export function supportTotals(rows) {
  const resolved = rows.filter((ticket) => ticket.resolutionHours !== null);
  const pending = rows.filter((ticket) => ticket.resolutionHours === null);
  const hours = resolved.map((ticket) => ticket.resolutionHours).sort((a, b) => a - b);
  const percentile = (p) => {
    if (!hours.length) return null;
    const at = (hours.length - 1) * p, base = Math.floor(at);
    return hours[base] + (hours[Math.ceil(at)] - hours[base]) * (at - base);
  };
  return { total: rows.length, resolved: resolved.length, pending: pending.length,
    rate: rows.length ? resolved.length / rows.length : null,
    median: percentile(.5), p95: percentile(.95),
    older30: pending.filter((ticket) => daysBetween(ticket.date, LAST_DATE) > 30).length,
    older90: pending.filter((ticket) => daysBetween(ticket.date, LAST_DATE) > 90).length };
}

export const supportTicket = (id) => tickets.find((ticket) => ticket.id === id);

export function inventoryRows(filters) {
  const date = STOCK_DATES.findLast((day) => day >= filters.from && day <= filters.to);
  const sites = siteOptions(filters).map((site) => site.id);
  const rows = stock.filter((item) => item.date === date && sites.includes(item.site)
    && (filters.site === 'all' || item.site === filters.site)
    && (filters.category === 'all' || item.category === filters.category)
    && (!filters.low || item.quantity < item.minimum));
  return { date, rows };
}

export function csvText(columns, rows) {
  const escape = (value) => '"' + String(value ?? '').replaceAll('"', '""') + '"';
  return '\uFEFF' + [columns, ...rows].map((row) => row.map(escape).join(';')).join('\r\n') + '\r\n';
}
