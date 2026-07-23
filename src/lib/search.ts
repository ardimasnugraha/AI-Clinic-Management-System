// src/lib/search.ts

/**
 * Simple wrapper for Google Custom Search JSON API.
 * Returns up to 3 result snippets with their URLs.
 */
export async function search(query: string): Promise<{ snippets: string[]; urls: string[] }> {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const cx = process.env.GOOGLE_SEARCH_CX;
  if (!apiKey || !cx) {
    throw new Error('Google Search API key or CX is missing in environment variables.');
  }

  const url = new URL('https://www.googleapis.com/customsearch/v1');
  url.searchParams.set('key', apiKey);
  url.searchParams.set('cx', cx);
  url.searchParams.set('q', query);
  url.searchParams.set('num', '3'); // limit to 3 results

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`Google Search request failed: ${res.status}`);
  }
  const data = await res.json();
  const items = data.items || [];
  const snippets: string[] = [];
  const urls: string[] = [];
  for (const item of items) {
    snippets.push(item.snippet || item.title || '');
    urls.push(item.link);
  }
  return { snippets, urls };
}
