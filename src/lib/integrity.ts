/** Browser and Node Web Crypto. No checksum input is considered verified without comparing retrieved bytes. */
export async function sha256Hex(bytes: ArrayBuffer): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", bytes)
  return [...new Uint8Array(hash)].map((n) => n.toString(16).padStart(2, "0")).join("")
}

export async function verifyOriginalBytes(bytes: ArrayBuffer, expectedSize: number | null, expectedSha256: string | null): Promise<string> {
  if (expectedSize !== null && bytes.byteLength !== expectedSize) {
    throw new Error("Original size verification failed")
  }
  if (!expectedSha256 || !/^[0-9a-f]{64}$/i.test(expectedSha256)) {
    throw new Error("Original is missing its valid preservation checksum")
  }
  const actual = await sha256Hex(bytes)
  if (actual !== expectedSha256.toLowerCase()) {
    throw new Error("Original checksum verification failed")
  }
  return actual
}
