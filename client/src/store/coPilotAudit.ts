// Block 33: AI Co-Pilot Toggle (audit log)
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CoPilotAuditEntry {
  timestamp: string;
  userId: string;
  oldMode: string;
  newMode: string;
}

interface CoPilotAuditState {
  auditLog: CoPilotAuditEntry[];
  addCoPilotAudit: (entry: CoPilotAuditEntry) => void;
  getAuditLog: () => CoPilotAuditEntry[];
}

export const useCoPilotAuditStore = create(
  persist<CoPilotAuditState>(
    (set, get) => ({
      auditLog: [],
      addCoPilotAudit: (entry: CoPilotAuditEntry) => set((state: CoPilotAuditState) => ({ auditLog: [entry, ...state.auditLog] })),
      getAuditLog: () => get().auditLog,
    }),
    { name: 'copilot-audit' }
  )
); 