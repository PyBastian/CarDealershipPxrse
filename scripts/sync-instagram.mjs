import { mkdir, readdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

const username = process.env.INSTAGRAM_USERNAME ?? "mkcars.cl";
const profileUrl = `https://www.instagram.com/${username}/`;
const imageDirectory = path.resolve("public/instagram");
const dataFile = path.resolve("src/data/instagram.json");

export function extractCaption(description) {
  const start = description.indexOf(': "');
  return (start < 0 ? description : description.slice(start + 3).replace(/"\.?\s*$/, "")).trim();
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(profileUrl, { waitUntil: "domcontentloaded", timeout: 30_000 });
    const postLinks = 'a[href*="/p/"], a[href*="/reel/"]';
    await page.locator(postLinks).first().waitFor({ timeout: 20_000 });
    const urls = [...new Set(await page.locator(postLinks).evaluateAll((links) => links.map((link) => link.href)))].slice(0, 3);
    if (!urls.length) throw new Error(`No se encontraron publicaciones en ${profileUrl}`);

    await mkdir(imageDirectory, { recursive: true });
    const posts = [];
    for (const url of urls) {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
      const [description, imageUrl] = await Promise.all([
        page.locator('meta[property="og:description"]').getAttribute("content"),
        page.locator('meta[property="og:image"]').getAttribute("content")
      ]);
      if (!description || !imageUrl) throw new Error(`Instagram no entregó metadatos para ${url}`);

      const shortcode = new URL(url).pathname.split("/").filter(Boolean).at(-1);
      if (!shortcode) throw new Error(`URL de publicación inválida: ${url}`);
      const caption = extractCaption(description);
      const title = caption.split("\n").find(Boolean)?.trim() ?? `Publicación de @${username}`;
      const response = await fetch(imageUrl, { headers: { Referer: "https://www.instagram.com/" } });
      if (!response.ok) throw new Error(`No se pudo descargar la imagen de ${url}: ${response.status}`);
      await writeFile(path.join(imageDirectory, `${shortcode}.jpg`), Buffer.from(await response.arrayBuffer()));
      posts.push({ shortcode, url, image: `/instagram/${shortcode}.jpg`, title, caption });
    }

    const keep = new Set(posts.map((post) => `${post.shortcode}.jpg`));
    for (const file of await readdir(imageDirectory)) if (file.endsWith(".jpg") && !keep.has(file)) await unlink(path.join(imageDirectory, file));
    await mkdir(path.dirname(dataFile), { recursive: true });
    await writeFile(dataFile, `${JSON.stringify(posts, null, 2)}\n`);
    console.log(`Instagram sincronizado: ${posts.length} publicaciones de @${username}`);
  } finally {
    await browser.close();
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main().catch((error) => { console.error(error); process.exitCode = 1; });
