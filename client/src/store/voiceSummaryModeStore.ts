// Block 98: Voice Summary Mode - Store
// Zustand State Management for Voice Synthesis and Audio

import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  VoiceSummaryMode,
  VoiceSummaryModeState,
  AudioInstance,
  AudioQueueItem,
  CachedAudio,
  GenerationProgress,
  PerformanceMetrics,
  VoiceProfile,
  CustomVoiceProfile,
  ContentTemplate,
  BatchGenerationResult,
  ExportResult
} from '../types/voiceSummaryMode';

interface VoiceSummaryModeStore extends VoiceSummaryModeState {
  // Mode Management
  addMode: (mode: VoiceSummaryMode) => void;
  updateMode: (id: string, updates: Partial<VoiceSummaryMode>) => void;
  removeMode: (id: string) => void;
  setCurrentMode: (id: string | null) => void;
  
  // Audio Generation Management
  setGenerating: (isGenerating: boolean) => void;
  setGenerationProgress: (progress: GenerationProgress | null) => void;
  updateGenerationProgress: (stage: string, progress: number, operation: string) => void;
  
  // Audio Instance Management
  addAudioInstance: (audio: AudioInstance) => void;
  updateAudioInstance: (id: string, updates: Partial<AudioInstance>) => void;
  removeAudioInstance: (id: string) => void;
  
  // Playback Management
  setPlaybackState: (isPlaying: boolean, audio?: AudioInstance | null) => void;
  setPlaybackPosition: (position: number) => void;
  setCurrentAudio: (audio: AudioInstance | null) => void;
  updatePlaybackStats: (audioId: string) => void;
  
  // Queue Management
  addToQueue: (item: AudioQueueItem) => void;
  removeFromQueue: (itemId: string) => void;
  reorderQueue: (newOrder: string[]) => void;
  clearQueue: () => void;
  moveToNext: () => void;
  moveToPrevious: () => void;
  
  // Cache Management
  addToCache: (audioId: string, audioBlob: Blob, metadata: any) => void;
  removeFromCache: (audioId: string) => void;
  getCachedAudio: (audioId: string) => CachedAudio | null;
  clearExpiredCache: () => void;
  optimizeCache: () => void;
  
  // Voice Management
  setAvailableVoices: (voices: VoiceProfile[]) => void;
  addCustomVoice: (voice: CustomVoiceProfile) => void;
  updateCustomVoice: (id: string, updates: Partial<CustomVoiceProfile>) => void;
  removeCustomVoice: (id: string) => void;
  
  // Template Management
  addTemplate: (template: ContentTemplate) => void;
  updateTemplate: (id: string, updates: Partial<ContentTemplate>) => void;
  removeTemplate: (id: string) => void;
  
  // Performance Tracking
  updatePerformanceMetrics: (metrics: Partial<PerformanceMetrics>) => void;
  recordGenerationTime: (time: number) => void;
  recordPlaybackLatency: (latency: number) => void;
  incrementCacheHit: () => void;
  incrementCacheMiss: () => void;
  recordError: () => void;
  
  // Batch Operations
  setBatchResult: (batchId: string, result: BatchGenerationResult) => void;
  getBatchResult: (batchId: string) => BatchGenerationResult | null;
  clearBatchResults: () => void;
  
  // Export Results
  addExportResult: (result: ExportResult) => void;
  getExportResults: () => ExportResult[];
  removeExpiredExports: () => void;
  
  // Settings and Preferences
  updateVoiceSettings: (modeId: string, settings: any) => void;
  updateAudioSettings: (modeId: string, settings: any) => void;
  updateAccessibilitySettings: (modeId: string, settings: any) => void;
  
  // Error Handling
  setError: (error: string) => void;
  clearError: () => void;
  addErrorLog: (error: string, context: string) => void;
  
  // Statistics and Analytics
  getGenerationStats: () => GenerationStats;
  getPlaybackStats: () => PlaybackStats;
  getCacheStats: () => CacheStats;
  getUsageStats: () => UsageStats;
  
  // Utility
  getModeById: (id: string) => VoiceSummaryMode | undefined;
  getActiveModes: () => VoiceSummaryMode[];
  getAudioById: (id: string) => AudioInstance | null;
  getQueueLength: () => number;
  getCurrentQueueItem: () => AudioQueueItem | null;
  
  // Cleanup and Maintenance
  cleanup: () => void;
  resetStore: () => void;
  exportStoreData: () => StoreExportData;
  importStoreData: (data: StoreExportData) => void;
}

const initialState: VoiceSummaryModeState = {
  modes: {},
  currentModeId: null,
  isGenerating: false,
  generationProgress: null,
  isPlaying: false,
  currentAudio: null,
  playbackPosition: 0,
  audioQueue: [],
  audioCache: {},
  cacheSize: 0,
  maxCacheSize: 500 * 1024 * 1024, // 500MB
  errors: {},
  performanceMetrics: {
    generationTime: 0,
    playbackLatency: 0,
    cacheHitRate: 0,
    errorRate: 0,
    userSatisfaction: 0
  }
};

export const useVoiceSummaryModeStore = create<VoiceSummaryModeStore>()(
  subscribeWithSelector(
    persist(
      immer((set, get) => ({
        ...initialState,
        
        // Additional state for advanced features
        availableVoices: [] as VoiceProfile[],
        customVoices: {} as Record<string, CustomVoiceProfile>,
        templates: {} as Record<string, ContentTemplate>,
        audioInstances: {} as Record<string, AudioInstance>,
        batchResults: {} as Record<string, BatchGenerationResult>,
        exportResults: [] as ExportResult[],
        errorLogs: [] as ErrorLog[],
        generationHistory: [] as GenerationHistoryItem[],
        
        // Performance tracking
        totalGenerations: 0,
        totalPlaybacks: 0,
        cacheHits: 0,
        cacheMisses: 0,
        totalErrors: 0,
        generationTimes: [] as number[],
        playbackLatencies: [] as number[],
        
        // Mode Management
        addMode: (mode) => {
          set((state) => {
            state.modes[mode.id] = mode;
            
            // Set as current mode if it's the first one
            if (Object.keys(state.modes).length === 1) {
              state.currentModeId = mode.id;
            }
          });
        },
        
        updateMode: (id, updates) => {
          set((state) => {
            if (state.modes[id]) {
              state.modes[id] = { ...state.modes[id], ...updates, updatedAt: new Date() };
            }
          });
        },
        
        removeMode: (id) => {
          set((state) => {
            delete state.modes[id];
            
            // Clear current mode if it's the one being removed
            if (state.currentModeId === id) {
              const remainingModeIds = Object.keys(state.modes);
              state.currentModeId = remainingModeIds.length > 0 ? remainingModeIds[0] : null;
            }
            
            // Clean up related data
            Object.keys(state.audioInstances).forEach(audioId => {
              if (state.audioInstances[audioId].settings && 
                  Object.keys(state.modes).some(modeId => modeId === id)) {
                delete state.audioInstances[audioId];
                delete state.audioCache[audioId];
              }
            });
          });
        },
        
        setCurrentMode: (id) => {
          set((state) => {
            state.currentModeId = id;
            
            // Update last used timestamp
            if (id && state.modes[id]) {
              state.modes[id].lastUsed = new Date();
            }
          });
        },
        
        // Audio Generation Management
        setGenerating: (isGenerating) => {
          set((state) => {
            state.isGenerating = isGenerating;
            
            if (!isGenerating) {
              state.generationProgress = null;
            }
          });
        },
        
        setGenerationProgress: (progress) => {
          set((state) => {
            state.generationProgress = progress;
          });
        },
        
        updateGenerationProgress: (stage, progress, operation) => {
          set((state) => {
            if (state.generationProgress) {
              state.generationProgress.stage = stage;
              state.generationProgress.progress = progress;
              state.generationProgress.currentOperation = operation;
              state.generationProgress.estimatedTimeRemaining = Math.max(
                (100 - progress) * 100, 
                0
              );
            }
          });
        },
        
        // Audio Instance Management
        addAudioInstance: (audio) => {
          set((state) => {
            state.audioInstances[audio.id] = audio;
            state.totalGenerations += 1;
            
            // Add to generation history
            state.generationHistory.push({
              id: audio.id,
              generatedAt: audio.generatedAt,
              text: audio.text,
              duration: audio.duration,
              voiceUsed: audio.voiceUsed,
              quality: audio.quality
            });
            
            // Keep history limited
            if (state.generationHistory.length > 100) {
              state.generationHistory = state.generationHistory.slice(-100);
            }
          });
        },
        
        updateAudioInstance: (id, updates) => {
          set((state) => {
            if (state.audioInstances[id]) {
              state.audioInstances[id] = { ...state.audioInstances[id], ...updates };
            }
          });
        },
        
        removeAudioInstance: (id) => {
          set((state) => {
            delete state.audioInstances[id];
            delete state.audioCache[id];
            
            // Remove from queue if present
            state.audioQueue = state.audioQueue.filter(item => item.audioId !== id);
            
            // Clear current audio if it's the one being removed
            if (state.currentAudio?.id === id) {
              state.currentAudio = null;
              state.isPlaying = false;
              state.playbackPosition = 0;
            }
          });
        },
        
        // Playback Management
        setPlaybackState: (isPlaying, audio) => {
          set((state) => {
            state.isPlaying = isPlaying;
            
            if (audio !== undefined) {
              state.currentAudio = audio;
            }
            
            if (isPlaying && state.currentAudio) {
              state.totalPlaybacks += 1;
              
              // Update play count
              if (state.audioInstances[state.currentAudio.id]) {
                state.audioInstances[state.currentAudio.id].playCount += 1;
                state.audioInstances[state.currentAudio.id].lastPlayed = new Date();
              }
            }
          });
        },
        
        setPlaybackPosition: (position) => {
          set((state) => {
            state.playbackPosition = position;
          });
        },
        
        setCurrentAudio: (audio) => {
          set((state) => {
            state.currentAudio = audio;
            
            if (!audio) {
              state.isPlaying = false;
              state.playbackPosition = 0;
            }
          });
        },
        
        updatePlaybackStats: (audioId) => {
          set((state) => {
            if (state.audioInstances[audioId]) {
              state.audioInstances[audioId].playCount += 1;
              state.audioInstances[audioId].lastPlayed = new Date();
            }
          });
        },
        
        // Queue Management
        addToQueue: (item) => {
          set((state) => {
            state.audioQueue.push(item);
          });
        },
        
        removeFromQueue: (itemId) => {
          set((state) => {
            state.audioQueue = state.audioQueue.filter(item => item.id !== itemId);
          });
        },
        
        reorderQueue: (newOrder) => {
          set((state) => {
            const orderedQueue = newOrder.map(itemId => 
              state.audioQueue.find(item => item.id === itemId)
            ).filter(Boolean) as AudioQueueItem[];
            
            state.audioQueue = orderedQueue;
          });
        },
        
        clearQueue: () => {
          set((state) => {
            state.audioQueue = [];
          });
        },
        
        moveToNext: () => {
          set((state) => {
            if (state.audioQueue.length > 0) {
              const nextItem = state.audioQueue[0];
              const nextAudio = state.audioInstances[nextItem.audioId];
              
              if (nextAudio) {
                state.currentAudio = nextAudio;
                state.audioQueue = state.audioQueue.slice(1);
                state.playbackPosition = 0;
              }
            }
          });
        },
        
        moveToPrevious: () => {
          set((state) => {
            // Implementation would depend on history tracking
            state.playbackPosition = 0;
          });
        },
        
        // Cache Management
        addToCache: (audioId, audioBlob, metadata) => {
          set((state) => {
            const cachedAudio: CachedAudio = {
              audioId,
              audioBlob,
              metadata,
              cachedAt: new Date(),
              lastAccessed: new Date(),
              accessCount: 1
            };
            
            state.audioCache[audioId] = cachedAudio;
            state.cacheSize += audioBlob.size;
            
            // Optimize cache if it's getting too large
            if (state.cacheSize > state.maxCacheSize) {
              // Remove least recently used items
              const cacheEntries = Object.entries(state.audioCache)
                .sort(([, a], [, b]) => a.lastAccessed.getTime() - b.lastAccessed.getTime());
              
              while (state.cacheSize > state.maxCacheSize * 0.8 && cacheEntries.length > 0) {
                const [audioId, cachedAudio] = cacheEntries.shift()!;
                state.cacheSize -= cachedAudio.audioBlob.size;
                delete state.audioCache[audioId];
              }
            }
          });
        },
        
        removeFromCache: (audioId) => {
          set((state) => {
            if (state.audioCache[audioId]) {
              state.cacheSize -= state.audioCache[audioId].audioBlob.size;
              delete state.audioCache[audioId];
            }
          });
        },
        
        getCachedAudio: (audioId) => {
          const state = get();
          const cached = state.audioCache[audioId];
          
          if (cached) {
            // Update access stats
            set((state) => {
              if (state.audioCache[audioId]) {
                state.audioCache[audioId].lastAccessed = new Date();
                state.audioCache[audioId].accessCount += 1;
              }
            });
            
            return cached;
          }
          
          return null;
        },
        
        clearExpiredCache: () => {
          set((state) => {
            const now = new Date();
            const maxAge = 24 * 60 * 60 * 1000; // 24 hours
            
            Object.keys(state.audioCache).forEach(audioId => {
              const cached = state.audioCache[audioId];
              const age = now.getTime() - cached.cachedAt.getTime();
              
              if (age > maxAge) {
                state.cacheSize -= cached.audioBlob.size;
                delete state.audioCache[audioId];
              }
            });
          });
        },
        
        optimizeCache: () => {
          set((state) => {
            // Remove least frequently used items if cache is large
            if (state.cacheSize > state.maxCacheSize * 0.7) {
              const cacheEntries = Object.entries(state.audioCache)
                .sort(([, a], [, b]) => a.accessCount - b.accessCount);
              
              const itemsToRemove = Math.floor(cacheEntries.length * 0.2);
              
              for (let i = 0; i < itemsToRemove && cacheEntries.length > 0; i++) {
                const [audioId, cachedAudio] = cacheEntries.shift()!;
                state.cacheSize -= cachedAudio.audioBlob.size;
                delete state.audioCache[audioId];
              }
            }
          });
        },
        
        // Voice Management
        setAvailableVoices: (voices) => {
          set((state) => {
            state.availableVoices = voices;
          });
        },
        
        addCustomVoice: (voice) => {
          set((state) => {
            state.customVoices[voice.id] = voice;
          });
        },
        
        updateCustomVoice: (id, updates) => {
          set((state) => {
            if (state.customVoices[id]) {
              state.customVoices[id] = { ...state.customVoices[id], ...updates };
            }
          });
        },
        
        removeCustomVoice: (id) => {
          set((state) => {
            delete state.customVoices[id];
          });
        },
        
        // Template Management
        addTemplate: (template) => {
          set((state) => {
            state.templates[template.id] = template;
          });
        },
        
        updateTemplate: (id, updates) => {
          set((state) => {
            if (state.templates[id]) {
              state.templates[id] = { ...state.templates[id], ...updates };
            }
          });
        },
        
        removeTemplate: (id) => {
          set((state) => {
            delete state.templates[id];
          });
        },
        
        // Performance Tracking
        updatePerformanceMetrics: (metrics) => {
          set((state) => {
            state.performanceMetrics = { ...state.performanceMetrics, ...metrics };
          });
        },
        
        recordGenerationTime: (time) => {
          set((state) => {
            state.generationTimes.push(time);
            
            // Keep only last 100 measurements
            if (state.generationTimes.length > 100) {
              state.generationTimes = state.generationTimes.slice(-100);
            }
            
            // Update average
            const average = state.generationTimes.reduce((sum, t) => sum + t, 0) / state.generationTimes.length;
            state.performanceMetrics.generationTime = average;
          });
        },
        
        recordPlaybackLatency: (latency) => {
          set((state) => {
            state.playbackLatencies.push(latency);
            
            // Keep only last 100 measurements
            if (state.playbackLatencies.length > 100) {
              state.playbackLatencies = state.playbackLatencies.slice(-100);
            }
            
            // Update average
            const average = state.playbackLatencies.reduce((sum, l) => sum + l, 0) / state.playbackLatencies.length;
            state.performanceMetrics.playbackLatency = average;
          });
        },
        
        incrementCacheHit: () => {
          set((state) => {
            state.cacheHits += 1;
            state.performanceMetrics.cacheHitRate = state.cacheHits / (state.cacheHits + state.cacheMisses);
          });
        },
        
        incrementCacheMiss: () => {
          set((state) => {
            state.cacheMisses += 1;
            state.performanceMetrics.cacheHitRate = state.cacheHits / (state.cacheHits + state.cacheMisses);
          });
        },
        
        recordError: () => {
          set((state) => {
            state.totalErrors += 1;
            const totalOperations = state.totalGenerations + state.totalPlaybacks;
            state.performanceMetrics.errorRate = totalOperations > 0 ? state.totalErrors / totalOperations : 0;
          });
        },
        
        // Batch Operations
        setBatchResult: (batchId, result) => {
          set((state) => {
            state.batchResults[batchId] = result;
          });
        },
        
        getBatchResult: (batchId) => {
          const state = get();
          return state.batchResults[batchId] || null;
        },
        
        clearBatchResults: () => {
          set((state) => {
            state.batchResults = {};
          });
        },
        
        // Export Results
        addExportResult: (result) => {
          set((state) => {
            state.exportResults.push(result);
            
            // Keep only last 50 export results
            if (state.exportResults.length > 50) {
              state.exportResults = state.exportResults.slice(-50);
            }
          });
        },
        
        getExportResults: () => {
          const state = get();
          return state.exportResults;
        },
        
        removeExpiredExports: () => {
          set((state) => {
            const now = new Date();
            state.exportResults = state.exportResults.filter(result => 
              result.expiresAt.getTime() > now.getTime()
            );
          });
        },
        
        // Settings and Preferences
        updateVoiceSettings: (modeId, settings) => {
          set((state) => {
            if (state.modes[modeId]) {
              state.modes[modeId].voiceConfig = { ...state.modes[modeId].voiceConfig, ...settings };
              state.modes[modeId].updatedAt = new Date();
            }
          });
        },
        
        updateAudioSettings: (modeId, settings) => {
          set((state) => {
            if (state.modes[modeId]) {
              state.modes[modeId].audioSettings = { ...state.modes[modeId].audioSettings, ...settings };
              state.modes[modeId].updatedAt = new Date();
            }
          });
        },
        
        updateAccessibilitySettings: (modeId, settings) => {
          set((state) => {
            if (state.modes[modeId]) {
              state.modes[modeId].accessibilityFeatures = { ...state.modes[modeId].accessibilityFeatures, ...settings };
              state.modes[modeId].updatedAt = new Date();
            }
          });
        },
        
        // Error Handling
        setError: (error) => {
          set((state) => {
            state.errors.general = error;
          });
        },
        
        clearError: () => {
          set((state) => {
            state.errors = {};
          });
        },
        
        addErrorLog: (error, context) => {
          set((state) => {
            state.errorLogs.push({
              error,
              context,
              timestamp: new Date(),
              id: `error_${Date.now()}`
            });
            
            // Keep only last 100 error logs
            if (state.errorLogs.length > 100) {
              state.errorLogs = state.errorLogs.slice(-100);
            }
          });
        },
        
        // Statistics and Analytics
        getGenerationStats: () => {
          const state = get();
          return {
            totalGenerations: state.totalGenerations,
            averageGenerationTime: state.performanceMetrics.generationTime,
            totalAudioDuration: Object.values(state.audioInstances).reduce((sum, audio) => sum + audio.duration, 0),
            averageQuality: Object.values(state.audioInstances).reduce((sum, audio) => sum + audio.quality, 0) / Math.max(Object.keys(state.audioInstances).length, 1),
            mostUsedVoice: getMostUsedVoice(state.audioInstances),
            generationsToday: getGenerationsToday(state.generationHistory)
          };
        },
        
        getPlaybackStats: () => {
          const state = get();
          return {
            totalPlaybacks: state.totalPlaybacks,
            averagePlaybackLatency: state.performanceMetrics.playbackLatency,
            totalListeningTime: calculateTotalListeningTime(state.audioInstances),
            mostPlayedAudio: getMostPlayedAudio(state.audioInstances),
            playbacksToday: getPlaybacksToday(state.audioInstances)
          };
        },
        
        getCacheStats: () => {
          const state = get();
          return {
            cacheSize: state.cacheSize,
            maxCacheSize: state.maxCacheSize,
            cacheUtilization: state.cacheSize / state.maxCacheSize,
            cacheHitRate: state.performanceMetrics.cacheHitRate,
            cachedItems: Object.keys(state.audioCache).length,
            oldestCacheItem: getOldestCacheItem(state.audioCache),
            newestCacheItem: getNewestCacheItem(state.audioCache)
          };
        },
        
        getUsageStats: () => {
          const state = get();
          return {
            activeModes: Object.values(state.modes).filter(mode => mode.isActive).length,
            totalModes: Object.keys(state.modes).length,
            customVoices: Object.keys(state.customVoices).length,
            templates: Object.keys(state.templates).length,
            queueLength: state.audioQueue.length,
            errorRate: state.performanceMetrics.errorRate,
            userSatisfaction: state.performanceMetrics.userSatisfaction
          };
        },
        
        // Utility
        getModeById: (id) => {
          const state = get();
          return state.modes[id];
        },
        
        getActiveModes: () => {
          const state = get();
          return Object.values(state.modes).filter(mode => mode.isActive);
        },
        
        getAudioById: (id) => {
          const state = get();
          return state.audioInstances[id] || null;
        },
        
        getQueueLength: () => {
          const state = get();
          return state.audioQueue.length;
        },
        
        getCurrentQueueItem: () => {
          const state = get();
          return state.audioQueue.length > 0 ? state.audioQueue[0] : null;
        },
        
        // Cleanup and Maintenance
        cleanup: () => {
          set((state) => {
            const now = new Date();
            const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
            
            // Clean up old audio instances
            Object.keys(state.audioInstances).forEach(audioId => {
              const audio = state.audioInstances[audioId];
              const age = now.getTime() - audio.generatedAt.getTime();
              
              if (age > maxAge && audio.playCount === 0) {
                delete state.audioInstances[audioId];
                delete state.audioCache[audioId];
              }
            });
            
            // Clean up old error logs
            state.errorLogs = state.errorLogs.filter(log => 
              now.getTime() - log.timestamp.getTime() < 7 * 24 * 60 * 60 * 1000 // 7 days
            );
            
            // Clean up old generation history
            state.generationHistory = state.generationHistory.filter(item =>
              now.getTime() - item.generatedAt.getTime() < maxAge
            );
            
            // Clean up expired exports
            state.exportResults = state.exportResults.filter(result =>
              result.expiresAt.getTime() > now.getTime()
            );
            
            // Optimize cache
            if (state.cacheSize > state.maxCacheSize * 0.8) {
              const cacheEntries = Object.entries(state.audioCache)
                .sort(([, a], [, b]) => a.lastAccessed.getTime() - b.lastAccessed.getTime());
              
              while (state.cacheSize > state.maxCacheSize * 0.7 && cacheEntries.length > 0) {
                const [audioId, cachedAudio] = cacheEntries.shift()!;
                state.cacheSize -= cachedAudio.audioBlob.size;
                delete state.audioCache[audioId];
              }
            }
          });
        },
        
        resetStore: () => {
          set(() => ({ 
            ...initialState,
            availableVoices: [],
            customVoices: {},
            templates: {},
            audioInstances: {},
            batchResults: {},
            exportResults: [],
            errorLogs: [],
            generationHistory: [],
            totalGenerations: 0,
            totalPlaybacks: 0,
            cacheHits: 0,
            cacheMisses: 0,
            totalErrors: 0,
            generationTimes: [],
            playbackLatencies: []
          }));
        },
        
        exportStoreData: () => {
          const state = get();
          return {
            modes: state.modes,
            customVoices: state.customVoices,
            templates: state.templates,
            settings: {
              maxCacheSize: state.maxCacheSize
            },
            exportedAt: new Date(),
            version: '1.0.0'
          };
        },
        
        importStoreData: (data) => {
          set((state) => {
            if (data.modes) {
              Object.assign(state.modes, data.modes);
            }
            if (data.customVoices) {
              Object.assign(state.customVoices, data.customVoices);
            }
            if (data.templates) {
              Object.assign(state.templates, data.templates);
            }
            if (data.settings) {
              if (data.settings.maxCacheSize) {
                state.maxCacheSize = data.settings.maxCacheSize;
              }
            }
          });
        }
      })),
      {
        name: 'voice-summary-mode-store',
        version: 1,
        partialize: (state) => ({
          modes: state.modes,
          currentModeId: state.currentModeId,
          customVoices: state.customVoices,
          templates: state.templates,
          maxCacheSize: state.maxCacheSize,
          performanceMetrics: state.performanceMetrics
        }),
        onRehydrateStorage: () => (state) => {
          // Clean up after rehydration
          if (state) {
            state.cleanup();
          }
        }
      }
    )
  )
);

// Helper functions
function getMostUsedVoice(audioInstances: Record<string, AudioInstance>): string {
  const voiceUsage: Record<string, number> = {};
  
  Object.values(audioInstances).forEach(audio => {
    voiceUsage[audio.voiceUsed] = (voiceUsage[audio.voiceUsed] || 0) + 1;
  });
  
  return Object.entries(voiceUsage).reduce((a, b) => a[1] > b[1] ? a : b)?.[0] || 'none';
}

function getGenerationsToday(history: GenerationHistoryItem[]): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return history.filter(item => 
    item.generatedAt.getTime() >= today.getTime()
  ).length;
}

function calculateTotalListeningTime(audioInstances: Record<string, AudioInstance>): number {
  return Object.values(audioInstances).reduce((total, audio) => 
    total + (audio.duration * audio.playCount), 0
  );
}

function getMostPlayedAudio(audioInstances: Record<string, AudioInstance>): string {
  const sortedByPlayCount = Object.values(audioInstances).sort((a, b) => b.playCount - a.playCount);
  return sortedByPlayCount[0]?.id || 'none';
}

function getPlaybacksToday(audioInstances: Record<string, AudioInstance>): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return Object.values(audioInstances).filter(audio => 
    audio.lastPlayed.getTime() >= today.getTime()
  ).length;
}

function getOldestCacheItem(cache: Record<string, CachedAudio>): Date | null {
  const items = Object.values(cache);
  if (items.length === 0) return null;
  
  return items.reduce((oldest, item) => 
    item.cachedAt < oldest ? item.cachedAt : oldest, items[0].cachedAt
  );
}

function getNewestCacheItem(cache: Record<string, CachedAudio>): Date | null {
  const items = Object.values(cache);
  if (items.length === 0) return null;
  
  return items.reduce((newest, item) => 
    item.cachedAt > newest ? item.cachedAt : newest, items[0].cachedAt
  );
}

// Type definitions for analytics
interface GenerationStats {
  totalGenerations: number;
  averageGenerationTime: number;
  totalAudioDuration: number;
  averageQuality: number;
  mostUsedVoice: string;
  generationsToday: number;
}

interface PlaybackStats {
  totalPlaybacks: number;
  averagePlaybackLatency: number;
  totalListeningTime: number;
  mostPlayedAudio: string;
  playbacksToday: number;
}

interface CacheStats {
  cacheSize: number;
  maxCacheSize: number;
  cacheUtilization: number;
  cacheHitRate: number;
  cachedItems: number;
  oldestCacheItem: Date | null;
  newestCacheItem: Date | null;
}

interface UsageStats {
  activeModes: number;
  totalModes: number;
  customVoices: number;
  templates: number;
  queueLength: number;
  errorRate: number;
  userSatisfaction: number;
}

interface ErrorLog {
  id: string;
  error: string;
  context: string;
  timestamp: Date;
}

interface GenerationHistoryItem {
  id: string;
  generatedAt: Date;
  text: string;
  duration: number;
  voiceUsed: string;
  quality: number;
}

interface StoreExportData {
  modes: Record<string, VoiceSummaryMode>;
  customVoices: Record<string, CustomVoiceProfile>;
  templates: Record<string, ContentTemplate>;
  settings: {
    maxCacheSize: number;
  };
  exportedAt: Date;
  version: string;
}

// Selectors for optimized performance
export const selectCurrentMode = (state: VoiceSummaryModeStore) => 
  state.currentModeId ? state.modes[state.currentModeId] : null;

export const selectActiveModes = (state: VoiceSummaryModeStore) => 
  Object.values(state.modes).filter(mode => mode.isActive);

export const selectCurrentAudio = (state: VoiceSummaryModeStore) => 
  state.currentAudio;

export const selectIsPlaying = (state: VoiceSummaryModeStore) => 
  state.isPlaying;

export const selectQueueLength = (state: VoiceSummaryModeStore) => 
  state.audioQueue.length;

export const selectCacheUtilization = (state: VoiceSummaryModeStore) => 
  state.cacheSize / state.maxCacheSize;

export const selectPerformanceMetrics = (state: VoiceSummaryModeStore) => 
  state.performanceMetrics;

export const selectAvailableVoices = (state: VoiceSummaryModeStore) => 
  state.availableVoices;

export const selectCustomVoices = (state: VoiceSummaryModeStore) => 
  Object.values(state.customVoices);

export const selectTemplates = (state: VoiceSummaryModeStore) => 
  Object.values(state.templates);

export const selectGenerationProgress = (state: VoiceSummaryModeStore) => 
  state.generationProgress;

export const selectErrors = (state: VoiceSummaryModeStore) => 
  state.errors;

// Subscribe to store changes for debugging
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  useVoiceSummaryModeStore.subscribe(
    (state) => state.modes,
    (modes) => {
      console.log('Voice Summary Modes updated:', Object.keys(modes).length);
    }
  );
  
  useVoiceSummaryModeStore.subscribe(
    (state) => state.currentAudio,
    (audio) => {
      console.log('Current Audio changed:', audio?.id || 'none');
    }
  );
  
  useVoiceSummaryModeStore.subscribe(
    (state) => state.isPlaying,
    (isPlaying) => {
      console.log('Playback state changed:', isPlaying ? 'playing' : 'paused');
    }
  );
}

export default useVoiceSummaryModeStore; 