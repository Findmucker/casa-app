import { guessCategory, SHOPPING_CATEGORIES, COISINHAS_CATEGORIES, PROJECTS_CATEGORIES } from "@/lib/categories";

describe("Categories - guessCategory", () => {
  describe("Shopping categories", () => {
    it("should classify milk as Frescos", () => {
      expect(guessCategory("leite", SHOPPING_CATEGORIES)).toBe("🥛 Frescos");
    });

    it("should classify chicken as Carnes & Peixe", () => {
      expect(guessCategory("frango", SHOPPING_CATEGORIES)).toBe("🥩 Carnes & Peixe");
    });

    it("should classify bananas as Frutas & Legumes", () => {
      expect(guessCategory("bananas", SHOPPING_CATEGORIES)).toBe("🥬 Frutas & Legumes");
    });

    it("should classify bread as Padaria", () => {
      expect(guessCategory("pão", SHOPPING_CATEGORIES)).toBe("🍞 Padaria & Cereais");
    });

    it("should classify detergent as Higiene", () => {
      expect(guessCategory("detergente", SHOPPING_CATEGORIES)).toBe("🧴 Higiene & Limpeza");
    });

    it("should classify wine as Bebidas", () => {
      expect(guessCategory("vinho", SHOPPING_CATEGORIES)).toBe("🍷 Bebidas");
    });

    it("should classify chocolate as Snacks", () => {
      expect(guessCategory("chocolate", SHOPPING_CATEGORIES)).toBe("🍫 Snacks");
    });

    it("should classify cat food as Pets", () => {
      expect(guessCategory("ração", SHOPPING_CATEGORIES)).toBe("🐾 Pets");
    });

    it("should fallback to Outros for unknown items", () => {
      expect(guessCategory("xyzabc", SHOPPING_CATEGORIES)).toBe("📦 Outros");
    });

    it("should handle partial matches (e.g. 'panela grande')", () => {
      expect(guessCategory("leite gordo", SHOPPING_CATEGORIES)).toBe("🥛 Frescos");
    });

    it("should be case insensitive", () => {
      expect(guessCategory("LEITE", SHOPPING_CATEGORIES)).toBe("🥛 Frescos");
      expect(guessCategory("Frango", SHOPPING_CATEGORIES)).toBe("🥩 Carnes & Peixe");
    });
  });

  describe("Coisinhas categories", () => {
    it("should classify aspirador as Casa", () => {
      expect(guessCategory("aspirador", COISINHAS_CATEGORIES)).toBe("🏠 Casa & Conforto");
    });

    it("should classify panela as Cozinha", () => {
      expect(guessCategory("panela", COISINHAS_CATEGORIES)).toBe("🍳 Cozinha");
    });

    it("should classify plantas as Decoração", () => {
      expect(guessCategory("plantas", COISINHAS_CATEGORIES)).toBe("🪴 Decoração");
    });

    it("should classify organizador as Organização", () => {
      expect(guessCategory("organizador", COISINHAS_CATEGORIES)).toBe("🗄️ Organização");
    });

    it("should classify carregador as Tech", () => {
      expect(guessCategory("carregador", COISINHAS_CATEGORIES)).toBe("💻 Tech & Eletrónica");
    });
  });

  describe("Projects categories", () => {
    it("should classify pintar as Pintura", () => {
      expect(guessCategory("pintar parede", PROJECTS_CATEGORIES)).toBe("🎨 Pintura");
    });

    it("should classify portão as Portas & Janelas", () => {
      expect(guessCategory("portão", PROJECTS_CATEGORIES)).toBe("🚪 Portas & Janelas");
    });

    it("should classify arranjar calhas as Reparações", () => {
      expect(guessCategory("arranjar calhas", PROJECTS_CATEGORIES)).toBe("🔧 Reparações");
    });
  });
});
