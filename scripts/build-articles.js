#!/usr/bin/env node
/**
 * Zero-dependency static build step for the Articles section.
 *
 * Reads Markdown files from /articles/*.md (each with simple YAML-style
 * frontmatter), and generates:
 *   - /articles/<slug>.html   — one page per article, in the site's own look
 *   - /articles.html          — a listing page, newest first
 *
 * Runs on Netlify automatically on every deploy (see netlify.toml) and
 * on every save made through the Decap CMS admin panel at /admin/, since
 * a CMS save is just a Git commit, which triggers a new Netlify build.
 *
 * Deliberately dependency-free (no npm install step) so the Netlify build
 * stays fast and has nothing to break. The Markdown support is intentionally
 * small: paragraphs, blank-line breaks, #/##/### headings, **bold**, *italic*,
 * and [text](url) links. That covers ordinary article writing; anything
 * fancier (tables, images inline in the body) can be added later if needed.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ARTICLES_DIR = path.join(ROOT, 'articles');
const SITE_URL_PLACEHOLDER = 'https://www.lodgealameen.in';

// ---------- frontmatter + markdown parsing ----------

function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { meta: {}, body: raw };
  const [, fm, body] = match;
  const meta = {};
  fm.split(/\r?\n/).forEach((line) => {
    const m = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!m) return;
    let [, key, value] = m;
    value = value.trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    meta[key] = value;
  });
  return { meta, body: body.trim() };
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function inlineMarkdown(text) {
  let s = escapeHtml(text);
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2">$1</a>');
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  return s;
}

function markdownToHtml(md) {
  const blocks = md.split(/\r?\n\r?\n+/);
  return blocks
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return '';
      const h3 = trimmed.match(/^###\s+(.*)$/);
      if (h3) return `<h3>${inlineMarkdown(h3[1])}</h3>`;
      const h2 = trimmed.match(/^##\s+(.*)$/);
      if (h2) return `<h2>${inlineMarkdown(h2[1])}</h2>`;
      const h1 = trimmed.match(/^#\s+(.*)$/);
      if (h1) return `<h2>${inlineMarkdown(h1[1])}</h2>`; // articles use <h1> for the title already
      const lines = trimmed.split(/\r?\n/).map((l) => inlineMarkdown(l));
      return `<p>${lines.join('<br>')}</p>`;
    })
    .filter(Boolean)
    .join('\n    ');
}

function slugify(name) {
  return name.replace(/\.md$/i, '');
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ---------- shared site chrome (kept in sync with the static pages by hand) ----------

function pageHead(title, description) {
  return `<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<link rel="icon" href="/images/logo.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/style.css">`;
}

function header(active) {
  const link = (href, label) =>
    `<a href="${href}"${active === label ? ' class="active"' : ''}>${label}</a>`;
  return `<header class="site-header">
  <div class="header-top">
    <img src="/images/crest-alameen.png" onerror="this.onerror=null;this.src='/images/logo.svg'" alt="Crest of Lodge Al-Ameen No. 1412 SC">
    <div class="wordmark">Lodge Al-Ameen No. 1412 SC<span class="wordmark-sub">Antient Free and Accepted Masons · Bangalore</span></div>
  </div>
  <nav class="main-nav" aria-label="Main navigation">
    ${link('/index.html', 'Home')}
    ${link('/history.html', 'History')}
    ${link('/membership.html', 'Membership')}
    ${link('/visit.html', 'Visit')}
    ${link('/gallery.html', 'Gallery')}
    ${link('/articles.html', 'Articles')}
    ${link('/contact.html', 'Contact')}
  </nav>
</header>`;
}

function footer() {
  return `<footer class="site-footer">
  <p>Lodge Al-Ameen No. 1412 SC · Freemasons' Hall, 2 Primrose Road, Bengaluru 560 025</p>
  <p><a href="mailto:secretary.lodgealameen@gmail.com">secretary.lodgealameen@gmail.com</a></p>
  <div class="affiliation-row">
    <a href="https://www.grandlodgescotland.com/" target="_blank" rel="noopener">
      <img src="/images/glos-crest.png" onerror="this.style.display='none'" alt="Crest of the Grand Lodge of Scotland">
      <span>Grand Lodge of Scotland</span>
    </a>
    <a href="https://www.dgli-sc.com/" target="_blank" rel="noopener" class="affiliation-text-only">
      <span class="affiliation-mark">DGLI</span>
      <span>District Grand Lodge of India, SC</span>
    </a>
  </div>
  <p class="fine">© <span id="yr"></span> Lodge Al-Ameen No. 1412 SC. All rights reserved.</p>
  <script>document.getElementById('yr').textContent=new Date().getFullYear();</script>
</footer>`;
}

// ---------- page builders ----------

function articlePage(meta, bodyHtml, slug) {
  const title = meta.title || slug;
  const dateStr = formatDate(meta.date);
  const author = meta.author ? `<p class="form-note">By ${escapeHtml(meta.author)}${dateStr ? ' · ' + dateStr : ''}</p>` : (dateStr ? `<p class="form-note">${dateStr}</p>` : '');
  const heroImg = meta.image
    ? `<div class="hero-photo" style="height:auto"><img src="${escapeHtml(meta.image)}" alt="${escapeHtml(title)}" style="height:min(46vh,420px);object-fit:cover;object-position:center 25%"></div>`
    : '';
  return `<!DOCTYPE html>
<html lang="en">
<head>
${pageHead(title + ' | Lodge Al-Ameen No. 1412 SC', meta.excerpt || title)}
</head>
<body>

${header('Articles')}

${heroImg}

<section class="section narrow">
  <span class="kicker">Article</span>
  <h2>${escapeHtml(title)}</h2>
  ${author}
  <div class="prose" style="margin-top:24px">
    ${bodyHtml}
  </div>
  <div style="text-align:center;margin-top:44px">
    <a class="btn btn-ghost" href="/articles.html">&larr; Back to Articles</a>
  </div>
</section>

${footer()}

</body>
</html>
`;
}

function listingPage(articles) {
  const cards = articles
    .map((a) => {
      const dateStr = formatDate(a.meta.date);
      return `      <div class="card">
        <h3><a href="/articles/${a.slug}.html" style="color:inherit;text-decoration:none">${escapeHtml(a.meta.title || a.slug)}</a></h3>
        ${dateStr ? `<p style="font-size:12.5px;letter-spacing:1px;text-transform:uppercase;color:var(--gold);margin-bottom:8px">${dateStr}</p>` : ''}
        <p>${escapeHtml(a.meta.excerpt || '')}</p>
        <a class="card-link" href="/articles/${a.slug}.html">Read more &rarr;</a>
      </div>`;
    })
    .join('\n');

  const empty = `      <p class="lede">No articles have been published yet. Articles added through the admin panel at <a href="/admin/">/admin/</a> will appear here automatically.</p>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
${pageHead('Articles | Lodge Al-Ameen No. 1412 SC', 'News, notices and reflections from Lodge Al-Ameen No. 1412 SC, Bangalore.')}
</head>
<body>

${header('Articles')}

<div class="page-hero">
  <h1>Articles</h1>
  <p>News and notices from the Lodge</p>
</div>

<section class="section">
  <div class="card-grid" style="margin-top:10px">
${articles.length ? cards : empty}
  </div>
</section>

${footer()}

</body>
</html>
`;
}

// ---------- run ----------

function main() {
  if (!fs.existsSync(ARTICLES_DIR)) {
    fs.mkdirSync(ARTICLES_DIR, { recursive: true });
  }

  const files = fs
    .readdirSync(ARTICLES_DIR)
    .filter((f) => f.endsWith('.md'));

  const articles = files.map((file) => {
    const raw = fs.readFileSync(path.join(ARTICLES_DIR, file), 'utf8');
    const { meta, body } = parseFrontmatter(raw);
    const slug = slugify(file);
    return { slug, meta, bodyHtml: markdownToHtml(body) };
  });

  // newest first; articles without a date sort last
  articles.sort((a, b) => {
    const da = a.meta.date ? new Date(a.meta.date).getTime() : -Infinity;
    const db = b.meta.date ? new Date(b.meta.date).getTime() : -Infinity;
    return db - da;
  });

  articles.forEach((a) => {
    const html = articlePage(a.meta, a.bodyHtml, a.slug);
    fs.writeFileSync(path.join(ARTICLES_DIR, `${a.slug}.html`), html, 'utf8');
    console.log('wrote articles/%s.html', a.slug);
  });

  fs.writeFileSync(path.join(ROOT, 'articles.html'), listingPage(articles), 'utf8');
  console.log('wrote articles.html (%d article%s)', articles.length, articles.length === 1 ? '' : 's');
}

main();
