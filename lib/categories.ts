// Category maps and auto-classification for Comprinhas & Coisinhas

export const SHOPPING_CATEGORIES: Record<string, string[]> = {
  "🥛 Frescos": ["leite", "ovos", "manteiga", "queijo", "fiambre", "iogurtes", "iogurte", "natas", "presunto", "requeijão", "mozarela", "mozzarella"],
  "🥩 Carnes & Peixe": ["frango", "carne", "bifes", "bife", "salmão", "atum", "peixe", "camarão", "porco", "peru", "bacon", "salsicha", "linguiça"],
  "🥬 Frutas & Legumes": ["batatas", "batata", "cebolas", "cebola", "alho", "tomates", "tomate", "alface", "cenouras", "cenoura", "bananas", "banana", "maçãs", "maçã", "laranjas", "laranja", "limão", "pepino", "courgette", "brócolos", "espinafres", "cogumelos", "abacate", "morango", "uvas", "pêra", "manga", "ananás", "melão", "melancia", "kiwi"],
  "🍞 Padaria & Cereais": ["pão", "bolachas", "cereais", "tortilhas", "croissant", "tostas", "farinha", "fermento", "granola"],
  "🫙 Despensa": ["arroz", "massa", "azeite", "sal", "açúcar", "café", "chá", "molho", "ketchup", "mostarda", "maionese", "vinagre", "especiarias", "pimenta", "oregãos", "canela", "feijão", "grão", "lentilhas", "conserva", "atum em lata"],
  "🧴 Higiene & Limpeza": ["papel higiénico", "detergente", "sabonete", "champô", "pasta de dentes", "desodorizante", "gel de banho", "creme", "lixívia", "amaciador", "esfregão", "sacos lixo", "toalhitas"],
  "🍷 Bebidas": ["água", "sumo", "cerveja", "vinho", "coca-cola", "cola", "ice tea", "refrigerante", "espumante"],
  "🍫 Snacks": ["chocolate", "gomas", "batatas fritas", "pipocas", "gelado", "bolacha"],
  "📦 Outros": [],
};

export const COISINHAS_CATEGORIES: Record<string, string[]> = {
  "🏠 Casa": ["aspirador", "toalhas", "cortinas", "almofadas", "tapete", "lençóis", "edredão", "colchão", "mesa", "cadeira"],
  "🪴 Decoração": ["velas", "plantas", "planta", "molduras", "candeeiro", "espelho", "quadro", "jarra", "flores"],
  "🗄️ Organização": ["organizador", "caixas", "caixa", "prateleira", "ganchos", "cabides", "cesto roupa", "puxadores", "gaveta"],
  "🔧 Arranjos": ["lâmpada", "pilhas", "parafuso", "tinta", "pincel", "fita", "cola"],
  "📦 Outros": [],
};

// Ordered for supermarket flow
export const SHOPPING_CATEGORY_ORDER = [
  "🥬 Frutas & Legumes",
  "🥛 Frescos",
  "🥩 Carnes & Peixe",
  "🍞 Padaria & Cereais",
  "🫙 Despensa",
  "🍷 Bebidas",
  "🍫 Snacks",
  "🧴 Higiene & Limpeza",
  "📦 Outros",
];

export const COISINHAS_CATEGORY_ORDER = [
  "🏠 Casa",
  "🪴 Decoração",
  "🗄️ Organização",
  "🔧 Arranjos",
  "📦 Outros",
];

export function guessCategory(
  name: string,
  categories: Record<string, string[]>
): string {
  const lower = name.toLowerCase().trim();

  for (const [category, keywords] of Object.entries(categories)) {
    if (category === "📦 Outros") continue;
    for (const keyword of keywords) {
      if (lower.includes(keyword) || keyword.includes(lower)) {
        return category;
      }
    }
  }

  return "📦 Outros";
}

export function getAllCategoryNames(categories: Record<string, string[]>): string[] {
  return Object.keys(categories);
}
