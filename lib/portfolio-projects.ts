export type PortfolioProject = {
  id: string;
  name: string;
  category: "Landing Pages" | "E-Commerce" | "Sistemas a medida";
  description: string;
  url: string;
  cover: string;
  gallery: [string, string];
};

export const portfolioProjects: PortfolioProject[] = [
  {
    id: "o1idpmcp61blykb",
    name: "Builto",
    category: "Landing Pages",
    description: "Plataforma para crear sitios web mediante IA, con acompañamiento de desarrolladores humanos y seguimiento del proyecto en tiempo real.",
    url: "https://builto-jade.vercel.app/",
    cover: "/portfolio/builto-cover.png",
    gallery: ["/portfolio/builto-gallery-1.png", "/portfolio/builto-gallery-2.png"],
  },
  {
    id: "9s9t40tgqrl30mh",
    name: "TTM Agencia",
    category: "Landing Pages",
    description: "Agencia tecnológica de Buenos Aires especializada en desarrollo web, e-commerce, landing pages, sistemas personalizados y automatizaciones.",
    url: "https://ttmagencia.com/",
    cover: "/portfolio/ttm-cover.png",
    gallery: ["/portfolio/ttm-gallery-1.png", "/portfolio/ttm-gallery-2.png"],
  },
  {
    id: "h7235004v7tqpmw",
    name: "PlatoRest",
    category: "Landing Pages",
    description: "Sistema gastronómico todo-en-uno con menú digital por QR, pedidos online, reservas, fidelización, POS, inventario y estadísticas.",
    url: "https://platorest.com/",
    cover: "/portfolio/platorest-cover.png",
    gallery: ["/portfolio/platorest-gallery-1.png", "/portfolio/platorest-gallery-2.png"],
  },
  {
    id: "orcuf7yqigvgmsv",
    name: "Zudy Accesorios",
    category: "E-Commerce",
    description: "Tienda online de accesorios, bijouterie, cosmética y perfumería con una selección de productos de lujo accesible y envíos nacionales.",
    url: "https://zudybijouterie.vercel.app/",
    cover: "/portfolio/zudy-cover.png",
    gallery: ["/portfolio/zudy-gallery-1.png", "/portfolio/zudy-gallery-2.png"],
  },
  {
    id: "6kimbtzavfbtxdw",
    name: "Grupo Chalita",
    category: "E-Commerce",
    description: "Experiencia digital para una empresa de organización y ambientación de eventos, con mobiliario, cristalería, catering y planificación personalizada.",
    url: "https://grupochalitabahia.com/",
    cover: "/portfolio/grupochalita-cover.png",
    gallery: ["/portfolio/grupochalita-gallery-1.png", "/portfolio/grupochalita-gallery-2.png"],
  },
  {
    id: "g5arnjn8ffq945o",
    name: "Bahia 105W",
    category: "E-Commerce",
    description: "E-commerce de indumentaria artesanal mexicana: prendas hechas a mano por artesanas, con bordado tradicional y presentación contemporánea.",
    url: "https://bahia105w.vercel.app/",
    cover: "/portfolio/bahia105w-cover.png",
    gallery: ["/portfolio/bahia105w-gallery-1.png", "/portfolio/bahia105w-gallery-2.png"],
  },
  {
    id: "a1oexuv38ckbya7",
    name: "Del Mate Mayorista",
    category: "E-Commerce",
    description: "Tienda mayorista de mates, bolsos materos, combos, yerberas, bombillas y artículos para asador, con compra mínima y envíos a todo el país.",
    url: "https://delmatemayorista.vercel.app/",
    cover: "/portfolio/delmate-cover.png",
    gallery: ["/portfolio/delmate-gallery-1.png", "/portfolio/delmate-gallery-2.png"],
  },
  {
    id: "sb5p1ljkx02uefc",
    name: "ConectaTuProff",
    category: "Sistemas a medida",
    description: "Sistema profesional de gestión de servicios desarrollado a medida para centralizar y ordenar la operación del negocio.",
    url: "https://conectatuproff.vercel.app/",
    cover: "/portfolio/conectatuproff-cover.png",
    gallery: ["/portfolio/conectatuproff-gallery-1.png", "/portfolio/conectatuproff-gallery-2.png"],
  },
  {
    id: "fcoqer3a7ynnsgt",
    name: "GotThatLead",
    category: "Sistemas a medida",
    description: "Plataforma de scraping y generación de leads que permite extraer datos de Google Maps y sitios web sin programar, con planes por créditos.",
    url: "https://gotthatlead.shop/",
    cover: "/portfolio/gotthatlead-cover.png",
    gallery: ["/portfolio/gotthatlead-gallery-1.png", "/portfolio/gotthatlead-gallery-2.png"],
  },
  {
    id: "s5c90ckfy5q5nsu",
    name: "Koldesk",
    category: "Sistemas a medida",
    description: "Sistema para locales técnicos que centraliza reparaciones, inventario, ventas, CRM, seguimiento de órdenes y e-commerce.",
    url: "https://koldesk.vercel.app/",
    cover: "/portfolio/koldesk-cover.png",
    gallery: ["/portfolio/koldesk-gallery-1.png", "/portfolio/koldesk-gallery-2.png"],
  },
  {
    id: "ymh3guk2i13hnd4",
    name: "Empleos.AR",
    category: "Sistemas a medida",
    description: "Portal argentino de búsqueda laboral que reúne avisos de distintas fuentes y ofrece búsqueda, filtros, guardado, descarte y generación de CV.",
    url: "https://empleosar.vercel.app/",
    cover: "/portfolio/empleosar-cover.png",
    gallery: ["/portfolio/empleosar-gallery-1.png", "/portfolio/empleosar-gallery-2.png"],
  },
];

export const portfolioCategories = ["Landing Pages", "E-Commerce", "Sistemas a medida"] as const;
