import {
  SITES, CHANNELS, CATEGORIES, PRIORITIES, STATUSES, STOCK_DATE, commercialRows,
  compact, dailyTotals, decimal, findName, fullDate, groupCommercial, inventoryRows,
  metricValue, money, number, percent, period, productTotals, shortDate, supportRows,
  supportTotals, totals,
} from './data.js';

const METRICS = [
  { id: 'sales', name: 'Ventas netas', format: money, short: (value) => `$ ${compact(value)}`, axis: (value) => `$ ${compact(value)}` },
  { id: 'orders', name: 'Transacciones', format: number, short: number, axis: compact },
  { id: 'ticket', name: 'Ticket promedio', format: money, short: money, axis: (value) => `$ ${compact(value)}` },
];
const FAMILY_COLORS = ['#7252d4', '#15958a', '#cf9134'];
const PAGE_SIZE = 8;

function escapeHtml(value) {
  const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return value.replace(/[&<>"']/g, (character) => entities[character]);
}

function card(label, value, note, { tone = '', full = value, emphasized = false } = {}) {
  return `<article class="kpi${emphasized ? ' kpi-selected' : ''}">
    <p>${label}</p>
    <strong title="${full}">${value}</strong>
    <span class="kpi-note ${tone}">${note}</span>
  </article>`;
}

function metricCards(current, previous, active) {
  return METRICS.map((metric) => {
    const value = metricValue(current, metric.id);
    const previousValue = metricValue(previous, metric.id);
    const delta = previousValue ? (value / previousValue - 1) * 100 : null;
    const change = delta === null ? 'Período seleccionado'
      : `${delta < 0 ? '↓' : '↑'} ${percent(Math.abs(delta))} vs. anterior`;
    return card(metric.name, metric.short(value), change, {
      full: metric.format(value),
      tone: delta === null ? '' : delta < 0 ? 'negative' : 'positive',
      emphasized: active === metric.id,
    });
  }).join('');
}

function panel(title, body, subtitle = '', extraClass = '') {
  return `<section class="panel ${extraClass}">
    <header class="panel-heading"><h2>${title}</h2>${subtitle ? `<p>${subtitle}</p>` : ''}</header>
    ${body}
  </section>`;
}

function trendPanel(metric) {
  return panel('Evolución diaria', `
    <div class="chart-legend"><span><i></i>Período actual</span><span><i class="comparison"></i>Período anterior</span></div>
    <div class="trend-wrap">
      <canvas id="trend-chart" role="img" aria-label="Evolución diaria de ${metric.name.toLowerCase()}"></canvas>
      <output class="trend-tip" id="trend-tip" hidden></output>
    </div>`, metric.name);
}

function trendModel(rows, earlier, days, metric) {
  const dates = period(days).dates;
  const priorDates = period(days, days).dates;
  return {
    dates,
    current: dailyTotals(rows, dates).map((day) => metricValue(day, metric.id) ?? 0),
    previous: dailyTotals(earlier, priorDates).map((day) => metricValue(day, metric.id) ?? 0),
    axis: metric.axis,
    format: metric.format,
  };
}

function ringPanel(title, groups, valueLabel, centerLabel, format) {
  const sum = groups.reduce((total, group) => total + group.amount, 0);
  let cursor = 0;
  const stops = groups.filter((group) => group.amount > 0).map((group) => {
    const start = cursor;
    cursor += group.amount / sum * 100;
    return `${group.color} ${start}% ${cursor}%`;
  });
  const colors = stops.length ? `conic-gradient(${stops.join(', ')})` : '#edeef5';
  return panel(title, `
    <div class="ring-wrap">
      <div class="ring" style="--ring-colors:${colors}" aria-hidden="true"><div><strong>${valueLabel}</strong><span>${centerLabel}</span></div></div>
    </div>
    <ul class="ring-legend">
      ${groups.map((group) => `<li>
        <span><i style="--swatch:${group.color}"></i>${group.name}</span>
        <strong title="${format(group.amount)}">${sum ? percent(group.amount / sum * 100) : '0 %'}</strong>
      </li>`).join('')}
    </ul>`, '', 'ring-panel');
}

function table(headers, rows, caption) {
  if (!rows.length) return '<p class="empty-state">Ajusta los filtros para ver resultados.</p>';
  return `<div class="table-wrap" tabindex="0" role="region" aria-label="${caption}">
    <table><caption class="sr-only">${caption}</caption>
      <thead><tr>${headers.map((header) => `<th scope="col">${header}</th>`).join('')}</tr></thead>
      <tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>
  </div>`;
}

function amount(value, format = number) {
  return `<span class="numeric">${format(value)}</span>`;
}

function commercialTable(bySite, sortMetric) {
  const ordered = bySite.filter((site) => site.orders).sort((a, b) => metricValue(b, sortMetric) - metricValue(a, sortMetric));
  return table(['Sede', 'Ventas netas', 'Transacciones', 'Ticket promedio'], ordered.map((site) => [
    `<strong>${site.name}</strong>`, amount(site.sales, money), amount(site.orders), amount(metricValue(site, 'ticket'), money),
  ]), 'Resultados comerciales por sede');
}

function commercialExport(rows) {
  return {
    filename: 'pulso-comercial.csv',
    columns: ['Fecha', 'Sede', 'Canal', 'Ventas netas COP', 'Transacciones', 'Ticket promedio COP'],
    rows: rows.map((row) => [row.date, findName(SITES, row.site), findName(CHANNELS, row.channel), row.sales, row.orders, Math.round(metricValue(row, 'ticket'))]),
  };
}

function salesRing(rows) {
  const channels = groupCommercial(rows, 'channel', CHANNELS);
  return ringPanel('Ventas por canal', channels.map((channel) => ({ ...channel, amount: channel.sales })), `$ ${compact(totals(rows).sales)}`, 'Ventas netas', money);
}

function switcher(options, selected, attribute, label) {
  return `<div class="segmented" role="group" aria-label="${label}">${options.map((option) =>
    `<button type="button" ${attribute}="${option.id}" aria-pressed="${option.id === selected}">${option.name}</button>`).join('')}</div>`;
}

export function renderSummary(filters, showCommercial, showSupport) {
  const requests = showSupport ? supportRows(filters) : [];
  if (!showCommercial) {
    return { html: supportOverview(requests), export: supportExport(requests) };
  }
  const rows = commercialRows(filters);
  const prior = commercialRows(filters, filters.days);
  const summary = totals(rows);
  const siteRows = groupCommercial(rows, 'site', SITES);
  const top = METRICS[0];
  return {
    html: `<div class="kpi-grid">${metricCards(summary, totals(prior))}
      ${showSupport ? card('Solicitudes pendientes', number(supportTotals(requests).pending), 'Período y sede') : ''}
    </div>
    <div class="chart-grid">${trendPanel(top)}${salesRing(rows)}</div>
    ${panel('Rendimiento por sede', commercialTable(siteRows, 'sales'), 'Resultados del período seleccionado', 'table-panel')}`,
    trend: trendModel(rows, prior, filters.days, top),
    export: commercialExport(rows),
  };
}

export function renderCommercial(filters, selectedMetric) {
  const rows = commercialRows(filters);
  const prior = commercialRows(filters, filters.days);
  const metric = METRICS.find((option) => option.id === selectedMetric);
  const bySite = groupCommercial(rows, 'site', SITES);
  return {
    html: `${switcher(METRICS, selectedMetric, 'data-metric', 'Indicador comercial')}
      <div class="kpi-grid">${metricCards(totals(rows), totals(prior), selectedMetric)}</div>
      <div class="chart-grid">${trendPanel(metric)}${salesRing(rows)}</div>
      ${panel('Resultados por sede', commercialTable(bySite, selectedMetric), 'Ventas en COP y ticket calculado sobre las transacciones', 'table-panel')}`,
    trend: trendModel(rows, prior, filters.days, metric),
    export: commercialExport(rows),
  };
}

export function renderProducts(filters) {
  const products = productTotals(commercialRows(filters));
  const sales = products.reduce((sum, product) => sum + product.sales, 0);
  const units = products.reduce((sum, product) => sum + product.units, 0);
  const families = ['Platos', 'Bebidas', 'Postres'].map((name, index) => ({
    name, color: FAMILY_COLORS[index], amount: products.filter((product) => product.family === name).reduce((sum, product) => sum + product.sales, 0),
  }));
  const ranked = panel('Productos con mayor venta', `<ul class="ranking">${products.map((product) => {
    const share = sales ? product.sales / sales * 100 : 0;
    const length = products[0]?.sales ? product.sales / products[0].sales * 100 : 0;
    return `<li><div><strong>${product.name}</strong><span>${money(product.sales)}</span></div>
      <div class="bar-track"><span style="width:${length}%"></span></div>
      <p>${number(product.units)} unidades · ${percent(share)} de las ventas</p></li>`;
  }).join('')}</ul>`, 'Ordenados por venta neta');
  return {
    html: `<div class="kpi-grid">
      ${card('Unidades vendidas', number(units), 'Suma de los productos del período')}
      ${card('Ventas de productos', `$ ${compact(sales)}`, 'Cifras en COP', { full: money(sales) })}
      ${card('Productos con venta', number(products.filter((product) => product.units > 0).length), 'Referencias con unidades vendidas')}
    </div><div class="chart-grid">${ranked}${ringPanel('Mezcla por familia', families, `$ ${compact(sales)}`, 'Ventas netas', money)}</div>`,
    export: {
      filename: 'pulso-productos.csv',
      columns: ['Producto', 'Familia', 'Unidades', 'Ventas netas COP'],
      rows: products.map((product) => [product.name, product.family, product.units, product.sales]),
    },
  };
}

export function renderInventory(filters, lowOnly) {
  const all = inventoryRows(filters);
  const rows = lowOnly ? inventoryRows(filters, true) : all;
  const valuation = all.reduce((sum, item) => sum + item.value, 0);
  const low = all.filter((item) => item.quantity < item.minimum).length;
  return {
    html: `<div class="kpi-grid">
      ${card('Valor del inventario', `$ ${compact(valuation)}`, 'Existencias × costo unitario', { full: money(valuation) })}
      ${card('Referencias por sede', number(all.length), 'Registros del corte seleccionado')}
      ${card('Por debajo del mínimo', number(low), 'Registros que requieren atención', { tone: low ? 'negative' : '' })}
    </div>
    ${switcher([{ id: 'all', name: 'Todos' }, { id: 'low', name: 'Bajo mínimo' }], lowOnly ? 'low' : 'all', 'data-stock', 'Estado del inventario')}
    ${panel('Existencias por sede', table(['Artículo', 'Sede', 'Existencias', 'Mínimo', 'Costo unitario', 'Valor', 'Estado'], rows.map((item) => [
      `<strong>${item.name}</strong>`, findName(SITES, item.site), `${number(item.quantity)} ${item.measure}`, `${number(item.minimum)} ${item.measure}`,
      amount(item.unitCost, money), amount(item.value, money),
      item.quantity < item.minimum ? '<span class="badge badge-alert">Bajo mínimo</span>' : '<span class="badge badge-resuelta">Disponible</span>',
    ]), 'Existencias y costo unitario'), `Corte del escenario · ${fullDate(STOCK_DATE)}`, 'table-panel')}`,
    export: {
      filename: 'pulso-inventario.csv',
      columns: ['Fecha de corte', 'Artículo', 'Sede', 'Unidad', 'Existencias', 'Mínimo', 'Costo unitario COP', 'Valor COP'],
      rows: rows.map((item) => [STOCK_DATE, item.name, findName(SITES, item.site), item.measure, item.quantity, item.minimum, item.unitCost, item.value]),
    },
  };
}

function supportOverview(rows) {
  const summary = supportTotals(rows);
  const groups = STATUSES.map((status) => ({ ...status, amount: rows.filter((ticket) => ticket.status === status.id).length }));
  const priorities = PRIORITIES.map((priority) => ({ ...priority, amount: rows.filter((ticket) => ticket.priority === priority.id).length }));
  const maximum = Math.max(...priorities.map((priority) => priority.amount), 1);
  return `<div class="kpi-grid">
    ${card('Solicitudes', number(summary.total), 'Creadas en el período')}
    ${card('Pendientes', number(summary.pending), 'Abiertas o en curso')}
    ${card('Resueltas', number(summary.resolved), summary.total ? `${percent(summary.resolved / summary.total * 100)} del total` : 'Sin solicitudes')}
    ${card('Tiempo medio de resolución', summary.meanHours === null ? '—' : `${decimal(summary.meanHours)} h`, 'Solicitudes resueltas')}
  </div><div class="chart-grid support-grid">
    ${panel('Solicitudes por prioridad', `<ul class="ranking support-ranking">${priorities.map((priority) => `<li>
      <div><strong>${priority.name}</strong><span>${number(priority.amount)}</span></div>
      <div class="bar-track"><span style="width:${priority.amount / maximum * 100}%;background:${priority.color}"></span></div>
    </li>`).join('')}</ul>`, 'Según los filtros activos')}
    ${ringPanel('Distribución por estado', groups, number(summary.total), 'Solicitudes', number)}
  </div>`;
}

function options(items, selected) {
  return [{ id: 'all', name: 'Todas' }, ...items].map((item) => `<option value="${item.id}"${item.id === selected ? ' selected' : ''}>${item.name}</option>`).join('');
}

function supportFilters(support) {
  return `<form class="filters-panel support-filters" id="support-filters" aria-label="Filtros de solicitudes">
    <label class="field">Estado<select name="status">${options(STATUSES, support.status)}</select></label>
    <label class="field">Prioridad<select name="priority">${options(PRIORITIES, support.priority)}</select></label>
    <label class="field">Categoría<select name="category">${options(CATEGORIES, support.category)}</select></label>
    <label class="field search-field">Buscar<input name="search" type="search" maxlength="80" placeholder="Solicitud, asunto o sede" value="${escapeHtml(support.search)}"></label>
    <div class="filter-actions"><button type="submit" class="button button-primary">Aplicar</button>
      <button type="button" class="button button-quiet" data-clear-support>Limpiar</button></div>
  </form>`;
}

function ticketBadge(ticket) {
  return `<span class="badge badge-${ticket.status}">${findName(STATUSES, ticket.status)}</span>`;
}

function supportDetail(rows, page) {
  const maxPage = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, maxPage);
  const start = (current - 1) * PAGE_SIZE;
  const visible = rows.slice(start, start + PAGE_SIZE);
  const detail = table(['Solicitud', 'Sede', 'Categoría', 'Prioridad', 'Estado', 'Fecha'], visible.map((ticket) => [
    `<button class="text-button ticket-link" type="button" data-ticket="${ticket.id}" aria-label="Ver solicitud ${ticket.id}">${ticket.id}</button><span class="table-subtitle">${ticket.subject}</span>`,
    findName(SITES, ticket.site), findName(CATEGORIES, ticket.category), findName(PRIORITIES, ticket.priority), ticketBadge(ticket), shortDate(ticket.date),
  ]), 'Detalle de solicitudes');
  const pagination = rows.length > PAGE_SIZE ? `<nav class="pagination" aria-label="Páginas de solicitudes">
    <span>${start + 1}–${start + visible.length} de ${rows.length}</span>
    <div><button type="button" class="button button-outline" data-page="${current - 1}"${current === 1 ? ' disabled' : ''}>Anterior</button>
    <button type="button" class="button button-outline" data-page="${current + 1}"${current === maxPage ? ' disabled' : ''}>Siguiente</button></div>
  </nav>` : '';
  return panel('Detalle de solicitudes', detail + pagination, `${number(rows.length)} solicitudes encontradas`, 'table-panel');
}

function supportSites(rows) {
  const summaries = SITES.map((site) => ({ ...site, ...supportTotals(rows.filter((row) => row.site === site.id)) }))
    .filter((site) => site.total > 0).sort((a, b) => b.total - a.total);
  return panel('Solicitudes por sede', table(['Sede', 'Solicitudes', 'Pendientes', 'Resueltas', 'Detalle'], summaries.map((site) => [
    `<strong>${site.name}</strong>`, amount(site.total), amount(site.pending), amount(site.resolved),
    `<button class="text-button" type="button" data-support-site="${site.id}" aria-label="Ver solicitudes de ${site.name}">Ver detalle ↗</button>`,
  ]), 'Solicitudes agrupadas por sede'), 'Abre el detalle de cada sede', 'table-panel');
}

function supportExport(rows) {
  return {
    filename: 'pulso-solicitudes.csv',
    columns: ['Solicitud', 'Fecha de creación', 'Sede', 'Categoría', 'Asunto', 'Prioridad', 'Estado', 'Horas de resolución'],
    rows: rows.map((ticket) => [
      ticket.id, ticket.date, findName(SITES, ticket.site), findName(CATEGORIES, ticket.category), ticket.subject,
      findName(PRIORITIES, ticket.priority), findName(STATUSES, ticket.status), ticket.resolutionHours,
    ]),
  };
}

export function renderSupport(filters, support) {
  const rows = supportRows(filters, support);
  const tabs = [{ id: 'resumen', name: 'Resumen' }, { id: 'detalle', name: 'Detalle' }, { id: 'sedes', name: 'Sedes' }];
  let content = supportOverview(rows);
  if (support.tab === 'detalle') content = supportDetail(rows, support.page);
  if (support.tab === 'sedes') content = supportSites(rows);
  return {
    html: `${switcher(tabs, support.tab, 'data-support-tab', 'Vistas de soporte')}${supportFilters(support)}${content}`,
    export: supportExport(rows),
  };
}

export function ticketDetail(ticket) {
  return `<p>${ticket.detail}</p><dl class="ticket-facts">
    <div><dt>Sede</dt><dd>${findName(SITES, ticket.site)}</dd></div>
    <div><dt>Creada</dt><dd>${fullDate(ticket.date)}</dd></div>
    <div><dt>Estado</dt><dd>${ticketBadge(ticket)}</dd></div>
    <div><dt>Prioridad</dt><dd>${findName(PRIORITIES, ticket.priority)}</dd></div>
    <div><dt>Categoría</dt><dd>${findName(CATEGORIES, ticket.category)}</dd></div>
    ${ticket.resolutionHours === null ? '' : `<div><dt>Resolución</dt><dd>${decimal(ticket.resolutionHours)} horas</dd></div>`}
  </dl>`;
}

export function renderOrigin() {
  return {
    html: `<div class="origin-grid">
      <section class="panel origin-panel">
        <span class="demo-badge"><span aria-hidden="true"></span>Datos ficticios</span>
        <h2>De BK Analytics a Pulso Operativo</h2>
        <p>BK Analytics es una plataforma interna de Burger King Colombia. Pulso Operativo recrea sus recorridos de consulta y seguimiento con una identidad propia y datos ficticios para proteger la información operativa y la identidad visual de la empresa.</p>
        <a class="button button-primary" href="#resumen">Explorar la demo ↗</a>
      </section>
      <section class="panel origin-panel">
        <h2>Aporte de Juan José Vallejo</h2>
        <p>Diseñé la arquitectura y la interfaz del frontend. Implementé la navegación por sesión y permisos y desarrollé el módulo de análisis de soporte.</p>
        <h3>Perfiles de la demo</h3>
        <p>El selector superior permite explorar los módulos desde los perfiles General, Comercial y Soporte. Cada perfil ilustra una combinación de permisos.</p>
      </section>
    </div>`,
  };
}
