import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, CheckCircle, CreditCard, Calendar, Download, Settings } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BillingPlan {
  tier: string;
  name: string;
  monthly_price_id: string;
  monthly_amount: number;
  yearly_price_id?: string;
  yearly_amount?: number;
  yearly_savings?: number;
  features: string[];
}

interface UserSubscription {
  id: string;
  status: string;
  current_period_start: number;
  current_period_end: number;
  trial_end?: number;
  cancel_at_period_end: boolean;
  price_id: string;
}

interface Invoice {
  id: string;
  amount_paid: number;
  amount_due: number;
  status: string;
  created: number;
  invoice_pdf?: string;
}

interface BillingInfo {
  user_id: string;
  current_tier: string;
  stripe_customer_id: string;
  subscription: UserSubscription | null;
  invoices: Invoice[];
}

export const BillingDashboard: React.FC = () => {
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBilling, setSelectedBilling] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    try {
      setLoading(true);
      
      // Get user ID from context/auth (mock for now)
      const userId = 'user-id-placeholder';
      
      // Load billing config and user info
      const [configResponse, userResponse] = await Promise.all([
        fetch('/api/billing/config'),
        fetch(`/api/billing/user/${userId}`)
      ]);
      
      if (!configResponse.ok || !userResponse.ok) {
        throw new Error('Failed to load billing data');
      }
      
      const config = await configResponse.json();
      const userBilling = await userResponse.json();
      
      setPlans(config.plans);
      setBillingInfo(userBilling);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load billing data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (priceId: string) => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/billing/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: billingInfo?.user_id,
          price_id: priceId,
          trial_days: 14
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create subscription');
      }
      
      const result = await response.json();
      
      // Handle payment if needed (would integrate with Stripe Elements)
      if (result.client_secret) {
        // Process payment with Stripe Elements
        console.log('Payment required:', result.client_secret);
      }
      
      // Reload billing data
      await loadBillingData();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to subscribe');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!billingInfo?.subscription) return;
    
    try {
      setLoading(true);
      
      const response = await fetch('/api/billing/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription_id: billingInfo.subscription.id,
          cancel_at_period_end: true
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }
      
      await loadBillingData();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel subscription');
    } finally {
      setLoading(false);
    }
  };

  const openBillingPortal = async () => {
    if (!billingInfo?.stripe_customer_id) return;
    
    try {
      const response = await fetch('/api/billing/billing-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: billingInfo.stripe_customer_id,
          return_url: window.location.href
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to open billing portal');
      }
      
      const result = await response.json();
      window.open(result.url, '_blank');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open billing portal');
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const formatAmount = (amount: number) => {
    return `$${(amount / 100).toFixed(2)}`;
  };

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case 'free': return 'bg-gray-100 text-gray-800';
      case 'pro': return 'bg-blue-100 text-blue-800';
      case 'enterprise': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Subscription Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Current Subscription
          </CardTitle>
          <CardDescription>
            Manage your StackMotive subscription and billing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge className={getTierBadgeColor(billingInfo?.current_tier || 'free')}>
                {billingInfo?.current_tier?.toUpperCase() || 'FREE'}
              </Badge>
              <span className="text-sm text-gray-600">
                {billingInfo?.subscription ? (
                  `Active until ${formatDate(billingInfo.subscription.current_period_end)}`
                ) : (
                  'No active subscription'
                )}
              </span>
            </div>
            
            <div className="flex gap-2">
              {billingInfo?.subscription && (
                <>
                  <Button variant="outline" onClick={openBillingPortal}>
                    <Settings className="h-4 w-4 mr-2" />
                    Manage
                  </Button>
                  <Button variant="destructive" onClick={handleCancelSubscription}>
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </div>
          
          {billingInfo?.subscription?.trial_end && (
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Trial ends on {formatDate(billingInfo.subscription.trial_end)}
              </AlertDescription>
            </Alert>
          )}
          
          {billingInfo?.subscription?.cancel_at_period_end && (
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Subscription will cancel at the end of the current period
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Available Plans */}
      <Card>
        <CardHeader>
          <CardTitle>Available Plans</CardTitle>
          <CardDescription>
            Choose the plan that works best for you
          </CardDescription>
          
          <div className="flex gap-2">
            <Button
              variant={selectedBilling === 'monthly' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedBilling('monthly')}
            >
              Monthly
            </Button>
            <Button
              variant={selectedBilling === 'yearly' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedBilling('yearly')}
            >
              Yearly (Save 17%)
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card key={plan.tier} className={`relative ${billingInfo?.current_tier === plan.tier ? 'ring-2 ring-blue-500' : ''}`}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {plan.name}
                    {billingInfo?.current_tier === plan.tier && (
                      <Badge>Current</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    <div className="text-2xl font-bold">
                      {selectedBilling === 'monthly' ? (
                        formatAmount(plan.monthly_amount)
                      ) : plan.yearly_amount ? (
                        formatAmount(plan.yearly_amount / 12)
                      ) : (
                        formatAmount(plan.monthly_amount)
                      )}
                      <span className="text-sm font-normal text-gray-600">
                        /month
                      </span>
                    </div>
                    {selectedBilling === 'yearly' && plan.yearly_savings && (
                      <div className="text-sm text-green-600">
                        Save {formatAmount(plan.yearly_savings)} per year
                      </div>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  {billingInfo?.current_tier !== plan.tier && (
                    <Button
                      className="w-full"
                      onClick={() => {
                        const priceId = selectedBilling === 'monthly' 
                          ? plan.monthly_price_id 
                          : plan.yearly_price_id || plan.monthly_price_id;
                        handleSubscribe(priceId);
                      }}
                      disabled={loading}
                    >
                      {plan.tier === 'free' ? 'Downgrade' : 'Upgrade'} to {plan.name}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Billing History */}
      {billingInfo?.invoices && billingInfo.invoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Billing History
            </CardTitle>
            <CardDescription>
              Your recent invoices and payments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {billingInfo.invoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">
                      {formatAmount(invoice.amount_paid || invoice.amount_due)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatDate(invoice.created)}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Badge variant={invoice.status === 'paid' ? 'default' : 'destructive'}>
                      {invoice.status}
                    </Badge>
                    {invoice.invoice_pdf && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={invoice.invoice_pdf} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4 mr-2" />
                          PDF
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 