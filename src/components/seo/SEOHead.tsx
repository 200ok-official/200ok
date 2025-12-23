'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
  noindex?: boolean;
}

export function SEOHead({ 
  title, 
  description, 
  keywords = [], 
  ogImage = '/og-image.png',
  noindex = false 
}: SEOHeadProps) {
  const pathname = usePathname();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://200ok.tw';
  const fullUrl = `${baseUrl}${pathname}`;

  const pageTitle = title ? `${title} | 200 OK` : '200 OK - 專業軟體接案平台';
  const pageDescription = description || '連結優秀開發者與案主，提供最專業的軟體開發案件媒合服務';

  useEffect(() => {
    // 更新 document title
    document.title = pageTitle;

    // 更新或創建 meta tags
    const updateMetaTag = (property: string, content: string, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${property}"]`);
      
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, property);
        document.head.appendChild(element);
      }
      
      element.setAttribute('content', content);
    };

    // Basic meta tags
    updateMetaTag('description', pageDescription);
    if (keywords.length > 0) {
      updateMetaTag('keywords', keywords.join(', '));
    }

    // Open Graph
    updateMetaTag('og:title', pageTitle, true);
    updateMetaTag('og:description', pageDescription, true);
    updateMetaTag('og:url', fullUrl, true);
    updateMetaTag('og:image', `${baseUrl}${ogImage}`, true);
    updateMetaTag('og:type', 'website', true);
    updateMetaTag('og:locale', 'zh_TW', true);

    // Twitter Card
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', pageTitle);
    updateMetaTag('twitter:description', pageDescription);
    updateMetaTag('twitter:image', `${baseUrl}${ogImage}`);

    // Canonical link
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', fullUrl);

    // Robots meta
    if (noindex) {
      updateMetaTag('robots', 'noindex, nofollow');
    }
  }, [pageTitle, pageDescription, keywords, fullUrl, baseUrl, ogImage, noindex, pathname]);

  return null;
}

