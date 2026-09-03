export const MAX_NEWS_IMAGE_BYTES = 12 * 1024 * 1024;

/**
 * Read an upstream image incrementally and stop the source as soon as it
 * crosses the byte ceiling. A null result tells the route to serve its safe
 * same-origin fallback instead.
 *
 * @param {Response} response
 * @param {number} [maxBytes]
 * @returns {Promise<Uint8Array | null>}
 */
export async function readNewsImageBytes(
  response,
  maxBytes = MAX_NEWS_IMAGE_BYTES,
) {
  const reader = response.body?.getReader();
  if (!reader) return null;

  const chunks = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value || value.byteLength === 0) continue;

      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel("News image exceeded the byte limit").catch(() => {});
        return null;
      }
      chunks.push(value);
    }

    if (totalBytes === 0) return null;

    const bytes = new Uint8Array(totalBytes);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return bytes;
  } catch {
    await reader.cancel("News image stream failed").catch(() => {});
    return null;
  } finally {
    reader.releaseLock();
  }
}
