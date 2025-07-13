import React from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useBacktestSessions } from '@/hooks/use-backtest-sessions';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { ArrowRight, ChevronRight, PlayCircle } from 'lucide-react';

export default function BacktestsPage() {
  const [_, navigate] = useLocation();
  const { data: sessions = [], isLoading } = useBacktestSessions();

  return (
    <div className='p-4'>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Backtest Sessions</h1>
            <p className="text-muted-foreground">
              View and analyze your strategy backtesting results
            </p>
          </div>
          <Button onClick={() => navigate('/strategies/new')} size="lg">
            <PlayCircle className="w-4 h-4 mr-2" />
            New Backtest
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map((session) => (
            <Card key={session.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{session.strategy.name}</CardTitle>
                    <CardDescription>{session.name}</CardDescription>
                  </div>
                  <Badge 
                    variant={
                      session.status === 'completed' ? 'default' :
                      session.status === 'failed' ? 'destructive' :
                      session.status === 'running' ? 'secondary' : 'outline'
                    }
                  >
                    {session.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Date Range */}
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Date Range</span>
                    <span>
                      {format(new Date(session.startDate), 'MMM d')} - {format(new Date(session.endDate), 'MMM d, yyyy')}
                    </span>
                  </div>

                  {/* Performance */}
                  {session.profitLossPercentage && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Return</span>
                      <span className={
                        parseFloat(session.profitLossPercentage) > 0 
                          ? 'text-green-600 font-medium' 
                          : 'text-red-600 font-medium'
                      }>
                        {parseFloat(session.profitLossPercentage).toFixed(2)}%
                      </span>
                    </div>
                  )}

                  {/* P&L */}
                  {session.profitLoss && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">P&L</span>
                      <span className={
                        parseFloat(session.profitLoss) > 0 
                          ? 'text-green-600 font-medium' 
                          : 'text-red-600 font-medium'
                      }>
                        {formatCurrency(parseFloat(session.profitLoss))}
                      </span>
                    </div>
                  )}

                  {/* Win Rate */}
                  {session.winRate && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Win Rate</span>
                      <span className="font-medium">
                        {parseFloat(session.winRate).toFixed(1)}%
                      </span>
                    </div>
                  )}

                  {/* View Details Button */}
                  <Button 
                    variant="outline" 
                    className="w-full mt-4"
                    onClick={() => navigate(`/backtests/${session.id}`)}
                  >
                    View Details
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Empty State */}
          {!isLoading && sessions.length === 0 && (
            <Card className="col-span-full">
              <CardContent className="py-6 text-center">
                <h3 className="text-lg font-medium mb-2">No Backtest Sessions Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start by creating a strategy and running your first backtest.
                </p>
                <Button onClick={() => navigate('/strategies/new')}>
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Create Strategy
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
} 