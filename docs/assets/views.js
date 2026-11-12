import {
  SITES, CHANNELS, CITIES, FORMATS, DISTRICTS, FAMILIES, CATEGORIES, STATUSES, PRIORITIES, TYPES,
  STOCK_CATEGORIES, number, normalize, siteOptions,
} from './data.js?v=2';
import {
  e, icon, select, searchField, button, link, submit, reset, exportButton, pill, panel, strip,
  table, textRows, pager,
} from './ui.js?v=2';
import { commercialData, productData, rangeFields, rangeText, siteSelect } from './commercial.js?v=2';
import { operationData, supportData } from './operations.js?v=2';

export const DATASETS = [
  { id: 'comercial', name: 'Resultados comerciales', route: 'comercial', data: commercialData, grain: 'Una fila por fecha, restaurante y canal.' },
  { id: 'productos', name: 'Producto y mix', route: 'productos', data: productData, grain: 'Una fila por fecha, restaurante, canal y producto.' },
  { id: 'inventario', name: 'Inventario', route: 'inventario', data: (f) => operationData(f, false), grain: 'Una fila por restaurante y artículo en el corte seleccionado.' },
  { id: 'costos', name: 'Costos', route: 'costos', data: (f) => operationData(f, true), grain: 'Una fila por restaurante y artículo con consumo y costo.' },
  { id: 'soporte', name: 'Tickets de soporte', route: 'soporte', data: supportData, grain: 'Una fila por ticket creado dentro del rango.' },
];

export function renderExplorer(f, { allow }) {
  const datasets = DATASETS.filter(({ route }) => allow(route));
  const selected = datasets.find(({ id }) => id === f.dataset) ?? datasets[0];
  const exported = selected.data(f), rows = exported.records;
  const p = pager(f.page, 10, rows.length);
  const isCommercial = ['comercial', 'productos'].includes(selected.id);
  const isSupport = selected.id === 'soporte';
  return { exported, html: `<div class="module-intro"><p class="eyebrow">Espacio de trabajo</p><h2>Explorador de datos</h2>
    <p>Consulta una serie y descarga las filas del alcance seleccionado.</p></div>
    <form class="panel filter-panel" data-filter aria-label="Filtros de datos y descargas">
      <div class="filter-grid filter-four">${select('dataset', 'Conjunto de datos', datasets, selected.id, null)}
      ${rangeFields(f)}${siteSelect(f)}${isCommercial ? select('channel', 'Canal', CHANNELS, f.channel, 'Todos')
        + select('city', 'Ciudad', CITIES, f.city, 'Todas') + select('format', 'Formato', FORMATS, f.format, 'Todos') : ''}
      ${selected.id === 'productos' ? select('family', 'Familia', FAMILIES, f.family, 'Todas') : ''}
      ${isSupport ? select('status', 'Estado', STATUSES, f.status, 'Todos') + select('priority', 'Prioridad', PRIORITIES, f.priority, 'Todas')
        + select('category', 'Categoría', CATEGORIES, f.category, 'Todas') + select('type', 'Tipo', TYPES, f.type, 'Todos') : ''}
      ${!isCommercial && !isSupport ? select('category', 'Categoría inventario', STOCK_CATEGORIES, f.category, 'Todas') + select('city', 'Ciudad', CITIES, f.city, 'Todas')
        + select('format', 'Formato', FORMATS, f.format, 'Todos') + select('district', 'Distrital', DISTRICTS, f.district, 'Todos') : ''}</div>
      ${isSupport || selected.id === 'productos' ? `<div class="search-actions">${searchField('search', isSupport ? 'Buscar ticket' : 'Buscar producto', f.search, isSupport ? 'ID, asunto o sede' : 'Código o producto')}${submit()}</div>` : ''}
      <div class="filter-actions">${reset()}</div></form>
    ${strip('Fuente de demostración', selected.grain, pill('Datos ficticios', 'accent'))}
    ${panel('Vista previa · ' + selected.name, number(rows.length) + ' filas · ' + rangeText(f),
      table(exported.columns, textRows(rows.slice(p.start, p.end)), 'Vista previa de datos') + p.html, exportButton('Descargar CSV', rows.length))}` };
}

export function renderRestaurants(f, { url, allow }) {
  const term = normalize(f.search);
  const sites = siteOptions(f).filter((site) => normalize([site.name, site.code, site.city].join(' ')).includes(term));
  const route = allow('comercial') ? 'comercial' : 'soporte';
  return { html: `<div class="module-intro"><p class="eyebrow">Herramientas</p><h2>Directorio de restaurantes</h2><p>Catálogo ficticio de la Red Ámbar.</p></div>
    <form class="panel filter-panel" data-filter aria-label="Filtros del directorio"><div class="filter-grid filter-three">
      ${select('city', 'Ciudad', CITIES, f.city, 'Todas')}${select('format', 'Formato', FORMATS, f.format, 'Todos')}${select('district', 'Distrital', DISTRICTS, f.district, 'Todos')}</div>
      <div class="search-actions">${searchField('search', 'Buscar por nombre o código', f.search, 'Restaurante o código')}${submit()}</div>
      <div class="filter-actions">${reset()}</div></form>
    ${panel('Restaurantes', number(sites.length) + ' en el filtro', table(['Código', 'Restaurante', 'Ciudad', 'Distrital', 'Formato', 'Análisis'],
      sites.map((site) => [e(site.code), e(site.name), e(site.city), e(site.district), e(site.format),
        link('Ver análisis de ' + site.name, url(route, { site: site.id }), 'text-button', 'arrow')]), 'Directorio de restaurantes'))}` };
}

const topics = {
  comercial: { title: 'Resultados comerciales', text: 'Elige el indicador, el rango y el restaurante o canal. En Detalle puedes consultar segmentos, tendencia diaria y hora comercial. El ticket promedio usa las ventas netas y las transacciones totales del alcance.' },
  productos: { title: 'Producto y mix', text: 'Filtra por familia, código o nombre. Resumen muestra unidades y participación; Explorador permite recorrer el catálogo. Histórico agrupa el rango seleccionado por mes.' },
  inventario: { title: 'Inventario', text: 'El sistema selecciona el último corte del rango. En Existencias puedes filtrar por debajo del mínimo. Calidad de datos lista las fechas con cortes disponibles.' },
  costos: { title: 'Costos', text: 'Compara el costo observado con el ideal del período del corte. Los dos usan el mismo costo unitario. Calidad y alertas identifica las desviaciones que superan el umbral del escenario.' },
  soporte: { title: 'GLPI · Tickets y resolución', text: 'Los filtros usan la fecha de creación. Selecciona un motivo o segmento del resumen para abrir los tickets que lo componen. En Detalle puedes abrir la ficha de cada ticket.' },
};

export function renderHelp(f, { url, allow }) {
  const selected = f.topic;
  return { html: `<div class="module-intro"><p class="eyebrow">Herramientas</p><h2>Ayuda de Pulso Operativo</h2><p>Consulta los recorridos disponibles para tu perfil de demo.</p></div>
    <div class="help-links">${Object.entries(topics).filter(([route]) => allow(route)).sort(([a], [b]) => Number(b === selected) - Number(a === selected)).map(([route, topic]) =>
      panel(topic.title, '', `<p>${e(topic.text)}</p>`, link('Ir al módulo', url(route), 'text-button', 'arrow'))).join('')}</div>` };
}

export function renderOrigin() {
  return { html: `<div class="module-intro"><p class="eyebrow">Portafolio · Juan José Vallejo</p><h2>Sobre Pulso Operativo</h2>
    <p>Recreación de la interfaz y los flujos de BK Analytics.</p></div>
    ${panel('El proyecto original', 'Burger King Colombia', '<p>BK Analytics reúne resultados comerciales, información operativa y análisis de soporte en una interfaz web. Juan José diseñó la arquitectura y la interfaz del frontend, implementó la navegación por sesión y permisos y desarrolló el módulo de análisis de soporte.</p>')}
    ${panel('El alcance de la demostración', 'Identidad propia y datos ficticios', '<p>Pulso Operativo recrea la organización y los recorridos del frontend. Usa una marca, una paleta y un escenario propios para proteger la información y la identidad visual de la empresa. Los perfiles son simulados y los datos se generan en el navegador.</p>')}
    ${strip('Entorno de demostración', 'Todas las cifras, restaurantes, artículos y tickets pertenecen al escenario ficticio.', '', 'ok')}` };
}

export function renderRestricted(f, { profile, url }) {
  return { html: panel('Este módulo requiere otro perfil', 'El perfil ' + profile + ' no tiene acceso a esta vista de demostración.',
    '<div class="actions">' + button('Cambiar a General', 'data-general', 'primary') + link('Ir a Inicio', url('resumen')) + '</div>') };
}
