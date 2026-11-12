import {
  SITES, CHANNELS, CITIES, FORMATS, DISTRICTS, FAMILIES, STOCK_CATEGORIES, STATUSES,
  PRIORITIES, CATEGORIES, TYPES, FIRST_DATE, LAST_DATE, fullDate, monthStart, shift, siteOptions,
  supportRows, supportTicket, csvText,
} from './data.js?v=2';
import { e, icon, link, METRICS, empty } from './ui.js?v=2';
import { connectTrend } from './charts.js?v=2';
import {
  COMMERCIAL_VIEWS, PRODUCT_VIEWS, renderHome, renderCommercial, renderProducts, renderDrivers,
} from './commercial.js?v=2';
import {
  INVENTORY_VIEWS, COST_VIEWS, SUPPORT_VIEWS, DISTRIBUTIONS, renderOperations, renderSupport, ticketDetail,
} from './operations.js?v=2';
import { DATASETS, renderExplorer, renderRestaurants, renderHelp, renderOrigin, renderRestricted } from './views.js?v=2';

const modules = {
  resumen: ['Inicio', 'home', renderHome],
  explorador: ['Datos y descargas', 'table', renderExplorer],
  comercial: ['Resultados comerciales', 'trend', renderCommercial],
  productos: ['Producto y mix', 'box', renderProducts],
  drivers: ['Drivers de producto', 'bars', renderDrivers],
  inventario: ['Inventario', 'inventory', (f, ctx) => renderOperations(f, ctx, false)],
  costos: ['Costos', 'money', (f, ctx) => renderOperations(f, ctx, true)],
  soporte: ['GLPI', 'support', renderSupport],
  restaurantes: ['Restaurantes', 'pin', renderRestaurants],
  ayuda: ['Ayuda', 'help', renderHelp],
  origen: ['Sobre la demo', 'info', renderOrigin],
};
const groups = [
  ['Espacio de trabajo', ['resumen', 'explorador']],
  ['Comercial', ['comercial', 'productos', 'drivers']],
  ['Operación', ['inventario', 'costos', 'soporte']],
  ['Herramientas', ['restaurantes', 'ayuda', 'origen']],
];
const shared = ['resumen', 'explorador', 'restaurantes', 'ayuda', 'origen'];
const profiles = {
  general: { label: 'General', modules: Object.keys(modules) },
  comercial: { label: 'Comercial', modules: [...shared, 'comercial', 'productos', 'drivers', 'inventario', 'costos'] },
  soporte: { label: 'Soporte', modules: [...shared, 'soporte'] },
};
const tabSets = { comercial: COMMERCIAL_VIEWS, productos: PRODUCT_VIEWS, inventario: INVENTORY_VIEWS, costos: COST_VIEWS, soporte: SUPPORT_VIEWS };
const fields = {
  profile: 'perfil', from: 'desde', to: 'hasta', site: 'sede', channel: 'canal', city: 'ciudad',
  format: 'formato', district: 'distrital', tab: 'vista', metric: 'indicador', family: 'familia',
  status: 'estado', priority: 'prioridad', category: 'categoria', type: 'tipo', series: 'serie',
  search: 'buscar', rail: 'catalogo', page: 'pagina', low: 'existencias', distribution: 'distribucion',
  dataset: 'conjunto', topic: 'tema',
};
const byRoute = {
  resumen: ['to', 'site', 'channel'],
  comercial: ['from', 'to', 'site', 'channel', 'city', 'format', 'district', 'rail', 'metric', 'tab'],
  productos: ['from', 'to', 'site', 'channel', 'city', 'format', 'family', 'search', 'tab', 'series', 'page'],
  drivers: ['from', 'to', 'site', 'channel'],
  inventario: ['from', 'to', 'site', 'city', 'format', 'district', 'category', 'tab', 'low', 'page'],
  costos: ['from', 'to', 'site', 'city', 'format', 'district', 'category', 'tab'],
  soporte: ['from', 'to', 'site', 'status', 'priority', 'category', 'type', 'search', 'tab', 'page', 'distribution'],
  explorador: ['dataset', 'from', 'to', 'site', 'channel', 'city', 'format', 'district', 'family', 'status', 'priority', 'type', 'category', 'search', 'page', 'low'],
  restaurantes: ['city', 'format', 'district', 'search'],
  ayuda: ['topic'],
  origen: [],
};
const list = {
  site: SITES, channel: CHANNELS, city: CITIES, format: FORMATS, district: DISTRICTS,
  family: FAMILIES, status: STATUSES, priority: PRIORITIES, type: TYPES,
};

function allowed(route, profile = state.profile) {
  return profiles[profile].modules.includes(route);
}
function datasetFor(value, profile) {
  const data = DATASETS.filter(({ route }) => allowed(route, profile));
  return data.some(({ id }) => id === value) ? value : data[0].id;
}
function defaults(route, profile, dataset) {
  const set = datasetFor(dataset, profile);
  const allHistory = route === 'soporte' || (route === 'explorador' && set === 'soporte');
  return {
    route, profile, dataset: set, from: allHistory ? FIRST_DATE : route === 'resumen' ? LAST_DATE : monthStart(LAST_DATE), to: LAST_DATE,
    ...Object.fromEntries(Object.keys(list).map((key) => [key, 'all'])), category: 'all',
    tab: 'resumen', metric: 'sales', search: '', rail: '', series: 'diaria', distribution: 'status', topic: '',
    page: 1, low: false,
  };
}
function realDate(date) {
  return typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) && date >= FIRST_DATE && date <= LAST_DATE
    && Number.isFinite(Date.parse(date)) && new Date(date).toISOString().slice(0, 10) === date;
}
function selectId(options, value) {
  return options.some(({ id }) => id === value) ? value : 'all';
}
function clean(route, raw) {
  const profile = Object.hasOwn(profiles, raw.profile) ? raw.profile : 'general';
  const result = defaults(route, profile, raw.dataset);
  for (const key of byRoute[route]) {
    if (raw[key] !== undefined && raw[key] !== null) result[key] = raw[key];
  }
  for (const [key, options] of Object.entries(list)) result[key] = selectId(options, result[key]);
  result.dataset = datasetFor(result.dataset, profile);
  const context = route === 'explorador' ? result.dataset : route;
  result.category = selectId(context === 'soporte' ? CATEGORIES : STOCK_CATEGORIES, result.category);
  result.tab = tabSets[route]?.some(([id]) => id === result.tab) ? result.tab : 'resumen';
  result.metric = Object.hasOwn(METRICS, result.metric) ? result.metric : 'sales';
  result.series = result.series === 'historica' ? 'historica' : 'diaria';
  result.distribution = DISTRIBUTIONS.some(([id]) => result.distribution === id) ? result.distribution : 'status';
  result.search = String(result.search).slice(0, 80);
  result.rail = String(result.rail).slice(0, 80);
  result.topic = Object.hasOwn(modules, result.topic) ? result.topic : '';
  result.low = (result.tab === 'existencias' || route === 'explorador' && result.dataset === 'inventario')
    && (result.low === true || result.low === 'bajo-minimo');
  result.page = Number.isInteger(Number(result.page)) ? Math.max(1, Math.min(3000, Number(result.page))) : 1;
  if (!realDate(result.to)) result.to = LAST_DATE;
  if (route === 'resumen') result.from = result.to;
  if (!realDate(result.from) || result.from > result.to) result.from = result.to;
  if (result.site !== 'all' && !siteOptions({ ...result, district: context === 'comercial' ? 'all' : result.district }).some(({ id }) => id === result.site)) result.site = 'all';
  return result;
}
function readAddress() {
  const [name, query] = location.hash.slice(1).split('?');
  const route = Object.hasOwn(modules, name) ? name : 'resumen';
  const params = new URLSearchParams(query);
  const raw = Object.fromEntries(Object.entries(fields).map(([key, param]) => [key, params.get(param)]));
  const legacy = Number(params.get('dias'));
  if (!raw.from && [7, 14, 30].includes(legacy)) raw.from = shift(LAST_DATE, 1 - legacy);
  if (route === 'soporte' && raw.tab === 'restaurantes') raw.tab = 'sedes';
  if (route === 'inventario' && raw.low && !raw.tab) raw.tab = 'existencias';
  return clean(route, raw);
}
let state = readAddress();

function address(route, changes = {}) {
  const base = route === state.route ? state : { profile: state.profile, site: state.site };
  const f = clean(route, { ...base, ...changes });
  const baseValues = defaults(route, f.profile, f.dataset);
  const params = new URLSearchParams();
  for (const key of ['profile', ...byRoute[route]]) {
    if (key === 'dataset' ? f[key] !== datasetFor(null, f.profile) : f[key] !== baseValues[key]) {
      params.set(fields[key], key === 'low' ? 'bajo-minimo' : f[key]);
    }
  }
  return '#' + route + (params.size ? '?' + params : '');
}

const $ = (selector) => document.querySelector(selector);
const view = $('#view'), main = $('#contenido'), nav = $('#module-nav'), sidebar = $('#sidebar');
const menuButton = $('#menu-button'), backdrop = $('#backdrop'), profileMenu = $('#profile-menu');
const profileSelect = $('#profile-select'), notifications = $('#notifications');
const dialog = $('#ticket-dialog'), announcer = $('#announcer');
const expanded = new Map();
let exported = null;
let disconnect = () => {};
let ticketButton = null;
let previousRoute = null;

function mobileMenu(open, returnFocus = false) {
  sidebar.dataset.expanded = String(open);
  backdrop.hidden = !open;
  menuButton.setAttribute('aria-expanded', String(open));
  if (open) sidebar.querySelector('a').focus();
  if (returnFocus) menuButton.focus();
}
function navLink(route) {
  const [title, symbol] = modules[route];
  return `<a class="nav-link" href="${e(address(route))}"${route === state.route ? ' aria-current="page"' : ''}>${icon(symbol)}<span>${title}</span></a>`;
}
function renderNavigation() {
  nav.innerHTML = groups.map(([group, routes], index) => {
    const links = routes.filter((route) => allowed(route)).map(navLink).join('');
    if (!links) return '';
    if (!index) return `<div class="nav-group"><p class="nav-label">${group}</p>${links}</div>`;
    const open = (routes.includes(state.route) && previousRoute !== state.route) || (expanded.get(index) ?? routes.includes(state.route));
    return `<details class="nav-group" data-group="${index}"${open ? ' open' : ''}>
      <summary>${group}${icon('chevron', 14)}</summary><div>${links}</div></details>`;
  }).join('');
  for (const group of nav.querySelectorAll('details')) group.addEventListener('toggle', () => {
    if (group.isConnected) expanded.set(Number(group.dataset.group), group.open);
  });
  previousRoute = state.route;
}

function renderHeader() {
  const group = groups.find(([, routes]) => routes.includes(state.route))[0];
  const title = state.route === 'comercial' ? METRICS[state.metric].label
    : state.route === 'soporte' ? 'GLPI · Tickets y resolución' : modules[state.route][0];
  $('#breadcrumb-group').textContent = group === 'Espacio de trabajo' ? 'Pulso Operativo' : group;
  $('#breadcrumb-current').textContent = title;
  document.title = title + ' · Pulso Operativo';
  const help = $('#help-link');
  help.href = address('ayuda', { topic: state.route });
  help.hidden = ['resumen', 'ayuda', 'origen'].includes(state.route) || !allowed(state.route);
  help.innerHTML = icon('help') + '<span>Ayuda ' + e(title) + '</span>';
  $('#demo-badge').href = address('origen');
  $('#profile-origin').href = address('origen');
  sidebar.querySelector('.brand').href = address('resumen');
  profileSelect.value = state.profile;
  const pending = allowed('soporte') ? supportRows({
    from: FIRST_DATE, to: LAST_DATE, site: 'all', status: 'abierta', priority: 'alta', category: 'all', type: 'all', search: '',
  }) : [];
  $('#notification-list').innerHTML = '<h2>Notificaciones</h2>' + (pending.length
    ? '<p>Tickets abiertos de prioridad alta en la demo.</p><ul>' + pending.slice(0, 3).map((ticket) =>
      '<li><strong>' + e(ticket.subject) + '</strong><small>' + e(ticket.id) + ' · ' + fullDate(ticket.date) + '</small></li>').join('') + '</ul>'
      + link('Ver tickets', address('soporte', { tab: 'detalle', status: 'abierta', priority: 'alta', from: FIRST_DATE, to: LAST_DATE, site: 'all', search: '' }), 'text-button', 'arrow')
    : '<p>No hay notificaciones para este perfil.</p>');
}

function render() {
  disconnect();
  disconnect = () => {};
  renderNavigation();
  renderHeader();
  const ctx = { url: address, profile: profiles[state.profile].label, allow: allowed };
  const renderer = allowed(state.route) ? modules[state.route][2] : renderRestricted;
  const result = renderer(state, ctx);
  const visible = state.route === 'comercial' && !allowed(state.route) ? 'Acceso restringido' : $('#breadcrumb-current').textContent;
  view.innerHTML = (result.html.includes('<h1>') ? '' : '<h1 class="sr-only">' + e(visible) + '</h1>') + result.html;
  exported = result.exported ?? null;
  if (result.trend) disconnect = connectTrend(view, result.trend);
}

function update(changes, focus) {
  state = clean(state.route, { ...state, ...changes });
  history.replaceState(null, '', address(state.route));
  render();
  if (focus) focus()?.focus({ preventScroll: true });
}

function applyForm(form, field) {
  if (field?.name === 'period') {
    if (field.value === 'manual') {
      form.querySelector('[name="from"]').focus();
      return;
    }
    const from = field.value === 'mes' ? monthStart(LAST_DATE) : shift(LAST_DATE, 1 - Number(field.value));
    update({ from, to: LAST_DATE, page: 1 }, () => view.querySelector('[name="period"]'));
    return;
  }
  const values = Object.fromEntries(new FormData(form));
  const dateEnd = form.querySelector('[name="to"]');
  if (dateEnd) {
    dateEnd.setCustomValidity(values.from && values.to && values.from > values.to ? 'La fecha hasta debe ser igual o posterior a la fecha desde.' : '');
  }
  if (!form.reportValidity()) return;
  const focusName = field?.name || null, label = form.getAttribute('aria-label');
  if (values.dataset && values.dataset !== state.dataset) {
    const next = defaults(state.route, state.profile, values.dataset);
    update({ ...next, site: state.site }, () => view.querySelector('[name="dataset"]'));
    return;
  }
  update({ ...values, page: 1 }, () => {
    const next = [...view.querySelectorAll('form[data-filter]')].find((item) => item.getAttribute('aria-label') === label);
    return focusName ? next?.elements.namedItem(focusName) : next?.querySelector('[type="submit"]');
  });
  announcer.textContent = exported ? 'Filtros aplicados. ' + exported.records.length + ' filas en el alcance.' : 'Vista actualizada.';
}

function download() {
  if (!exported?.records.length) return;
  const file = new Blob([csvText(exported.columns, exported.records)], { type: 'text/csv;charset=utf-8' });
  const fileUrl = URL.createObjectURL(file);
  const anchor = document.createElement('a');
  anchor.href = fileUrl;
  anchor.download = exported.filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(fileUrl), 1000);
  announcer.textContent = 'Exportación preparada: ' + exported.records.length + ' filas.';
}

view.addEventListener('submit', (event) => {
  if (!event.target.matches('form[data-filter]')) return;
  event.preventDefault();
  applyForm(event.target);
});
view.addEventListener('change', (event) => {
  const field = event.target;
  const form = field.closest('form[data-filter]');
  if (form && field.matches('select,input[type="date"]')) applyForm(form, field);
});
view.addEventListener('input', (event) => {
  if (event.target.matches('input[type="date"]')) event.target.form.querySelector('[name="to"]')?.setCustomValidity('');
});
view.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  const d = button.dataset;
  if ('export' in d) return download();
  if (d.scroll) return document.getElementById(d.scroll)?.scrollIntoView({ block: 'start' });
  if (d.ticket) {
    const ticket = supportTicket(d.ticket);
    if (!ticket || !allowed('soporte')) return;
    ticketButton = button;
    $('#ticket-id').textContent = 'Ticket ' + ticket.id;
    $('#ticket-title').textContent = ticket.subject;
    $('#ticket-content').innerHTML = ticketDetail(ticket);
    dialog.showModal();
    return;
  }
  if ('reset' in d) {
    update({ ...defaults(state.route, state.profile, state.dataset), tab: state.tab, metric: state.metric, series: state.series, distribution: state.distribution },
      () => view.querySelector('[data-reset]'));
    announcer.textContent = 'Filtros restablecidos.';
    return;
  }
  if (d.drillKey) {
    update({ [d.drillKey]: d.drillValue, tab: 'detalle', page: 1 }, () => main);
    window.scrollTo(0, 0);
    return;
  }
  if ('general' in d) {
    update({ profile: 'general' }, () => main);
    return;
  }
  const values = { tab: d.tab, metric: d.metric, series: d.series, distribution: d.distribution, low: d.stock, page: d.page };
  const entry = Object.entries(values).find(([, value]) => value !== undefined);
  if (entry) {
    const [key, value] = entry;
    const attr = key === 'low' ? 'stock' : key;
    update({ page: 1, [key]: key === 'low' ? value === 'low' : value }, () =>
      key === 'page' ? view.querySelector('.pager button:not(:disabled)') : view.querySelector('[data-' + attr + '="' + CSS.escape(value) + '"]'));
  }
});

dialog.addEventListener('close', () => {
  if (ticketButton?.isConnected) ticketButton.focus({ preventScroll: true });
  ticketButton = null;
});
menuButton.innerHTML = icon('menu', 20);
notifications.querySelector('summary').innerHTML = icon('bell', 17);
menuButton.addEventListener('click', () => mobileMenu(sidebar.dataset.expanded !== 'true'));
backdrop.addEventListener('click', () => mobileMenu(false, true));
profileSelect.addEventListener('change', () => {
  update({ profile: profileSelect.value });
  profileMenu.open = false;
  profileMenu.querySelector('summary').focus({ preventScroll: true });
});
document.addEventListener('click', (event) => {
  for (const menu of [notifications, profileMenu]) if (!menu.contains(event.target)) menu.open = false;
  const anchor = event.target.closest('a[href^="#"]');
  if (!anchor || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  if (anchor.hash === '#contenido') {
    event.preventDefault();
    main.focus();
  } else if (Object.hasOwn(modules, anchor.hash.slice(1).split('?')[0])) {
    mobileMenu(false);
    notifications.open = profileMenu.open = false;
    if (location.hash === anchor.hash) {
      event.preventDefault();
      window.scrollTo(0, 0);
      main.focus({ preventScroll: true });
    }
  }
});
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape' || dialog.open) return;
  if (sidebar.dataset.expanded === 'true') mobileMenu(false, true);
  for (const menu of [notifications, profileMenu]) if (menu.open) {
    menu.open = false;
    menu.querySelector('summary').focus();
  }
});
window.addEventListener('hashchange', () => {
  if (dialog.open) dialog.close();
  state = readAddress();
  mobileMenu(false);
  render();
  window.scrollTo(0, 0);
  main.focus({ preventScroll: true });
});
$('#portfolio-return').hidden = !['localhost', '127.0.0.1'].includes(location.hostname);
try {
  render();
} catch (error) {
  view.innerHTML = empty('No se pudo abrir la demo', 'Recarga la página para volver a cargar los recursos.');
  throw error;
}
