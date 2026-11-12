# Pulso Operativo

Demo de analítica operativa para el portafolio de Juan José Vallejo. Recrea recorridos de BK Analytics, una plataforma interna de Burger King Colombia, con una identidad visual propia y datos ficticios para proteger la información operativa y la identidad visual de la empresa.

En el proyecto original, Juan José diseñó la arquitectura y la interfaz del frontend, implementó la navegación por sesión y permisos y desarrolló el módulo de análisis de soporte.

## Ejecutar en localhost

Desde PowerShell con Python 3:

```powershell
Set-Location 'C:\bk-analytics-demo'
python -m http.server 41764 --bind 127.0.0.1 --directory docs
```

Abre [Pulso Operativo](http://localhost:41764/). El sitio se sirve directamente desde `docs/` con HTML, CSS y JavaScript.

## Recorridos de la demo

- **Inicio y Comercial.** Menú por módulos, tarjetas del día y del mes, panel de restaurantes, filtros y detalle de ventas, transacciones y ticket promedio.
- **Producto y mix.** Resumen semanal con composición por familia, tendencia mensual, explorador de producto y controles de calidad.
- **Inventario y Costos.** Resumen del corte, existencias bajo mínimo, análisis por restaurante y comparación del costo observado con el ideal.
- **GLPI.** Resumen con motivos y distribución, detalle de tickets y análisis por restaurante. Los motivos y segmentos abren el detalle correspondiente.
- **Datos y descargas.** Previsualización y exportación CSV por conjunto de datos. General, Comercial y Soporte simulan la visibilidad de módulos dentro del navegador.

## Datos del escenario

- **Comercial y productos.** Serie diaria del 6 de julio al 25 de octubre de 2026 por restaurante y canal. Las ventas netas son la suma de unidades por precio ficticio; el ticket promedio usa ventas totales divididas por transacciones totales. El período comparable conserva los días de la semana y se muestra si hay cobertura completa. El AUV del escenario divide las unidades por los días con datos de cada restaurante.
- **Inventario y costos.** Cortes del 31 de agosto, 30 de septiembre y 25 de octubre de 2026. La consulta usa el último corte dentro del rango. Las existencias se valoran al costo unitario; los costos observado e ideal usan el consumo del mes hasta ese corte.
- **Soporte.** Los filtros de período se aplican a la fecha de creación. La mediana y el percentil 95 se calculan con los tickets resueltos. La antigüedad de los abiertos se mide al 25 de octubre de 2026.
- **Exportación.** El CSV incluye las filas filtradas de la vista activa. El escenario es reproducible y se genera en el navegador sin conexiones a servicios de la empresa.

## Fuente de publicación

El repositorio está preparado para servir `/docs` desde la rama `main` en GitHub Pages. La navegación por fragmentos y las rutas relativas de los recursos permiten alojar la demo bajo el subdirectorio del repositorio. [Configurar la fuente de publicación en GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).
