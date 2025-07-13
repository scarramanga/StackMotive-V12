import React from 'react';
import { BackLink } from '@/components/ui/back-link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { Plus, Brain, Code, TrendingUp, Bot } from 'lucide-react';

export default function NewStrategy() {
  const [, navigate] = useLocation();

  return (
    <div className='p-4'>
      <div className="p-6 space-y-6">
        <BackLink href="/trading/strategies">← Back to Strategies</BackLink>
        
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-2">Create New Strategy</h1>
          <p className="text-muted-foreground">
            Choose how you'd like to create your trading strategy
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* AI Strategy Builder */}
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/trading/ai-strategy-builder')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Brain className="h-6 w-6 text-purple-600" />
                AI Strategy Builder
              </CardTitle>
              <CardDescription>
                Let AI create a custom strategy based on your preferences and risk tolerance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">Features:</div>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Machine learning optimization</li>
                  <li>• Risk-adjusted parameters</li>
                  <li>• Backtesting included</li>
                  <li>• No coding required</li>
                </ul>
                <Button className="w-full mt-4">
                  <Brain className="h-4 w-4 mr-2" />
                  Start AI Builder
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Template-Based */}
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <TrendingUp className="h-6 w-6 text-blue-600" />
                Strategy Templates
              </CardTitle>
              <CardDescription>
                Start with proven strategy templates and customize them to your needs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">Available Templates:</div>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• MACD Crossover</li>
                  <li>• RSI Mean Reversion</li>
                  <li>• Moving Average Trend</li>
                  <li>• Bollinger Band Breakout</li>
                </ul>
                <Button variant="outline" className="w-full mt-4">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Browse Templates
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Code-Based */}
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Code className="h-6 w-6 text-green-600" />
                Custom Code
              </CardTitle>
              <CardDescription>
                Write your own strategy using our Python-based strategy framework
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">For developers:</div>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Full Python framework</li>
                  <li>• Custom indicators</li>
                  <li>• Advanced logic</li>
                  <li>• Direct market access</li>
                </ul>
                <Button variant="outline" className="w-full mt-4">
                  <Code className="h-4 w-4 mr-2" />
                  Code Editor
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Strategy Import Section */}
        <Card>
          <CardHeader>
            <CardTitle>Import Existing Strategy</CardTitle>
            <CardDescription>
              Already have a strategy configuration file? Import it here
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center p-6 border-2 border-dashed border-muted-foreground/25 rounded-lg">
              <div className="text-center">
                <Bot className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground mb-4">
                  Drop your strategy file here or click to browse
                </p>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Choose File
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Start Tips */}
        <Card>
          <CardHeader>
            <CardTitle>Getting Started Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">For Beginners</h4>
                <p className="text-muted-foreground">
                  Start with the AI Strategy Builder or use proven templates. These require no coding experience.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">For Intermediate</h4>
                <p className="text-muted-foreground">
                  Customize existing templates with your own parameters and risk management rules.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">For Advanced</h4>
                <p className="text-muted-foreground">
                  Build completely custom strategies using our Python framework with full market access.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 