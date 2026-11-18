export { createOriginalSignedUrl } from "./sources"

export function buildOriginalPath(
  matterId: string,
  objectId: string,
  fileName: string,
) {
  const safeName =
    fileName
      .normalize("NFKD")
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "original"

  return `${matterId}/${objectId}/${safeName}`
}
