import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BackLink } from '@/components/ui/back-link';
import { Settings } from 'lucide-react';
import UserPreferencesPanel from '../components/settings/UserPreferencesPanel';

const SettingsPage: React.FC = () => {
  return (
    <div className='p-4'>
      <div className="space-y-6">
        <BackLink href="/">← Back to Dashboard</BackLink>
        
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">Settings</h1>
            <p className="text-neutral-500 dark:text-neutral-400">
              Manage your account settings and preferences
            </p>
          </div>
          
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                User Preferences
              </CardTitle>
              <CardDescription>
                Configure your trading preferences and account settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <UserPreferencesPanel />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;