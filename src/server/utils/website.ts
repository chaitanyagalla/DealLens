/** Returns true only for parseable HTTP or HTTPS company URLs. */
export function isValidWebsite(website: string | null): boolean {
  if (!website) return false;

  try {
    const url = new URL(website);
    return (url.protocol === "http:" || url.protocol === "https:") && Boolean(url.hostname);
  } catch {
    return false;
  }
}

