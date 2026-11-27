# House4Rent.ng — property marketplace (front-end prototype)

A property-only classifieds site: houses & apartments for rent and sale, land & plots, short lets, new builds, commercial property and event spaces. Layout follows the familiar classifieds pattern (filter sidebar + card grid + detail page), with its own brand, copy and demo data.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build to dist/
```

## Screens

| Route | Screen |
| --- | --- |
| `/` | Home: hero search, category tiles, featured / rentals / land / short-let shelves, popular areas |
| `/:city/:category` | Listings, e.g. `/port-harcourt/real-estate`, `/lagos/land-plots-for-sale`. Sidebar filters (category counts, location picker, price bands, type, bedrooms, bathrooms, furnishing, condition, title document, facilities, verified sellers), quick price chips, type tiles, active-filter chips, sort, posted-within, grid/list, pagination, mobile filter sheet. All state lives in the URL. |
| `/listing/:id/:slug` | Detail: gallery + full-screen viewer, key facts, attributes, description, facilities, move-in / mortgage / booking / land cost calculator, map, price card, call-back request, seller card, show contact, start chat, report / mark unavailable, safety tips, similar + recently viewed |
| `/sell` | 5-step post-ad wizard (category & location → details → photos → price & contact → review). `?edit=<id>` edits your ad |
| `/seller/:id` | Seller profile with adverts, feedback and about tabs |
| `/agents` | Trusted agents directory |
| `/price-check` | Asking-price stats by city, category, type, bedrooms and area |
| `/saved`, `/messages`, `/my-ads` | Saved adverts, chat with sellers, manage your adverts |
| `/login`, `/register` | Mock auth |
| `/about`, `/safety`, `/terms`, `/privacy` | Info pages (placeholder legal text) |

## Where things live

- `src/data/` — categories, cities/areas, sellers, image pools and the seeded listing generator (`listings.ts`).
- `src/lib/store.tsx` — client state (user, saved, posted ads, chats, recently viewed) persisted to `localStorage`.
- `src/lib/filters.ts` — URL ↔ filter parsing, filtering, sorting, facet counts and price bands.
- `src/components/`, `src/pages/` — UI.

## Going to production

1. Replace `SEED_LISTINGS` and the store actions with API calls (listings, sellers, auth, chat, uploads).
2. Upload photos to object storage instead of storing data URLs in `localStorage`.
3. Move filtering/pagination server-side once inventory grows.
4. Replace the Unsplash demo photos and placeholder legal pages.
