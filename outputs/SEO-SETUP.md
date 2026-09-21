# Portfolio SEO

Canonical domain: https://itskarishma.vercel.app

The previous deployment pointed canonical links and the sitemap to an old chatgpt.site address. The source now uses `src/data/seo.json` for the production domain and each main page's title and description, shared by the build and React. Change that file if you move to a custom domain; the old VITE_SITE_URL environment variable is no longer used.

Included: unique main-page metadata, Open Graph/Twitter previews, profile social links including YouTube, collection/article structured data, a sitemap with real content modification dates where available, and HTTP noindex headers for admin and smart-link routes. Draft/inactive/demo records are excluded from generated detail URLs as applicable. Rebuild after publishing content to refresh the sitemap and static metadata.

After Vercel deploys the GitHub update:

1. Add `https://itskarishma.vercel.app/` as a URL-prefix property in Google Search Console.
2. Set the supplied verification token as VITE_GOOGLE_SITE_VERIFICATION in Vercel and redeploy, then verify ownership. A custom domain can instead use DNS verification.
3. Submit `https://itskarishma.vercel.app/sitemap.xml` and inspect the homepage and portfolio URL.
4. Upload Karishma's own social preview image in Admin Settings when available. Publish genuine portfolio items and useful articles with descriptive image text and titles.

The build includes metadata in initial HTML; most page bodies still render with JavaScript. Unknown SPA routes can still return HTTP 200, with client-side noindex on the not-found view. Search Console verification, sitemap submission and search ranking are not completed by a GitHub push. Rankings or rich-result display are not guaranteed.

References: [Google title guidance](https://developers.google.com/search/docs/appearance/title-link), [Google sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).

Validation: `npm run build` followed by `node tests/seo-build.mjs`.
