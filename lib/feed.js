/**
 * News and advisory readers for the watch tabs.
 *
 * Everything here is a public feed: Hacker News (Algolia JSON), dev.to, the
 * Hugging Face and TechCrunch RSS feeds, the French CERT-FR feed, GitHub's
 * advisory API and BleepingComputer. No key, no account, no scraping of a page
 * that asks not to be scraped.
 *
 * Feeds rarely carry images, so cards fall back to the article's own
 * `og:image`, fetched once per item with a hard byte and time budget.
 */

import { lookup } from 'node:dns/promises';

const USER_AGENT = 'dsh-system-monitor/1.0 (+local dashboard)';
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const imageCache = new Map();
const ogCache = new Map();

/* ------------------------------------------------------------------ http */

/** Fetch text with a deadline; never throws. */
async function get(url, { timeoutMs = 12_000, maxBytes = 6 * 1024 * 1024, accept = '*/*' } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      headers: { 'user-agent': USER_AGENT, accept },
      signal: controller.signal,
      redirect: 'follow',
    });
    if (!response.ok) return { ok: false, status: response.status, text: '' };
    const type = String(response.headers.get('content-type') ?? '');
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > maxBytes) return { ok: false, status: 413, text: '' };
    return { ok: true, status: response.status, text: new TextDecoder('utf-8').decode(buffer), type };
  } catch {
    return { ok: false, status: 0, text: '' };
  } finally {
    clearTimeout(timer);
  }
}

/* ------------------------------------------------------------------ rss */

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'" };

function decodeEntities(text) {
  return String(text ?? '')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&([a-z#0-9]+);/gi, (match, name) => ENTITIES[name.toLowerCase()] ?? match);
}

function stripHtml(text) {
  return decodeEntities(
    String(text ?? '')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' '),
  ).trim();
}

function tag(block, names) {
  for (const name of names) {
    const match = new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, 'i').exec(block);
    if (match) return decodeEntities(match[1].replace(/<!\[CDATA\[|\]\]>/g, '')).trim();
  }
  return '';
}

/** First usable image URL in an item: media, enclosure, or an inline <img>. */
function imageOf(block) {
  const media = /<media:content[^>]*url=["']([^"']+)["']/i.exec(block);
  if (media) return decodeEntities(media[1]);
  const thumb = /<media:thumbnail[^>]*url=["']([^"']+)["']/i.exec(block);
  if (thumb) return decodeEntities(thumb[1]);
  const enclosure = /<enclosure[^>]*url=["']([^"']+)["'][^>]*type=["']image/i.exec(block);
  if (enclosure) return decodeEntities(enclosure[1]);
  const inline = /<img[^>]*src=["']([^"']+)["']/i.exec(block);
  if (inline) return decodeEntities(inline[1]);
  return null;
}

/** Parse RSS 2.0 or Atom into a common shape. */
function parseFeed(xml, source) {
  const items = [];
  const blocks = xml.split(/<item[\s>]/).slice(1);
  const atoms = blocks.length === 0 ? xml.split(/<entry[\s>]/).slice(1) : [];
  const chunks = blocks.length > 0 ? blocks : atoms;

  for (const chunk of chunks.slice(0, 25)) {
    const body = chunk.split(/<\/item>|<\/entry>/)[0];
    const title = stripHtml(tag(body, ['title']));
    if (!title) continue;
    const linkTag = tag(body, ['link']);
    const href = /<link[^>]*href=["']([^"']+)["']/i.exec(body)?.[1];
    const link = decodeEntities(linkTag.startsWith('http') ? linkTag : href || linkTag);
    const summary = stripHtml(tag(body, ['description', 'summary', 'content:encoded'])).slice(0, 400);
    const published = tag(body, ['pubDate', 'published', 'updated', 'dc:date']);
    items.push({
      id: `${source.id}:${link || title}`.slice(0, 200),
      title,
      url: link,
      summary,
      published: published ? Date.parse(published) || null : null,
      image: imageOf(body),
      source: source.name,
      tone: source.tone ?? null,
      kind: source.kind ?? 'news',
    });
  }
  return items;
}

/* --------------------------------------------------------------- sources */

const TECH_SOURCES = [
  {
    id: 'hn',
    name: 'Hacker News',
    kind: 'json',
    url: 'https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=20',
  },
  {
    id: 'devto',
    name: 'dev.to',
    kind: 'devto',
    url: 'https://dev.to/api/articles?top=7&per_page=12',
  },
  { id: 'hf', name: 'Hugging Face', kind: 'rss', url: 'https://huggingface.co/blog/feed.xml' },
  { id: 'tc', name: 'TechCrunch', kind: 'rss', url: 'https://techcrunch.com/feed/' },
];

// CERT-FR publishes two feeds; the split is the severity, not a title prefix.
const CYBER_SOURCES = {
  alerts: { id: 'cert-alerte', name: 'CERT-FR', kind: 'rss', url: 'https://www.cert.ssi.gouv.fr/alerte/feed/' },
  advisories: { id: 'cert-avis', name: 'CERT-FR', kind: 'rss', url: 'https://www.cert.ssi.gouv.fr/avis/feed/' },
  attacks: { id: 'bc', name: 'BleepingComputer', kind: 'rss', url: 'https://www.bleepingcomputer.com/feed/' },
};

const byNewest = (left, right) => (right.published ?? 0) - (left.published ?? 0);

/* ------------------------------------------------------------ og:image */

/** The article's own social card, when it has one. Cached for an hour. */
async function ogImage(url) {
  if (!url || !/^https?:\/\//i.test(url)) return null;
  const cached = ogCache.get(url);
  if (cached && Date.now() - cached.at < 3_600_000) return cached.image;
  const page = await get(url, { timeoutMs: 7000, maxBytes: 900 * 1024 });
  const image = page.ok
    ? decodeEntities(
        /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i.exec(page.text)?.[1] ??
          /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i.exec(page.text)?.[1] ??
          /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i.exec(page.text)?.[1] ??
          '',
      )
    : null;
  ogCache.set(url, { image: image || null, at: Date.now() });
  if (ogCache.size > 300) ogCache.delete(ogCache.keys().next().value);
  return image || null;
}

/** Give the first few imageless cards a real picture. */
async function enrichImages(items, budget = 10) {
  const missing = items.filter((item) => !item.image && item.url).slice(0, budget);
  const found = await Promise.all(
    missing.map(async (item) => ({ id: item.id, image: await ogImage(item.url) })),
  );
  const byId = new Map(found.map((entry) => [entry.id, entry.image]));
  return items.map((item) => (byId.get(item.id) ? { ...item, image: byId.get(item.id) } : item));
}

/* -------------------------------------------------------- source readers */

async function readTech() {
  const [hn, devto, hf, tc] = await Promise.all(
    TECH_SOURCES.map(async (source) => {
      const response = await get(source.url, { timeoutMs: 12000 });
      if (!response.ok) return [];
      if (source.kind === 'json') {
        try {
          const hits = JSON.parse(response.text)?.hits ?? [];
          return hits.map((hit) => ({
            id: `hn:${hit.objectID}`,
            title: String(hit.title ?? hit.story_title ?? '').trim(),
            url: String(hit.url ?? `https://news.ycombinator.com/item?id=${hit.objectID}`),
            summary: '',
            published: hit.created_at ? Date.parse(hit.created_at) : null,
            image: null,
            source: source.name,
            score: Number(hit.points ?? 0),
            comments: Number(hit.num_comments ?? 0),
            kind: 'news',
          })).filter((entry) => entry.title);
        } catch {
          return [];
        }
      }
      if (source.kind === 'devto') {
        try {
          const articles = JSON.parse(response.text);
          return (Array.isArray(articles) ? articles : []).map((entry) => ({
            id: `devto:${entry.id}`,
            title: String(entry.title ?? ''),
            url: String(entry.url ?? ''),
            summary: String(entry.description ?? '').slice(0, 240),
            published: entry.published_timestamp ? Date.parse(entry.published_timestamp) : null,
            image: entry.cover_image ?? entry.social_image ?? null,
            source: source.name,
            score: Number(entry.public_reactions_count ?? 0),
            comments: Number(entry.comments_count ?? 0),
            tags: Array.isArray(entry.tag_list) ? entry.tag_list.slice(0, 3) : [],
            kind: 'news',
          })).filter((entry) => entry.title);
        } catch {
          return [];
        }
      }
      return parseFeed(response.text, source);
    }),
  );
  return [...devto, ...hn, ...hf, ...tc]
    .filter((item) => item.title)
    .sort((left, right) => (right.published ?? 0) - (left.published ?? 0))
    .slice(0, 40);
}

async function readCyber() {
  const feed = async (source) => {
    const response = await get(source.url, { timeoutMs: 12000 });
    return response.ok ? parseFeed(response.text, source) : [];
  };

  const [certAlertsRaw, certAdvisoriesRaw, attacks, advisories] = await Promise.all([
    feed(CYBER_SOURCES.alerts),
    feed(CYBER_SOURCES.advisories),
    feed(CYBER_SOURCES.attacks),
    (async () => {
      const response = await get('https://api.github.com/advisories?per_page=20&sort=published&direction=desc', {
        timeoutMs: 12000,
        accept: 'application/vnd.github+json',
      });
      if (!response.ok) return [];
      try {
        const list = JSON.parse(response.text);
        return (Array.isArray(list) ? list : []).map((entry) => ({
          id: `ghsa:${entry.ghsa_id}`,
          ghsa: String(entry.ghsa_id ?? ''),
          cve: String(entry.cve_id ?? ''),
          severity: String(entry.severity ?? '').toLowerCase(),
          summary: String(entry.summary ?? ''),
          published: entry.published_at ? Date.parse(entry.published_at) : null,
          url: String(entry.html_url ?? ''),
          package: String(entry.vulnerabilities?.[0]?.package?.name ?? ''),
          cvss: Number(entry.cvss?.score ?? 0),
        }));
      } catch {
        return [];
      }
    })(),
  ]);

  return {
    advisories: advisories.slice(0, 25),
    certAlerts: certAlertsRaw
      .sort(byNewest)
      .slice(0, 15)
      .map((item) => ({ ...item, severity: 'critical', kind: 'advisory' })),
    certAdvisories: certAdvisoriesRaw
      .sort(byNewest)
      .slice(0, 15)
      .map((item) => ({ ...item, severity: 'high', kind: 'advisory' })),
    attacks: attacks.sort(byNewest).slice(0, 15),
  };
}

/* -------------------------------------------------------------- collect */

/** Everything the two watch tabs show, plus the alerts worth surfacing. */
export async function collectNews() {
  const [tech, cyber] = await Promise.all([
    readTech().catch(() => []),
    readCyber().catch(() => ({ advisories: [], certAlerts: [], certAdvisories: [], attacks: [] })),
  ]);

  const withImages = await enrichImages(tech);

  const alerts = [
    ...cyber.certAlerts
      .filter((entry) => entry.severity === 'critical')
      .slice(0, 3)
      .map((entry) => ({
        id: entry.id,
        title: entry.title,
        url: entry.url,
        source: 'CERT-FR',
        tone: 'critical',
        at: entry.published,
      })),
    ...cyber.advisories
      .filter((entry) => entry.severity === 'critical')
      .slice(0, 3)
      .map((entry) => ({
        id: entry.id,
        title: `${entry.cve || entry.ghsa} · ${entry.summary}`.slice(0, 160),
        url: entry.url,
        source: 'GitHub Advisory',
        tone: 'critical',
        at: entry.published,
      })),
    ...withImages
      .filter((entry) => (entry.score ?? 0) >= 300)
      .slice(0, 3)
      .map((entry) => ({
        id: entry.id,
        title: entry.title,
        url: entry.url,
        source: entry.source,
        tone: 'notable',
        at: entry.published,
      })),
  ].slice(0, 6);

  return {
    tech: withImages,
    cyber,
    alerts,
    asOf: Date.now(),
  };
}

/* -------------------------------------------------------- image fetching */

/** True for any address a browser on this machine must not be pointed at. */
function isPrivateAddress(address) {
  if (!address) return true;
  const value = String(address);
  if (value === '::1' || value.startsWith('fe80:') || /^f[cd][0-9a-f]{2}:/i.test(value)) return true;
  const v4 = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/.exec(value);
  if (!v4) return false;
  const [a, b] = [Number(v4[1]), Number(v4[2])];
  if (a === 10 || a === 127 || a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a >= 224) return true;
  return false;
}

/**
 * Fetch one remote image for the cards.
 *
 * This is a proxy, so it is deliberately narrow: http(s) only, no credentials
 * in the URL, no host that resolves to a private address, images only, bounded
 * size, and a small in-memory cache.
 */
export async function fetchImage(rawUrl) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    return { ok: false, status: 400 };
  }
  if (!/^https?:$/.test(url.protocol) || url.username || url.password) return { ok: false, status: 400 };
  const host = url.hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) {
    return { ok: false, status: 403 };
  }

  const cached = imageCache.get(url.href);
  if (cached && Date.now() - cached.at < 1_800_000) return { ok: true, ...cached };

  try {
    const { address } = await lookup(host);
    if (isPrivateAddress(address)) return { ok: false, status: 403 };
  } catch {
    return { ok: false, status: 404 };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 9000);
  try {
    const response = await fetch(url.href, {
      headers: { 'user-agent': USER_AGENT, accept: 'image/*' },
      signal: controller.signal,
      redirect: 'follow',
    });
    const type = String(response.headers.get('content-type') ?? '');
    if (!response.ok || !type.startsWith('image/')) return { ok: false, status: 415 };
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength === 0 || buffer.byteLength > MAX_IMAGE_BYTES) return { ok: false, status: 413 };
    const entry = { bytes: buffer, type, at: Date.now() };
    imageCache.set(url.href, entry);
    if (imageCache.size > 80) imageCache.delete(imageCache.keys().next().value);
    return { ok: true, ...entry };
  } catch {
    return { ok: false, status: 502 };
  } finally {
    clearTimeout(timer);
  }
}
