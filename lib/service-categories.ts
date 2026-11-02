export const SERVICE_CATEGORIES = [
  { slug: "programacion-web", title: "Programación Web", description: "Sitios, plataformas y experiencias web hechas para tu negocio." },
  { slug: "automatizacion", title: "Automatización", description: "Procesos conectados para ahorrar tiempo y reducir tareas repetitivas." },
  { slug: "saas-desde-cero", title: "SaaS desde cero", description: "Productos digitales diseñados y construidos desde la idea inicial." },
  { slug: "tienda-online", title: "Tienda Online", description: "Experiencias de venta online listas para crecer." },
] as const;

export function inferServiceCategory(title = "", description = "") {
  const value = `${title} ${description}`.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (/automat|integracion|workflow|proceso automatico/.test(value)) return "automatizacion";
  if (/saas|software como servicio|producto digital desde cero/.test(value)) return "saas-desde-cero";
  if (/e-commerce|ecommerce|tienda online|tienda virtual|shopify|woocommerce/.test(value)) return "tienda-online";
  return "programacion-web";
}
