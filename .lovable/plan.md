Google Search Console is not currently added to the live site. I checked the rendered HTML of `https://offai.lovable.app` and found no `google-site-verification` meta tag. The sitemap and robots.txt are already in place, so after verification Google can begin indexing the public pages and blog articles.

## What I will do

1. **Add the verification meta tag**
   - Insert the provided tag into `index.html` `<head>`:
   - Tag: `google-site-verification=E3nRPlwIz8L5Z7Gxz50ZylqD9TrcBHBcrUm8Tdz-iZM`
   - This must be present in the server-rendered HTML (not injected client-side after hydration), so it goes directly in `index.html`.

2. **Publish the site**
   - Deploy the change so the meta tag appears on `https://offai.lovable.app/`.

3. **Verify in Google Search Console**
   - Option A: If you connect the Google Search Console connector in Lovable, I can call the verification API for you.
   - Option B (manual): After publish, go to Google Search Console, click **Verify** on your property, and Google will read the meta tag.

## Note on current head metadata

The current `<title>` and meta description are still template-quality:
- Title: `learn and earn withai`
- Description: `we earn more from this and genratr from this site`

Google uses these in search results, so I can also rewrite them to a proper SEO title and description while I’m editing `index.html`.

## Technical details

- File to edit: `index.html`
- Required tag format: `<meta name="google-site-verification" content="google-site-verification=E3nRPlwIz8L5Z7Gxz50ZylqD9TrcBHBcrUm8Tdz-iZM" />`
- No backend changes required.
- No breaking changes to existing routes or auth.