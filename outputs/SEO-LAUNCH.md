# Its Karishma: search visibility and launch

## Identity to keep consistent

- Website: https://itskarishma.vercel.app/
- Name: Karishma Chauhan
- Website name: Its Karishma (itskarishma)
- Instagram: https://www.instagram.com/itskarishma.chauhan/
- YouTube: https://www.youtube.com/@Karishmachauhan2z
- Focus: Mumbai beauty, fashion, lifestyle, makeup, GRWM and traditional looks.

These social URLs come from the existing portfolio settings, not the unrelated accounts in the search screenshots. Review the handles in Creator Settings before launch. Do not add another person's profile, job title, press coverage or photographs to compete with their name results.

## Implemented in this source

Distinct page titles and descriptions; canonical URLs; social share metadata; a shared Person / WebSite / ProfilePage identity graph with stable IDs and social sameAs links; visible official profile links; large image preview permission; crawlable initial HTML summaries, published detail content and internal links; sitemap; robots.txt; preserved Google verification file; noindex admin and redirect routes; real HTTP 404 responses for unknown Vercel URLs.

The initial HTML is a build-time public-content snapshot, not live server rendering. CMS content and route changes require a rebuild. React loads current content after startup. Only published content and active, non-demo products are included in the generated route list. A portrait is included in Person markup only when a real profile_image is configured; an editorial stock image is not presented as Karishma's portrait.

## Deploy and verify

1. Deploy this updated source to the existing Vercel project using `npm run build` and output directory `dist`. Keep the production content environment variables configured so published pages are included. This document does not establish that deployment occurred.
2. Run `npm run test:seo` after the build. Open the deployed home, about, portfolio, robots.txt and sitemap.xml. Confirm an invented URL returns HTTP 404 and admin still loads with a noindex header.
3. In Google Search Console, add the URL-prefix property `https://itskarishma.vercel.app/`. Select HTML-file verification and confirm Google issued the existing `googlef0b545d4da8f015e.html` token for your Google account/property. The file being online alone does not mean ownership has been verified. Alternatively set your actual `VITE_GOOGLE_SITE_VERIFICATION` value and redeploy.
4. Submit `https://itskarishma.vercel.app/sitemap.xml` in Sitemaps. Use URL Inspection on the home and about pages, run Test Live URL, and request indexing if available. Repeat for substantive published portfolio or article pages.
5. Check the deployed home and about pages with Google's Rich Results Test and Schema.org Validator. Structured data can clarify identity but does not guarantee rich results, sitelinks, a knowledge panel, or ranking.
6. Monitor Search Console indexing exclusions and Performance for `Karishma Chauhan`, `itskarishma`, `Karishma Chauhan beauty creator` and the exact social handles. Track impressions/clicks over time; personalized search screenshots are not a reliable ranking measurement.

## Actions on your social accounts

Add the exact website URL to Instagram's profile links and YouTube's channel profile links. Use the same name and accurate creator description across profiles. Suggested description, if it matches the channel content:

> Karishma Chauhan | Its Karishma. Mumbai beauty, fashion & lifestyle creator. Makeup, GRWM, traditional looks and everyday inspiration. Portfolio and collaborations: https://itskarishma.vercel.app/

These account edits have not been made. The website's sameAs links alone cannot change Instagram or YouTube search results.

## Content and maintenance

Upload Karishma's own clear portrait and an appropriate social preview image in Creator Settings. Publish original work with specific titles, useful descriptions, relevant images and links to the actual reel/video. Add video transcripts or meaningful summaries where useful. Keep service, contact and biography details accurate. Earn relevant links from real collaborators; avoid purchased links, repeated keywords and invented credentials. Rebuild after publishing, unpublishing, changing a slug, or updating identity information.

Search engines choose when to crawl and index, and may rewrite titles or snippets. A common personal name competes with other people; the distinctive creator name, handles, relevant content and consistent links help disambiguate it. There is no guaranteed first-page position or fixed indexing deadline.

## Official references

- [Google profile-page structured data](https://developers.google.com/search/docs/appearance/structured-data/profile-page)
- [Google sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview)
- [Google SEO guidance for developers](https://developers.google.com/search/docs/fundamentals/get-started-developers)
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Schema.org Validator](https://validator.schema.org/)
