# mia-princz.com

Personal portfolio of Mia Princz: a single-page site built with Next.js, React and
TypeScript, exported to plain static files and uploaded to the web host by hand.

## Requirements

- Node.js 22 or newer (the site is built with Node 24) and npm.
- No network access is needed at build time: fonts are bundled from npm packages.

## Commands

```powershell
git config core.hooksPath .githooks   # once after cloning: Conventional Commits check
npm ci             # install the exact locked dependencies
npm run dev        # development server on http://localhost:3000
npm run check      # type check, lint and unit tests
npm run build      # static export into out/
npm run preview    # serve out/ on http://localhost:4173 with real 404 handling
```

## Where things live

| Path | Purpose |
| --- | --- |
| `src/content/` | All copy and data, typed in `types.ts`. Edit these files to change what the site says. |
| `src/content/site.ts` | Name, canonical URL, email, GitHub and LinkedIn links, and `teachingSiteUrl`. |
| `src/content/projects.ts` | Featured projects. Append an entry to add one; the section hides itself when the list is empty. |
| `src/content/academic.ts` | Studies, research focus, education and the `outputs` list for future papers, TDK work, thesis and talks. |
| `src/components/sections/` | One component per section of the page. |
| `src/components/illustrations/` | The SVG line art: the clickable Bongo Cat in the hero and one drawing per section. Entrance animations key on `InView`. |
| `src/components/laptop/` | The laptop terminal in the Work drawing: `commands.ts` (pure command table), real shareware Doom (`RealDoom.tsx`, `doomEngine.ts`) and the Duke runner (`DukeRun.tsx`, pure engine in `duke.ts`). |
| `src/components/work/` | The desk easter eggs: the Lich King on its throne, the coffee mug window and the sticky note. |
| `public/audio/` | The horn and Lich King recordings. |
| `src/components/personal/` | The Off the clock easter eggs (popcorn, purring cat, war horn, Raider.IO link) and the cat photo surprise. |
| `src/lib/sound.ts` | Synthesised sounds (war horn, purr) on one shared audio context. |
| `src/content/sounds.ts` | Optional recordings that replace the synthesised sounds. |
| `public/doom/` | The Doom engine build with the shareware episode, plus its licence; see `docs/LICENSES-THIRD-PARTY.md`. |
| `src/components/teaching/` | The interactive chalkboard: canvas painter in `Chalkboard.tsx`, pure chalk and sponge helpers in `chalk.ts`. |
| `src/app/` | Routes, metadata, 404 page, sitemap, favicon and the social preview image. |
| `public/.htaccess` | Hosting rules copied into `out/` (404 page, caching, content type for the preview image). |
| `scripts/preview.mjs` | Dependency-free static server that mimics the host for local checks. |

### The teaching site link

`teachingSiteUrl` in `src/content/site.ts` is `null` until the separately hosted
teaching site exists. While it is `null`, the teaching section shows an email prompt
and the footer has no teaching link. Set it to the real `https://` address and both
appear; nothing else needs to change.

### Adding cat photos

Put the photos in `public/cats/` (a few hundred KB each at most; around 1200 px on
the long side is plenty) and list them in `catPhotos` in
`src/content/personal.ts` with a path, a short description for screen readers and
the pixel size. They then appear in two places: petting the cat in the Off the clock
drawing seven times fans them out, and the terminal's locked `cats/` folder opens
them with the sticky-note password. While the list is empty, neither shows photos.

### Desk secrets and the support link

`src/content/desk.ts` holds the sticky-note password and `supportUrl`. Set
`supportUrl` to a Buy Me a Coffee or Ko-fi page to add a support button to the coffee
mug's window; while it is `null` the window only tells a joke.

### Adding a research output

Add an object to `outputs` in `src/content/academic.ts` with a title, type, status,
date, summary and optional links. The "Research outputs" block renders only when the
list has entries.

## Deploying

The host serves static files from `public_html`.

1. Run `npm run check` and `npm run build`.
2. Upload the **contents** of `out/`, including the hidden `.htaccess` file, to
   `public_html`, replacing what is there. Delete leftovers from the previous site
   (its `assets/` and `imgs/` folders) so stale files are not served.
3. Open the site, one unknown URL (it must show the designed 404 page) and
   `/sitemap.xml`.

`.htaccess` relies on Apache-compatible hosting: `ErrorDocument` for the 404 page and
`ForceType` so the extension-less `opengraph-image` file is served as PNG.

## Licences

Site code is the author's. Fonts: Fraunces, IBM Plex Sans and IBM Plex Mono, all
under the SIL Open Font License 1.1, bundled from the `@fontsource` packages.
