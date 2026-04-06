import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogImageAlt?: string;
  ogType?: string;
  noindex?: boolean;
  datePublished?: string;
  dateModified?: string;
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
  ogImageAlt = "Logo de la Asociación AHORA",
  ogType = "website",
  noindex = false,
  datePublished,
  dateModified,
  jsonLd,
  children,
}: SEOProps) {
  const fullTitle = title
    ? `${title} | ${SITE_NAME}`
    : `${SITE_NAME} — Actuar en el presente para construir el futuro`;

  const canonicalUrl = canonical ? `${BASE_URL}${canonical}` : undefined;

  const schemas = jsonLd
    ? Array.isArray(jsonLd)
      ? jsonLd
      : [jsonLd]
    : [];

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      )}

      {/* Canonical */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={ogImageAlt} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="es_ES" />

      {/* Article dates for og:type article */}
      {ogType === "article" && datePublished && (
        <meta property="article:published_time" content={datePublished} />
      )}
      {ogType === "article" && dateModified && (
        <meta property="article:modified_time" content={dateModified} />
      )}
      {ogType === "article" && (
        <meta property="article:author" content="Asociación AHORA" />
      )}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@AhoraOrg_es" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:image:alt" content={ogImageAlt} />

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
    item: `${BASE_URL}${item.url}`,
  })),
});

export const articleSchema = (article: {
  title: string;
  description: string;
  url: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
  author?: string;
}) => ({
  "@context": "https://schema.org",
  "@type": "NewsArticle",
  mainEntityOfPage: {
    "@type": "WebPage",
    "@id": `${BASE_URL}${article.url}`,
  },
  headline: article.title,
  description: article.description,
  url: `${BASE_URL}${article.url}`,
  ...(article.image && {
    image: {
      "@type": "ImageObject",
      url: article.image,
    },
  }),
  ...(article.datePublished && { datePublished: article.datePublished }),
  ...(article.dateModified && { dateModified: article.dateModified }),
  inLanguage: "es",
  author: {
    "@type": "Organization",
    name: article.author || "AHORA",
    url: BASE_URL,
  },
  publisher: {
    "@type": "Organization",
    name: "AHORA",
    url: BASE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${BASE_URL}/og-image.png`,
      width: 600,
      height: 60,
    },
  },
});

export const faqSchema = (
  faqs: { question: string; answer: string }[]
) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
});
