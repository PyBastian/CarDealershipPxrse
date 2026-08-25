const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function withBasePath(path: string) {
  return `${basePath}${path}`;
}

export function publicSiteUrl(path = "/") {
  return withBasePath(path);
}
