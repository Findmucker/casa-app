// Category maps and auto-classification for Compras & Coisinhas

export const SHOPPING_CATEGORIES: Record<string, string[]> = {
  "🥛 Frescos": ["leite", "ovos", "manteiga", "queijo", "fiambre", "iogurtes", "iogurte", "natas", "presunto", "requeijão", "mozarela", "mozzarella", "cream cheese", "philadelphia", "ricotta", "brie", "camembert", "emmental"],
  "🥩 Carnes & Peixe": ["frango", "carne", "bifes", "bife", "salmão", "atum", "peixe", "camarão", "porco", "peru", "bacon", "salsicha", "linguiça", "hambúrguer", "costeletas", "lombo", "peito", "coxa", "pescada", "bacalhau", "polvo", "lulas", "mexilhões", "gambas", "dourada", "robalo"],
  "🥬 Frutas & Legumes": ["batatas", "batata", "cebolas", "cebola", "alho", "tomates", "tomate", "alface", "cenouras", "cenoura", "bananas", "banana", "maçãs", "maçã", "laranjas", "laranja", "limão", "pepino", "courgette", "brócolos", "espinafres", "cogumelos", "abacate", "morango", "uvas", "pêra", "manga", "ananás", "melão", "melancia", "kiwi", "pimento", "rúcula", "agrião", "coentros", "salsa", "hortelã", "gengibre", "feijão verde", "ervilhas", "milho", "beringela", "abóbora", "nabo", "rabanete", "framboesas", "mirtilos", "cerejas", "figos", "romã", "papaia", "coco", "lima"],
  "🍞 Padaria & Cereais": ["pão", "bolachas", "cereais", "tortilhas", "croissant", "tostas", "farinha", "fermento", "granola", "aveia", "muesli", "pão de forma", "baguete", "broa", "panquecas", "waffles", "crepes"],
  "🫙 Despensa": ["arroz", "massa", "azeite", "sal", "açúcar", "café", "chá", "molho", "ketchup", "mostarda", "maionese", "vinagre", "especiarias", "pimenta", "oregãos", "canela", "feijão", "grão", "lentilhas", "conserva", "atum em lata", "tomate pelado", "leite de coco", "noodles", "cuscuz", "quinoa", "mel", "compota", "nutella", "manteiga de amendoim", "óleo", "caldo", "knorr", "gelatina", "amido"],
  "🧴 Higiene & Limpeza": ["papel higiénico", "detergente", "sabonete", "champô", "pasta de dentes", "desodorizante", "gel de banho", "creme", "lixívia", "amaciador", "esfregão", "sacos lixo", "toalhitas", "escova de dentes", "fio dental", "algodão", "pensos", "shampoo", "condicionador", "protetor solar", "after sun", "lenços", "fraldas", "absorventes", "cotonetes", "luvas", "pano", "spray", "ambientador", "desinfetante"],
  "🍷 Bebidas": ["água", "sumo", "cerveja", "vinho", "coca-cola", "cola", "ice tea", "refrigerante", "espumante", "gin", "vodka", "whisky", "rum", "tónica", "kombucha", "smoothie", "leite de amêndoa", "leite de aveia", "leite de soja"],
  "🍫 Snacks": ["chocolate", "gomas", "batatas fritas", "pipocas", "gelado", "bolacha", "amendoins", "cajus", "nozes", "amêndoas", "frutos secos", "barras", "nachos", "hummus", "crackers", "torradas"],
  "🐾 Pets": ["ração", "areia gato", "snacks gato", "snacks cão", "brinquedo", "coleira"],
  "📦 Outros": [],
};

export const COISINHAS_CATEGORIES: Record<string, string[]> = {
  "🏠 Casa & Conforto": ["aspirador", "toalhas", "cortinas", "almofadas", "tapete", "lençóis", "edredão", "colchão", "mesa", "cadeira", "sofá", "manta", "cobertores", "fronhas", "roupa de cama", "toalha", "roupão", "estendal", "ferro de engomar", "tábua de engomar", "vassoura", "balde"],
  "🍳 Cozinha": ["panela", "frigideira", "tábua de cortar", "facas", "faca", "colher de pau", "espátula", "forma", "taças", "pratos", "copos", "talheres", "tupperware", "saca-rolhas", "abridor", "escorredor", "pano de cozinha", "avental", "torradeira", "micro-ondas", "liquidificadora", "batedeira", "air fryer", "cafeteira", "chaleira"],
  "🪴 Decoração": ["velas", "plantas", "planta", "molduras", "candeeiro", "espelho", "quadro", "jarra", "flores", "porta-retratos", "relógio", "tapete decorativo", "cortinados", "almofada decorativa", "difusor", "incenso", "poster", "estante", "prateleira decorativa"],
  "🗄️ Organização": ["organizador", "caixas", "caixa", "prateleira", "ganchos", "cabides", "cesto roupa", "puxadores", "gaveta", "separadores", "sapateira", "porta-chaves", "porta-revistas", "cesto", "arrumação", "etiquetas", "dispensador"],
  "🔧 Arranjos & Bricolage": ["lâmpada", "pilhas", "parafuso", "tinta", "pincel", "fita", "cola", "martelo", "chave de fendas", "berbequim", "fita métrica", "pregos", "buchas", "silicone", "lixa", "serra", "nível", "alicate", "chave inglesa", "extensão elétrica", "tomada", "interruptor"],
  "🛁 Casa de Banho": ["tapete wc", "cortina duche", "suporte toalha", "dispensador sabão", "escova wc", "espelho wc", "prateleira wc", "copo escova dentes", "banheira", "chuveiro", "torneira"],
  "💻 Tech & Eletrónica": ["carregador", "cabo", "pilhas", "lâmpada smart", "adaptador", "power bank", "auriculares", "coluna", "hub usb", "router", "extensão", "temporizador"],
  "🌿 Jardim & Varanda": ["vasos", "terra", "sementes", "fertilizante", "regador", "mangueira", "tesoura jardim", "luvas jardim", "mesa exterior", "cadeira exterior", "guarda-sol", "barbecue", "churrasqueira"],
  "👗 Roupa & Pessoal": ["cabides", "saco roupa", "detergente roupa", "tira-nódoas", "costura", "agulha", "linha", "botões", "tesoura"],
  "📋 Tarefazinhas": ["morada", "fiscal", "finanças", "contrato", "seguro", "carta", "documento", "certidão", "registo", "nif", "irs", "iuc", "inspeção", "matrícula", "renovar", "cancelar", "subscrição", "marcar", "consulta", "médico", "dentista", "veterinário", "banco", "transferência", "pagamento", "conta", "fatura", "recibo", "declaração", "atestado", "procuração", "notário", "junta", "câmara", "licença", "água", "luz", "gás", "internet", "operadora", "mudar", "alterar", "tratar", "entregar", "levantar", "enviar", "telefonar", "ligar", "email", "responder", "agendar", "desmarcar"],
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
  "🐾 Pets",
  "📦 Outros",
];

export const COISINHAS_CATEGORY_ORDER = [
  "📋 Tarefazinhas",
  "🏠 Casa & Conforto",
  "🍳 Cozinha",
  "🛁 Casa de Banho",
  "🪴 Decoração",
  "🗄️ Organização",
  "🔧 Arranjos & Bricolage",
  "💻 Tech & Eletrónica",
  "🌿 Jardim & Varanda",
  "👗 Roupa & Pessoal",
  "📦 Outros",
];

export const PROJECTS_CATEGORIES: Record<string, string[]> = {
  "🎨 Pintura": ["pintar", "pintura", "tinta", "verniz", "primário", "rolo", "trincha"],
  "🏗️ Obras & Estrutura": ["telhado", "telhas", "teto falso", "teto", "chão", "parede", "cimento", "reboco", "isolante", "isolamento", "terraço", "sótão", "garagem", "escadas", "fundação", "estrutura", "demolir", "construir"],
  "🚪 Portas & Janelas": ["porta", "janela", "portão", "portadas", "vidro", "caixilharia", "fechadura", "dobradiça", "aro", "soleira"],
  "⚡ Eletricidade & Automação": ["eléctrico", "elétrico", "eléctricas", "elétricas", "automação", "automatizar", "interruptor", "tomada", "luz", "quadro elétrico", "disjuntor", "led", "sensor", "câmara", "alarme"],
  "🔧 Reparações": ["arranjar", "reparar", "consertar", "substituir", "calhas", "escoamento", "canalização", "fuga", "infiltração", "humidade"],
  "🍳 Cozinha": ["cozinha", "exaustor", "armário", "móveis", "bancada", "lava-louça", "forno", "placa", "frigorifico"],
  "🏡 Exterior": ["exterior", "jardim", "galinheira", "churrasqueira", "varanda", "muro", "vedação", "portail", "piscina", "rega", "relva", "árvore", "poda", "calçada", "pavimento"],
  "🔥 Aquecimento": ["lareira", "recuperador", "aquecimento", "calor", "radiador", "caldeira", "ar condicionado", "climatização", "pellets"],
  "💧 Canalização": ["canalização", "torneira", "cano", "tubo", "esgoto", "fossa", "bomba", "pressão", "água quente"],
  "📦 Outros": [],
};

export const PROJECTS_CATEGORY_ORDER = [
  "🎨 Pintura",
  "🏗️ Obras & Estrutura",
  "🚪 Portas & Janelas",
  "⚡ Eletricidade & Automação",
  "🔧 Reparações",
  "💧 Canalização",
  "🍳 Cozinha",
  "🏡 Exterior",
  "🔥 Aquecimento",
  "📦 Outros",
];

export function guessCategory(
  name: string,
  categories: Record<string, string[]>
): string {
  const lower = name.toLowerCase().trim();

  // 1. Exact match first
  for (const [category, keywords] of Object.entries(categories)) {
    if (category === "📦 Outros") continue;
    for (const keyword of keywords) {
      if (lower === keyword) return category;
    }
  }

  // 2. Item contains keyword (e.g. "panela grande" matches "panela")
  for (const [category, keywords] of Object.entries(categories)) {
    if (category === "📦 Outros") continue;
    for (const keyword of keywords) {
      if (lower.includes(keyword)) return category;
    }
  }

  // 3. Keyword contains item (e.g. "pano" matches "pano de cozinha")
  for (const [category, keywords] of Object.entries(categories)) {
    if (category === "📦 Outros") continue;
    for (const keyword of keywords) {
      if (keyword.includes(lower) && lower.length >= 3) return category;
    }
  }

  // 4. Word-level partial match (any word in the item matches any word in keywords)
  const words = lower.split(/\s+/);
  for (const [category, keywords] of Object.entries(categories)) {
    if (category === "📦 Outros") continue;
    for (const keyword of keywords) {
      const kwWords = keyword.split(/\s+/);
      for (const word of words) {
        if (word.length >= 3 && kwWords.some((kw) => kw.startsWith(word) || word.startsWith(kw))) {
          return category;
        }
      }
    }
  }

  return "📦 Outros";
}

export function getAllCategoryNames(categories: Record<string, string[]>): string[] {
  return Object.keys(categories);
}
