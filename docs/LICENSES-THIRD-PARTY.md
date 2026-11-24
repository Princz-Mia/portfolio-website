# Third-party files

Files in this repository that were not written for this site, where they came
from, and the terms they are distributed under.

## Doom engine and shareware data: `public/doom/`

The laptop terminal's `doom` command loads the real game: id Software's Doom
engine compiled to WebAssembly, with the shareware episode (Knee-Deep in the
Dead) built into the same file. It is fetched only when someone starts the
game; no page loads it otherwise.

| File | Size (bytes) | What it is |
| --- | --- | --- |
| `public/doom/doom.wasm` | 4,559,928 (about 1.9 MB gzipped) | doom.wasm v0.1.0: the Doom engine (doomgeneric, derived from Chocolate Doom and id Software's 1997 source release) as a self-contained WebAssembly module, with the shareware `DOOM1.WAD` embedded |
| `public/doom/COPYING.txt` | 18,092 | GNU General Public License, version 2, as shipped with doom.wasm |
| `public/doom/README.txt` | small | Source, version and licence notice that travels with the files |

### doom.wasm v0.1.0

- Project: <https://github.com/jacobenget/doom.wasm> (author: Jacob Enget)
- Release: "Version 0.1.0", tag `v0.1.0`, published 2024-11-26:
  <https://github.com/jacobenget/doom.wasm/releases/tag/v0.1.0>
- Downloaded from the release asset:
  <https://github.com/jacobenget/doom.wasm/releases/download/v0.1.0/doom-v0.1.0.wasm>
  (saved as `doom.wasm`, unmodified)
- Source code for this build (commit the release documents):
  <https://github.com/jacobenget/doom.wasm/tree/24bb772900cc16f4c62e28ff16ea2d80f99389e6>
- Licence: GNU GPL version 2 (`COPYING.txt`, taken from
  <https://raw.githubusercontent.com/jacobenget/doom.wasm/24bb772900cc16f4c62e28ff16ea2d80f99389e6/LICENSE>).
  The engine includes code from doomgeneric (ozkl), Chocolate Doom
  (Simon Howard and contributors) and the Doom source released by id Software
  under the GPL. The complete corresponding source is available at the
  commit linked above.
- Checksums of `doom.wasm`:
  - MD5 `5e8c8d89b0fb6efe4e9e806631edcc5d`
  - SHA-256 `8edfe49a7583fd975199969302d8e9adcf8e714d0af72bf3e672f991fd810faa`
- Checksum of `COPYING.txt`: SHA-256
  `8177f97513213526df2cf6184d8ff986c675afb514d4e68a404010521b880643`

### DOOM1.WAD (shareware, v1.9), embedded in `doom.wasm`

- The game data is not a separate file here: doom.wasm embeds it at build time
  (its Makefile fetches it from
  <https://distro.ibiblio.org/slitaz/sources/packages/d/doom1.wad>, the URL
  listed on <https://doomwiki.org/wiki/DOOM1.WAD>).
- Verified by locating the `IWAD` header inside `doom.wasm` and hashing the
  4,196,020-byte span it describes (1,264 lumps):
  - MD5 `f0cefca49926d00903cf57551d901abe` (matches the published checksum of
    the v1.9 shareware DOOM1.WAD)
  - SHA-1 `5b2e249b9c5133ec987b3ea77596381dc0d6bc1d`
- Copyright id Software. Not covered by the GPL. id Software allows the
  shareware episode to be copied and given to others free of charge; it may
  not be sold or distributed for payment without id's written consent. A 1999
  statement from id's John Carmack, quoted in Debian's `doom-wad-shareware`
  copyright file, reads "The DOOM shareware wad is freely distributable."
  (<https://metadata.ftp-master.debian.org/changelogs/non-free/d/doom-wad-shareware/unstable_copyright>)
- DOOM is a trademark of id Software. This site is a personal portfolio, is not
  affiliated with id Software, and charges nothing.

### Hosting notes

- `public/.htaccess` serves `.wasm` as `application/wasm` (needed for
  streaming compilation), compresses it, and caches it for 30 days.
- `scripts/preview.mjs` serves `.wasm` with the same type.
- The game has no sound: doom.wasm v0.1.0 does not produce audio.
- While the game runs, a link under it ("DOOM shareware © id Software · engine
  doom.wasm (GPL-2.0)") opens `README.txt`, and the terminal prints the same
  credit, so the licence and the source offer are visible to players.

## Duke, the Java mascot (laptop terminal's `duke` command)

The `duke` command runs a small endless runner whose hero is Duke, the Java
mascot. No image files are copied: Duke is drawn on a canvas by
`src/components/laptop/dukeDraw.ts` as an original line drawing in this site's
style (dark head, red nose, white body).

- Sun Microsystems released the Duke artwork as open source under the new BSD
  licence in 2006 (<https://wiki.openjdk.org/display/duke/Main>), so drawing
  him is permitted.
- Java is a trademark of Oracle and/or its affiliates. This site is not
  affiliated with Oracle.
- The game credits Duke under the canvas ("Duke, the Java mascot (BSD
  licence), redrawn in line art").

## CV template and fonts (`cv/`)

- `cv/deedy-resume-reversed.cls` is a variant of the Deedy résumé class by
  Debarghya Das (<https://github.com/deedy/Deedy-Resume>, Apache License 2.0),
  with changes of its own. It was carried over from the earlier CV project; the
  class header now loads the base class before any package so that it compiles
  without errors.
- Lato (Łukasz Dziedzic) and Raleway (Matt McInerney, Pablo Impallari, Rodrigo
  Fuenzalida) in `cv/fonts/` are licensed under the SIL Open Font License 1.1
  (<https://openfontlicense.org>), which allows bundling them with the CV source.

## PDF.js (the CV page)

The `/cv/` page draws the CV with PDF.js (`pdfjs-dist`, Mozilla, Apache License
2.0, <https://github.com/mozilla/pdf.js>). Its legacy build and worker are
bundled into the exported site unchanged.
