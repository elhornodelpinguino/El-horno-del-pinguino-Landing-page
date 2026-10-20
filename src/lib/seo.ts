export interface HeadSeoInput {
  canonicalUrl: string;
  noindex: boolean;
  site: URL | string | undefined;
}

export interface HeadSeo {
  robots?: string;
  canonical?: string;
  ogUrl?: string;
}

/**
 * Indexing metadata for the document head. A page that opts out of indexing
 * (the 404) must not also announce itself as the canonical URL of anything,
 * so `noindex` drops canonical and og:url and emits the robots directive.
 */
export function buildHeadSeo({ canonicalUrl, noindex, site }: HeadSeoInput): HeadSeo {
  if (noindex) return { robots: "noindex" };
  const url = new URL(canonicalUrl, site).href;
  return { canonical: url, ogUrl: url };
}
