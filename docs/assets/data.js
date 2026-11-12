export const SITES = [
  { id: 'ambar', name: 'Sede Ámbar' },
  { id: 'bruma', name: 'Sede Bruma' },
  { id: 'delta', name: 'Sede Delta' },
  { id: 'faro', name: 'Sede Faro' },
  { id: 'lumen', name: 'Sede Lumen' },
  { id: 'vertice', name: 'Sede Vértice' },
];

export const CHANNELS = [
  { id: 'sede', name: 'Consumo en sede', weight: 0.54, color: '#7252d4' },
  { id: 'retiro', name: 'Para llevar', weight: 0.27, color: '#15958a' },
  { id: 'entrega', name: 'Entrega', weight: 0.19, color: '#cf9134' },
];

export const PRODUCTS = [
  { id: 'arroz', name: 'Bowl de arroz', family: 'Platos', price: 21400, unitsPerOrder: 0.36 },
  { id: 'panini', name: 'Panini de vegetales', family: 'Platos', price: 18700, unitsPerOrder: 0.31 },
  { id: 'ensalada', name: 'Ensalada cítrica', family: 'Platos', price: 16900, unitsPerOrder: 0.22 },
  { id: 'limonada', name: 'Limonada de jengibre', family: 'Bebidas', price: 6800, unitsPerOrder: 0.56 },
  { id: 'cafe', name: 'Café filtrado', family: 'Bebidas', price: 5700, unitsPerOrder: 0.37 },
  { id: 'postre', name: 'Tarta de frutas', family: 'Postres', price: 9300, unitsPerOrder: 0.19 },
];

export const STATUSES = [
  { id: 'abierta', name: 'Abierta', color: '#cf9134' },
  { id: 'curso', name: 'En curso', color: '#7252d4' },
  { id: 'resuelta', name: 'Resuelta', color: '#15958a' },
];

export const PRIORITIES = [
  { id: 'alta', name: 'Alta', color: '#b64b64' },
  { id: 'media', name: 'Media', color: '#cf9134' },
  { id: 'baja', name: 'Baja', color: '#7252d4' },
];

export const CATEGORIES = [
  { id: 'acceso', name: 'Acceso', subject: 'Revisión de permisos del tablero', detail: 'El equipo de la sede solicita acceso de lectura al tablero ficticio del turno.' },
  { id: 'equipos', name: 'Equipos', subject: 'Terminal de trabajo sin respuesta', detail: 'La sede reporta que una terminal de demostración requiere revisión del equipo de soporte.' },
  { id: 'reportes', name: 'Reportes', subject: 'Reporte pendiente de actualización', detail: 'La sede solicita verificar la actualización del resumen correspondiente al escenario.' },
  { id: 'conectividad', name: 'Conectividad', subject: 'Intermitencia en la red de la sede', detail: 'Se registra una solicitud ficticia de diagnóstico de conectividad para el turno.' },
  { id: 'inventario', name: 'Inventario', subject: 'Ajuste de conteo de insumos', detail: 'El equipo solicita revisar una diferencia en el conteo simulado de insumos.' },
];

const STOCK_ITEMS = [
  { name: 'Arroz integral', measure: 'kg', unitCost: 7400, minimum: 18 },
  { name: 'Mezcla de vegetales', measure: 'kg', unitCost: 11800, minimum: 12 },
  { name: 'Pan artesanal', measure: 'unid.', unitCost: 2200, minimum: 35 },
  { name: 'Café molido', measure: 'kg', unitCost: 49000, minimum: 5 },
  { name: 'Vasos compostables', measure: 'unid.', unitCost: 570, minimum: 85 },
  { name: 'Envases para llevar', measure: 'unid.', unitCost: 1150, minimum: 60 },
];

const DAY = 86_400_000;
const FIRST_DAY = Date.UTC(2026, 4, 2);
export const DATES = Array.from({ length: 60 }, (_, index) => new Date(FIRST_DAY + index * DAY).toISOString().slice(0, 10));
export const STOCK_DATE = DATES.at(-1);
export const DEFAULT_FILTERS = { days: 14, site: 'all', channel: 'all' };
export const DEFAULT_SUPPORT = { status: 'all', priority: 'all', category: 'all', search: '', tab: 'resumen', page: 1 };

const integerFormat = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 });
const decimalFormat = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 });
const moneyFormat = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
const shortDateFormat = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const fullDateFormat = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

export const number = (value) => integerFormat.format(value);
export const decimal = (value) => decimalFormat.format(value);
export const money = (value) => moneyFormat.format(value);
export const shortDate = (date) => shortDateFormat.format(new Date(`${date}T00:00:00Z`));
export const fullDate = (date) => fullDateFormat.format(new Date(`${date}T00:00:00Z`));
export const percent = (value) => `${decimal(value)} %`;

export function compact(value) {
  if (value >= 1_000_000) return `${decimal(value / 1_000_000)} M`;
  if (value >= 1_000) return `${decimal(value / 1_000)} mil`;
  return number(value);
}

function randomFrom(seed) {
  let state = seed;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function generateCommercial() {
  const random = randomFrom(41667);
  return DATES.flatMap((date, day) => {
    const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
    const activity = (weekday === 0 || weekday === 6 ? 1.22 : 1) * (1 + day * 0.003);
    return SITES.flatMap((site, siteIndex) => CHANNELS.map((channel) => {
      const orders = Math.max(1, Math.round((73 + siteIndex * 11) * channel.weight * activity * (0.83 + random() * 0.34)));
      const products = PRODUCTS.map((product) => {
        const units = Math.round(orders * product.unitsPerOrder * (0.8 + random() * 0.4));
        return { id: product.id, units, sales: units * product.price };
      });
      const sales = products.reduce((sum, product) => sum + product.sales, 0);
      return { date, site: site.id, channel: channel.id, orders, sales, products };
    }));
  });
}

function generateTickets() {
  const random = randomFrom(70261);
  let sequence = 0;
  return DATES.flatMap((date) => {
    const dailyCount = 3 + Math.floor(random() * 8);
    return Array.from({ length: dailyCount }, () => {
      const statusSample = random();
      const status = statusSample < 0.64 ? 'resuelta' : statusSample < 0.82 ? 'curso' : 'abierta';
      const prioritySample = random();
      const priority = prioritySample < 0.19 ? 'alta' : prioritySample < 0.67 ? 'media' : 'baja';
      const category = CATEGORIES[Math.floor(random() * CATEGORIES.length)];
      const site = SITES[Math.floor(random() * SITES.length)];
      sequence += 1;
      return {
        id: `SOL-${String(sequence).padStart(4, '0')}`,
        date,
        site: site.id,
        status,
        priority,
        category: category.id,
        subject: category.subject,
        detail: category.detail,
        resolutionHours: status === 'resuelta' ? Math.round((1.4 + random() * 17) * 10) / 10 : null,
      };
    });
  }).reverse();
}

function generateInventory() {
  const random = randomFrom(80319);
  return SITES.flatMap((site) => STOCK_ITEMS.map((item) => {
    const quantity = Math.round(item.minimum * (0.52 + random() * 2.08));
    return { ...item, site: site.id, quantity, value: quantity * item.unitCost };
  }));
}

const commercial = generateCommercial();
const tickets = generateTickets();
const inventory = generateInventory();

export function findName(options, id) {
  return options.find((option) => option.id === id)?.name ?? '—';
}

export function period(days, offset = 0) {
  const endIndex = DATES.length - offset;
  const dates = DATES.slice(endIndex - days, endIndex);
  return { dates, start: dates[0], end: dates.at(-1) };
}

export function periodLabel(days) {
  const range = period(days);
  return `${shortDate(range.start)} – ${fullDate(range.end)}`;
}

export function commercialRows(filters, offset = 0) {
  const range = period(filters.days, offset);
  return commercial.filter((row) => row.date >= range.start && row.date <= range.end
    && (filters.site === 'all' || row.site === filters.site)
    && (filters.channel === 'all' || row.channel === filters.channel));
}

export function totals(rows) {
  return rows.reduce((result, row) => {
    result.sales += row.sales;
    result.orders += row.orders;
    return result;
  }, { sales: 0, orders: 0 });
}

export function metricValue(summary, metric) {
  if (metric === 'ticket') return summary.orders ? summary.sales / summary.orders : null;
  return summary[metric];
}

export function groupCommercial(rows, key, options) {
  return options.map((option) => ({ ...option, ...totals(rows.filter((row) => row[key] === option.id)) }));
}

export function dailyTotals(rows, dates) {
  return dates.map((date) => ({ date, ...totals(rows.filter((row) => row.date === date)) }));
}

export function productTotals(rows) {
  const byProduct = new Map(PRODUCTS.map((product) => [product.id, { ...product, units: 0, sales: 0 }]));
  for (const row of rows) {
    for (const product of row.products) {
      const summary = byProduct.get(product.id);
      summary.units += product.units;
      summary.sales += product.sales;
    }
  }
  return [...byProduct.values()].sort((a, b) => b.sales - a.sales);
}

function normalize(value) {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
}

export function supportRows(filters, support = DEFAULT_SUPPORT) {
  const range = period(filters.days);
  const term = normalize(support.search);
  return tickets.filter((ticket) => ticket.date >= range.start && ticket.date <= range.end
    && (filters.site === 'all' || ticket.site === filters.site)
    && (support.status === 'all' || ticket.status === support.status)
    && (support.priority === 'all' || ticket.priority === support.priority)
    && (support.category === 'all' || ticket.category === support.category)
    && (!term || normalize(`${ticket.id} ${ticket.subject} ${findName(SITES, ticket.site)}`).includes(term)));
}

export function supportTotals(rows) {
  const resolved = rows.filter((ticket) => ticket.status === 'resuelta');
  return {
    total: rows.length,
    pending: rows.length - resolved.length,
    resolved: resolved.length,
    meanHours: resolved.length ? resolved.reduce((sum, ticket) => sum + ticket.resolutionHours, 0) / resolved.length : null,
  };
}

export function supportTicket(id) {
  return tickets.find((ticket) => ticket.id === id);
}

export function inventoryRows(filters, lowOnly = false) {
  return inventory.filter((item) => (filters.site === 'all' || item.site === filters.site)
    && (!lowOnly || item.quantity < item.minimum));
}

export function csvText(columns, rows) {
  const escape = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  return '\uFEFF' + [columns, ...rows].map((row) => row.map(escape).join(';')).join('\r\n') + '\r\n';
}
