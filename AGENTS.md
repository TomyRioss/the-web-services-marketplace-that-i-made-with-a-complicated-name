<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Reglas de comportamiento

- NUNCA muestres codigo (code blocks, snippets, diffs) en el chat. El usuario quiere ver el resultado en el preview, no leer codigo.
- Cuando hagas cambios al proyecto, simplemente realizalos y QUE EL PREVIEW HABLE POR SI SOLO. No asumas ni levantes un puerto fijo: usá el servidor que ya esté corriendo.
- No expliques lo que hiciste. Hace el cambio y que se vea en el preview.
- Se conciso. Respuestas de 1 linea maximo. Sin introducciones ni conclusiones.
- Credenciales de test (OWNER y cliente) para probar el login/admin: ver `QA-Accounts.md` (no versionado, no está en el repo).
- Al finalizar QA, descartar o eliminar las imágenes temporales creadas exclusivamente para las pruebas (capturas, screenshots y archivos visuales temporales); conservar los assets del producto.
- Paleta de color: negro ceniza, gris suave ligeramente difuminado, blanco y verde lima #C9E94F.
- Usar Michroma en encabezados y llamadas a la acción (CTA).
