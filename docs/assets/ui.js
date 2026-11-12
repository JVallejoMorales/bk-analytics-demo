import { number, decimal, percent } from './data.js?v=2';

export const e = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]);

const paths = {
  mark: '<path d="M2 12h4l2.8-6 4.1 12 2.4-6H22"/>',
  home: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 3v18M3 11h18"/>',
  table: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M3 14h18M9 9v11"/>',
  trend: '<path d="M3 3v17h18M6 15l5-5 4 3 5-7"/>',
  box: '<path d="M3 7l9-4 9 4v10l-9 4-9-4zM3 7l9 4 9-4M12 11v10M8 5l9 4"/>',
  bars: '<path d="M4 3v17h16M8 16v-5m5 5V6m5 10V9"/>',
  inventory: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 5V3h8v2M7 10h10M7 14h10M7 18h6"/>',
  money: '<circle cx="12" cy="12" r="9"/><path d="M12 6v12M15 8.5h-4a1.75 1.75 0 0 0 0 3.5h2a1.75 1.75 0 0 1 0 3.5H9"/>',
  support: '<path d="M3 13a9 9 0 0 1 18 0v4a2 2 0 0 1-2 2h-2v-7h4M3 12h4v7H5a2 2 0 0 1-2-2zM17 19l-2 2h-3"/>',
  pin: '<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 1 1 5 2.2c-1.2.9-2 1.3-2 3M12 17h.01"/>',
  bell: '<path d="M5 17h14l-2-3V9a5 5 0 0 0-10 0v5zM10 20h4"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
  download: '<path d="M12 3v12m-4-4 4 4 4-4M4 15v5h16v-5"/>',
  calendar: '<rect x="4" y="6" width="16" height="15" rx="2"/><path d="M4 10h16M8 3v5m8-5v5"/>',
  filters: '<path d="M4 6h16M4 12h16M4 18h16M8 3v6m8 0v6m-6 0v6"/>',
  refresh: '<path d="M20 11a8 8 0 1 0-2 6M20 5v6h-6"/>',
  check: '<path d="M12 22s8-4 8-12V6l-8-3-8 3v4c0 8 8 12 8 12Z"/><path d="m8 12 3 3 5-6"/>',
  list: '<path d="m3 6 2 2 4-4m3 2h8M3 12l2 2 4-4m3 2h8M3 18l2 2 4-4m3 2h8"/>',
  search: '<circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/>',
  menu: '<path d="M3 5h18M3 12h18M3 19h18"/>',
  close: '<path d="m5 5 14 14M19 5 5 19"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8h.01"/>',
};
export const icon = (name, size = 16) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] ?? paths.info}</svg>`;

export const METRICS = {
  sales: { label: 'Ventas', note: 'Venta neta', icon: 'trend' },
  orders: { label: 'Transacciones', note: 'Tráfico registrado', icon: 'list' },
  ticket: { label: 'Ticket promedio', note: 'Venta neta por transacción', icon: 'money' },
};

export function select(name, label, items, selected, all, extra = '') {
  const options = all == null ? items : [{ id: 'all', name: all }, ...items];
  return `<label class="field">${e(label)}<select name="${name}" ${extra}>${options.map((item) =>
    `<option value="${e(item.id)}"${String(item.id) === String(selected) ? ' selected' : ''}>${e(item.name)}</option>`).join('')}</select></label>`;
}

export const dateField = (name, label, value, min, max) => `<label class="field">${e(label)}<input type="date" name="${name}" value="${e(value)}" min="${min}" max="${max}" required></label>`;
export const searchField = (name, label, value, hint) => `<label class="field">${e(label)}<span class="search-field">${icon('search')}<input type="search" name="${name}" value="${e(value)}" placeholder="${e(hint)}" maxlength="80"></span></label>`;
export const button = (label, dataset = '', kind = '', image = '', disabled = false) =>
  `<button class="button ${kind}" type="button" ${dataset}${disabled ? ' disabled' : ''}>${image ? icon(image) : ''}${e(label)}</button>`;
export const link = (label, href, kind = '', image = '') =>
  `<a class="button ${kind}" href="${e(href)}">${image ? icon(image) : ''}${e(label)}</a>`;
export const submit = (label = 'Buscar') => `<button class="button" type="submit">${icon('search')}${e(label)}</button>`;
export const reset = () => button('Limpiar', 'data-reset', 'quiet', 'refresh');
export const exportButton = (label, count, kind = 'primary') =>
  button(label, 'data-export', kind, 'download', !count);
export const pill = (content, tone = '') => `<span class="pill ${tone}">${e(content)}</span>`;
export const tabs = (items, selected, key = 'tab', variant = '', label = 'Vistas del módulo') =>
  `<div class="tabs ${variant}" role="group" aria-label="${e(label)}">${items.map(([id, name]) =>
    `<button type="button" data-${key}="${e(id)}" aria-pressed="${id === selected}">${e(name)}</button>`).join('')}</div>`;
export const tabsPanel = (items, selected, label) => tabs(items, selected, 'tab', 'boxed', label);
export const empty = (title, description) => `<section class="empty">${icon('info', 21)}<h2>${e(title)}</h2><p>${e(description)}</p></section>`;
export const panel = (title, sub, content, aside = '', css = '') =>
  `<section class="panel ${css}"><div class="section-heading"><div><h2>${e(title)}</h2>${sub ? `<p>${e(sub)}</p>` : ''}</div>${aside}</div>${content}</section>`;
export const strip = (title, sub, aside = '', tone = 'info') =>
  `<div class="status-strip ${tone}"><div><strong>${icon(tone === 'ok' ? 'check' : 'info')}${e(title)}</strong><span>${e(sub)}</span></div>${aside}</div>`;
export const downloadBand = (title, description, label, rows) => `<section class="download-band panel"><div><p class="eyebrow">Datos y descargas</p><h2>${e(title)}</h2><p>${e(description)}</p></div>${exportButton(label, rows)}</section>`;
export function kpis(items, columns = 3) {
  return `<div class="kpi-grid cols-${columns}">${items.map(({ label, value, note, tone = '', extra = '' }) =>
    `<article class="panel kpi ${tone}"><div class="kpi-label"><span>${e(label)}</span><span class="dot"></span></div>
      <strong class="kpi-value">${e(value)}</strong>${note ? `<p>${e(note)}</p>` : ''}${extra}</article>`).join('')}</div>`;
}

export function table(columns, rows, label) {
  if (!rows.length) return empty('Sin coincidencias', 'Prueba otro rango o ajusta los filtros.');
  return `<div class="table-scroll" role="region" aria-label="${e(label)}" tabindex="0"><table aria-label="${e(label)}">
    <thead><tr>${columns.map((heading) => `<th scope="col">${e(heading)}</th>`).join('')}</tr></thead>
    <tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

export const textRows = (rows) => rows.map((row) => row.map(e));

export const chartColors = ['#5751a6', '#1b897e', '#bf872b', '#9384c8', '#6f89ad', '#ad435e'];
export function barList(items, formatter = number) {
  if (!items.length || !items.some((item) => item.value > 0)) return empty('Sin datos', 'El alcance seleccionado no tiene registros.');
  const max = Math.max(...items.map(({ value }) => value), 1);
  return `<div class="bar-list">${items.map(({ name, value, color, action }, index) => {
    const inner = `<span class="bar-name">${e(name)}</span><span class="bar-track"><i style="--bar:${value * 100 / max}%;--tone:${color ?? chartColors[index % chartColors.length]}"></i></span><strong>${e(formatter(value))}</strong>`;
    return action ? `<button type="button" class="bar-row" ${action}>${inner}</button>` : `<div class="bar-row">${inner}</div>`;
  }).join('')}</div>`;
}

export function rankedBars(items) {
  const entries = items.filter((item) => item.value > 0);
  if (!entries.length) return empty('Sin categorías', 'Los filtros seleccionados no devuelven tickets.');
  const max = Math.max(...entries.map((item) => item.value));
  return '<div class="ranked-bars">' + entries.map(({ name, value, action }, i) => {
    const color = chartColors[i % chartColors.length];
    return `<button type="button" class="ranked-bar" ${action}><small>${String(i + 1).padStart(2, '0')}</small>
      <span><span class="legend-label"><i style="--tone:${color}"></i>${e(name)}</span>
      <span class="bar-track"><i style="--bar:${value * 100 / max}%;--tone:${color}"></i></span></span>
      <strong>${number(value)}</strong></button>`;
  }).join('') + '</div>';
}

export function distributionList(items) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  if (!total) return empty('Sin distribución', 'Los filtros seleccionados no devuelven segmentos.');
  return '<ul class="legend distribution-list">' + items.filter((item) => item.value > 0).map(({ name, value, color, action }) =>
    `<li><button type="button" class="legend-row" ${action}><span class="legend-label"><i style="--tone:${color}"></i>${e(name)}</span>
      <strong>${number(value)}</strong><small>${percent(value / total)}</small></button></li>`).join('') + '</ul>';
}

export function donut(items, center, formatter = number) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  if (!total) return empty('Sin datos', 'El alcance seleccionado no tiene registros.');
  let offset = 0;
  const mapped = items.map((item, index) => ({ ...item, color: item.color ?? chartColors[index % chartColors.length] }));
  const fills = mapped.map(({ value, color }) => {
    const from = offset;
    offset += 100 * value / total;
    return color + ' ' + from + '% ' + offset + '%';
  }).join(',');
  return `<div class="donut-layout"><div class="donut" style="--slices:${fills}" aria-hidden="true"><div><strong>${e(center)}</strong><span>Total</span></div></div>
    <ul class="legend">${mapped.map(({ name, value, color, action }) => {
    const row = `<span class="legend-label"><i style="--tone:${color}"></i>${e(name)}</span><strong>${e(formatter(value))}</strong><small>${percent(value / total)}</small>`;
    return `<li>${action ? `<button type="button" class="legend-row" ${action}>${row}</button>` : `<span class="legend-row">${row}</span>`}</li>`;
  }).join('')}</ul></div>`;
}

export function linePlot(labels, series, description) {
  const hasSecondary = series.some((item) => item.secondary && item.values.some(Number.isFinite));
  const max = Math.max(1, ...series.filter((item) => !item.secondary).flatMap((item) => item.values.filter(Number.isFinite)));
  const alt = Math.max(.02, ...series.filter((item) => item.secondary).flatMap((item) => item.values.filter(Number.isFinite).map(Math.abs)));
  const right = hasSecondary ? 517 : 556;
  const x = (i) => labels.length === 1 ? (55 + right) / 2 : 55 + (right - 55) * i / (labels.length - 1);
  const y = (value, secondary) => secondary ? 102 - 76 * value / alt : 190 - 164 * value / max;
  const ticks = [0, .25, .5, .75, 1].map((factor) => {
    const yy = y(max * factor, false);
    return `<path class="plot-grid" d="M55 ${yy}H${right}"/><text x="47" y="${yy + 4}" text-anchor="end">${number(max * factor)}</text>
      ${hasSecondary ? `<text class="plot-secondary" x="${right + 6}" y="${yy + 4}">${percent(alt * (102 - yy) / 76)}</text>` : ''}`;
  }).join('');
  const line = (item) => {
    let prev = null;
    const points = item.values.map((value, index) => {
      if (!Number.isFinite(value)) { prev = null; return ''; }
      const xx = x(index), yy = y(value, item.secondary);
      const path = prev ? `<path d="M${prev[0]} ${prev[1]}L${xx} ${yy}" stroke="${item.color}" stroke-width="2.5"${item.secondary ? ' stroke-dasharray="5 4"' : ''}/>` : '';
      prev = [xx, yy];
      return path + `<circle cx="${xx}" cy="${yy}" r="3.4" fill="${item.color}"><title>${e(labels[index] + ' · ' + item.name + ': ' + (item.secondary ? percent(value) : decimal(value)))}</title></circle>`;
    }).join('');
    return points;
  };
  const interval = Math.max(1, Math.ceil(labels.length / 7));
  return `<div class="plot-key">${series.map((item) =>
    `<span><i style="--tone:${item.color}"></i>${e(item.name)}</span>`).join('')}</div>
    <svg class="line-plot" viewBox="0 0 582 222" role="img" aria-label="${e(description)}">
      ${ticks}${series.map(line).join('')}${labels.map((label, i) => i % interval === 0 || i === labels.length - 1
      ? `<text x="${x(i)}" y="210" text-anchor="middle">${e(label)}</text>` : '').join('')}</svg>`;
}

export function pager(page, size, count) {
  if (!count) return { page: 1, start: 0, end: 0, html: '' };
  const max = Math.ceil(count / size);
  const current = Math.max(1, Math.min(max, page));
  const start = (current - 1) * size, end = Math.min(start + size, count);
  return { page: current, start, end,
    html: `<div class="pager"><span>${number(start + 1)}–${number(end)} de ${number(count)}</span>
      <div>${button('Anterior', 'data-page="' + (current - 1) + '"', '', '', current === 1)}${button('Siguiente', 'data-page="' + (current + 1) + '"', '', '', current === max)}</div></div>` };
}

export function trendMarkup(hasPrevious) {
  return `<div class="trend-chart"><div class="chart-key"><span><i></i>Actual</span>${hasPrevious ? '<span><i></i>Período comparable</span>' : ''}</div>
    <div class="trend-plot"><canvas id="trend-chart" tabindex="0" aria-label="Tendencia diaria. Usa las flechas para consultar cada fecha."></canvas>
    <div id="trend-tip" class="chart-tip" aria-live="polite" hidden></div></div></div>`;
}

export const hours = (value) => value === null ? '—' : decimal(value) + ' h';
