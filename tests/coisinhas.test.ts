import { getNextCoisinhaOrder, groupCoisinhas } from "@/lib/coisinhas";
import type { SmallPriorityItem } from "@/lib/hooks";

function item(id: string, order: number, category?: string): SmallPriorityItem {
  return {
    id,
    name: id,
    done: false,
    order,
    category,
    createdAt: null,
  };
}

describe("Coisinhas list calculations", () => {
  it("groups a 60-item list in the configured category order", () => {
    const items = Array.from({ length: 60 }, (_, index) =>
      item(`item-${index}`, index + 1, index % 2 === 0 ? "📦 Outros" : "📋 Tarefazinhas")
    );

    const groups = groupCoisinhas(items);

    expect(groups.map((group) => group.category)).toEqual(["📋 Tarefazinhas", "📦 Outros"]);
    expect(groups.flatMap((group) => group.items)).toHaveLength(60);
    expect(groups[0].items.map((entry) => entry.order)).toEqual(
      Array.from({ length: 30 }, (_, index) => index * 2 + 2)
    );
  });

  it("calculates the next order without spreading the full list", () => {
    expect(getNextCoisinhaOrder([item("a", 2), item("b", 10), item("c", 4)])).toBe(11);
    expect(getNextCoisinhaOrder([])).toBe(1);
  });
});
