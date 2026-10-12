import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { storefrontApiRequest, type Product } from '@/lib/shopify';
export interface CartLine { id: string; quantity: number; merchandise: { id: string; title: string; price: { amount: string; currencyCode: string }; product: Pick<Product, 'title' | 'handle'> & { featuredImage: { url: string } | null } } }
interface Cart { id: string; checkoutUrl: string; lines: { nodes: CartLine[] } }
const cartFields = `id checkoutUrl lines(first:100){nodes{id quantity merchandise{... on ProductVariant{id title price{amount currencyCode} product{title handle featuredImage{url}}}}}}`;
interface CartState { cart: Cart | null; busy: boolean; error: string | null; change: (variantId: string, quantity: number, lineId?: string) => Promise<void>; syncCart: () => Promise<void> }
export const useCartStore = create<CartState>()(persist((set, get) => ({
  cart: null, busy: false, error: null,
  change: async (variantId, quantity, lineId) => {
    if (get().busy) return;
    set({ busy: true, error: null });
    try {
      const cartId = get().cart?.id;
      const operation = !cartId ? 'cartCreate' : lineId ? quantity <= 0 ? 'cartLinesRemove' : 'cartLinesUpdate' : 'cartLinesAdd';
      const declarations = !cartId ? '$input:CartInput!' : operation === 'cartLinesRemove' ? '$cartId:ID!,$lineIds:[ID!]!' : operation === 'cartLinesUpdate' ? '$cartId:ID!,$lines:[CartLineUpdateInput!]!' : '$cartId:ID!,$lines:[CartLineInput!]!';
      const args = !cartId ? 'input:$input' : operation === 'cartLinesRemove' ? 'cartId:$cartId,lineIds:$lineIds' : 'cartId:$cartId,lines:$lines';
      const variables = !cartId ? { input: { lines: [{ merchandiseId: variantId, quantity }] } } : operation === 'cartLinesRemove' ? { cartId, lineIds: [lineId] } : { cartId, lines: [lineId ? { id: lineId, quantity } : { merchandiseId: variantId, quantity }] };
      const result = await storefrontApiRequest<Record<string, { cart: Cart | null; userErrors: { message: string }[] }>>(`mutation(${declarations}){${operation}(${args}){cart{${cartFields}} userErrors{message}}}`, variables);
      const payload = result[operation];
      if (!payload) throw new Error("The shopping bag could not be updated.");
      if (payload.userErrors.length) { if (payload.userErrors.some(e => /not found|does not exist/i.test(e.message))) set({ cart: null }); throw new Error(payload.userErrors[0]?.message ?? "Could not update your bag."); }
      set({ cart: payload.cart?.lines.nodes.length ? payload.cart : null });
    } catch (error) { set({ error: error instanceof Error ? error.message : 'Could not update your bag.' }); }
    finally { set({ busy: false }); }
  },
  syncCart: async () => {
    const id = get().cart?.id; if (!id || get().busy) return;
    set({ busy: true });
    try { const data = await storefrontApiRequest<{ cart: Cart | null }>(`query($id:ID!){cart(id:$id){${cartFields}}}`, { id }); set({ cart: data.cart?.lines.nodes.length ? data.cart : null }); }
    catch { set({ error: 'Could not refresh your bag. Please try again.' }); }
    finally { set({ busy: false }); }
  },
}), { name: 'stickr-shopping-bag', skipHydration: true, partialize: state => ({ cart: state.cart }) }));
