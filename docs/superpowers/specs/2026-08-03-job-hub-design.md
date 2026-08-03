# Job Hub — Design Spec

Date: 2026-08-03

## Purpose
Hub que recopila ofertas de trabajo diariamente desde 3 fuentes: Computrabajo, ZonaJobs, y Reddit r/empleos. Muestra resultados en UI unificada.

## Architecture
- Next.js app (App Router) sirve la UI y expone un endpoint de scrape.
- Supabase almacena las ofertas (tabla `jobs`), autorizado explícitamente por el usuario para este proyecto.
- GitHub Actions ejecuta un cron diario que dispara el scrape vía HTTP.
- No scraping en build/deploy de Vercel — corre en el runner de GitHub Actions (soporta Selenium/Chrome headless).

## Data flow
1. Cron GitHub Actions (diario, horario a definir en implementación) hace `POST /api/scrape` con header secret.
2. `app/api/scrape/route.ts` corre los 3 scrapers en paralelo, cada uno aislado con try/catch.
3. Resultados normalizados a shape común y upserted en Supabase (`onConflict: url`).
4. UI (`app/page.tsx`) lee de Supabase (server component o API route), renderiza grid de cards con shadcn.

## Components
- `lib/scrapers/computrabajo.ts` — Selenium WebDriver, navega resultados de búsqueda por keyword+ubicación, parsea DOM.
- `lib/scrapers/zonajobs.ts` — mismo patrón Selenium que computrabajo.
- `lib/scrapers/reddit.ts` — fetch a `https://www.reddit.com/r/empleos/search.json?q={keyword}&restrict_sr=1&sort=new`, sin Selenium, parsea JSON.
- `lib/config/search.ts` — lista de keywords (gastronomía, atención al cliente, administrativo, ventas, delivery, cajero, mozo/moza, cocinero, recepcionista, call center, repositor, seguridad, limpieza, chofer, operario, niñera, etc — ~20 términos comunes) + ubicación default (Argentina, ampliable a ciudad específica).
- `app/api/scrape/route.ts` — orquestador, protegido con secret en header (`SCRAPE_SECRET` env var), corre las 3 fuentes, dedup, upsert.
- `.github/workflows/daily-scrape.yml` — cron schedule diario, `curl -X POST` al endpoint con secret desde GitHub Secrets.
- `app/page.tsx` + componentes shadcn (Card, Badge, etc) — grid de ofertas, filtro por fuente/keyword, paleta blanco/naranja (regla de proyecto), responsive mobile+PC.

## Data model (Supabase table `jobs`)
| campo | tipo | notas |
|---|---|---|
| id | uuid | PK |
| source | text | 'computrabajo' \| 'zonajobs' \| 'reddit' |
| title | text | |
| company | text | nullable (reddit no siempre tiene) |
| location | text | nullable |
| url | text | unique, usado para dedup |
| keyword_matched | text | keyword que generó el match |
| scraped_at | timestamptz | default now() |

Dedup: `upsert` con `onConflict: url` — si ya existe la URL, no duplica.

## Error handling
- Cada scraper aislado (try/catch individual); si uno falla, los otros 2 igual persisten resultados.
- Endpoint responde con resumen: `{ computrabajo: {ok, count, error?}, zonajobs: {...}, reddit: {...} }`.
- Logs de error a consola (capturados por GitHub Actions run log).
- UI muestra timestamp de última actualización; si el último scrape tuvo fallos parciales, banner visual de aviso (regla de proyecto: feedback consola + visual en todo error).

## Testing
- UI: skill `playwright` (modelo haiku) para validar carga de hub, filtros, responsive mobile/PC.
- Scrapers: ejecución manual de `/api/scrape` una vez, verificación de filas insertadas en Supabase vía MCP Supabase.
- No tests unitarios de scraping DOM (frágil por naturaleza, se valida por ejecución real).

## Out of scope (YAGNI)
- Autenticación de usuarios.
- Notificaciones (email/push) de nuevas ofertas.
- Paginación infinita / búsqueda full-text avanzada — filtro simple por fuente/keyword alcanza para v1.
- Selenium para reddit — usa JSON search endpoint, más liviano y estable.
