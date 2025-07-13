import React from 'react';
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectLabel, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Card, 
  CardContent
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, Filter } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useQuery } from '@tanstack/react-query';

interface WhaleActivityFiltersProps {
  selectedSymbol: string;
  setSelectedSymbol: (symbol: string) => void;
  selectedInstitution: string;
  setSelectedInstitution: (institution: string) => void;
  institutions: string[] | undefined;
  isUserAuthenticated: boolean;
  showPortfolioOnly: boolean;
  setShowPortfolioOnly: (value: boolean) => void;
  showWatchlistOnly: boolean;
  setShowWatchlistOnly: (value: boolean) => void;
}

export const WhaleActivityFilters: React.FC<WhaleActivityFiltersProps> = ({
  selectedSymbol,
  setSelectedSymbol,
  selectedInstitution,
  setSelectedInstitution,
  institutions,
  isUserAuthenticated,
  showPortfolioOnly,
  setShowPortfolioOnly,
  showWatchlistOnly,
  setShowWatchlistOnly
}) => {
  // Fetch user's watchlist and portfolio symbols if authenticated
  const { data: watchlistItems } = useQuery({
    queryKey: ['/api/watchlist'],
    enabled: isUserAuthenticated && showWatchlistOnly
  });
  
  const { data: tradingAccounts } = useQuery({
    queryKey: ['/api/trading-accounts'],
    enabled: isUserAuthenticated && showPortfolioOnly
  });
  
  // Popular symbols for quick filtering
  const popularSymbols = [
    { value: 'BTC-USD', label: 'Bitcoin (BTC)' },
    { value: 'ETH-USD', label: 'Ethereum (ETH)' },
    { value: 'AAPL', label: 'Apple Inc.' },
    { value: 'MSFT', label: 'Microsoft' },
    { value: 'TSLA', label: 'Tesla' },
    { value: 'NVDA', label: 'NVIDIA' },
    { value: 'GOOG', label: 'Google' },
    { value: 'AMZN', label: 'Amazon' },
  ];
  
  const handleSymbolChange = (value: string) => {
    setSelectedSymbol(value);
  };
  
  const handleInstitutionChange = (value: string) => {
    setSelectedInstitution(value);
  };
  
  const togglePortfolioFilter = () => {
    setShowPortfolioOnly(!showPortfolioOnly);
    if (!showPortfolioOnly) {
      // When enabling portfolio filter, disable watchlist filter
      setShowWatchlistOnly(false);
    }
  };
  
  const toggleWatchlistFilter = () => {
    setShowWatchlistOnly(!showWatchlistOnly);
    if (!showWatchlistOnly) {
      // When enabling watchlist filter, disable portfolio filter
      setShowPortfolioOnly(false);
    }
  };
  
  const clearFilters = () => {
    setSelectedSymbol('');
    setSelectedInstitution('');
    setShowPortfolioOnly(false);
    setShowWatchlistOnly(false);
  };
  
  const hasActiveFilters = selectedSymbol || selectedInstitution || showPortfolioOnly || showWatchlistOnly;
  
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          <div className="flex-1 space-y-2">
            <label htmlFor="symbol-filter" className="text-sm font-medium">Symbol</label>
            <Select value={selectedSymbol} onValueChange={handleSymbolChange}>
              <SelectTrigger id="symbol-filter" className="w-full">
                <SelectValue placeholder="All Symbols" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Cryptocurrencies</SelectLabel>
                  <SelectItem value="BTC-USD">Bitcoin (BTC)</SelectItem>
                  <SelectItem value="ETH-USD">Ethereum (ETH)</SelectItem>
                  <SelectItem value="SOL-USD">Solana (SOL)</SelectItem>
                  <SelectItem value="BNB-USD">Binance Coin (BNB)</SelectItem>
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>Stocks</SelectLabel>
                  <SelectItem value="AAPL">Apple Inc. (AAPL)</SelectItem>
                  <SelectItem value="MSFT">Microsoft (MSFT)</SelectItem>
                  <SelectItem value="GOOG">Google (GOOG)</SelectItem>
                  <SelectItem value="TSLA">Tesla (TSLA)</SelectItem>
                  <SelectItem value="NVDA">NVIDIA (NVDA)</SelectItem>
                  <SelectItem value="AMZN">Amazon (AMZN)</SelectItem>
                  <SelectItem value="META">Meta (META)</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1 space-y-2">
            <label htmlFor="institution-filter" className="text-sm font-medium">Institution</label>
            <Select value={selectedInstitution} onValueChange={handleInstitutionChange}>
              <SelectTrigger id="institution-filter" className="w-full">
                <SelectValue placeholder="All Institutions" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Key Institutions</SelectLabel>
                  {institutions && institutions.map((institution: string, index: number) => (
                    <SelectItem key={index} value={institution}>
                      {institution}
                    </SelectItem>
                  ))}
                  {!institutions && (
                    <>
                      <SelectItem value="Berkshire Hathaway">Berkshire Hathaway</SelectItem>
                      <SelectItem value="BlackRock">BlackRock</SelectItem>
                      <SelectItem value="Vanguard Group">Vanguard Group</SelectItem>
                      <SelectItem value="ETH Foundation">ETH Foundation</SelectItem>
                      <SelectItem value="Unknown Wallet">Unknown Wallet</SelectItem>
                    </>
                  )}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          
          {hasActiveFilters && (
            <Button 
              variant="outline" 
              size="icon" 
              onClick={clearFilters}
              className="h-10 w-10"
              aria-label="Clear filters"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {isUserAuthenticated && (
          <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex items-center space-x-2">
              <Switch 
                id="portfolio-filter" 
                checked={showPortfolioOnly}
                onCheckedChange={togglePortfolioFilter}
                disabled={!isUserAuthenticated}
              />
              <Label htmlFor="portfolio-filter" className="cursor-pointer">Show Portfolio Assets Only</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch 
                id="watchlist-filter" 
                checked={showWatchlistOnly}
                onCheckedChange={toggleWatchlistFilter}
                disabled={!isUserAuthenticated}
              />
              <Label htmlFor="watchlist-filter" className="cursor-pointer">Show Watchlist Assets Only</Label>
            </div>
          </div>
        )}
        
        {!isUserAuthenticated && (
          <div className="mt-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Filter className="h-4 w-4" />
              Log in to filter by your portfolio and watchlist
            </span>
          </div>
        )}
        
        {hasActiveFilters && (
          <div className="mt-4 text-sm text-muted-foreground">
            <span className="font-medium">Active filters:</span>{' '}
            {selectedSymbol && (
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold mr-2">
                Symbol: {selectedSymbol}
              </span>
            )}
            {selectedInstitution && (
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold mr-2">
                Institution: {selectedInstitution}
              </span>
            )}
            {showPortfolioOnly && (
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold mr-2">
                Portfolio Assets Only
              </span>
            )}
            {showWatchlistOnly && (
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold mr-2">
                Watchlist Assets Only
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};