import {
  SITES, CHANNELS, STATUSES, PRIORITIES, CATEGORIES, DEFAULT_FILTERS, DEFAULT_SUPPORT,
  STOCK_DATE, csvText, fullDate, periodLabel, supportTicket,
} from './data.js';
import { connectTrend } from './charts.js';
import {
  renderSummary, renderCommercial, renderProducts, renderInventory, renderSupport,
  renderOrigin, ticketDetail,
} from './views.js';

const MODULES = [
  { id: 'resumen', label: 'Resumen', icon: '▦', title: 'Resumen operativo', description: 'Indicadores de la red de sedes del escenario.' },
  { id: 'comercial', label: 'Comercial', icon: '↗', title: 'Análisis comercial', description: 'Consulta ventas netas, transacciones y ticket promedio por período, sede y canal.' },
  { id: 'productos', label: 'Productos', icon: '◫', title: 'Mezcla de productos', description: 'Consulta las unidades vendidas y la participación de cada familia de productos.' },
  { id: 'inventario', label: 'Inventario y costos', icon: '▤', title: 'Inventario y costos', description: 'Revisa existencias, mínimos y valor de los artículos en el corte del escenario.' },
  { id: 'soporte', label: 'Soporte', icon: '◎', title: 'Soporte operativo', description: 'Explora el estado de las solicitudes y el detalle por sede.' },
  { id: 'origen', label: 'Sobre la demo', icon: 'ⓘ', title: 'Sobre la demo', description: 'Origen del proyecto y alcance de la recreación.' },
];
const PROFILES = {
  general: { label: 'General', modules: MODULES.map(({ id }) => id) },
  comercial: { label: 'Comercial', modules: ['resumen', 'comercial', 'productos', 'inventario', 'origen'] },
  soporte: { label: 'Soporte', modules: ['resumen', 'soporte', 'origen'] },
};
const ROUTES = new Set(MODULES.map(({ id }) => id));
const METRIC_IDS = ['sales', 'orders', 'ticket'];
const SUPPORT_TABS = ['resumen', 'detalle', 'sedes'];

const moduleNav = document.querySelector('#module-nav');
const sidebar = document.querySelector('#sidebar');
const menuButton = document.querySelector('#menu-button');
const profileSelect = document.querySelector('#profile-select');
const breadcrumb = document.querySelector('#breadcrumb-current');
const pageTitle = document.querySelector('#page-title');
const pageDescription = document.querySelector('#page-description');
const scopeFilters = document.querySelector('#scope-filters');
const periodField = document.querySelector('#period-field');
const channelField = document.querySelector('#channel-field');
const periodSelect = document.querySelector('#period-filter');
const siteSelect = document.querySelector('#site-filter');
const channelSelect = document.querySelector('#channel-filter');
const periodNote = document.querySelector('#period-note');
const exportButton = document.querySelector('#export-view');
const view = document.querySelector('#view');
const announcer = document.querySelector('#announcer');
const ticketDialog = document.querySelector('#ticket-dialog');

function allowedId(options, value) {
  return options.some((option) => option.id === value) ? value : 'all';
}

function readAddress() {
  const [route, query] = location.hash.slice(1).split('?');
  const params = new URLSearchParams(query);
  const profile = params.get('perfil');
  const days = Number(params.get('dias'));
  const tab = params.get('vista');
  const metric = params.get('indicador');
  const page = Number(params.get('pagina'));

  return {
    route: ROUTES.has(route) ? route : 'resumen',
    profile: Object.hasOwn(PROFILES, profile) ? profile : 'general',
    metric: METRIC_IDS.includes(metric) ? metric : 'sales',
    lowStock: params.get('existencias') === 'bajo-minimo',
    filters: {
      days: [7, 14, 30].includes(days) ? days : DEFAULT_FILTERS.days,
      site: allowedId(SITES, params.get('sede')),
      channel: allowedId(CHANNELS, params.get('canal')),
    },
    support: {
      status: allowedId(STATUSES, params.get('estado')),
      priority: allowedId(PRIORITIES, params.get('prioridad')),
      category: allowedId(CATEGORIES, params.get('categoria')),
      search: (params.get('buscar') ?? '').slice(0, 80),
      tab: SUPPORT_TABS.includes(tab) ? tab : DEFAULT_SUPPORT.tab,
      page: Number.isInteger(page) && page >= 1 && page <= 100 ? page : 1,
    },
  };
}

let state = readAddress();
let currentExport = null;
let disconnectTrend = () => {};

function addressFor(route = state.route) {
  const params = new URLSearchParams();
  if (state.profile !== 'general') params.set('perfil', state.profile);
  if (state.filters.days !== DEFAULT_FILTERS.days) params.set('dias', state.filters.days);
  if (state.filters.site !== 'all') params.set('sede', state.filters.site);
  if (state.filters.channel !== 'all') params.set('canal', state.filters.channel);
  if (route === 'comercial' && state.metric !== 'sales') params.set('indicador', state.metric);
  if (route === 'inventario' && state.lowStock) params.set('existencias', 'bajo-minimo');
  if (route === 'soporte') {
    if (state.support.tab !== 'resumen') params.set('vista', state.support.tab);
    if (state.support.status !== 'all') params.set('estado', state.support.status);
    if (state.support.priority !== 'all') params.set('prioridad', state.support.priority);
    if (state.support.category !== 'all') params.set('categoria', state.support.category);
    if (state.support.search) params.set('buscar', state.support.search);
    if (state.support.page !== 1) params.set('pagina', state.support.page);
  }
  const query = params.toString();
  return `#${route}${query ? '?' + query : ''}`;
}

function showMenu(expanded) {
  sidebar.dataset.expanded = String(expanded);
  menuButton.setAttribute('aria-expanded', String(expanded));
}

function renderNavigation(profile) {
  moduleNav.innerHTML = MODULES.filter((module) => profile.modules.includes(module.id)).map((module) =>
    `<a href="${addressFor(module.id)}"${state.route === module.id ? ' aria-current="page"' : ''}>
      <span class="nav-icon" aria-hidden="true">${module.icon}</span>${module.label}
    </a>`).join('');
}

function configureFilters(allowed, commercialAllowed) {
  scopeFilters.hidden = !allowed || state.route === 'origen';
  periodField.hidden = state.route === 'inventario';
  channelField.hidden = !commercialAllowed || !['resumen', 'comercial', 'productos'].includes(state.route);
  periodSelect.value = String(state.filters.days);
  siteSelect.value = state.filters.site;
  channelSelect.value = state.filters.channel;
  periodNote.textContent = state.route === 'inventario' ? `Corte · ${fullDate(STOCK_DATE)}` : periodLabel(state.filters.days);
}

function activeView(commercialAllowed, supportAllowed) {
  if (state.route === 'comercial') return renderCommercial(state.filters, state.metric);
  if (state.route === 'productos') return renderProducts(state.filters);
  if (state.route === 'inventario') return renderInventory(state.filters, state.lowStock);
  if (state.route === 'soporte') return renderSupport(state.filters, state.support);
  if (state.route === 'origen') return renderOrigin();
  return renderSummary(state.filters, commercialAllowed, supportAllowed);
}

function render() {
  disconnectTrend();
  disconnectTrend = () => {};
  const module = MODULES.find(({ id }) => id === state.route);
  const profile = PROFILES[state.profile];
  const allowed = profile.modules.includes(state.route);
  const commercialAllowed = profile.modules.includes('comercial');
  const supportAllowed = profile.modules.includes('soporte');

  renderNavigation(profile);
  profileSelect.value = state.profile;
  breadcrumb.textContent = module.label;
  pageTitle.textContent = allowed ? module.title : 'Acceso restringido';
  pageDescription.textContent = !allowed ? `Vista de ${module.label} para el perfil ${profile.label}.`
    : state.route === 'resumen' && !commercialAllowed ? 'Solicitudes de soporte de las sedes del escenario.'
    : module.description;
  configureFilters(allowed, commercialAllowed);

  const result = allowed ? activeView(commercialAllowed, supportAllowed) : {
    html: `<section class="panel access-panel">
      <h2>Este módulo requiere otro perfil</h2>
      <p>Selecciona el perfil General para recorrer todos los módulos de la demo.</p>
      <div><button type="button" class="button button-primary" data-general-profile>Cambiar a General</button>
        <a class="button button-outline" href="#resumen">Ir al resumen</a></div>
    </section>`,
  };
  view.innerHTML = result.html;
  currentExport = result.export ?? null;
  exportButton.hidden = !currentExport;
  exportButton.disabled = !currentExport?.rows.length;
  if (result.trend) disconnectTrend = connectTrend(view, result.trend);
}

function refresh() {
  history.replaceState(null, '', addressFor());
  render();
}

function optionList(options, allLabel) {
  return [{ id: 'all', name: allLabel }, ...options].map((option) => `<option value="${option.id}">${option.name}</option>`).join('');
}

siteSelect.innerHTML = optionList(SITES, 'Todas las sedes');
channelSelect.innerHTML = optionList(CHANNELS, 'Todos los canales');
document.querySelector('#portfolio-return').hidden = !['localhost', '127.0.0.1'].includes(location.hostname);

menuButton.addEventListener('click', () => showMenu(sidebar.dataset.expanded !== 'true'));
profileSelect.addEventListener('change', () => {
  state.profile = profileSelect.value;
  refresh();
});

scopeFilters.addEventListener('submit', (event) => event.preventDefault());
scopeFilters.addEventListener('change', () => {
  state.filters = { days: Number(periodSelect.value), site: siteSelect.value, channel: channelSelect.value };
  state.support.page = 1;
  refresh();
});
document.querySelector('#reset-filters').addEventListener('click', () => {
  state.filters = { ...DEFAULT_FILTERS };
  state.support = { ...DEFAULT_SUPPORT, tab: state.support.tab };
  state.lowStock = false;
  refresh();
  announcer.textContent = 'Filtros restablecidos.';
});

view.addEventListener('submit', (event) => {
  if (event.target.id !== 'support-filters') return;
  event.preventDefault();
  const form = new FormData(event.target);
  state.support = {
    ...state.support,
    status: allowedId(STATUSES, form.get('status')),
    priority: allowedId(PRIORITIES, form.get('priority')),
    category: allowedId(CATEGORIES, form.get('category')),
    search: String(form.get('search') ?? '').slice(0, 80),
    page: 1,
  };
  refresh();
  view.querySelector('#support-filters button[type="submit"]').focus({ preventScroll: true });
  announcer.textContent = `${currentExport.rows.length} solicitudes en el alcance seleccionado.`;
});

view.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  const values = button.dataset;

  if (values.ticket) {
    const ticket = supportTicket(values.ticket);
    if (!ticket) return;
    document.querySelector('#ticket-id').textContent = ticket.id;
    document.querySelector('#ticket-title').textContent = ticket.subject;
    document.querySelector('#ticket-content').innerHTML = ticketDetail(ticket);
    ticketDialog.showModal();
    return;
  }

  if (values.metric) state.metric = values.metric;
  else if (values.stock) state.lowStock = values.stock === 'low';
  else if (values.supportTab) state.support = { ...state.support, tab: values.supportTab, page: 1 };
  else if (values.page) state.support.page = Number(values.page);
  else if (values.supportSite) {
    state.filters.site = values.supportSite;
    state.support = { ...state.support, tab: 'detalle', page: 1 };
  } else if ('clearSupport' in values) {
    state.support = { ...DEFAULT_SUPPORT, tab: state.support.tab };
  } else if ('generalProfile' in values) {
    state.profile = 'general';
  } else return;

  refresh();
  const pressed = view.querySelector('.segmented button[aria-pressed="true"]');
  if (pressed && (values.metric || values.stock || values.supportTab)) pressed.focus({ preventScroll: true });
});

exportButton.addEventListener('click', () => {
  if (!currentExport?.rows.length) return;
  const blob = new Blob([csvText(currentExport.columns, currentExport.rows)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = currentExport.filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  announcer.textContent = `Exportación preparada con ${currentExport.rows.length} filas.`;
});

document.addEventListener('click', (event) => {
  if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  const link = event.target.closest('a[href^="#"]');
  if (!link) return;
  const route = link.hash.slice(1).split('?')[0];
  if (route === 'contenido') {
    event.preventDefault();
    document.querySelector('#contenido').focus();
  } else if (ROUTES.has(route)) {
    event.preventDefault();
    showMenu(false);
    const address = addressFor(route);
    if (location.hash !== address) location.hash = address;
    else window.scrollTo(0, 0);
  }
});

window.addEventListener('hashchange', () => {
  state = readAddress();
  if (ticketDialog.open) ticketDialog.close();
  render();
  window.scrollTo(0, 0);
  document.querySelector('#contenido').focus({ preventScroll: true });
});

render();
