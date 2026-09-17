# Ironside AI — new hero

This is **your `index.html`**, with the hero section replaced. Everything else in the
file is byte-for-byte what you sent me.

## What to do

Upload **one file**: `index.html`. That's the whole job.

1. github.com → your repo → click `index.html` → **pencil icon**
2. Select all (Cmd+A), delete, paste in the new `index.html`
3. **Commit changes**
4. Render rebuilds on its own, usually under a minute — watch **Events** in your Render
   dashboard, then hard-refresh with **Cmd+Shift+R**

If it looks wrong: Render → **Deploys → ⋯ → Rollback**. Your old version comes straight
back. Nothing here can break the site permanently.

> **There is no `hero.js` anymore** — that's why it wouldn't open. The script was 30
> lines, so it now lives inside `index.html` at the bottom. Same for the styles. One
> file, nothing else to upload, nothing that can go missing.

## What changed

- The hero section only. New headline (*Never miss another customer.*), short sub-line,
  and the animated connection graph behind it.
- Old hero copy, `.blueprint-grid` and the old `.corner-mark` divs are gone — the new
  hero draws its own.

## What I deliberately did **not** touch

- **Your header, nav and mobile menu.** They already work and `script.js` is wired to
  `#navToggle`. Replacing them would have risked breaking that for no real gain.
- **Your buttons.** The hero uses your existing `.btn .btn-accent` / `.btn .btn-ghost`,
  so the colours match the rest of the site exactly.
- **Your `.eyebrow` styling**, your fonts, your `styles.css`, your `script.js`, your
  schema markup, your form, your footer.
- Your two `TODO` comments (pricing ranges, business email) are still there.

## Why every class starts with `ih-`

Your `styles.css` already defines `.hero`, `.btn` and `.eyebrow`. If I'd shipped my
original class names, your rules and mine would have fought each other and your buttons
and spacing would have broken in ways that are miserable to debug. So every new class is
prefixed `ih-` (`ih-hero`, `ih-field`, `ih-content`…). Nothing collides, and your
stylesheet needs no changes at all.

`hero.css` in this folder is the same styles as a standalone file. **You don't need it** —
they're already inlined in `index.html`. It's only there if you'd rather move them into
`styles.css` later, in which case delete the `<style>` block from `index.html`.

## Details

- **Fonts** — matched to yours: Archivo 800 for the headline, IBM Plex Sans for the
  sub-line. Your existing Google Fonts line already loads both, so no new requests.
- **Height** — the hero measures your header at runtime and sizes itself to exactly one
  screen minus that, so the Discover cue always sits just above the fold. It adapts if
  you ever change the header height.
- **Motion** — the graph drifts, three nodes pulse, light runs along two connections, and
  the layers shift with your pointer. All of it switches off for *Reduce motion*.
- **Mobile** — the graph lifts and dims so the headline always wins, the eyebrow shortens
  to just "Sudbury, Ontario", and the buttons stack full width.
- **Weight** — about 24 KB of extra HTML/CSS. No images, no libraries, no new requests.

## Worth doing soon

- **`og:image`** — your page has no social preview image, so links to the site show a
  blank card when shared. A 1200×630 image plus one `<meta property="og:image">` line
  fixes it.
- **`logo.svg`** in this folder is your mark rebuilt as vector (traced from the file you
  sent, gradient included). Your header currently uses `logo-180.png`, which is fine —
  the SVG is just sharper on retina screens and a fraction of the size, if you ever want
  to swap it.
