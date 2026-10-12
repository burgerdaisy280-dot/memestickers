import { queryOptions } from '@tanstack/react-query';
export interface Product {
  id: string; title: string; description: string; handle: string; tags: string[];
  images: { edges: { node: { url: string; altText: string | null } }[] };
  variants: { edges: { node: { id: string; title: string; availableForSale: boolean; price: { amount: string; currencyCode: string }; selectedOptions: { name: string; value: string }[] } }[] };
}
export async function storefrontApiRequest<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const response = await fetch('https://meme-sticker-shop-bdwp1-miu78sea.myshopify.com/api/2025-07/graphql.json', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': '7912cc5529a7533a40c398a58c070cd8' }, body: JSON.stringify({ query, variables }),
  });
  if (!response.ok) throw new Error('The shop is temporarily unavailable. Please try again.');
  const result = await response.json() as { data: T; errors?: { message: string }[] };
  if (result.errors?.length) throw new Error(result.errors.map(e => e.message).join(', '));
  return result.data;
}
const fields = `id title description handle tags images(first:5){edges{node{url altText}}} variants(first:50){edges{node{id title availableForSale price{amount currencyCode} selectedOptions{name value}}}}`;
export const productsOptions = queryOptions({ queryKey: ['products'], queryFn: async () => {
  const data = await storefrontApiRequest<{ products: { nodes: Product[] } }>(`query { products(first:100){nodes{${fields}}} }`); return data.products.nodes;
}, staleTime: 60000 });
export const productOptions = (handle: string) => queryOptions({ queryKey: ['product', handle], queryFn: async () => {
  const data = await storefrontApiRequest<{ product: Product | null }>(`query($handle:String!){product(handle:$handle){${fields}}}`, { handle }); return data.product;
} });
export const money = (amount: string | number, currency = 'SEK') => new Intl.NumberFormat('en-SE', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(amount));
