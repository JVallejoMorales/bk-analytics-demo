import {
  SITES, CITIES, FORMATS, DISTRICTS, STOCK_CATEGORIES, CATEGORIES, STATUSES, PRIORITIES, TYPES,
  FIRST_DATE, LAST_DATE, STOCK_DATES, number, money, percent, bigMoney, fullDate, monthStart, findName,
  group, supportRows, supportTotals, inventoryRows,
} from './data.js?v=2';
import {
  e, icon, select, searchField, submit, reset, button, link, pill, tabs, tabsPanel, panel, strip,
  downloadBand, empty, kpis, table, textRows, barList, rankedBars, distributionList, pager, hours, exportButton,
} from './ui.js?v=2';
import { siteSelect, rangeFields, rangeText } from './commercial.js?v=2';

export const INVENTORY_VIEWS = [['resumen', 'Resumen'], ['restaurantes', 'Restaurantes'], ['existencias', 'Existencias'], ['calidad', 'Calidad de datos']];
export const COST_VIEWS = [['resumen', 'Resumen'], ['restaurantes', 'Restaurantes'], ['calidad', 'Calidad y alertas']];
export const SUPPORT_VIEWS = [['resumen', 'Resumen'], ['detalle', 'Detalle'], ['sedes', 'Restaurantes']];
export const DISTRIBUTIONS = [['status', 'Estado'], ['priority', 'Prioridad'], ['type', 'Tipo']];
const categoryFor = { status: STATUSES, priority: PRIORITIES, type: TYPES };
const nameOf = (row) => findName(SITES, row.site);
const siteName = (site) => site.name + ' · ' + site.code;
const count = (rows, condition) => rows.filter(condition).length;
const sum = (rows, key) => rows.reduce((total, row) => total + row[key], 0);
const low = (row) => row.quantity < row.minimum;
const costReview = (row) => Math.abs(row.actualCost - row.idealCost) / row.idealCost > .12;
const statusTone = { abierta: 'warn', curso: 'accent', resuelta: 'ok', alta: 'alert', media: 'warn', baja: 'accent' };
const drill = (key, value) => `data-drill-key="${e(key)}" data-drill-value="${e(value)}"`;

function operationalFilter(f, isCost) {
  return `<form class="panel filter-panel operation-filter" data-filter aria-label="Filtros de ${isCost ? 'costos' : 'inventario'}">
    <div class="filter-grid filter-six">${rangeFields(f)}${select('city', 'Ciudad', CITIES, f.city, 'Todas')}
      ${select('format', 'Formato', FORMATS, f.format, 'Todos')}${select('district', 'Distrital', DISTRICTS, f.district, 'Todos')}${siteSelect(f)}
      ${select('category', 'Categoría inventario', STOCK_CATEGORIES, f.category, 'Todas')}</div>
    <p class="filter-note">${isCost ? 'Los costos corresponden al período observado en el último corte del rango.' : 'El rango determina el corte disponible; la fecha de existencia se muestra por separado.'}</p>
    <div class="filter-actions align-end">${reset()}</div></form>`;
}

export function operationData(f, isCost) {
  const { rows, date } = inventoryRows(f);
  return { rows, date, filename: isCost ? 'pulso-costos.csv' : 'pulso-inventario.csv',
    columns: ['Corte', 'Restaurante', 'Código', 'Artículo', 'Categoría', 'Unidad', ...(isCost
      ? ['Período desde', 'Consumo observado', 'Consumo ideal', 'Costo unitario COP', 'Costo observado COP', 'Costo ideal COP', 'Desviación COP']
      : ['Existencia', 'Mínimo', 'Costo unitario COP', 'Valor COP'])],
    records: rows.map((row) => [row.date, nameOf(row), row.code, row.name, row.category, row.unit, ...(isCost
      ? [monthStart(row.date), row.actualUse, row.idealUse, row.unitCost, row.actualCost, row.idealCost, row.actualCost - row.idealCost]
      : [row.quantity, row.minimum, row.unitCost, row.value])]) };
}

function stockSeverity(row) {
  return row.quantity === 0 ? 'P0' : row.quantity < row.minimum * .7 ? 'P1' : low(row) ? 'P2' : '';
}

function operationStats(rows, isCost) {
  const sites = new Set(rows.map((row) => row.site)).size;
  if (isCost) {
    const actual = sum(rows, 'actualCost'), ideal = sum(rows, 'idealCost');
    return kpis([
      { label: 'Costo observado', value: bigMoney(actual), note: 'Consumo por costo unitario' },
      { label: 'Desviación vs. ideal', value: (actual > ideal ? '+' : '') + bigMoney(actual - ideal), note: 'Observado menos ideal', tone: actual > ideal ? 'alert' : 'ok' },
      { label: 'Costo ideal', value: bigMoney(ideal), note: 'Consumo teórico del escenario' },
      { label: 'Ítems en revisión', value: number(count(rows, costReview)), note: 'Desvío absoluto mayor a 12%', tone: 'warn' },
      { label: 'Restaurantes con datos', value: number(sites), note: 'Corte seleccionado', tone: 'ok' },
    ], 5);
  }
  return kpis([
    { label: 'Restaurantes con datos', value: number(sites), note: 'En el corte seleccionado', tone: 'ok' },
    { label: 'Ítems en revisión', value: number(count(rows, low)), note: number(rows.length) + ' ítems evaluados', tone: 'warn' },
    { label: 'Alertas P0', value: number(count(rows, (row) => stockSeverity(row) === 'P0')), note: 'Sin existencias', tone: 'alert' },
    { label: 'Alertas P1', value: number(count(rows, (row) => stockSeverity(row) === 'P1')), note: 'Por debajo del 70% del mínimo', tone: 'warn' },
    { label: 'Alertas P2', value: number(count(rows, (row) => stockSeverity(row) === 'P2')), note: 'Por debajo del mínimo', tone: 'warn' },
  ], 5);
}

function stockTable(rows) {
  return table(['Restaurante', 'Código', 'Artículo', 'Categoría', 'Existencia', 'Mínimo', 'Valor', 'Estado'], rows.map((row) => [
    e(nameOf(row)), e(row.code), e(row.name), e(row.category), e(number(row.quantity) + ' ' + row.unit),
    e(number(row.minimum) + ' ' + row.unit), e(money(row.value)), pill(stockSeverity(row) || 'En rango', low(row) ? 'warn' : 'ok'),
  ]), 'Existencias por artículo');
}

function costTable(rows) {
  return table(['Restaurante', 'Artículo', 'Consumo observado', 'Consumo ideal', 'Costo observado', 'Costo ideal', 'Desviación'], rows.map((row) => [
    e(nameOf(row)), e(row.name), e(number(row.actualUse) + ' ' + row.unit), e(number(row.idealUse) + ' ' + row.unit),
    e(money(row.actualCost)), e(money(row.idealCost)), pill(money(row.actualCost - row.idealCost), costReview(row) ? 'warn' : ''),
  ]), 'Costos por artículo');
}

export function renderOperations(f, { url }, isCost) {
  const exported = operationData(f, isCost), { rows, date } = exported;
  const route = isCost ? 'costos' : 'inventario';
  const review = isCost ? costReview : low;
  const metric = isCost ? 'actualCost' : 'value';
  const name = isCost ? 'Costos por restaurante' : 'Inventario por restaurante';
  const sites = group(rows, 'site', SITES, (items) => ({ items: items.length, flagged: count(items, review), value: sum(items, metric) }))
    .filter(({ items }) => items).sort((a, b) => b.flagged - a.flagged);
  const siteRows = sites.map((site) => [
    link(siteName(site), url(route, { ...f, site: site.id, tab: isCost ? 'restaurantes' : 'existencias' }), 'text-button'),
    e(site.city), e(number(site.items)), e(number(site.flagged)), e(money(site.value)),
  ]);
  const siteColumns = ['Restaurante', 'Ciudad', 'Ítems', 'En revisión', isCost ? 'Costo observado' : 'Valor de inventario'];
  const title = isCost ? 'Costos del corte disponible' : 'Inventario del corte disponible';
  const note = date ? rangeText(f) + ' · Corte ' + fullDate(date) : rangeText(f);
  const withData = date && rows.length;
  let content;
  if (!withData) {
    content = empty('Sin registros en el alcance', date ? 'Ajusta los filtros para consultar el corte disponible.' : 'El rango no contiene un corte de inventario. Consulta las fechas en Calidad de datos.');
  } else if (f.tab === 'resumen') {
    const grouped = group(rows, 'category', STOCK_CATEGORIES, (items) => ({ value: count(items, review) }));
    content = operationStats(rows, isCost)
      + `<div class="split split-wide">${panel(isCost ? 'Restaurantes con desvíos de costos' : 'Restaurantes con excepciones de stock',
        'Primero los restaurantes con más ítems en revisión.', table(siteColumns, siteRows, name),
        button(isCost ? 'Abrir restaurantes' : 'Abrir stock', 'data-tab="' + (isCost ? 'restaurantes' : 'existencias') + '"'))}
      ${panel(isCost ? 'Desvíos por categoría' : 'Causas de alerta o revisión', 'Ítems que superan el umbral de revisión.', barList(grouped))}</div>`;
  } else if (f.tab === 'restaurantes') {
    content = panel(name, note, table(siteColumns, siteRows, name))
      + (isCost ? panel('Detalle de costos', 'Consumo observado e ideal por artículo.', costTable(rows)) : '');
  } else if (f.tab === 'existencias') {
    const p = pager(f.page, 12, rows.length);
    content = panel('Existencias por artículo', note, stockTable(rows.slice(p.start, p.end)) + p.html,
      tabs([['all', 'Todos'], ['low', 'Bajo mínimo']], f.low ? 'low' : 'all', 'stock', 'small-tabs', 'Estado de existencias'));
  } else {
    content = operationStats(rows, isCost) + panel('Ítems en revisión', isCost ? 'Desviación absoluta superior al 12% del costo ideal.' : 'Existencias por debajo del mínimo.',
      isCost ? costTable(rows.filter(review)) : stockTable(rows.filter(review)));
  }
  if (f.tab === 'existencias' && !withData && f.low) {
    content = panel('Existencias por artículo', note, content,
      tabs([['all', 'Todos'], ['low', 'Bajo mínimo']], 'low', 'stock', 'small-tabs', 'Estado de existencias'));
  }
  if (f.tab === 'calidad') content = panel('Cobertura de cortes', 'Cada consulta usa el último corte disponible dentro del rango.',
    table(['Fecha de corte', 'Alcance de costos'], textRows(STOCK_DATES.map((day) => [fullDate(day), fullDate(monthStart(day)) + ' al ' + fullDate(day)])), 'Cortes disponibles')) + content;
  return { exported, html: tabsPanel(isCost ? COST_VIEWS : INVENTORY_VIEWS, f.tab, isCost ? 'Vistas de Costos' : 'Vistas de Inventario')
    + operationalFilter(f, isCost)
    + (isCost ? downloadBand('Universo de artículos y costos', number(rows.length) + ' filas · restaurantes del filtro', 'CSV de costos completo', rows.length) : '')
    + strip(title, note + ' · ' + number(rows.length) + ' ítems', pill(date ? 'Corte simulado' : 'Sin corte', date ? 'accent' : 'warn'), date ? 'info' : 'warn') + content
    + (!isCost && f.tab === 'existencias' && rows.length ? '<div class="actions align-end">' + exportButton('CSV de existencias', rows.length, '') + '</div>' : '') };
}

function supportFilter(f) {
  const detail = f.tab !== 'resumen';
  return `<form class="panel filter-panel support-filter" data-filter aria-label="Filtros de tickets">
    <div class="filter-grid support-grid">
      ${select('status', 'Estado', STATUSES, f.status, 'Todos')}
      ${select('priority', 'Prioridad', PRIORITIES, f.priority, 'Todas')}
      ${select('category', 'Categoría', CATEGORIES, f.category, 'Todas')}
      ${searchField('search', 'Buscar por ID o nombre', f.search, 'Ej.: PO-4701, red, sede')}
      ${rangeFields(f, 'F. creación desde', 'F. creación hasta')}</div>
    <div class="filter-actions${detail || f.type !== 'all' || f.site !== 'all' ? ' extended' : ''}">
      ${detail || f.type !== 'all' || f.site !== 'all' ? select('type', 'Tipo', TYPES, f.type, 'Todos') + siteSelect(f) : ''}
      <div class="actions">${reset()}${submit()}</div></div></form>`;
}

export function supportData(f) {
  const rows = supportRows(f);
  return { rows, filename: 'pulso-soporte.csv',
    columns: ['Ticket', 'Fecha de creación', 'Restaurante', 'Asunto', 'Tipo', 'Categoría', 'Estado', 'Prioridad', 'Horas de resolución'],
    records: rows.map((row) => [row.id, row.date, nameOf(row), row.subject, findName(TYPES, row.type),
      findName(CATEGORIES, row.category), findName(STATUSES, row.status), findName(PRIORITIES, row.priority), row.resolutionHours]) };
}

function supportKpis(summary, f) {
  const share = summary.total ? summary.pending / summary.total : null;
  return kpis([
    { label: 'Total tickets', value: number(summary.total), note: f.from === FIRST_DATE && f.to === LAST_DATE ? 'Histórico de la demo' : 'Creados dentro del rango' },
    { label: 'Abiertos', value: number(summary.pending), note: share === null ? 'Sin tickets' : percent(share) + ' del total', tone: 'warn' },
    { label: 'Resueltos', value: number(summary.resolved), note: summary.rate === null ? 'Sin tickets' : percent(summary.rate) + ' tasa', tone: 'ok' },
    { label: '% resolución', value: percent(summary.rate), note: 'Meta del escenario: 80%', tone: summary.rate >= .8 ? 'ok' : 'warn',
      extra: `<div class="mini-meter"><small>Resolución</small><progress aria-label="Tasa de resolución" max="100" value="${(summary.rate ?? 0) * 100}"></progress></div>` },
    { label: 'Mediana hrs', value: hours(summary.median), note: 'Tiempo de resolución' },
    { label: 'P95 hrs', value: hours(summary.p95), note: 'Percentil 95 de los resueltos', tone: 'alert' },
  ]);
}

export function renderSupport(f, { url }) {
  const exported = supportData(f), { rows } = exported, result = supportTotals(rows);
  let content;
  if (f.tab === 'detalle') {
    const p = pager(f.page, 12, rows.length);
    content = panel('Detalle de tickets', number(rows.length) + ' tickets · ' + rangeText(f),
      table(['Ticket', 'Asunto', 'Restaurante', 'Creación', 'Categoría', 'Estado', 'Prioridad', 'Resolución'],
        rows.slice(p.start, p.end).map((row) => [
          button(row.id, 'data-ticket="' + row.id + '"', 'text-button'), e(row.subject), e(nameOf(row)), e(fullDate(row.date)),
          e(findName(CATEGORIES, row.category)), pill(findName(STATUSES, row.status), statusTone[row.status]),
          pill(findName(PRIORITIES, row.priority), statusTone[row.priority]), e(hours(row.resolutionHours)),
        ]), 'Detalle de tickets') + p.html, exportButton('Exportar CSV', rows.length, ''));
  } else if (f.tab === 'sedes') {
    const sites = group(rows, 'site', SITES, supportTotals).filter((site) => site.total).sort((a, b) => b.total - a.total);
    content = kpis([
      { label: 'Restaurantes con tickets', value: number(sites.length) },
      { label: 'Tickets abiertos', value: number(result.pending), tone: 'warn' },
      { label: 'Tasa de resolución', value: percent(result.rate), tone: 'ok' },
    ]) + panel('Resultados por restaurante', 'Selecciona un restaurante para consultar sus tickets.',
      table(['Restaurante', 'Ciudad', 'Tickets', 'Abiertos', 'Resueltos', 'Tasa de resolución', 'Mediana'],
        sites.map((site) => [link(siteName(site), url('soporte', { ...f, site: site.id, tab: 'detalle', page: 1 }), 'text-button'),
          e(site.city), e(number(site.total)), e(number(site.pending)), e(number(site.resolved)), e(percent(site.rate)), e(hours(site.median))]), 'Tickets por restaurante'));
  } else {
    const categories = group(rows, 'category', CATEGORIES, supportTotals).sort((a, b) => b.total - a.total)
      .map((item) => ({ name: item.name, value: item.total, action: drill('category', item.id) }));
    const segments = group(rows, f.distribution, categoryFor[f.distribution], supportTotals)
      .map((item) => ({ ...item, value: item.total, action: drill(f.distribution, item.id) }));
    content = supportKpis(result, f)
      + `<div class="kpi-grid cols-4 mini-cards">${[
        ['30+', number(result.older30), 'Abiertos > 30 días', 'alert'], ['90+', number(result.older90), 'Abiertos > 90 días', 'warn'],
        ['✓', number(result.resolved), 'Resueltos con tiempo', 'ok'], ['AA', rows[0]?.date.slice(0, 4) ?? '—', 'Año máximo datos', ''],
      ].map(([symbol, value, label, tone]) => `<article class="panel mini-card ${tone}"><span class="icon-tile">${symbol}</span><div><strong>${value}</strong><small>${label}</small></div></article>`).join('')}</div>`
      + `<div class="split split-wide">${panel('Principales motivos de tickets', 'Selecciona una categoría para ver el detalle.', rankedBars(categories))}
        ${panel('Distribución', 'Selecciona un segmento para ver sus tickets.',
          tabs(DISTRIBUTIONS, f.distribution, 'distribution', 'small-tabs', 'Distribuir tickets por') + distributionList(segments))}</div>`;
  }
  return { exported, html: tabsPanel(SUPPORT_VIEWS, f.tab, 'Vistas de GLPI') + supportFilter(f) + content };
}

export function ticketDetail(ticket) {
  return `<dl class="ticket-facts"><div><dt>Restaurante</dt><dd>${e(nameOf(ticket))}</dd></div>
    <div><dt>Fecha de creación</dt><dd>${fullDate(ticket.date)}</dd></div><div><dt>Categoría</dt><dd>${e(findName(CATEGORIES, ticket.category))}</dd></div>
    <div><dt>Tipo</dt><dd>${e(findName(TYPES, ticket.type))}</dd></div><div><dt>Estado</dt><dd>${pill(findName(STATUSES, ticket.status), statusTone[ticket.status])}</dd></div>
    <div><dt>Prioridad</dt><dd>${pill(findName(PRIORITIES, ticket.priority), statusTone[ticket.priority])}</dd></div>
    <div><dt>Tiempo de resolución</dt><dd>${e(hours(ticket.resolutionHours))}</dd></div></dl><p class="ticket-note">${e(ticket.detail)}</p>`;
}
