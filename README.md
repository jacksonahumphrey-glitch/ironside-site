# Ironside AI — Website

Static site: plain HTML/CSS/JS, no build step, no framework. Three files do all the work:

```
index.html    all page content and structure
styles.css    the design system (colors, type, layout)
script.js     mobile nav toggle only
```

## Before you launch — do these first

1. **Contact form endpoint.** Open `index.html`, find the `<form>` tag, and replace
   `https://formspree.io/f/REPLACE_WITH_YOUR_FORM_ID` with your real Formspree endpoint
   (see setup below).
2. **Contact email.** Replace `hello@ironsideai.ca` (appears twice: the footer link and the
   Formspree account you register) with your real business email.
3. **Phone number.** Intentionally left off the site for now. Add it to the footer and/or
   contact section once you've decided cell vs. a dedicated business line.
4. **Pricing numbers.** The two `<!-- TODO -->` comments in the Pricing section are where
   your setup fee and monthly retainer figures go once you've settled on them.
5. **Test the form for real.** After deploying, submit one real entry through the live form
   and confirm it actually lands in your inbox. Don't rely on the form just looking correct.

## Setting up the contact form (Formspree, free tier)

1. Go to formspree.io and create a free account.
2. Create a new form, and copy the endpoint it gives you
   (looks like `https://formspree.io/f/abc123xy`).
3. Paste that into the `action="..."` attribute of the `<form>` in `index.html`.
4. Formspree will email you every submission, and also keeps a log of past submissions
   in your Formspree dashboard — so you get basic history without needing your own backend.

Web3Forms is a similar free alternative if you'd rather use that instead.

## Putting it on GitHub

```bash
cd ironside-site
git init
git add .
git commit -m "Initial site"
```

Then create a new empty repository on GitHub (no README/license, since you already have one
locally) and push:

```bash
git remote add origin https://github.com/YOUR_USERNAME/ironside-site.git
git branch -M main
git push -u origin main
```

## Deploying on Render

1. In the Render dashboard, click **New > Static Site**.
2. Connect your GitHub account and select the `ironside-site` repository.
3. Build command: leave blank (there's no build step).
4. Publish directory: `.` (the repo root, since `index.html` lives there directly).
5. Deploy. Render will give you a `.onrender.com` URL immediately; you can attach a custom
   domain afterward from the site's Settings tab.

Netlify and Vercel both work the same way for a static site like this, if you end up
preferring either of those instead.

## Editing later

Everything is plain HTML/CSS — no build tools, no npm packages, no framework. Open
`index.html` in any editor, change the copy or markup directly, commit, and push; Render
redeploys automatically on every push to `main`.
