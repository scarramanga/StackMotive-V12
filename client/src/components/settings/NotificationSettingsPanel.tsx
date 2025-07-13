import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const NOTIFICATION_CATEGORIES = [
  { id: 'rebalance', label: 'Rebalance Alerts' },
  { id: 'watchlist', label: 'Watchlist Triggers' },
  { id: 'macro', label: 'Macro Events' },
  { id: 'digest', label: 'Digest Summary' },
];

export const NotificationSettingsPanel: React.FC = () => {
  // TODO: Replace with real notification preference data
  const [prefs, setPrefs] = useState({
    rebalance: true,
    watchlist: true,
    macro: true,
    digest: false,
  });
  const isLoading = false;
  const error = false;

  const handleToggle = (id: string) => {
    setPrefs((prev) => ({ ...prev, [id]: !prev[id as keyof typeof prev] }));
  };

  const handleSave = () => {
    // TODO: Implement save logic
  };

  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <CardTitle>Notification Settings Panel</CardTitle>
        <CardDescription>
          Customise what types of alerts and agent messages you receive, and when. Changes persist and affect live behavior.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <span>Loading...</span>
        ) : error ? (
          <span className="text-red-500">Error loading notification settings</span>
        ) : (
          <div className="space-y-4">
            {NOTIFICATION_CATEGORIES.map((cat) => (
              <label key={cat.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={prefs[cat.id as keyof typeof prefs]}
                  onChange={() => handleToggle(cat.id)}
                />
                <span>{cat.label}</span>
              </label>
            ))}
            <Button variant="default" onClick={handleSave}>Save Preferences</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationSettingsPanel; 