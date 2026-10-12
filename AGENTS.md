<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep Shopify public catalog access in src/lib/shopify.ts and cart mutations in the Zustand store; this separates catalog reads from persistent shopping state.
- Use shared storefront header and footer in the root route, and separate shop and product detail routes; this keeps navigation consistent and individual products addressable.
