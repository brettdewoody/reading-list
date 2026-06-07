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
    const html = await res.text();
    const match = html.match(/<title[^>]*>([^<]{1,200})<\/title>/i);
    if (!match) return null;
    return match[1]
      .trim()
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ');
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
  if (cached) {
    const updated = { ...cached, note: entry.note };
    results.push(updated);
    if (cached.note !== entry.note) changed = true;
  } else {
    console.log(`Fetching: ${entry.url}`);
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
