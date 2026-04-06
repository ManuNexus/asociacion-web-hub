import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  children?: React.ReactNode;
}

const SITE_NAME = "AHORA";
const BASE_URL = "https://ahoraorg.es";
const DEFAULT_IMAGE = `${BASE_URL}/og-image.png`;
const DEFAULT_DESCRIPTION =
  "AHORA es una asociación civil de ámbito nacional que defiende los valores constitucionales, el pluralismo ideológico y los derechos fundamentales en España.";

export function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  canonical,
  ogImage = DEFAULT_IMAGE,
  ogType = "website",
  noindex = false,
  jsonLd,
  children,
}: SEOProps) {
  const fullTitle = title
    ? `${title} | ${SITE_NAME}`
    : `${SITE_NAME} — Actuar en el presente para construir el futuro`;

  const canonicalUrl = canonical
    ? `${BASE_URL}${canonical}`
    : undefined;

  const schemas = jsonLd
    ? Array.isArray(jsonLd)
      ? jsonLd
      : [jsonLd]
    : [];

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Canonical */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="es_ES" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@AhoraOrg_es" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* JSON-LD structured data */}
      {schemas.map((schema, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}

      {children}
    </Helmet>
  );
}

// Reusable JSON-LD schemas
export const breadcrumbSchema = (
  items: { name: string; url: string }[]
) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: item.name,
    item: `https://ahoraorg.es${item.url}`,
  })),
});

export const articleSchema = (article: {
  title: string;
  description: string;
  url: string;
  image?: string;
  datePublished?: string;
  author?: string;
}) => ({
  "@context": "https://schema.org",
  "@type": "NewsArticle",
  headline: article.title,
  description: article.description,
  url: `https://ahoraorg.es${article.url}`,
  ...(article.image && { image: article.image }),
  ...(article.datePublished && { datePublished: article.datePublished }),
  author: {
    "@type": "Organization",
    name: article.author || "AHORA",
    url: "https://ahoraorg.es",
  },
  publisher: {
    "@type": "Organization",
    name: "AHORA",
    url: "https://ahoraorg.es",
    logo: { "@type": "ImageObject", url: "https://ahoraorg.es/og-image.png" },
  },
});
