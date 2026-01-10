import { useEffect } from "react";

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  ogImage?: string;
  ogType?: "website" | "article" | "profile";
  canonicalUrl?: string;
  noIndex?: boolean;
}

export const useSEO = ({
  title,
  description,
  keywords,
  ogImage = "https://hophop.pl/og-image.png",
  ogType = "website",
  canonicalUrl,
  noIndex = false,
}: SEOProps) => {
  useEffect(() => {
    // Ustaw tytuł
    const fullTitle = title === "Strona główna" 
      ? "Hop Hop - Platforma zleceń i usług"
      : `${title} | Hop Hop`;
    document.title = fullTitle;

    // Helper do aktualizacji lub tworzenia meta tagów
    const setMetaTag = (name: string, content: string, isProperty = false) => {
      const attribute = isProperty ? "property" : "name";
      let element = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
      
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      element.content = content;
    };

    // Podstawowe meta tagi
    setMetaTag("description", description);
    if (keywords) {
      setMetaTag("keywords", keywords);
    }

    // Open Graph
    setMetaTag("og:title", fullTitle, true);
    setMetaTag("og:description", description, true);
    setMetaTag("og:type", ogType, true);
    setMetaTag("og:image", ogImage, true);
    setMetaTag("og:site_name", "Hop Hop", true);
    setMetaTag("og:locale", "pl_PL", true);

    // Twitter Cards
    setMetaTag("twitter:card", "summary_large_image");
    setMetaTag("twitter:title", fullTitle);
    setMetaTag("twitter:description", description);
    setMetaTag("twitter:image", ogImage);

    // Canonical URL
    let canonicalElement = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (canonicalUrl) {
      if (!canonicalElement) {
        canonicalElement = document.createElement("link");
        canonicalElement.rel = "canonical";
        document.head.appendChild(canonicalElement);
      }
      canonicalElement.href = canonicalUrl;
    } else if (canonicalElement) {
      canonicalElement.href = window.location.href;
    }

    // Robots meta
    if (noIndex) {
      setMetaTag("robots", "noindex, nofollow");
    } else {
      setMetaTag("robots", "index, follow");
    }

    // Cleanup function
    return () => {
      // Reset title on unmount if needed
    };
  }, [title, description, keywords, ogImage, ogType, canonicalUrl, noIndex]);
};

// Schema.org JSON-LD helpers
export const generateOrganizationSchema = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Hop Hop",
  "url": "https://hophop.pl",
  "logo": "https://hophop.pl/logo.png",
  "description": "Platforma do zlecania i wykonywania usług. Znajdź wykonawców lub zlecenia w swojej okolicy.",
  "sameAs": [],
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer service",
    "availableLanguage": "Polish"
  }
});

export const generateWebsiteSchema = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Hop Hop",
  "url": "https://hophop.pl",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://hophop.pl/jobs?search={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  }
});

export const generateLocalBusinessSchema = () => ({
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Hop Hop",
  "description": "Platforma do zlecania i wykonywania usług",
  "url": "https://hophop.pl",
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "PL"
  },
  "priceRange": "$$"
});

export const generateJobPostingSchema = (job: {
  title: string;
  description: string;
  city: string;
  budget?: number;
  createdAt: string;
}) => ({
  "@context": "https://schema.org",
  "@type": "JobPosting",
  "title": job.title,
  "description": job.description,
  "datePosted": job.createdAt,
  "jobLocation": {
    "@type": "Place",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": job.city,
      "addressCountry": "PL"
    }
  },
  "hiringOrganization": {
    "@type": "Organization",
    "name": "Hop Hop",
    "sameAs": "https://hophop.pl"
  },
  ...(job.budget && {
    "baseSalary": {
      "@type": "MonetaryAmount",
      "currency": "PLN",
      "value": {
        "@type": "QuantitativeValue",
        "value": job.budget
      }
    }
  })
});

export const generateFAQSchema = (faqs: { question: string; answer: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": faqs.map((faq) => ({
    "@type": "Question",
    "name": faq.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": faq.answer
    }
  }))
});
