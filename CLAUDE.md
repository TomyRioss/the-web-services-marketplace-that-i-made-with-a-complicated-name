@AGENTS.md

# Reglas de proyecto

## Skill obligatoria
- Siempre usar `/cavemen ultra` skill.

## Errores y feedback
- Todo error catcheado con feedback de consola Y visual (UX/UI) correspondiente.

## Librerías y componentes
- Antes de resolver lógica/interfaz custom, investigar si existe librería de terceros y plantearla.
- Priorizar shadcn/ui para componentes e interacciones generales. Antes de crear un componente desde cero, revisar `components/ui` y el catálogo oficial de shadcn.
- Si el componente no está instalado, agregarlo con `npx shadcn@latest add <componente>` y adaptar el componente generado al diseño del proyecto. No copiar implementaciones manualmente si shadcn ofrece el componente.
- Combinar componentes shadcn existentes para patrones de interfaz comunes. Crear componentes propios solo cuando no exista una opción adecuada o la experiencia del producto requiera comportamiento específico; en ese caso, reutilizar shadcn como base cuando sea posible.
- Mantener los componentes añadidos en `components/ui` y respetar `components.json`, los alias y las convenciones actuales del proyecto. No reemplazar ni regenerar configuración existente de forma innecesaria.
- Usar TailwindCSS para todo CSS. Nunca CSS puro. Nunca tocar `global.css`.

## Base de datos
- Nunca cambios en DB sin consentimiento explícito del usuario (mensaje aparte).

## Diseño
- Siempre responsive (mobile + PC).
- Paleta de color: negro ceniza, gris suave ligeramente difuminado, blanco y verde lima #C9E94F.
- Tipografía de encabezados y CTA: Michroma.

## Arquitectura
- Metodología MVC, componentes modulares.
- Ningún componente mayor a 500 líneas — modularizar.

## Investigación
- Problema desconocido → buscar en internet (Stack Overflow, Reddit, comunidades relacionadas).

# Skills por tarea

- **DB**: skill `supabase/agent-skills`, modelo sonnet + MCP Supabase.
  Ej: "Help me set up Supabase Auth with Next.js", "Help me add proper indexes to this table"
- **Testeo/navegador**: skill `playwright`, modelo haiku, gasto mínimo de tokens (acoplar `/cavemen ultra` para maximizar ahorro).
- **Review/auditoría de código**: skills `code-simplifier` y `code-reviewer`, modelo haiku.
- **Commits/GitHub**: skills `commit-commands` y `github mcp`.
- **Componentes/diseño**: `frontend design` skill, `superpowers@claude-plugins-official` (brainstorming), `ui-ux-pro-max@ui-ux-pro-max-skill`, `expo-design`.
