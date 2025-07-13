// Block 11: AdvisorPanel UI
import React from 'react';
import { useAdvisorStore } from '../../store/advisor';
import { useSessionStore } from '../../store/session';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { useAdvisorRecommendations } from '../../hooks/use-advisor-recommendations';
import { useAdvisorStopLoss } from '../../hooks/use-advisor-stoploss';
import { useAdvisorRebalancing } from '../../hooks/use-advisor-rebalancing';
import { useAdvisorTaxLoss } from '../../hooks/use-advisor-taxloss';
import { useAdvisorMacro } from '../../hooks/use-advisor-macro';
import { useAdvisorCustom } from '../../hooks/use-advisor-custom';
import type { AdvisorTab } from '../../types/advisor';
import { auditAdvisorAction } from '../../lib/advisorAudit';

function SimpleTabs({ value, onValueChange, tabs, children }: { value: string; onValueChange: (t: string) => void; tabs: string[]; children: React.ReactNode[] }) {
  return (
    <div>
      <div className="flex gap-2 mb-2">
        {tabs.map(tab => (
          <button key={tab} className={`btn btn-sm ${value === tab ? 'btn-primary' : 'btn-secondary'}`} onClick={() => onValueChange(tab)}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</button>
        ))}
      </div>
      {children[tabs.indexOf(value)]}
    </div>
  );
}

// Fix: marked.parseSync for string output (marked.parse can be async in some configs)
const renderMarkdown = (md: string) => marked.parse(md) as string;

export default function AdvisorPanel() {
  const user = useSessionStore(s => s.user);
  const isPremium = user?.isPremium;
  const { recommendations, history, activeTab, setActiveTab, setRecommendations, addHistory } = useAdvisorStore();
  const { data: liveRecs = [], isLoading } = useAdvisorRecommendations();
  const stopLossTab = 'stoploss';
  const { data: stopLossRecs = [], isLoading: loadingStopLoss } = useAdvisorStopLoss();
  const rebalancingTab = 'rebalance';
  const { data: rebalancingRecs = [], isLoading: loadingRebalancing } = useAdvisorRebalancing();
  const taxLossTab = 'taxloss';
  const { data: taxLossRecs = [], isLoading: loadingTaxLoss } = useAdvisorTaxLoss();
  const macroTab = 'macro';
  const { data: macroRecs = [], isLoading: loadingMacro } = useAdvisorMacro();
  const customTab = 'custom';
  const { data: customRecs = [], isLoading: loadingCustom } = useAdvisorCustom();
  const tabs = ['signals', 'dca'] as const;
  const allTabs = Array.from(new Set([...tabs, stopLossTab, rebalancingTab, taxLossTab, macroTab, customTab])) as AdvisorTab[];

  if (!isPremium) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">AI Portfolio Advisor (Premium Only)</h1>
        <p className="mb-4">Upgrade to unlock AI-driven portfolio recommendations and automation.</p>
        <button className="btn btn-primary">Upgrade Now</button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">AI Portfolio Advisor</h1>
      {isLoading && <div className="mb-4">Loading recommendations...</div>}
      <SimpleTabs value={activeTab} onValueChange={(t: string) => setActiveTab(t as any)} tabs={allTabs as unknown as string[]}>
        {allTabs.map(tab => (
          <div key={tab}>
            <div className="mb-4">
              {tab === customTab && loadingCustom && <div>Loading custom agent recommendations...</div>}
              {tab === customTab
                ? customRecs.filter(r => !r.completed).length === 0 && !loadingCustom && (
                    <div className="text-gray-500">All clear. No active custom agent recommendations.</div>
                  )
                : tab === macroTab && loadingMacro && <div>Loading macro event recommendations...</div>}
              {tab === stopLossTab && loadingStopLoss && <div>Loading stop-loss recommendations...</div>}
              {tab === rebalancingTab && loadingRebalancing && <div>Loading rebalancing recommendations...</div>}
              {tab === taxLossTab && loadingTaxLoss && <div>Loading tax-loss harvesting recommendations...</div>}
              {tab === stopLossTab
                ? stopLossRecs.filter(r => !r.completed).length === 0 && !loadingStopLoss && (
                    <div className="text-gray-500">All clear. No active stop-loss/take-profit recommendations.</div>
                  )
                : tab === rebalancingTab
                ? rebalancingRecs.filter(r => !r.completed).length === 0 && !loadingRebalancing && (
                    <div className="text-gray-500">All clear. No active rebalancing recommendations.</div>
                  )
                : tab === taxLossTab
                ? taxLossRecs.filter(r => !r.completed).length === 0 && !loadingTaxLoss && (
                    <div className="text-gray-500">All clear. No active tax-loss harvesting recommendations.</div>
                  )
                : liveRecs.filter(r => r.tab === tab && !r.completed).length === 0 && (
                    <div className="text-gray-500">All clear. No active {tab} recommendations.</div>
                  )}
              {(tab === customTab ? customRecs : tab === macroTab ? macroRecs : tab === taxLossTab ? taxLossRecs : tab === stopLossTab ? stopLossRecs : tab === rebalancingTab ? rebalancingRecs : liveRecs.filter(r => r.tab === tab)).filter(r => !r.completed).map(rec => (
                <div key={rec.id} className="mb-2 p-3 bg-yellow-100 rounded flex flex-col">
                  <div className="flex justify-between items-center">
                    <div>
                      <b>{rec.asset || rec.tab}</b> — <span>{rec.action}</span>
                      <span className="ml-2 text-xs text-gray-600">{new Date(rec.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="flex gap-2">
                      <button className="btn btn-sm btn-primary" onClick={async () => {
                        setRecommendations((tab === customTab ? customRecs : tab === macroTab ? macroRecs : tab === taxLossTab ? taxLossRecs : tab === stopLossTab ? stopLossRecs : tab === rebalancingTab ? rebalancingRecs : liveRecs).map(r => r.id === rec.id ? { ...r, completed: true, accepted: true } : r));
                        addHistory({ ...rec, completed: true, accepted: true, declined: false });
                        await auditAdvisorAction({ ...rec, completed: true, accepted: true, declined: false });
                      }}>Accept</button>
                      <button className="btn btn-sm btn-secondary" onClick={async () => {
                        setRecommendations((tab === customTab ? customRecs : tab === macroTab ? macroRecs : tab === taxLossTab ? taxLossRecs : tab === stopLossTab ? stopLossRecs : tab === rebalancingTab ? rebalancingRecs : liveRecs).map(r => r.id === rec.id ? { ...r, completed: true, accepted: false, declined: true } : r));
                        addHistory({ ...rec, completed: true, accepted: false, declined: true });
                        await auditAdvisorAction({ ...rec, completed: true, accepted: false, declined: true });
                      }}>Decline</button>
                    </div>
                  </div>
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-blue-700">Rationale</summary>
                    <div className="prose prose-sm mt-1" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(renderMarkdown(rec.markdown)) }} />
                  </details>
                </div>
              ))}
            </div>
          </div>
        ))}
      </SimpleTabs>
      <div className="mb-4">
        <h2 className="font-semibold mb-2">Recommendation History</h2>
        {history.length === 0 && <div className="text-gray-500">No history yet.</div>}
        {history.map((h, i) => (
          <div key={h.id} className="mb-2 p-3 bg-green-50 rounded">
            <div className="flex justify-between items-center">
              <div>
                <b>{h.asset || h.tab}</b> — {h.action}
                <span className="ml-2 text-xs text-gray-600">{new Date(h.timestamp).toLocaleString()}</span>
              </div>
              <span className="text-xs">{h.accepted ? 'Accepted' : h.declined ? 'Declined' : ''}</span>
            </div>
            <details className="mt-1">
              <summary className="cursor-pointer text-xs text-blue-700">Rationale</summary>
              <div className="prose prose-xs mt-1" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(renderMarkdown(h.markdown)) }} />
            </details>
          </div>
        ))}
      </div>
      {/* Mobile drawer styles handled by parent layout */}
    </div>
  );
} 