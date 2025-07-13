// Block 32: Watchlist Engine - Engine
import { WatchlistItem, WatchlistScore, WatchlistSettings, ScoringCriteria } from '../types/watchlist';

export class WatchlistEngine {
  private watchlist: Map<string, WatchlistItem> = new Map();
  private settings: WatchlistSettings = {
    maxItems: 50,
    autoScore: true,
    scoreThreshold: 70,
    refreshInterval: 300000, // 5 minutes
    notifications: true
  };

  /**
   * Add asset to watchlist
   */
  addToWatchlist(symbol: string, name: string, priority: number = 1): WatchlistItem {
    const item: WatchlistItem = {
      id: this.generateId(),
      symbol: symbol.toUpperCase(),
      name,
      priority,
      addedAt: new Date(),
      lastScored: null,
      currentScore: null,
      priceTarget: null,
      notes: null,
      alerts: [],
      tags: []
    };

    this.watchlist.set(symbol, item);
    
    // Auto-score if enabled
    if (this.settings.autoScore) {
      this.scoreAsset(symbol);
    }

    return item;
  }

  /**
   * Remove asset from watchlist
   */
  removeFromWatchlist(symbol: string): boolean {
    return this.watchlist.delete(symbol.toUpperCase());
  }

  /**
   * Get all watchlist items
   */
  getAllWatchlistItems(): WatchlistItem[] {
    return Array.from(this.watchlist.values())
      .sort((a, b) => {
        // Sort by priority first, then by score
        if (a.priority !== b.priority) {
          return b.priority - a.priority;
        }
        const aScore = a.currentScore?.totalScore || 0;
        const bScore = b.currentScore?.totalScore || 0;
        return bScore - aScore;
      });
  }

  /**
   * Get watchlist item by symbol
   */
  getWatchlistItem(symbol: string): WatchlistItem | undefined {
    return this.watchlist.get(symbol.toUpperCase());
  }

  /**
   * Score a specific asset
   */
  scoreAsset(symbol: string): WatchlistScore | null {
    const item = this.watchlist.get(symbol.toUpperCase());
    if (!item) return null;

    const score = this.calculateScore(item);
    
    // Update the item
    item.currentScore = score;
    item.lastScored = new Date();
    this.watchlist.set(symbol.toUpperCase(), item);

    return score;
  }

  /**
   * Score all watchlist items
   */
  scoreAllAssets(): Map<string, WatchlistScore> {
    const scores = new Map<string, WatchlistScore>();
    
    this.watchlist.forEach((item, symbol) => {
      const score = this.calculateScore(item);
      item.currentScore = score;
      item.lastScored = new Date();
      scores.set(symbol, score);
    });

    return scores;
  }

  /**
   * Get top scoring assets
   */
  getTopScoring(limit: number = 10): WatchlistItem[] {
    return this.getAllWatchlistItems()
      .filter(item => item.currentScore !== null)
      .slice(0, limit);
  }

  /**
   * Get assets above threshold
   */
  getAssetsAboveThreshold(threshold?: number): WatchlistItem[] {
    const scoreThreshold = threshold || this.settings.scoreThreshold;
    
    return this.getAllWatchlistItems()
      .filter(item => 
        item.currentScore && 
        item.currentScore.totalScore >= scoreThreshold
      );
  }

  /**
   * Set price target for an asset
   */
  setPriceTarget(symbol: string, target: number, type: 'buy' | 'sell' = 'buy'): boolean {
    const item = this.watchlist.get(symbol.toUpperCase());
    if (!item) return false;

    item.priceTarget = { price: target, type };
    return true;
  }

  /**
   * Add alert for an asset
   */
  addAlert(symbol: string, condition: string, value: number, type: 'price' | 'score' | 'volume'): boolean {
    const item = this.watchlist.get(symbol.toUpperCase());
    if (!item) return false;

    const alert = {
      id: this.generateId(),
      type,
      condition,
      value,
      createdAt: new Date(),
      triggered: false
    };

    item.alerts.push(alert);
    return true;
  }

  /**
   * Update notes for an asset
   */
  updateNotes(symbol: string, notes: string): boolean {
    const item = this.watchlist.get(symbol.toUpperCase());
    if (!item) return false;

    item.notes = notes;
    return true;
  }

  /**
   * Set asset priority
   */
  setPriority(symbol: string, priority: number): boolean {
    const item = this.watchlist.get(symbol.toUpperCase());
    if (!item) return false;

    item.priority = Math.max(1, Math.min(5, priority));
    return true;
  }

  /**
   * Search watchlist
   */
  searchWatchlist(query: string): WatchlistItem[] {
    const searchTerm = query.toLowerCase();
    
    return this.getAllWatchlistItems()
      .filter(item => 
        item.symbol.toLowerCase().includes(searchTerm) ||
        item.name.toLowerCase().includes(searchTerm) ||
        (item.notes && item.notes.toLowerCase().includes(searchTerm)) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
  }

  /**
   * Get watchlist statistics
   */
  getWatchlistStats(): {
    totalItems: number;
    averageScore: number;
    highPriorityCount: number;
    recentlyAdded: number;
    needsScoring: number;
  } {
    const items = this.getAllWatchlistItems();
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const scoredItems = items.filter(item => item.currentScore !== null);
    const averageScore = scoredItems.length > 0 
      ? scoredItems.reduce((sum, item) => sum + item.currentScore!.totalScore, 0) / scoredItems.length 
      : 0;

    return {
      totalItems: items.length,
      averageScore,
      highPriorityCount: items.filter(item => item.priority >= 4).length,
      recentlyAdded: items.filter(item => item.addedAt > oneDayAgo).length,
      needsScoring: items.filter(item => item.currentScore === null).length
    };
  }

  /**
   * Export watchlist
   */
  exportWatchlist(): { items: WatchlistItem[], settings: WatchlistSettings } {
    return {
      items: this.getAllWatchlistItems(),
      settings: this.settings
    };
  }

  /**
   * Import watchlist
   */
  importWatchlist(data: { items: WatchlistItem[], settings?: WatchlistSettings }): void {
    this.watchlist.clear();
    
    data.items.forEach(item => {
      this.watchlist.set(item.symbol, item);
    });

    if (data.settings) {
      this.settings = { ...this.settings, ...data.settings };
    }
  }

  /**
   * Update settings
   */
  updateSettings(settings: Partial<WatchlistSettings>): void {
    this.settings = { ...this.settings, ...settings };
  }

  /**
   * Get settings
   */
  getSettings(): WatchlistSettings {
    return { ...this.settings };
  }

  /**
   * Calculate score for an asset
   */
  private calculateScore(item: WatchlistItem): WatchlistScore {
    // Mock scoring algorithm - in production, this would integrate with real data
    const criteria: ScoringCriteria = {
      technical: this.calculateTechnicalScore(item),
      fundamental: this.calculateFundamentalScore(item),
      sentiment: this.calculateSentimentScore(item),
      momentum: this.calculateMomentumScore(item),
      risk: this.calculateRiskScore(item)
    };

    const weights = {
      technical: 0.25,
      fundamental: 0.25,
      sentiment: 0.2,
      momentum: 0.2,
      risk: 0.1
    };

    const totalScore = Math.round(
      criteria.technical * weights.technical +
      criteria.fundamental * weights.fundamental +
      criteria.sentiment * weights.sentiment +
      criteria.momentum * weights.momentum +
      criteria.risk * weights.risk
    );

    return {
      totalScore,
      criteria,
      confidence: this.calculateConfidence(criteria),
      lastUpdated: new Date()
    };
  }

  private calculateTechnicalScore(item: WatchlistItem): number {
    // Mock technical analysis score
    const baseScore = 60;
    const priorityBonus = item.priority * 5;
    const randomVariation = Math.random() * 30 - 15;
    return Math.max(0, Math.min(100, baseScore + priorityBonus + randomVariation));
  }

  private calculateFundamentalScore(item: WatchlistItem): number {
    // Mock fundamental analysis score
    const baseScore = 65;
    const randomVariation = Math.random() * 40 - 20;
    return Math.max(0, Math.min(100, baseScore + randomVariation));
  }

  private calculateSentimentScore(item: WatchlistItem): number {
    // Mock sentiment analysis score
    const baseScore = 55;
    const randomVariation = Math.random() * 50 - 25;
    return Math.max(0, Math.min(100, baseScore + randomVariation));
  }

  private calculateMomentumScore(item: WatchlistItem): number {
    // Mock momentum score
    const baseScore = 50;
    const randomVariation = Math.random() * 60 - 30;
    return Math.max(0, Math.min(100, baseScore + randomVariation));
  }

  private calculateRiskScore(item: WatchlistItem): number {
    // Mock risk assessment (higher = lower risk)
    const baseScore = 70;
    const randomVariation = Math.random() * 40 - 20;
    return Math.max(0, Math.min(100, baseScore + randomVariation));
  }

  private calculateConfidence(criteria: ScoringCriteria): number {
    // Calculate confidence based on score consistency
    const scores = Object.values(criteria);
    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - average, 2), 0) / scores.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Lower standard deviation = higher confidence
    return Math.max(0, Math.min(100, 100 - standardDeviation));
  }

  private generateId(): string {
    return `wl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
export const watchlistEngine = new WatchlistEngine(); 