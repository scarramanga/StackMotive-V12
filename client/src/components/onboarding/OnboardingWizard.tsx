import React, { useState } from 'react';
import { PageFade } from '../animation/PageFade';
import { motion, AnimatePresence } from 'framer-motion';

interface OnboardingWizardProps {
  onComplete?: () => void;
}

const steps = [
  'Welcome',
  'Choose Vault',
  'Connect Signals',
  'Confirm',
];

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [vault, setVault] = useState<string | null>(null);
  const [signals, setSignals] = useState<string[]>([]);

  const next = () => setStep((s) => Math.min(s + 1, steps.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));
  const skip = () => setStep(steps.length - 1);

  // Example step content
  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <h1 className="text-2xl font-bold mb-2">Welcome to StackMotive</h1>
            <p className="mb-6 text-muted-foreground">Your journey to smarter trading starts here.</p>
            <button className="btn-primary w-full max-w-xs py-2 rounded mb-2" onClick={next}>Get Started</button>
            <button className="btn-secondary w-full max-w-xs py-2 rounded text-xs" onClick={skip}>Skip Onboarding</button>
          </div>
        );
      case 1:
        return (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <h2 className="text-xl font-semibold mb-2">Choose or Create a Vault</h2>
            <p className="mb-4 text-muted-foreground">Vaults keep your signals and strategies organized.</p>
            <input
              className="input w-full max-w-xs mb-2 px-3 py-2 rounded border border-border bg-background text-foreground"
              placeholder="Vault Name"
              value={vault || ''}
              onChange={e => setVault(e.target.value)}
            />
            <button className="btn-primary w-full max-w-xs py-2 rounded mb-2" onClick={next} disabled={!vault}>Next</button>
            <button className="btn-secondary w-full max-w-xs py-2 rounded text-xs" onClick={back}>Back</button>
            <button className="btn-secondary w-full max-w-xs py-2 rounded text-xs mt-2" onClick={skip}>Skip</button>
          </div>
        );
      case 2:
        return (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <h2 className="text-xl font-semibold mb-2">Connect Signals</h2>
            <p className="mb-4 text-muted-foreground">Select which signals you want to subscribe to.</p>
            <div className="flex flex-wrap gap-2 justify-center mb-4">
              {['MACD', 'RSI', 'VIX', 'News', 'Earnings', 'Social', 'Geo'].map(sig => (
                <button
                  key={sig}
                  className={`px-3 py-1 rounded border ${signals.includes(sig) ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'} transition-colors`}
                  onClick={() => setSignals(s => s.includes(sig) ? s.filter(x => x !== sig) : [...s, sig])}
                  type="button"
                >
                  {sig}
                </button>
              ))}
            </div>
            <button className="btn-primary w-full max-w-xs py-2 rounded mb-2" onClick={next} disabled={signals.length === 0}>Next</button>
            <button className="btn-secondary w-full max-w-xs py-2 rounded text-xs" onClick={back}>Back</button>
            <button className="btn-secondary w-full max-w-xs py-2 rounded text-xs mt-2" onClick={skip}>Skip</button>
          </div>
        );
      case 3:
        return (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="flex flex-col items-center justify-center h-full text-center"
          >
            <h2 className="text-xl font-semibold mb-2">All Set!</h2>
            <p className="mb-4 text-muted-foreground">Your vault <span className="font-bold">{vault}</span> is ready with {signals.length} signals.</p>
            <button className="btn-primary w-full max-w-xs py-2 rounded mb-2" onClick={onComplete}>Go to Dashboard</button>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full h-screen flex items-center justify-center bg-background text-foreground transition-colors duration-300">
      <div className="w-full max-w-md mx-auto p-4 sm:p-8 rounded-xl shadow-lg bg-card dark:bg-card/80 min-h-[420px] flex flex-col justify-center">
        <AnimatePresence mode="wait" initial={false}>
          <PageFade key={step}>
            {renderStep()}
          </PageFade>
        </AnimatePresence>
        <div className="flex justify-center gap-2 mt-6">
          {steps.map((_, i) => (
            <span
              key={i}
              className={`w-2 h-2 rounded-full ${i === step ? 'bg-primary' : 'bg-muted-foreground/40'} transition-colors`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}; 