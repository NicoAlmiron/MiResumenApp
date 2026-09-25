# MiResumen

Frontend de MiResumenApp: gestión de resúmenes de materias de Abogacía con
tableros tipo Kanban y venta de resúmenes. Ver el contexto funcional completo
en `docs/Requisitos_Funcionales_MiResumenApp.md` y `docs/Arquitectura_y_POO.md`
(carpeta `docs/` del repo `ResumenesApp`, un nivel arriba de este proyecto).

**Stack**: React + Vite (JavaScript), React Router, Bootstrap 5 (vía
`react-bootstrap`) con un tema oscuro a medida (`src/theme.scss`), Bootstrap
Icons y `@hello-pangea/dnd` para el drag-and-drop del tablero.

## Estado actual

Todavía **no hay backend conectado** (`MiResumenAPI/` está vacío). Todo el
dato vive en memoria en dos Contexts de React:

- `src/context/MateriasContext.jsx` — Materias, Cátedras, Comisiones, tableros
  y cola de envío. Se reinicia a los datos de ejemplo de `src/data/mockData.js`
  en cada refresh de página.
- `src/context/AuthContext.jsx` — login simulado con un usuario de prueba
  (ver abajo), persistido en `localStorage` para no perder la sesión al
  refrescar.

Cuando exista la API real, estos dos archivos son los que se reemplazan por
llamadas HTTP — el resto de los componentes no debería necesitar cambios,
porque solo consumen `useMaterias()` / `useAuth()`.

## Correr en local

```bash
npm install
npm run dev
```

Abre `http://localhost:5173`. Te va a pedir login — usuario de prueba:

```
Usuario:     admin
Contraseña:  admin123
```

Otros comandos:

```bash
npm run build    # build de producción a dist/
npm run preview  # sirve ese build localmente, para probarlo antes de deployar
npm run lint     # oxlint
```

## Deploy en Vercel

El proyecto ya está listo para importarse tal cual en Vercel:

1. En [vercel.com/new](https://vercel.com/new), importá este repositorio
   (`NicoAlmiron/MiResumenApp`).
2. Vercel detecta Vite automáticamente. `vercel.json` ya deja fijado:
   - `buildCommand`: `npm run build`
   - `outputDirectory`: `dist`
   - un rewrite de todas las rutas a `index.html`, necesario porque esta es
     una SPA con rutas propias del lado del cliente (React Router) — sin esto,
     refrescar la página en `/resumenes` o en un tablero (URL con `/materias/...`)
     da 404.
3. No hace falta configurar ninguna variable de entorno todavía (no hay API
   real). Cuando la haya, se agrega `VITE_API_URL` en Project Settings →
   Environment Variables (ver `.env.example`).
4. Deploy. Cada push a `main` genera un deploy de producción; cada PR genera
   un preview.

## Estructura del código

```
src/
├── context/       # Auth y Materias: estado global (hoy en memoria, mañana API)
├── components/     # componentes chicos y genéricos (RequireAuth, NombreEditable)
├── layout/          # Navbar, Footer, layout compartido
├── pages/            # una por ruta (Login, Resúmenes, Ventas, Tablero)
├── features/          # componentes de negocio, agrupados por área
│   ├── materias/       # tarjetas, modales, filas de Cátedra/Comisión, cola de envío
│   └── tablero/         # Kanban, columnas, tarjeta de archivo
├── data/              # datos de ejemplo (mockData.js)
└── utils/              # helpers (año de cursada, etc.)
```
