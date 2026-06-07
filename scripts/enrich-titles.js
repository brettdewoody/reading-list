import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function parseReadingList(content) {
  const lines = content.split('\n');
  const entries = [];
  let currentDate = null;
  let currentUrl = null;
  let noteLines = [];

  const flush = () => {
    if (currentDate && currentUrl) {
      entries.push({ date: currentDate.toISOString(), url: currentUrl, note: noteLines.join(' ').trim() });
    }
    currentDate = null;
    currentUrl = null;
    noteLines = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (/^\w{3} \w{3}\s+\d{1,2} \d{2}:\d{2}:\d{2} \d{4}$/.test(line)) {
      flush();
      currentDate = new Date(line);
      continue;
    }

    if (!currentDate) continue;

    if (!currentUrl) {
      const mdMatch = line.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (mdMatch) {
        currentUrl = mdMatch[2];
      } else if (/^https?:\/\//.test(line)) {
        currentUrl = line;
      }
    } else {
      noteLines.push(line);
    }
  }
  flush();
  return entries;
}

function getDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function extractAmazonTitle(finalUrl) {
  try {
    const path = new URL(finalUrl).pathname;
    // Amazon product URLs: /Product-Name-Words/dp/ASIN or /dp/ASIN
    const match = path.match(/^\/([^/]+)\/dp\//);
    if (match && match[1] !== 'dp') {
      return match[1].replace(/-/g, ' ');
    }
  } catch {}
  return null;
}

function isAmazonUrl(url) {
  return /amazon\.|amzn\./i.test(url);
}

// A title that looks like a domain/storefront name is considered stale
function isStalTitle(title, url) {
  if (!title) return false;
  const domain = getDomain(url);
  if (title.toLowerCase() === domain.toLowerCase()) return true;
  // Amazon short links (amzn.eu, amzn.to) redirect to a different amazon.* domain
  if (isAmazonUrl(url) && /^amazon\./i.test(getDomain(title.includes('://') ? title : `https://${title}`))) return true;
  if (isAmazonUrl(url) && /^Amazon\.(com|co\.uk|de|fr|ca|au|in|jp)$/i.test(title.trim())) return true;
  return false;
}

async function fetchTitle(url) {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; reading-list-enricher/1.0)' },
      redirect: 'follow',
    });
    clearTimeout(id);
    if (!res.ok) return null;

    // For Amazon URLs, try to extract title from the final (redirected) URL path
    if (isAmazonUrl(res.url)) {
      const amazonTitle = extractAmazonTitle(res.url);
      if (amazonTitle) return amazonTitle;
    }

    const html = await res.text();

    // Try OG title first — usually cleaner than <title>
    const ogMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']{1,200})["']/i)
      ?? html.match(/<meta[^>]+content=["']([^"']{1,200})["'][^>]+property=["']og:title["']/i);
    if (ogMatch) {
      return ogMatch[1].trim()
        .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ');
    }

    const match = html.match(/<title[^>]*>([^<]{1,200})<\/title>/i);
    if (!match) return null;
    return match[1]
      .trim()
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ');
  } catch {
    return null;
  }
}

const indexMd = readFileSync(join(ROOT, 'index.md'), 'utf-8');
const entries = parseReadingList(indexMd);

const dataPath = join(ROOT, 'data.json');
const existing = existsSync(dataPath) ? JSON.parse(readFileSync(dataPath, 'utf-8')) : [];
const existingByUrl = new Map(existing.map(e => [e.url, e]));

let changed = false;
const results = [];

for (const entry of entries) {
  const cached = existingByUrl.get(entry.url);
  const needsRefetch = !cached || cached.title === null || isStalTitle(cached.title, entry.url);

  if (cached && !needsRefetch) {
    const updated = { ...cached, note: entry.note };
    results.push(updated);
    if (cached.note !== entry.note) changed = true;
  } else {
    if (needsRefetch && cached) {
      console.log(`Re-fetching (stale title "${cached.title}"): ${entry.url}`);
    } else {
      console.log(`Fetching: ${entry.url}`);
    }
    const title = await fetchTitle(entry.url);
    console.log(`  title: ${title ?? '(none)'}`);
    results.push({ ...entry, title: title ?? null });
    changed = true;
  }
}

if (changed || results.length !== existing.length) {
  writeFileSync(dataPath, JSON.stringify(results, null, 2) + '\n');
  console.log(`Wrote ${results.length} entries to data.json`);
} else {
  console.log('No changes.');
}
