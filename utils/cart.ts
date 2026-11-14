import { Product } from './api';

// items notation used in data files: "1:1|4:2" = product #1 x1, product #4 x2 (1-based position in /api/products)
export interface CartItem {
  index: number; // 0-based position in the products list
  quantity: number;
}

export function parseItems(spec: string): CartItem[] {
  if (!spec) return [];
  return spec.split('|').map((part) => {
    const [n, q] = part.split(':').map(Number);
    return { index: n - 1, quantity: q };
  });
}

// Expected total from the SPEC: sum of unit price x quantity, with prices read from the SUT at run time
export function computeTotal(items: CartItem[], products: Product[]): number {
  return items.reduce((sum, it) => sum + Number(products[it.index].price) * it.quantity, 0);
}
