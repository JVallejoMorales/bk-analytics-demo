import {
  NETWORK, SITES, CHANNELS, CITIES, FORMATS, DISTRICTS, FAMILIES, FIRST_DATE, LAST_DATE,
  number, decimal, money, percent, compact, bigMoney, fullDate, shortDate, monthStart, dateList, shift,
  normalize, findName, commercialRows, totals, metricValue, group, comparison, productTotals,
  hourlyTotals, siteOptions, supportRows, supportTotals,
} from './data.js?v=2';
import {
  e, icon, METRICS, select, dateField, searchField, button, link, submit, reset, exportButton,
  pill, tabs, tabsPanel, empty, panel, strip, downloadBand, kpis, table, textRows, barList, donut,
  pager, trendMarkup, linePlot, chartColors,
} from './ui.js?v=2';

export const COMMERCIAL_VIEWS = [
  ['resumen', 'Resumen'], ['segmentos', 'Canales y segmentos'], ['restaurantes', 'Restaurantes'],
  ['tendencia', 'Tendencia diaria'], ['horas', 'Hora comercial'], ['calidad', 'Calidad de datos'],
];
export const PRODUCT_VIEWS = [['resumen', 'Resumen'], ['restaurantes', 'Restaurantes'], ['explorador', 'Explorador'], ['calidad', 'Calidad de datos']];
export const PERIODS = [{ id: 'mes', name: 'Mes a fecha' }, { id: '7', name: 'Últimos 7 días' },
  { id: '14', name: 'Últimos 14 días' }, { id: '30', name: 'Últimos 30 días' }, { id: 'manual', name: 'Rango personalizado' }];
const METRIC_TABS = Object.entries(METRICS).map(([id, item]) => [id, item.label]);

const siteLabel = (site) => site.name + ' · ' + site.code;
export const siteSelect = (f, all = 'Todos') => select('site', 'Restaurante', siteOptions(f).map((site) => ({ ...site, name: siteLabel(site) })), f.site, all);
export const rangeFields = (f, from = 'Fecha desde', to = 'Fecha hasta') => dateField('from', from, f.from, FIRST_DATE, LAST_DATE) + dateField('to', to, f.to, FIRST_DATE, LAST_DATE);
export const rangeText = (f) => fullDate(f.from) + ' al ' + fullDate(f.to);
const scope = (f) => (f.site === 'all' ? 'Todos los restaurantes' : findName(SITES, f.site)) + ' · ' + (f.channel === 'all' ? 'Todos los canales' : findName(CHANNELS, f.channel));
const fmt = (metric) => metric === 'orders' ? number : money;
const headline = (metric) => metric === 'orders' ? number : metric === 'sales' ? bigMoney : money;
const quotient = (a, b) => b > 0 && a != null ? a / b : null;
const delta = (a, b) => {
  const value = quotient(a, b);
  return value === null ? null : Math.round((value - 1) * 1000) / 1000 || 0;
};
const sum = (rows, key) => rows.reduce((amount, row) => amount + row[key], 0);

export function commercialData(f) {
  const rows = commercialRows(f);
  return { rows, filename: 'pulso-comercial.csv',
    columns: ['Fecha', 'Código', 'Restaurante', 'Ciudad', 'Canal', 'Ventas netas COP', 'Transacciones', 'Ticket promedio COP', 'Meta ventas COP', 'Meta transacciones'],
    records: rows.map((row) => {
      const site = SITES.find(({ id }) => row.site === id);
      return [row.date, site.code, site.name, site.city, findName(CHANNELS, row.channel), row.sales, row.orders,
        Number(metricValue(row, 'ticket')?.toFixed(2)), row.plannedSales, row.plannedOrders];
    }) };
}

export function productData(f) {
  const term = normalize(f.search);
  const rows = commercialRows(f).flatMap((row) => productTotals([row], f.family, term)
    .map((item) => ({ ...item, date: row.date, site: row.site, channel: row.channel })));
  return { rows, filename: 'pulso-productos.csv',
    columns: ['Fecha', 'Restaurante', 'Canal', 'Código', 'Producto', 'Familia', 'Unidades', 'Ventas COP'],
    records: rows.map((row) => [row.date, findName(SITES, row.site), findName(CHANNELS, row.channel), row.code, row.name, row.family, row.units, row.sales]) };
}

function scorecard(f, rows, previous, url) {
  const actual = totals(rows), reference = previous?.rows ? totals(previous.rows) : null;
  return `<section class="scorecard"><div class="section-heading scorecard-heading">
    <div><p class="eyebrow">Resumen ejecutivo</p><h2>Resultado comercial</h2></div>
    <div class="tags">${previous?.rows ? pill('Comparable: ' + shortDate(previous.from) + '–' + shortDate(previous.to), 'accent') : pill('Sin período comparable')}${pill(rangeText(f))}</div>
    </div><div class="kpi-grid cols-3">${Object.entries(METRICS).map(([id, meta]) => {
      const value = metricValue(actual, id), plan = metricValue(actual, id, true), before = reference && metricValue(reference, id);
      const attainment = quotient(value, plan), change = delta(value, before);
      return `<a class="panel score-tile" href="${e(url('comercial', { from: f.from, to: f.to, metric: id, site: f.site, channel: f.channel }))}">
        <div class="score-label"><span class="icon-tile">${icon(meta.icon)}</span><span><strong>${meta.label}</strong><small>${meta.note}</small></span>${icon('arrow')}</div>
        <strong class="kpi-value">${headline(id)(value)}</strong>
        <div class="score-compare"><div><small>Cumplimiento</small><strong class="${attainment === null ? '' : attainment >= 1 ? 'ok' : 'warn'}">${percent(attainment)}</strong><span>Meta ${headline(id)(plan)}</span></div>
        <div><small>Crecimiento</small><strong class="${change === null ? '' : change >= 0 ? 'ok' : 'alert'}">${change > 0 ? '+' : ''}${percent(change)}</strong><span>Comparable ${headline(id)(before)}</span></div></div>
      </a>`;
    }).join('')}</div></section>`;
}

function periodBlock(title, eyebrow, f, url) {
  const rows = commercialRows(f), previous = comparison(f, f.from, f.to);
  return `<section class="period-block" aria-label="${title}"><div class="section-heading">
    <div><p class="eyebrow">${eyebrow}</p><h2>${title}</h2></div>${pill(f.from === f.to ? fullDate(f.to) : rangeText(f))}</div>
    ${strip('Datos de demostración', rangeText(f) + ' · ' + scope(f), link('Cobertura y actualización', url('comercial', { from: f.from, to: f.to, tab: 'calidad' }), 'text-button', 'arrow'), 'ok')}
    ${rows.length ? scorecard(f, rows, previous, url) : empty('Sin resultados', 'No hay datos para este día y restaurante.')}</section>`;
}

export function renderHome(f, ctx) {
  const { url, profile, allow } = ctx;
  const daily = { ...f, from: f.to };
  const startOfMonth = monthStart(f.to);
  const monthly = { ...f, from: startOfMonth < FIRST_DATE ? FIRST_DATE : startOfMonth };
  const hasCommercial = allow('comercial');
  const hasSupport = allow('soporte');
  const homeTickets = hasSupport ? supportRows({ ...f, from: FIRST_DATE, status: 'all', priority: 'all', category: 'all', type: 'all', search: '' }) : [];
  const summary = hasCommercial ? totals(commercialRows(monthly)) : supportTotals(homeTickets);
  const ordered = hasCommercial
    ? group(commercialRows(monthly), 'site', SITES).filter((site) => site.orders)
      .sort((a, b) => quotient(a.sales, a.plannedSales) - quotient(b.sales, b.plannedSales))
    : group(homeTickets, 'site', SITES, supportTotals).filter((site) => site.total).sort((a, b) => b.pending - a.pending);
  const review = ordered.map((site) => [
    link(siteLabel(site), url(hasCommercial ? 'comercial' : 'soporte', { site: site.id, ...(hasCommercial ? { from: monthly.from, to: monthly.to, tab: 'restaurantes' } : { tab: 'detalle' }) }), 'text-button'),
    e(site.city), hasCommercial ? e(bigMoney(site.sales)) : e(number(site.total)),
    hasCommercial ? pill(percent(quotient(site.sales, site.plannedSales)), site.sales < site.plannedSales ? 'warn' : 'ok') : e(number(site.pending)),
  ]);
  return { html: `<div class="home-head"><div><p class="eyebrow">Pulso Operativo</p><h1>Resumen de la red</h1>
    <p>Resultado del día, avance del mes y restaurantes por revisar.</p></div>
    <div class="heading-actions">${button('Análisis por equipo', 'data-scroll="analisis-por-equipo"')}
      ${link('Datos y descargas', url('explorador', { from: f.to, to: f.to, dataset: hasCommercial ? 'comercial' : 'soporte' }), 'primary', 'download')}
      <div class="session"><small>Sesión de demo</small><strong>Perfil ${e(profile)}</strong></div></div></div>
    <form class="panel filter-panel home-filter" data-filter aria-label="Filtros del resumen diario"><div class="filter-grid">
      ${dateField('to', 'Fecha del reporte', f.to, FIRST_DATE, LAST_DATE)}
      ${siteSelect(f, NETWORK + ' · Todos los restaurantes')}
      ${button('Último cierre · todos', 'data-reset', 'quiet')}</div>
      <p class="filter-note">El día y el acumulado del mes usan el mismo restaurante. Las descargas conservan el alcance seleccionado.</p></form>
    ${hasCommercial ? periodBlock('Resultado del día', 'Reporte diario', daily, url) + periodBlock('Avance del mes', 'Acumulado mensual', monthly, url) :
      kpis([{ label: 'Tickets recibidos', value: number(summary.total) }, { label: 'Abiertos', value: number(summary.pending), tone: 'warn' }, { label: 'Resueltos', value: number(summary.resolved), tone: 'ok' }])}
    ${panel('Restaurantes por revisar', hasCommercial ? 'Ordenados por cumplimiento de la meta de ventas del mes.' : 'Ordenados por solicitudes pendientes.',
      table(['Restaurante', 'Ciudad', hasCommercial ? 'Ventas netas' : 'Tickets', hasCommercial ? 'Cumplimiento' : 'Abiertos'], review, 'Restaurantes por revisar'))}
    <section id="analisis-por-equipo" class="team-links"><div><p class="eyebrow">Accesos directos</p><h2>Análisis por equipo</h2></div><div class="split">
      ${hasCommercial ? panel('Comercial', 'Ventas, transacciones y mezcla de productos.', '<div class="actions">' + link('Resultados comerciales', url('comercial'), '', 'trend') + link('Producto y mix', url('productos'), '', 'box') + '</div>') : ''}
      ${hasSupport || allow('inventario') ? panel('Operación', 'Existencias, costos y tickets de soporte.', '<div class="actions">' +
        (allow('inventario') ? link('Inventario', url('inventario'), '', 'inventory') + link('Costos', url('costos'), '', 'money') : '') +
        (hasSupport ? link('GLPI', url('soporte'), '', 'support') : '') + '</div>') : ''}</div></section>` };
}

function siteRail(f, url) {
  const term = normalize(f.rail);
  const sites = siteOptions(f).filter((site) => normalize(siteLabel(site)).includes(term));
  return `<aside class="panel restaurant-rail" aria-label="Listado de restaurantes"><h2>Restaurantes</h2><p>${SITES.length} en el catálogo de la demo</p>
    <form class="stack compact" data-filter aria-label="Buscar restaurantes">
      ${select('district', 'Buscar por distrital', DISTRICTS, f.district, 'Todos los distritales')}
      ${searchField('rail', 'Buscar restaurante', f.rail, 'Nombre o código')}
      ${submit('Buscar')}</form>
    <p class="muted rail-note">El distrital acota el listado. El resultado cambia al elegir un restaurante.</p>
    <div class="rail-sites">${[{ id: 'all', name: NETWORK + ' · Todos' }, ...sites].map((site) =>
      `<a class="rail-link${f.site === site.id ? ' active' : ''}" href="${e(url('comercial', { ...f, site: site.id }))}"${f.site === site.id ? ' aria-current="true"' : ''}>
        <span>${e(site.name)}</span>${site.code ? `<small>${site.code}</small>` : ''}</a>`).join('')}</div></aside>`;
}

function commercialFilter(f) {
  const period = PERIODS.find(({ id }) => id === 'mes' ? f.from === monthStart(f.to) && f.to === LAST_DATE
    : id !== 'manual' && f.from === shift(LAST_DATE, 1 - Number(id)) && f.to === LAST_DATE)?.id ?? 'manual';
  return `<form class="panel commercial-filter" data-filter aria-label="Filtros comerciales"><div class="filter-top">
    <div class="filter-scope"><span class="icon-tile">${icon('filters')}</span><div><span>Serie operativa</span><strong>${rangeText(f)}</strong><small>${e(scope(f))}</small></div></div>
    <div class="actions">${select('period', 'Período', PERIODS, period, null, 'aria-label="Período rápido"')}${reset()}</div></div>
    <div class="filter-grid filter-five">${rangeFields(f)}${select('city', 'Ciudad', CITIES, f.city, 'Todas')}
      ${select('channel', 'Canal', CHANNELS, f.channel, 'Todos')}${siteSelect({ ...f, district: 'all' })}</div>
    <details${f.format !== 'all' ? ' open' : ''}><summary>Más filtros: formato ${icon('chevron')}</summary>
      <div class="filter-grid">${select('format', 'Formato', FORMATS, f.format, 'Todos')}</div></details></form>`;
}

function byDate(rows, dates) {
  return dates.map((date) => ({ date, ...totals(rows.filter((row) => row.date === date)) }));
}

function detailTable(title, sub, groups, metric, href) {
  const columns = ['Segmento', METRICS[metric].label, 'Meta', 'Cumplimiento', 'Transacciones'];
  const rows = groups.filter((item) => item.orders).map((item) => {
    const value = metricValue(item, metric), plan = metricValue(item, metric, true);
    return [href ? link(item.name, href(item), 'text-button') : e(item.name), e(fmt(metric)(value)),
      e(fmt(metric)(plan)), pill(percent(quotient(value, plan)), value >= plan ? 'ok' : 'warn'), e(number(item.orders))];
  });
  return panel(title, sub, table(columns, rows, title));
}

function coverage(rows, f, itemCount = '') {
  const dates = new Set(rows.map((row) => row.date)), sites = new Set(rows.map((row) => row.site));
  return kpis([{ label: 'Días con datos', value: dates.size, note: rangeText(f), tone: 'ok' },
    { label: 'Restaurantes', value: sites.size, note: 'Con registros en el rango' },
    { label: itemCount ? 'Líneas de producto' : 'Filas de origen', value: number(itemCount || rows.length), note: 'Serie generada para la demo' }]);
}

export function renderCommercial(f, { url }) {
  const metric = f.metric, detail = f.tab;
  const exported = commercialData(f), rows = exported.rows;
  const reference = comparison(f, f.from, f.to);
  const dates = dateList(f.from, f.to);
  const current = byDate(rows, dates);
  const comparable = reference.rows ? byDate(reference.rows, dateList(reference.from, reference.to)) : [];
  const trend = rows.length && ['resumen', 'tendencia'].includes(detail) ? {
    dates, current: current.map((row) => metricValue(row, metric) ?? 0), previous: comparable.map((row) => metricValue(row, metric) ?? 0),
    format: fmt(metric), axis: (value) => (metric === 'orders' ? '' : '$') + compact(value),
  } : null;
  const byChannel = group(rows, 'channel', CHANNELS);
  const bySite = group(rows, 'site', SITES);
  const selectedSite = SITES.find(({ id }) => id === f.site);
  const trendPanel = trend ? panel('Tendencia diaria · ' + METRICS[metric].label, rangeText(f), trendMarkup(comparable.length > 0)) : '';
  const grouping = (key, options) => options.map((option) => ({ ...option, ...totals(rows.filter((row) =>
    SITES.find(({ id }) => row.site === id)?.[key] === option.id)) }));
  let content = '';
  if (detail === 'calidad') {
    content = coverage(rows, f) + panel('Cobertura y actualización', 'Fuente: escenario sintético de Pulso Operativo.',
      table(['Serie', 'Desde', 'Hasta', 'Frecuencia'], textRows([['Resultados comerciales', fullDate(FIRST_DATE), fullDate(LAST_DATE), 'Diaria por restaurante y canal']]), 'Cobertura comercial'));
  } else if (!rows.length) {
    content = empty('Sin datos comerciales', 'Revisa las fechas o el restaurante, ciudad, formato y canal seleccionados.');
  } else if (detail === 'resumen') {
    const channelItems = byChannel.map((item) => ({ ...item, value: metricValue(item, metric) ?? 0 }));
    content = strip('Serie disponible', rangeText(f) + ' · Datos ficticios', button('Cobertura y actualización', 'data-tab="calidad"', 'text-button', 'arrow'), 'ok')
      + scorecard(f, rows, reference, url)
      + `<div class="split split-wide">${trendPanel}${panel('Por canal', METRICS[metric].label, metric === 'ticket'
        ? barList(channelItems, fmt(metric)) : donut(channelItems, headline(metric)(metricValue(totals(rows), metric)), headline(metric)))}</div>`
      + detailTable('Resultados por restaurante', scope(f), bySite, metric, (item) => url('comercial', { ...f, site: item.id, tab: 'restaurantes' }));
  } else if (detail === 'segmentos') {
    content = detailTable('Por canal', rangeText(f), byChannel, metric)
      + `<div class="split">${detailTable('Por ciudad', scope(f), grouping('city', CITIES), metric)}
        ${detailTable('Por formato', scope(f), grouping('format', FORMATS), metric)}</div>`;
  } else if (detail === 'restaurantes') {
    const days = dates.slice(-7);
    content = detailTable('Restaurantes · acumulado', rangeText(f), bySite, metric, (item) => url('comercial', { ...f, site: item.id }))
      + panel('Matriz diaria por restaurante', 'Últimos ' + days.length + ' días del rango seleccionado', table(['Restaurante', ...days.map(shortDate)],
        textRows(bySite.filter((item) => item.orders).map((site) => [site.name, ...days.map((date) =>
          fmt(metric)(metricValue(totals(rows.filter((row) => row.date === date && row.site === site.id)), metric)))])), 'Matriz diaria'));
  } else if (detail === 'tendencia') {
    content = trendPanel + panel('Detalle diario', rangeText(f), table(['Fecha', 'Ventas netas', 'Transacciones', 'Ticket promedio'],
      textRows(current.toReversed().map((row) => [fullDate(row.date), money(row.sales), number(row.orders), money(metricValue(row, 'ticket'))])), 'Detalle diario'));
  } else if (detail === 'horas') {
    const points = hourlyTotals(rows).map((row) => ({ ...row, value: metricValue(row, metric) }));
    content = panel('Hora comercial', 'Distribución horaria simulada · 10:00 a 22:00', barList(points, fmt(metric)))
      + panel('Resultados por hora', rangeText(f), table(['Hora', 'Ventas netas', 'Transacciones', 'Ticket promedio'],
        textRows(points.map((row) => [row.name, money(row.sales), number(row.orders), money(metricValue(row, 'ticket'))])), 'Resultados por hora'));
  }

  return { exported, trend, html: `<div class="commercial-layout">${siteRail(f, url)}<div class="stack">
    <div class="commercial-heading panel"><p class="eyebrow">${NETWORK} · Resultados comerciales · ${METRICS[metric].label}</p>
      <h1>${e(selectedSite?.name ?? NETWORK)}</h1><p>${selectedSite ? e(selectedSite.code + ' · ' + selectedSite.city + ' · ' + selectedSite.format) : 'Todos los restaurantes disponibles para el alcance seleccionado'}</p><strong>${rangeText(f)}</strong></div>
    <div class="actions align-end">${link('Datos y descargas', url('explorador', { ...f, dataset: 'comercial' }), '', 'table')}</div>
    ${tabs(METRIC_TABS, metric, 'metric', 'underline', 'Indicador comercial')}
    ${commercialFilter(f)}
    <div class="commercial-view-tabs">${tabs([['resumen', 'Resumen'], ['segmentos', 'Detalle']], detail === 'resumen' ? 'resumen' : 'segmentos', 'tab', '', 'Nivel de análisis')}
      ${detail !== 'resumen' ? `<form data-filter>${select('tab', 'Ver', COMMERCIAL_VIEWS.slice(1).map(([id, name]) => ({ id, name })), detail, null, 'aria-label="Tipo de detalle"')}</form>` : ''}</div>
    ${content}</div></div>` };
}

function productFilter(f) {
  return `<form class="panel filter-panel" data-filter aria-label="Filtros de producto">
    <div class="filter-grid filter-four">${rangeFields(f, 'F. desde', 'F. hasta')}${select('channel', 'Canal', CHANNELS, f.channel, 'Todos')}${siteSelect(f)}
      ${select('city', 'Ciudad', CITIES, f.city, 'Todas')}${select('format', 'Formato', FORMATS, f.format, 'Todos')}
      ${select('family', 'Familia', FAMILIES, f.family, 'Todas')}</div>
    <div class="search-actions">${searchField('search', 'Buscar producto o código', f.search, 'Código visible o producto')}${submit()}</div>
    <div class="filter-actions">${reset()}${tabs([['diaria', 'Serie diaria'], ['historica', 'Histórico']], f.series, 'series', 'small-tabs', 'Fuente de producto')}</div></form>`;
}

function productTable(products, units, pagination) {
  return table(['Código', 'Producto', 'Familia', 'Unidades', 'Participación', 'Ventas netas'],
    textRows(products.slice(pagination.start, pagination.end).map((item) => [
      item.code, item.name, item.family, number(item.units), percent(quotient(item.units, units)), money(item.sales),
    ])), 'Productos del filtro') + pagination.html;
}

function productIntervals(rows, period) {
  const groupDate = (date) => period === 'mes' ? monthStart(date) : shift(date, -((new Date(date).getUTCDay() + 6) % 7));
  const buckets = new Map();
  for (const row of rows) {
    const key = groupDate(row.date);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(row);
  }
  return [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, items]) => {
    const active = new Set(items.map(({ site }) => site)).size;
    const days = new Set(items.map((row) => row.date)).size;
    const siteDays = new Set(items.map((row) => row.date + '|' + row.site)).size;
    const units = sum(items, 'units');
    const categories = group(items, 'family', FAMILIES, (family) => ({ units: sum(family, 'units') }));
    return { date, items, active, days, siteDays, units, categories, auv: units / siteDays };
  });
}

function productTrend(rows, f, url) {
  const weeks = productIntervals(rows, 'semana');
  const last = weeks.at(-1);
  const sequential = weeks.map((week, index) => {
    const prior = weeks[index - 1];
    return week.days === 7 && prior?.days === 7 && week.active === prior.active ? delta(week.auv, prior.auv) : null;
  });
  const families = last.categories.filter((item) => item.units)
    .map((item, index) => ({ name: item.name, value: item.units / last.siteDays, color: chartColors[index] }));
  const points = [
    { name: 'AUV total', color: '#5751a6', values: weeks.map((week) => week.auv) },
    { name: 'Secuencial semanal', color: '#a0334f', values: sequential, secondary: true },
  ];
  const facts = [['AUV último corte', decimal(last.auv)], ['Variación secuencial', percent(sequential.at(-1))],
    ['Unidades último corte', number(last.units)], ['Base último corte', last.days + ' días · ' + last.active + ' restaurantes']];
  return panel('AUV de unidades por semana', 'Unidades por día con datos y restaurante en el alcance.', `<div class="snapshot-facts">${facts.map(([label, value]) =>
    '<div><small>' + e(label) + '</small><strong>' + e(value) + '</strong></div>').join('')}</div>
    <div class="split split-wide chart-split"><div><h3>Tendencia AUV total</h3>
    ${linePlot(weeks.map((week) => shortDate(week.date)), points, 'AUV y variación secuencial por semana')}
    <details class="chart-data"><summary>Ver valores de la serie</summary>${table(['Semana desde', 'AUV', 'Variación secuencial', 'Días', 'Restaurantes'],
      textRows(weeks.map((week, index) => [fullDate(week.date), decimal(week.auv), percent(sequential[index]), week.days, week.active])), 'Valores semanales')}</details></div>
    <div><h3>Composición último corte</h3>${barList(families, (value) => decimal(value) + ' AUV')}</div></div>
    <p class="filter-note">La variación compara dos semanas completas con la misma cantidad de restaurantes.</p>`,
    link('Abrir análisis de producto', url('drivers', f), 'text-button', 'arrow'));
}

function productMonthly(rows) {
  const months = productIntervals(rows, 'mes');
  const series = FAMILIES.map((family, index) => ({ name: family.name, color: chartColors[index],
    values: months.map((month) => month.categories.find(({ id }) => id === family.id).units) }));
  return panel('Unidades por mes y familia', 'Tendencia mensual de las líneas del filtro.',
    linePlot(months.map(({ date }) => date.slice(0, 7)), series, 'Unidades mensuales por familia')
    + '<details class="chart-data"><summary>Ver valores de la serie</summary>'
    + table(['Mes', ...FAMILIES.map(({ name }) => name)], textRows(months.map((month, i) => [
      month.date.slice(0, 7), ...series.map((item) => number(item.values[i])),
    ])), 'Valores mensuales') + '</details>');
}

function productHierarchy(products, units) {
  return panel('Jerarquía de producto', 'Abre una familia para ver los productos del filtro.',
    FAMILIES.map(({ name }) => {
      const items = products.filter((item) => item.family === name);
      return items.length ? `<details class="hierarchy-row"${products.length === 1 ? ' open' : ''}>
        <summary>${icon('chevron')}<strong>${e(name)}</strong><span>${number(sum(items, 'units'))} unidades</span></summary>
        ${productTable(items, units, { start: 0, end: items.length, html: '' })}</details>` : '';
    }).join(''));
}

export function renderProducts(f, { url }) {
  const exported = productData(f), rows = exported.rows;
  const products = productTotals(commercialRows(f), f.family, f.search);
  const units = sum(products, 'units'), sales = sum(products, 'sales'), active = new Set(rows.map((row) => row.site)).size;
  const siteDays = new Set(rows.map((row) => row.date + '|' + row.site)).size;
  const days = new Set(rows.map((row) => row.date)).size;
  let content;
  if (f.tab === 'calidad') {
    content = coverage(rows, f, rows.length) + panel('Integridad de la carga', 'Controles del escenario de demostración.',
      table(['Control', 'Resultado'], textRows([
        ['Códigos de producto visibles', products.length], ['Ventas netas de líneas filtradas', money(sum(rows, 'sales'))],
        ['Coincidencia entre totales de líneas y productos', sum(rows, 'sales') === sales ? 'Conforme' : 'Revisar'],
      ]), 'Controles de Producto y mix'));
  } else if (!rows.length) {
    content = empty('Sin datos de producto', 'Revisa el rango, el restaurante o el término de búsqueda.');
  } else if (f.tab === 'restaurantes') {
    const bySite = group(rows, 'site', SITES, (items) => ({ units: sum(items, 'units'), sales: sum(items, 'sales') }));
    content = panel('Producto y mix por restaurante', scope(f), table(['Restaurante', 'Ciudad', 'Unidades', 'Ventas netas'],
      bySite.filter((item) => item.units).map((item) => [link(siteLabel(item), url('productos', { ...f, site: item.id, tab: 'explorador' }), 'text-button'),
        e(item.city), e(number(item.units)), e(money(item.sales))]), 'Producto y mix por restaurante'));
  } else {
    const productList = productTable(products, units, pager(f.page, 6, products.length));
    content = f.tab === 'resumen' ? kpis([
      { label: 'Unidades PMix', value: number(units), note: 'Unidades de productos vendidos' },
      { label: 'AUV unidades', value: decimal(units / siteDays), note: 'Promedio diario por restaurante', tone: 'accent' },
      { label: 'Restaurantes activos', value: active, note: 'Dentro del alcance', tone: 'ok' },
      { label: 'Días seleccionados', value: days, note: rangeText(f) },
    ], 4) + (f.series === 'historica' ? productMonthly(rows) : productTrend(rows, f, url))
      + panel('Productos principales del filtro', rangeText(f) + ' · ' + scope(f), productList)
      : productMonthly(rows) + productHierarchy(products, units);
  }
  return { exported, html: tabsPanel(PRODUCT_VIEWS, f.tab, 'Vistas de Producto y mix') + productFilter(f)
    + downloadBand('PMix por restaurante y producto', rangeText(f) + ' · ' + scope(f), 'CSV PMix completo', rows.length) + content };
}

export function renderDrivers(f) {
  const current = productTotals(commercialRows(f));
  const previous = comparison(f, f.from, f.to);
  const base = new Map(previous.rows ? productTotals(previous.rows).map((item) => [item.id, item]) : []);
  const ordered = current.map((item) => ({ ...item, before: base.get(item.id) })).sort((a, b) =>
    (b.sales - (b.before?.sales ?? 0)) - (a.sales - (a.before?.sales ?? 0)));
  const columns = ['Producto', 'Familia', 'Unidades', 'Ventas actuales', 'Comparable', 'Variación'];
  return { html: `<form class="panel filter-panel" data-filter aria-label="Filtros de drivers"><div class="filter-grid filter-four">
    ${rangeFields(f)}${siteSelect(f)}${select('channel', 'Canal', CHANNELS, f.channel, 'Todos')}</div><div class="filter-actions">${reset()}</div></form>
    ${strip('Variación de ventas por producto', previous.rows ? rangeText(f) + ' frente a ' + rangeText(previous) : 'No hay un período comparable completo para este rango.')}
    ${panel('Productos que explican la variación', 'Ordenados por el cambio en ventas netas.', table(columns, textRows(ordered.map((item) => [
      item.name, item.family, number(item.units), money(item.sales), money(item.before?.sales), item.before ? money(item.sales - item.before.sales) : '—',
    ])), 'Drivers de producto'))}` };
}
