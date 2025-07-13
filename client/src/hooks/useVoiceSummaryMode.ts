// Block 98: Voice Summary Mode - Hook
// React Hook for Voice Synthesis and Audio Management

import { useState, useEffect, useCallback, useRef } from 'react';
import { VoiceSummaryModeEngine } from '../engines/VoiceSummaryModeEngine';
import {
  VoiceSummaryMode,
  AudioInstance,
  GenerationOptions,
  SummaryOptions,
  ReportOptions,
  BatchGenerationRequest,
  BatchGenerationResult,
  VoiceProfile,
  CustomVoiceProfile,
  CustomVoiceConfig,
  ContentTemplate,
  GenerationProgress,
  PerformanceAnalysis,
  ExportResult,
  SettingsExport,
  SummaryType,
  ReportType,
  ExportFormat,
  UseVoiceSummaryModeReturn,
  AudioQueueItem
} from '../types/voiceSummaryMode';

export const useVoiceSummaryMode = (): UseVoiceSummaryModeReturn => {
  // State management
  const [modes, setModes] = useState<VoiceSummaryMode[]>([]);
  const [currentMode, setCurrentMode] = useState<VoiceSummaryMode | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<AudioInstance | null>(null);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [audioQueue, setAudioQueue] = useState<AudioQueueItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Refs for audio management and cleanup
  const engineRef = useRef<VoiceSummaryModeEngine | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const playbackIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // Available voices and templates
  const [availableVoices, setAvailableVoices] = useState<VoiceProfile[]>([]);
  const [customVoices, setCustomVoices] = useState<CustomVoiceProfile[]>([]);
  const [templates, setTemplates] = useState<ContentTemplate[]>([]);

  // Initialize engine and load data
  useEffect(() => {
    initializeEngine();
    
    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, []);

  // Initialize audio context and playback management
  useEffect(() => {
    initializeAudioContext();
    
    return () => {
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current = null;
      }
    };
  }, []);

  // Initialize engine
  const initializeEngine = useCallback(async () => {
    try {
      setError(null);
      
      engineRef.current = VoiceSummaryModeEngine.getInstance();
      
      // Load existing modes
      const existingModes = engineRef.current.getModes();
      if (mountedRef.current) {
        setModes(existingModes);
        
        // Set current mode if there's one
        if (existingModes.length > 0) {
          setCurrentMode(existingModes[0]);
        }
      }
      
      // Load available voices
      const voices = await engineRef.current.getAvailableVoices();
      if (mountedRef.current) {
        setAvailableVoices(voices);
      }
      
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to initialize voice engine');
      }
    }
  }, []);

  // Initialize audio context
  const initializeAudioContext = useCallback(() => {
    if (!audioElementRef.current) {
      audioElementRef.current = new Audio();
      
      // Set up event listeners
      audioElementRef.current.addEventListener('loadstart', () => {
        if (mountedRef.current) {
          setIsPlaying(false);
        }
      });
      
      audioElementRef.current.addEventListener('canplay', () => {
        if (mountedRef.current) {
          console.log('Audio ready to play');
        }
      });
      
      audioElementRef.current.addEventListener('play', () => {
        if (mountedRef.current) {
          setIsPlaying(true);
          startPlaybackTracking();
        }
      });
      
      audioElementRef.current.addEventListener('pause', () => {
        if (mountedRef.current) {
          setIsPlaying(false);
          stopPlaybackTracking();
        }
      });
      
      audioElementRef.current.addEventListener('ended', () => {
        if (mountedRef.current) {
          setIsPlaying(false);
          setPlaybackPosition(0);
          stopPlaybackTracking();
          handleAudioEnded();
        }
      });
      
      audioElementRef.current.addEventListener('timeupdate', () => {
        if (mountedRef.current && audioElementRef.current) {
          setPlaybackPosition(audioElementRef.current.currentTime);
        }
      });
      
      audioElementRef.current.addEventListener('error', (e) => {
        if (mountedRef.current) {
          setError('Audio playback error');
          setIsPlaying(false);
        }
      });
    }
  }, []);

  // Playback tracking
  const startPlaybackTracking = useCallback(() => {
    if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current);
    }
    
    playbackIntervalRef.current = setInterval(() => {
      if (audioElementRef.current && mountedRef.current) {
        setPlaybackPosition(audioElementRef.current.currentTime);
      }
    }, 100);
  }, []);

  const stopPlaybackTracking = useCallback(() => {
    if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current);
      playbackIntervalRef.current = null;
    }
  }, []);

  // Handle audio ended
  const handleAudioEnded = useCallback(() => {
    // Auto-play next item in queue
    if (audioQueue.length > 0) {
      const nextItem = audioQueue[0];
      if (nextItem.autoPlay) {
        setAudioQueue(prev => prev.slice(1));
        // Load next audio - implementation would be more complex in real app
      }
    }
  }, [audioQueue]);

  // Cleanup
  const cleanup = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    
    if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current);
      playbackIntervalRef.current = null;
    }
  }, []);

  // Mode Operations
  const createMode = useCallback(async (config: Omit<VoiceSummaryMode, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<VoiceSummaryMode> => {
    if (!engineRef.current) {
      throw new Error('Engine not initialized');
    }

    try {
      setError(null);
      
      const newMode = engineRef.current.createMode(config);
      
      if (mountedRef.current) {
        setModes(prevModes => [...prevModes, newMode]);
        
        // Set as current mode if it's the first one
        if (modes.length === 0) {
          setCurrentMode(newMode);
        }
      }
      
      return newMode;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create mode';
      if (mountedRef.current) {
        setError(errorMessage);
      }
      throw new Error(errorMessage);
    }
  }, [modes.length]);

  const updateMode = useCallback(async (id: string, updates: Partial<VoiceSummaryMode>): Promise<VoiceSummaryMode> => {
    if (!engineRef.current) {
      throw new Error('Engine not initialized');
    }

    try {
      setError(null);
      
      const updatedMode = engineRef.current.updateMode(id, updates);
      
      if (mountedRef.current) {
        setModes(prevModes => prevModes.map(mode => 
          mode.id === id ? updatedMode : mode
        ));
        
        // Update current mode if it's the one being updated
        if (currentMode?.id === id) {
          setCurrentMode(updatedMode);
        }
      }
      
      return updatedMode;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update mode';
      if (mountedRef.current) {
        setError(errorMessage);
      }
      throw new Error(errorMessage);
    }
  }, [currentMode]);

  const deleteMode = useCallback(async (id: string): Promise<void> => {
    if (!engineRef.current) {
      throw new Error('Engine not initialized');
    }

    try {
      setError(null);
      
      engineRef.current.deleteMode(id);
      
      if (mountedRef.current) {
        setModes(prevModes => prevModes.filter(mode => mode.id !== id));
        
        // Clear current mode if it's the one being deleted
        if (currentMode?.id === id) {
          const remainingModes = modes.filter(mode => mode.id !== id);
          if (remainingModes.length > 0) {
            setCurrentMode(remainingModes[0]);
          } else {
            setCurrentMode(null);
          }
        }
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete mode';
      if (mountedRef.current) {
        setError(errorMessage);
      }
      throw new Error(errorMessage);
    }
  }, [currentMode, modes]);

  // Audio Generation
  const generateAudio = useCallback(async (text: string, modeId: string, options: GenerationOptions = {}): Promise<AudioInstance> => {
    if (!engineRef.current) {
      throw new Error('Engine not initialized');
    }

    try {
      setIsGenerating(true);
      setError(null);
      
      // Start progress tracking
      startProgressTracking();
      
      const audioInstance = await engineRef.current.generateAudio(text, modeId, options);
      
      if (mountedRef.current) {
        setCurrentAudio(audioInstance);
      }
      
      return audioInstance;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate audio';
      if (mountedRef.current) {
        setError(errorMessage);
      }
      throw new Error(errorMessage);
    } finally {
      if (mountedRef.current) {
        setIsGenerating(false);
        setGenerationProgress(null);
        stopProgressTracking();
      }
    }
  }, []);

  const generateSummary = useCallback(async (type: SummaryType, modeId: string, options: SummaryOptions = {}): Promise<AudioInstance> => {
    if (!engineRef.current) {
      throw new Error('Engine not initialized');
    }

    try {
      setIsGenerating(true);
      setError(null);
      
      startProgressTracking();
      
      const audioInstance = await engineRef.current.generateSummary(type, modeId, options);
      
      if (mountedRef.current) {
        setCurrentAudio(audioInstance);
      }
      
      return audioInstance;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate summary';
      if (mountedRef.current) {
        setError(errorMessage);
      }
      throw new Error(errorMessage);
    } finally {
      if (mountedRef.current) {
        setIsGenerating(false);
        setGenerationProgress(null);
        stopProgressTracking();
      }
    }
  }, []);

  const generateReport = useCallback(async (reportType: ReportType, modeId: string, options: ReportOptions = {}): Promise<AudioInstance> => {
    if (!engineRef.current) {
      throw new Error('Engine not initialized');
    }

    try {
      setIsGenerating(true);
      setError(null);
      
      startProgressTracking();
      
      const audioInstance = await engineRef.current.generateReport(reportType, modeId, options);
      
      if (mountedRef.current) {
        setCurrentAudio(audioInstance);
      }
      
      return audioInstance;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate report';
      if (mountedRef.current) {
        setError(errorMessage);
      }
      throw new Error(errorMessage);
    } finally {
      if (mountedRef.current) {
        setIsGenerating(false);
        setGenerationProgress(null);
        stopProgressTracking();
      }
    }
  }, []);

  // Batch Operations
  const batchGenerateAudio = useCallback(async (requests: BatchGenerationRequest[]): Promise<BatchGenerationResult> => {
    if (!engineRef.current) {
      throw new Error('Engine not initialized');
    }

    try {
      setIsGenerating(true);
      setError(null);
      
      const result = await engineRef.current.batchGenerateAudio(requests);
      
      return result;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to batch generate audio';
      if (mountedRef.current) {
        setError(errorMessage);
      }
      throw new Error(errorMessage);
    } finally {
      if (mountedRef.current) {
        setIsGenerating(false);
      }
    }
  }, []);

  // Playback Operations
  const playAudio = useCallback(async (audioId: string): Promise<void> => {
    if (!audioElementRef.current) {
      throw new Error('Audio context not initialized');
    }

    try {
      setError(null);
      
      // Find audio instance (in real app, this would fetch from cache or generate)
      const audioInstance = currentAudio?.id === audioId ? currentAudio : null;
      
      if (!audioInstance) {
        throw new Error('Audio instance not found');
      }
      
      // Load audio
      audioElementRef.current.src = audioInstance.audioUrl;
      audioElementRef.current.load();
      
      // Play when ready
      await audioElementRef.current.play();
      
      if (mountedRef.current) {
        setCurrentAudio(audioInstance);
        setIsPlaying(true);
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to play audio';
      if (mountedRef.current) {
        setError(errorMessage);
      }
      throw new Error(errorMessage);
    }
  }, [currentAudio]);

  const pauseAudio = useCallback(() => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const stopAudio = useCallback(() => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.currentTime = 0;
      setIsPlaying(false);
      setPlaybackPosition(0);
    }
  }, []);

  const seekTo = useCallback((position: number) => {
    if (audioElementRef.current) {
      audioElementRef.current.currentTime = position;
      setPlaybackPosition(position);
    }
  }, []);

  // Queue Operations
  const addToQueue = useCallback((audio: AudioInstance) => {
    const queueItem: AudioQueueItem = {
      id: `queue_${Date.now()}`,
      audioId: audio.id,
      position: audioQueue.length,
      autoPlay: true,
      repeat: false,
      crossFade: false
    };
    
    setAudioQueue(prev => [...prev, queueItem]);
  }, [audioQueue.length]);

  const removeFromQueue = useCallback((audioId: string) => {
    setAudioQueue(prev => prev.filter(item => item.audioId !== audioId));
  }, []);

  const reorderQueue = useCallback((audioIds: string[]) => {
    setAudioQueue(prev => {
      const orderedItems = audioIds.map((audioId, index) => {
        const item = prev.find(i => i.audioId === audioId);
        return item ? { ...item, position: index } : null;
      }).filter(Boolean) as AudioQueueItem[];
      
      return orderedItems;
    });
  }, []);

  const clearQueue = useCallback(() => {
    setAudioQueue([]);
  }, []);

  // Voice Operations
  const getAvailableVoices = useCallback(async (): Promise<VoiceProfile[]> => {
    if (!engineRef.current) {
      throw new Error('Engine not initialized');
    }

    try {
      setError(null);
      
      const voices = await engineRef.current.getAvailableVoices();
      
      if (mountedRef.current) {
        setAvailableVoices(voices);
      }
      
      return voices;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get available voices';
      if (mountedRef.current) {
        setError(errorMessage);
      }
      throw new Error(errorMessage);
    }
  }, []);

  const previewVoice = useCallback(async (voiceId: string, sampleText: string): Promise<AudioInstance> => {
    if (!engineRef.current) {
      throw new Error('Engine not initialized');
    }

    try {
      setError(null);
      
      const audioInstance = await engineRef.current.previewVoice(voiceId, sampleText);
      
      return audioInstance;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to preview voice';
      if (mountedRef.current) {
        setError(errorMessage);
      }
      throw new Error(errorMessage);
    }
  }, []);

  const createCustomVoice = useCallback(async (config: CustomVoiceConfig): Promise<CustomVoiceProfile> => {
    if (!engineRef.current) {
      throw new Error('Engine not initialized');
    }

    try {
      setError(null);
      
      const customVoice = await engineRef.current.createCustomVoice(config);
      
      if (mountedRef.current) {
        setCustomVoices(prev => [...prev, customVoice]);
      }
      
      return customVoice;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create custom voice';
      if (mountedRef.current) {
        setError(errorMessage);
      }
      throw new Error(errorMessage);
    }
  }, []);

  // Template Operations
  const createTemplate = useCallback(async (template: Omit<ContentTemplate, 'id'>): Promise<ContentTemplate> => {
    if (!engineRef.current) {
      throw new Error('Engine not initialized');
    }

    try {
      setError(null);
      
      const newTemplate = await engineRef.current.createTemplate(template);
      
      if (mountedRef.current) {
        setTemplates(prev => [...prev, newTemplate]);
      }
      
      return newTemplate;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create template';
      if (mountedRef.current) {
        setError(errorMessage);
      }
      throw new Error(errorMessage);
    }
  }, []);

  const updateTemplate = useCallback(async (id: string, updates: Partial<ContentTemplate>): Promise<ContentTemplate> => {
    if (!engineRef.current) {
      throw new Error('Engine not initialized');
    }

    try {
      setError(null);
      
      const updatedTemplate = await engineRef.current.updateTemplate(id, updates);
      
      if (mountedRef.current) {
        setTemplates(prev => prev.map(template => 
          template.id === id ? updatedTemplate : template
        ));
      }
      
      return updatedTemplate;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update template';
      if (mountedRef.current) {
        setError(errorMessage);
      }
      throw new Error(errorMessage);
    }
  }, []);

  const deleteTemplate = useCallback(async (id: string): Promise<void> => {
    if (!engineRef.current) {
      throw new Error('Engine not initialized');
    }

    try {
      setError(null);
      
      await engineRef.current.deleteTemplate(id);
      
      if (mountedRef.current) {
        setTemplates(prev => prev.filter(template => template.id !== id));
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete template';
      if (mountedRef.current) {
        setError(errorMessage);
      }
      throw new Error(errorMessage);
    }
  }, []);

  // Accessibility Operations
  const enableAccessibilityFeature = useCallback(async (feature: string, modeId: string): Promise<void> => {
    if (!currentMode || currentMode.id !== modeId) {
      throw new Error('Mode not found or not current');
    }

    try {
      setError(null);
      
      // Update accessibility features in the mode
      const updatedFeatures = {
        ...currentMode.accessibilityFeatures,
        [feature]: { enabled: true }
      };
      
      await updateMode(modeId, {
        accessibilityFeatures: updatedFeatures
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to enable accessibility feature';
      if (mountedRef.current) {
        setError(errorMessage);
      }
      throw new Error(errorMessage);
    }
  }, [currentMode, updateMode]);

  const configureAccessibility = useCallback(async (config: any): Promise<void> => {
    if (!currentMode) {
      throw new Error('No current mode selected');
    }

    try {
      setError(null);
      
      await updateMode(currentMode.id, {
        accessibilityFeatures: config
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to configure accessibility';
      if (mountedRef.current) {
        setError(errorMessage);
      }
      throw new Error(errorMessage);
    }
  }, [currentMode, updateMode]);

  // Performance Operations
  const optimizeVoiceSettings = useCallback(async (modeId: string): Promise<any> => {
    if (!engineRef.current) {
      throw new Error('Engine not initialized');
    }

    try {
      setError(null);
      
      const optimizedConfig = await engineRef.current.optimizeVoiceSettings(modeId);
      
      // Update mode with optimized settings
      await updateMode(modeId, { voiceConfig: optimizedConfig });
      
      return optimizedConfig;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to optimize voice settings';
      if (mountedRef.current) {
        setError(errorMessage);
      }
      throw new Error(errorMessage);
    }
  }, [updateMode]);

  const analyzePerformance = useCallback(async (modeId: string): Promise<PerformanceAnalysis> => {
    if (!engineRef.current) {
      throw new Error('Engine not initialized');
    }

    try {
      setError(null);
      
      const analysis = await engineRef.current.analyzePerformance(modeId);
      
      return analysis;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze performance';
      if (mountedRef.current) {
        setError(errorMessage);
      }
      throw new Error(errorMessage);
    }
  }, []);

  // Export Operations
  const exportAudio = useCallback(async (audioId: string, format: ExportFormat): Promise<ExportResult> => {
    if (!engineRef.current) {
      throw new Error('Engine not initialized');
    }

    try {
      setError(null);
      
      const result = await engineRef.current.exportAudio(audioId, format);
      
      return result;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export audio';
      if (mountedRef.current) {
        setError(errorMessage);
      }
      throw new Error(errorMessage);
    }
  }, []);

  const exportSettings = useCallback(async (modeId: string): Promise<SettingsExport> => {
    if (!engineRef.current) {
      throw new Error('Engine not initialized');
    }

    try {
      setError(null);
      
      const result = await engineRef.current.exportSettings(modeId);
      
      return result;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export settings';
      if (mountedRef.current) {
        setError(errorMessage);
      }
      throw new Error(errorMessage);
    }
  }, []);

  // Utility Functions
  const setCurrentModeById = useCallback((modeId: string | null) => {
    if (!modeId) {
      setCurrentMode(null);
      return;
    }

    const mode = modes.find(m => m.id === modeId);
    if (mode) {
      setCurrentMode(mode);
      
      // Update last used timestamp
      updateMode(modeId, { lastUsed: new Date() });
    }
  }, [modes, updateMode]);

  const refreshData = useCallback(async (): Promise<void> => {
    if (!engineRef.current) {
      throw new Error('Engine not initialized');
    }

    try {
      setError(null);
      
      // Refresh all modes
      const allModes = engineRef.current.getModes();
      if (mountedRef.current) {
        setModes(allModes);
      }
      
      // Refresh available voices
      const voices = await engineRef.current.getAvailableVoices();
      if (mountedRef.current) {
        setAvailableVoices(voices);
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh data';
      if (mountedRef.current) {
        setError(errorMessage);
      }
      throw new Error(errorMessage);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Progress tracking
  const startProgressTracking = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    
    progressIntervalRef.current = setInterval(() => {
      // Mock progress updates
      setGenerationProgress(prev => {
        if (!prev) {
          return {
            stage: 'Processing',
            progress: 10,
            estimatedTimeRemaining: 5000,
            currentOperation: 'Processing text',
            stageProgress: []
          };
        }
        
        const newProgress = Math.min(prev.progress + 5, 95);
        return {
          ...prev,
          progress: newProgress,
          estimatedTimeRemaining: Math.max(prev.estimatedTimeRemaining - 500, 500)
        };
      });
    }, 500);
  }, []);

  const stopProgressTracking = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  return {
    // Data
    modes,
    currentMode,
    
    // Generation state
    isGenerating,
    generationProgress,
    
    // Playback state
    isPlaying,
    currentAudio,
    playbackPosition,
    
    // Queue management
    audioQueue,
    
    // Mode operations
    createMode,
    updateMode,
    deleteMode,
    
    // Audio generation
    generateAudio,
    generateSummary,
    generateReport,
    
    // Batch operations
    batchGenerateAudio,
    
    // Playback operations
    playAudio,
    pauseAudio,
    stopAudio,
    seekTo,
    
    // Queue operations
    addToQueue,
    removeFromQueue,
    reorderQueue,
    clearQueue,
    
    // Voice operations
    getAvailableVoices,
    previewVoice,
    createCustomVoice,
    
    // Template operations
    createTemplate,
    updateTemplate,
    deleteTemplate,
    
    // Accessibility operations
    enableAccessibilityFeature,
    configureAccessibility,
    
    // Performance operations
    optimizeVoiceSettings,
    analyzePerformance,
    
    // Export operations
    exportAudio,
    exportSettings,
    
    // Utility functions
    setCurrentMode: setCurrentModeById,
    refreshData,
    
    // Error handling
    error,
    clearError
  };
};

export default useVoiceSummaryMode; 