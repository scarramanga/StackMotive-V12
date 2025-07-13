import { useOverrideLogger } from '../../hooks/useOverrideLogger';

const GPTActionFeedbackPanel: React.FC<PanelProps> = (props) => {
  const { logOverride } = useOverrideLogger();

  const handleOverride = (asset: string, overlay: string, source: string, note: string) => {
    logOverride({ asset, overlay, source, note });
    // ... existing override logic ...
  };

  // Ensure all override UI/actions call handleOverride
  // ... existing code ...
}; 