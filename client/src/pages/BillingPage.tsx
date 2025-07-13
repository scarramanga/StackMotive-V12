import React from 'react';
import { BillingDashboard } from '@/components/billing/BillingDashboard';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const BillingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Billing & Subscriptions</h1>
                <p className="text-sm text-gray-600">
                  Manage your StackMotive subscription and billing settings
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="text-sm text-gray-500">
                Test Environment
              </div>
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BillingDashboard />
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Test Environment Notice
          </h3>
          <p className="text-blue-800 mb-4">
            You're in test mode. No real charges will be made. Use test card numbers for testing:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white p-3 rounded border">
              <div className="font-mono">4242 4242 4242 4242</div>
              <div className="text-gray-600">Successful payment</div>
            </div>
            <div className="bg-white p-3 rounded border">
              <div className="font-mono">4000 0000 0000 0002</div>
              <div className="text-gray-600">Card declined</div>
            </div>
            <div className="bg-white p-3 rounded border">
              <div className="font-mono">4000 0000 0000 9995</div>
              <div className="text-gray-600">Insufficient funds</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 