# Shot list — photography for `/negocios`

## Why this document exists

`/negocios` needs photographs of the product **in a business setting**: a café display
case, a school event table, a club gathering, an office meeting. No such photograph
exists today. The three product photos in `public/` are studio-style shots of a single
serving, and the branding folder adds nothing usable — its `sabor-de-la-semana` stories
carry burned-in text and a price, which would violate the page's no-price rule in pixels
while the automated copy guard stayed green.

These photographs cannot be substituted. Stock imagery of a café in another country,
presented on a page that says "en Loja", misrepresents the business to the exact buyers
it is trying to earn trust from. The page is built to hold real photographs; this is the
list of what to capture.

## How the page uses them

Segment media is optional by contract (`SegmentMedia` in `src/lib/business-segments.ts`).
A segment with no photo renders text-led and reads as deliberate composition — that is how
`clubes` ships today. So these can land one at a time, in any order, with no code change
beyond adding the `media` block to that segment.

Target: **4:3 landscape**, minimum 1200px wide, well lit, shot on a phone is fine.

## The shots

### 1. Cafetería — display case (highest value)

The single most useful photo on the page. A café owner needs to see the product sitting in
a case like theirs.

- Several units arranged in a real display case or on a counter, as a customer sees them
- Shoot at counter height, straight on, not from above
- Include enough of the case frame to read as a business, not a kitchen
- Natural light from the side; avoid direct flash on the plastic lids

### 2. Colegio — event table

- A tray or table set for an event, portions laid out for serving
- Wide enough to show quantity — the point is volume, not one dessert
- No identifiable minors in frame. If children are present, shoot from behind or crop to
  the table. This is not optional.

### 3. Club — gathering table

Currently the only segment with no photo at all.

- A table at a tournament, meeting or club event with the order laid out
- Context cues that read "club" — a hall, a court-side table, a shared long table
- Same rule on identifiable people: crop to the food and the setting

### 4. Empresa — office delivery

The current `empresas` photo is a butterfly birthday cake reading "Happy Birthday",
which contradicts the corporate framing.

- The order arriving or laid out in an office: a meeting table, a reception desk
- Boxes or trays as delivered, before serving, reads as a coordinated delivery
- Neutral office surroundings; no client branding or documents legible in frame

### 5. Open Graph card — 1200×630

Not a segment photo, and easy to forget: this is the image that appears when the link is
pasted into WhatsApp, which is how every recipient will first see this page.

- Landscape crop of the strongest business-context shot above
- Keep the centre clear; WhatsApp crops the edges on some clients
- Save as `public/og-negocios.png` and set `ogImage` on the page

## Before shooting

- Ask permission from the business owner before photographing their premises, and confirm
  they are willing to have it appear on your site.
- Do not photograph people who have not agreed to appear.
- Shoot more frames than you think you need, from more angles. Cropping later is free;
  going back is not.

## After shooting

Drop the files into `public/`, then add the `media` block to the matching segment in
`src/lib/business-segments.ts`:

```ts
media: {
  src: "/negocios-cafeteria-vitrina.jpg",
  alt: "Minitortas en la vitrina de una cafetería en Loja",
},
```

The `alt` text must describe what the photograph actually shows and must never claim a
setting the image does not contain — the same rule the existing entries follow.
