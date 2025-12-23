'use client';

import Script from 'next/script';

interface StructuredDataProps {
  type?: 'website' | 'organization' | 'breadcrumb' | 'faqPage';
  data?: any;
}

export function StructuredData({ type = 'website', data }: StructuredDataProps) {
  const getStructuredData = () => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://200ok.tw';

    switch (type) {
      case 'organization':
        return {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: '200 OK',
          url: baseUrl,
          logo: `${baseUrl}/icon.png`,
          description: '200 OK 是台灣領先的軟體開發接案媒合平台',
          sameAs: [
            // 可以添加社交媒體連結
          ],
          contactPoint: {
            '@type': 'ContactPoint',
            contactType: 'customer service',
            availableLanguage: ['zh-TW', 'en'],
          },
        };

      case 'website':
        return {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: '200 OK',
          url: baseUrl,
          description: '專業的軟體開發接案媒合平台，連結優秀的開發者與案主',
          potentialAction: {
            '@type': 'SearchAction',
            target: {
              '@type': 'EntryPoint',
              urlTemplate: `${baseUrl}/projects?search={search_term_string}`,
            },
            'query-input': 'required name=search_term_string',
          },
        };

      case 'breadcrumb':
        return data;

      case 'faqPage':
        return {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: data || [],
        };

      default:
        return data;
    }
  };

  const structuredData = getStructuredData();

  return (
    <Script
      id={`structured-data-${type}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

// 專門用於首頁的結構化資料
export function HomePageStructuredData() {
  return (
    <>
      <StructuredData type="organization" />
      <StructuredData type="website" />
    </>
  );
}

