// Block 6: Watchlist Trigger System Types

export interface WatchlistAsset {
  symbol: string;
  notes?: string; // markdown/formatting supported
}

export interface SignalThreshold {
  type: string; // e.g., 'RSI', 'price', 'volume'
  value: number;
  direction: 'above' | 'below';
}

export interface WatchlistConfig {
  asset: WatchlistAsset;
  thresholds: SignalThreshold[];
}

export interface WatchlistAlert {
  id: string;
  asset: string;
  triggerType: string;
  signalStrength: number;
  suggestion: string;
  timestamp: string;
  rationale?: string;
  dismissed: boolean;
  snoozed: boolean;
  notes?: string;
}

// Block 32: Watchlist Engine - Types
export interface WatchlistItem {
  id: string;
  symbol: string;
  name: string;
  priority: number; // 1-5 scale
  addedAt: Date;
  lastScored: Date | null;
  currentScore: WatchlistScore | null;
  priceTarget: PriceTarget | null;
  notes: string | null;
  alerts: WatchlistAlert[];
  tags: string[];
}

export interface WatchlistScore {
  totalScore: number; // 0-100
  criteria: ScoringCriteria;
  confidence: number; // 0-100
  lastUpdated: Date;
}

export interface ScoringCriteria {
  technical: number;    // Technical analysis score
  fundamental: number;  // Fundamental analysis score
  sentiment: number;    // Market sentiment score
  momentum: number;     // Price momentum score
  risk: number;         // Risk assessment score
}

export interface PriceTarget {
  price: number;
  type: 'buy' | 'sell';
}

export interface WatchlistAlert {
  id: string;
  type: 'price' | 'score' | 'volume';
  condition: string; // 'above', 'below', 'crosses'
  value: number;
  createdAt: Date;
  triggered: boolean;
}

export interface WatchlistSettings {
  maxItems: number;
  autoScore: boolean;
  scoreThreshold: number;
  refreshInterval: number; // milliseconds
  notifications: boolean;
}

export interface WatchlistState {
  items: WatchlistItem[];
  settings: WatchlistSettings;
  selectedItems: string[];
  sortBy: 'score' | 'priority' | 'symbol' | 'addedAt';
  sortOrder: 'asc' | 'desc';
  filterBy: WatchlistFilter;
  isLoading: boolean;
  error: string | null;
}

export interface WatchlistFilter {
  minScore?: number;
  maxScore?: number;
  priority?: number[];
  tags?: string[];
  hasAlerts?: boolean;
  hasNotes?: boolean;
  recentlyAdded?: boolean; // Added in last 24 hours
}

export interface WatchlistActions {
  addToWatchlist: (symbol: string, name: string, priority?: number) => WatchlistItem;
  removeFromWatchlist: (symbol: string) => boolean;
  updateWatchlistItem: (symbol: string, updates: Partial<WatchlistItem>) => boolean;
  scoreAsset: (symbol: string) => WatchlistScore | null;
  scoreAllAssets: () => Map<string, WatchlistScore>;
  setPriceTarget: (symbol: string, target: number, type?: 'buy' | 'sell') => boolean;
  addAlert: (symbol: string, condition: string, value: number, type?: 'price' | 'score' | 'volume') => boolean;
  updateNotes: (symbol: string, notes: string) => boolean;
  setPriority: (symbol: string, priority: number) => boolean;
  searchWatchlist: (query: string) => WatchlistItem[];
  exportWatchlist: () => { items: WatchlistItem[], settings: WatchlistSettings };
  importWatchlist: (data: { items: WatchlistItem[], settings?: WatchlistSettings }) => void;
  updateSettings: (settings: Partial<WatchlistSettings>) => void;
}

export interface WatchlistStats {
  totalItems: number;
  averageScore: number;
  highPriorityCount: number;
  recentlyAdded: number;
  needsScoring: number;
  topPerformers: WatchlistItem[];
  alertsTriggered: number;
}

export interface WatchlistBulkOperation {
  type: 'tag' | 'priority' | 'score' | 'remove';
  symbols: string[];
  value?: any;
}

export interface WatchlistComparison {
  symbol: string;
  currentScore: number;
  previousScore: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'flat';
}

export interface WatchlistRecommendation {
  symbol: string;
  action: 'buy' | 'sell' | 'hold' | 'monitor';
  reason: string;
  confidence: number;
  priority: number;
  targetPrice?: number;
} 