import { mkdir, readdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const username = process.env.INSTAGRAM_USERNAME ?? "mkcars.cl";
const profileUrl = `https://www.instagram.com/${username}/`;
const imageDirectory = path.resolve("public/instagram");
const dataFile = path.resolve("src/data/instagram.json");

export function extractPostShortcodes(html) {
  return [...html.matchAll(/\\"shortcode_media\\":\{[\s\S]*?\\"shortcode\\":\\"([A-Za-z0-9_-]+)\\"/g)].map((match) => match[1]);
}

export function extractEmbedImageUrl(html) {
  return html.match(/<img class="EmbeddedMediaImage"[^>]+src="([^"]+)"/)?.[1].replaceAll("&amp;", "&");
}

export function extractEmbedCaption(html) {
  const escaped = html.match(/\\"edge_media_to_caption\\":\{\\"edges\\":\[\{\\"node\\":\{\\"text\\":\\"((?:\\\\.|[^"\\])*)\\"/)?.[1];
  if (!escaped) return "";
  return [0, 1].reduce((value) => JSON.parse(`"${value.replaceAll('"', '\\"')}"`), escaped);
}

async function main() {
  const headers = { "User-Agent": "Mozilla/5.0" };
  const profileResponse = await fetch(`${profileUrl}embed/`, { headers });
  if (!profileResponse.ok) throw new Error(`No se pudo leer ${profileUrl}: ${profileResponse.status}`);
  const shortcodes = extractPostShortcodes(await profileResponse.text()).slice(0, 3);
  if (!shortcodes.length) throw new Error(`No se encontraron publicaciones en ${profileUrl}`);

  await mkdir(imageDirectory, { recursive: true });
  const posts = [];
  for (const shortcode of shortcodes) {
    const canonicalUrl = `https://www.instagram.com/p/${shortcode}/`;
    const embedResponse = await fetch(`${canonicalUrl}embed/`, { headers });
    const embedHtml = embedResponse.ok ? await embedResponse.text() : "";
    const imageUrl = extractEmbedImageUrl(embedHtml);
    const caption = extractEmbedCaption(embedHtml);
    if (!caption || !imageUrl) throw new Error(`Instagram no entregó metadatos para ${canonicalUrl}`);

    const title = caption.split("\n").find(Boolean)?.trim() ?? `Publicación de @${username}`;
    const response = await fetch(imageUrl, { headers: { Referer: "https://www.instagram.com/" } });
    if (!response.ok) throw new Error(`No se pudo descargar la imagen de ${canonicalUrl}: ${response.status}`);
    await writeFile(path.join(imageDirectory, `${shortcode}.jpg`), Buffer.from(await response.arrayBuffer()));
    posts.push({ shortcode, url: canonicalUrl, image: `/instagram/${shortcode}.jpg`, title, caption });
  }

  const keep = new Set(posts.map((post) => `${post.shortcode}.jpg`));
  for (const file of await readdir(imageDirectory)) if (file.endsWith(".jpg") && !keep.has(file)) await unlink(path.join(imageDirectory, file));
  await mkdir(path.dirname(dataFile), { recursive: true });
  await writeFile(dataFile, `${JSON.stringify(posts, null, 2)}\n`);
  console.log(`Instagram sincronizado: ${posts.length} publicaciones de @${username}`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main().catch((error) => { console.error(error); process.exitCode = 1; });
