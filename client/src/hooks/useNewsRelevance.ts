import { useMemo } from 'react';

export interface NewsArticle {
  title: string;
  description?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  assets?: string[];
}

export interface NewsWithRelevance extends NewsArticle {
  relevance: number;
  riskFlag: 'on' | 'off' | 'neutral';
}

export function useNewsRelevance(news: NewsArticle[], holdings: string[]): NewsWithRelevance[] {
  return useMemo(() => {
    return news.map(article => {
      // Score relevance: +50 if any holding is mentioned in title/desc, +50 if sentiment is negative
      let relevance = 0;
      const text = (article.title + ' ' + (article.description || '')).toLowerCase();
      const matches = holdings.filter(asset => text.includes(asset.toLowerCase()));
      if (matches.length > 0) relevance += 50;
      if (article.sentiment === 'negative') relevance += 50;
      else if (article.sentiment === 'positive') relevance += 20;
      else relevance += 10;
      relevance = Math.min(100, relevance);
      let riskFlag: 'on' | 'off' | 'neutral' = 'neutral';
      if (relevance > 80 && article.sentiment === 'negative') riskFlag = 'on';
      else if (relevance > 80 && article.sentiment === 'positive') riskFlag = 'off';
      return { ...article, relevance, riskFlag };
    });
  }, [news, holdings]);
} 