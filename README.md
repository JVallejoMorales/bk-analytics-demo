# Pulso Operativo

Demo de analítica operativa para el portafolio de Juan José Vallejo. Recrea recorridos de BK Analytics, una plataforma interna de Burger King Colombia, con una identidad visual propia y datos ficticios para proteger la información operativa y la identidad visual de la empresa.

En el proyecto original, Juan José diseñó la arquitectura y la interfaz del frontend, implementó la navegación por sesión y permisos y desarrolló el módulo de análisis de soporte.

## Ejecutar en localhost

Desde PowerShell con Python 3:

```powershell
Set-Location 'C:\bk-analytics-demo'
python -m http.server 41764 --bind 127.0.0.1 --directory docs
```

Abre [Pulso Operativo](http://localhost:41764/). Los archivos del sitio están en `docs/` y se sirven directamente con HTML, CSS y JavaScript. Los perfiles General, Comercial y Soporte simulan distintos permisos dentro del navegador.

## Datos del escenario

- **Comercial y productos.** El generador construye 60 días, del 2 de mayo al 30 de junio de 2026, con granularidad de fecha, sede y canal. Las ventas netas en COP se calculan con unidades vendidas y precios ficticios. El ticket promedio divide las ventas netas totales entre las transacciones totales del alcance filtrado.
- **Inventario.** Las existencias y costos corresponden a un corte fijo del 30 de junio de 2026. El valor por artículo y sede multiplica las existencias por el costo unitario.
- **Soporte.** El período filtra por fecha de creación. Se puede acotar por sede, estado, prioridad, categoría y búsqueda. El promedio de resolución se calcula sobre las solicitudes resueltas.
- **Exportación.** El CSV contiene los registros filtrados de la vista activa. El generador produce las mismas cifras en cada carga.

## Fuente de publicación

El repositorio está preparado para servir `/docs` desde la rama `main` en GitHub Pages. La navegación por fragmentos y las rutas relativas de los recursos permiten alojar la demo bajo el subdirectorio del repositorio. [Configurar la fuente de publicación en GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).
