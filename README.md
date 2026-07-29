# Lodge Al Ameen — static site (Grand Lodge of Scotland–inspired design)

Six pages (Home, History, Membership, Visit, Gallery, Contact) + thanks/404, one stylesheet, placeholder logo, no build step.

## Deploy to Netlify (free)

1. Sign in at netlify.com.
2. Go to **app.netlify.com/drop** and drag the ZIP (or this whole folder) onto the page. The zip must have `index.html` at its top level — it does.
3. Site goes live on a `*.netlify.app` URL. Review everything there first.

## Connect lodgealameen.in

1. Netlify: Site → **Domain management** → **Add custom domain** → `lodgealameen.in`.
2. At your registrar, follow Netlify's DNS instructions (Netlify DNS nameservers, or A record for apex + CNAME for www).
3. HTTPS is automatic once DNS propagates. Keep the WordPress site running until the switch is verified.

## Contact form (Formspree)

The form POSTs to https://formspree.io/f/mvzywdaw. The email recipient is set in the Formspree dashboard for that form — confirm it is vijayjagannathan@gmail.com there. After the redesign goes live, submit a test and check the inbox (and spam folder for the first one). Free tier: 50 submissions/month. Note: on the free plan, after submitting, visitors see Formspree's own thank-you page, not thanks.html.

## Logo — placeholder

`images/logo.svg` is a stand-in square-and-compasses drawn for this site. Replace the file with the lodge's official crest artwork (keep the filename, or update the `src` in each page's header). Do not copy the Grand Lodge of Scotland's crest — it is theirs.

## Facts on the site (per the lodge register)

- First founding member: HH Sir Sayed Raza Ali Khan, Nawab Saheb of Rampur, enrolled 11 January 1946.
- Constituted in Mumbai, 7 February 1946, under the Grand Lodge of Scotland.
- Warrant transferred to Bangalore; installation held **19 November 2010** (the register reads 2010 — confirm if the minutes say otherwise). Move assisted by Bro. Pervez Bativala.

## Still marked VERIFY in the HTML

- **Meeting schedule** (index.html, visit.html): site tradition says 3rd Tuesday of odd months at 6:00 PM; the DGLI roll (dgli-sc.com/roll.php) says 2nd Friday monthly except May, at 6:30 PM. Fix whichever is wrong and update the DGLI listing to match.
- **Installation month** placeholder in visit.html.
- **Hall redevelopment** year/wording on the history page.

## Images

- `images/home-hero.jpg` — Home page banner (Vijay-supplied photo).
- `images/gallery-new-1.jpg` — Gallery photo (Vijay-supplied).
- `images/crest-alameen.png` — Lodge crest, used in the header and as the DGLI-SC footer placeholder.
- `images/glos-crest.png` — Grand Lodge of Scotland crest, cropped from the GLoS letterhead, used only in the footer affiliation block (not the header — see Logo section below).
- Remaining gallery photos still load from the existing WordPress site (lodgealameen.in). Before retiring WordPress, download them into `images/` and update the `src` URLs in gallery.html.

## Gallery lightbox

Clicking any photo in gallery.html opens an enlarged view (`js/lightbox.js`, no external library). Arrow keys/on-screen arrows move between photos, Escape or the × closes it. To add a photo: copy one `<a class="gallery-item">...</a>` block in gallery.html and point `href`/`src` at the new image — no caption needed, none are shown.

## Affiliation links (footer)

Every page footer now links to both the Grand Lodge of Scotland (grandlodgescotland.com, with their crest) and the District Grand Lodge of India, SC (dgli-sc.com, text badge — no DGLI crest file was supplied, so it doesn't borrow anyone else's mark). Add a real DGLI-SC crest to `images/` and swap the markup in `.affiliation-row` on every page if you'd rather show their emblem too.

## Editing later

Plain HTML — edit any page in a text editor. If you're still on the old drag-and-drop workflow, re-drag the folder/zip to Netlify. Once article publishing is set up (below), you'll instead push changes to GitHub and Netlify rebuilds automatically. The footer year updates itself either way.

## Setting up article publishing (admin login + CMS)

This site now has an **Articles** section and an admin panel at `/admin/`, built with **Decap CMS** (free, open source). Someone logs in there, writes an article in a simple editor, clicks Publish, and it appears on `/articles.html` automatically — no HTML editing.

How it works under the hood: articles are Markdown files in `/articles/`; a small build script (`scripts/build-articles.js`, no external dependencies) turns them into styled pages matching the rest of the site every time the site is deployed. Decap CMS itself needs somewhere to store logins and commit the files it saves — Netlify's old built-in option for this (Identity + Git Gateway) was deprecated in 2026, so this is wired up for **[DecapBridge](https://decapbridge.com)**, a free replacement built for exactly this purpose.

**This requires moving the site off the drag-and-drop workflow onto GitHub**, because Decap CMS needs a real Git repository to commit articles to. That's a one-time change; everything about how the site *looks* and *works* stays the same.

### One-time setup — do these in order

1. **Create a GitHub account** (free) at github.com if you don't have one, and create a new repository — call it something like `lodge-al-ameen-website`. Keep it Public or Private, either works.
2. **Upload this folder's contents to that repository.** Easiest way: on the repo's GitHub page, use "Add file → Upload files" and drag in everything from this zip (keeping the folder structure). If you'd rather do this with Claude's help via the command line, ask and I'll walk you through it in a follow-up session.
3. **Reconnect Netlify to GitHub instead of drag-and-drop:** Netlify dashboard → your site → **Site configuration** → **Build & deploy** → **Link repository** (or create a new site via "Import an existing project" → GitHub → select the repo). Netlify will detect `netlify.toml` and use its build settings automatically.
4. **Re-point your custom domain** (lodgealameen.in) to this new Git-connected site if Netlify creates it as a separate site from your current one — Domain management → Add custom domain, same as before.
5. **Sign up at [decapbridge.com](https://decapbridge.com)** and click "Create New Site." It will ask for:
   - Your GitHub repo, as `your-username/your-repo-name`.
   - A GitHub **fine-grained personal access token** — DecapBridge's own setup page shows exactly how to generate one (GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens → grant it Read-and-write access to Contents and Pull requests, scoped to just this repo).
   - Your Decap CMS URL: `https://lodgealameen.in/admin/`.
6. **Copy the values DecapBridge gives you into `admin/config.yml`** — replace `YOUR-GITHUB-USERNAME/YOUR-REPO-NAME` and `YOUR-SITE-ID` with the real values shown on your DecapBridge dashboard. Commit that change to GitHub (Netlify will redeploy automatically).
7. **Test it:** visit `https://lodgealameen.in/admin/`, log in with the DecapBridge account you just created, and publish a test article. It should appear on `/articles.html` within a minute or two once Netlify finishes rebuilding.
8. **Invite other officers:** DecapBridge dashboard → your site → **Manage Collaborators** → enter their name and email. They'll get an email invite and can log in with their own email — no GitHub account needed on their end.

If anything in steps 1–4 (the GitHub/Netlify account-linking part) trips you up, that's normal — it's the fiddliest part, and I can't click through your GitHub/Netlify accounts for you since I don't have access to them. Come back with what you see on screen and I can talk you through it.
