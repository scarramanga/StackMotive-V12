// Block 6 Implementation: Unified AssetViewTabs with state persistence and responsive design
import React, { useEffect } from 'react';
import TabSection from './TabSection';
import useUserPreferences from '@/hooks/useUserPreferences';

export interface AssetViewTabsProps {
  showPerformanceTab?: boolean;
  renderHoldings: () => React.ReactNode;
  renderAllocation: () => React.ReactNode;
  renderPerformance?: () => React.ReactNode;
  preferenceKey?: string; // Optional: allow unique key for different dashboards
  className?: string;
}

const DEFAULT_TABS = ['Holdings', 'Allocation'];

const AssetViewTabs: React.FC<AssetViewTabsProps> = ({
  showPerformanceTab = false,
  renderHoldings,
  renderAllocation,
  renderPerformance,
  preferenceKey = 'assetViewTab',
  className = '',
}) => {
  const { preferences, setPreference } = useUserPreferences();
  const tabs = showPerformanceTab ? [...DEFAULT_TABS, 'Performance'] : DEFAULT_TABS;
  const savedTab = preferences[preferenceKey] as string | undefined;
  const [activeTab, setActiveTab] = React.useState<string>(savedTab && tabs.includes(savedTab) ? savedTab : tabs[0]);

  useEffect(() => {
    setPreference(preferenceKey, activeTab);
    // eslint-disable-next-line
  }, [activeTab]);

  return (
    <TabSection
      tabs={tabs}
      activeTab={activeTab}
      onChange={setActiveTab}
      className={className}
    >
      {activeTab === 'Holdings' && renderHoldings()}
      {activeTab === 'Allocation' && renderAllocation()}
      {showPerformanceTab && activeTab === 'Performance' && renderPerformance && renderPerformance()}
    </TabSection>
  );
};

export default AssetViewTabs; 