import { COISINHAS_CATEGORIES, COISINHAS_CATEGORY_ORDER, guessCategory } from "@/lib/categories";
import type { SmallPriorityItem } from "@/lib/hooks";

export interface CoisinhasGroup {
  category: string;
  items: SmallPriorityItem[];
}

export function groupCoisinhas(items: SmallPriorityItem[]): CoisinhasGroup[] {
  const grouped = new Map<string, SmallPriorityItem[]>();

  for (const item of items) {
    const category = item.category || guessCategory(item.name, COISINHAS_CATEGORIES);
    const categoryItems = grouped.get(category);
    if (categoryItems) categoryItems.push(item);
    else grouped.set(category, [item]);
  }

  return COISINHAS_CATEGORY_ORDER.flatMap((category) => {
    const categoryItems = grouped.get(category);
    return categoryItems ? [{ category, items: categoryItems }] : [];
  });
}

export function getNextCoisinhaOrder(items: SmallPriorityItem[]): number {
  let maxOrder = 0;
  for (const item of items) maxOrder = Math.max(maxOrder, item.order);
  return maxOrder + 1;
}
