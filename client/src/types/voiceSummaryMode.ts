// Block 98: Voice Summary Mode - Types
// Voice Synthesis, Text-to-Speech, and Audio Report Generation

export interface VoiceSummaryMode {
  id: string;
  userId: string;
  
  // Mode identification
  modeName: string;
  description: string;
  
  // Voice configuration
  voiceConfig: VoiceConfiguration;
  
  // Audio settings
  audioSettings: AudioSettings;
  
  // Summary configuration
  summaryConfig: SummaryConfiguration;
  
  // Accessibility features
  accessibilityFeatures: AccessibilityFeatures;
  
  // Synthesis preferences
  synthesisPreferences: SynthesisPreferences;
  
  // Content templates
  contentTemplates: ContentTemplate[];
  
  // Custom voice profiles
  customVoiceProfiles: CustomVoiceProfile[];
  
  // Audio generation history
  audioHistory: AudioGenerationHistory[];
  
  // Playback controls
  playbackControls: PlaybackControls;
  
  // Integration settings
  integrationSettings: IntegrationSettings;
  
  // Status
  isActive: boolean;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastUsed: Date;
}

export interface VoiceConfiguration {
  // Voice selection
  selectedVoice: VoiceProfile;
  fallbackVoices: VoiceProfile[];
  
  // Voice characteristics
  voiceGender: VoiceGender;
  voiceAge: VoiceAge;
  voiceAccent: VoiceAccent;
  voiceLanguage: VoiceLanguage;
  
  // Speech parameters
  speechRate: number; // 0.1 to 10.0
  speechPitch: number; // 0.0 to 2.0
  speechVolume: number; // 0.0 to 1.0
  
  // Pronunciation settings
  pronunciationRules: PronunciationRule[];
  customPhonetics: CustomPhonetic[];
  
  // Voice quality
  audioQuality: AudioQuality;
  compressionSettings: CompressionSettings;
  
  // Multi-language support
  multiLanguageSupport: MultiLanguageSupport;
  
  // Voice switching
  voiceSwitchingRules: VoiceSwitchingRule[];
}

export interface AudioSettings {
  // Audio format
  audioFormat: AudioFormat;
  sampleRate: number;
  bitRate: number;
  channels: number;
  
  // Audio processing
  audioProcessing: AudioProcessing;
  
  // Background audio
  backgroundAudio: BackgroundAudio;
  
  // Audio effects
  audioEffects: AudioEffect[];
  
  // Noise reduction
  noiseReduction: NoiseReduction;
  
  // Dynamic range
  dynamicRange: DynamicRange;
  
  // Spatial audio
  spatialAudio: SpatialAudio;
  
  // Cross-fade settings
  crossFadeSettings: CrossFadeSettings;
}

export interface SummaryConfiguration {
  // Summary types
  summaryTypes: SummaryType[];
  
  // Content categories
  contentCategories: ContentCategory[];
  
  // Summary length
  summaryLength: SummaryLength;
  
  // Detail level
  detailLevel: DetailLevel;
  
  // Update frequency
  updateFrequency: UpdateFrequency;
  
  // Data sources
  dataSources: DataSource[];
  
  // Filtering rules
  filteringRules: FilteringRule[];
  
  // Personalization
  personalization: PersonalizationSettings;
  
  // Context awareness
  contextAwareness: ContextAwareness;
  
  // Scheduling
  schedulingSettings: SchedulingSettings;
}

export interface AccessibilityFeatures {
  // Screen reader compatibility
  screenReaderSupport: ScreenReaderSupport;
  
  // Hearing impairment support
  hearingImpairmentSupport: HearingImpairmentSupport;
  
  // Visual impairment support
  visualImpairmentSupport: VisualImpairmentSupport;
  
  // Motor impairment support
  motorImpairmentSupport: MotorImpairmentSupport;
  
  // Cognitive support
  cognitiveSupport: CognitiveSupport;
  
  // Keyboard navigation
  keyboardNavigation: KeyboardNavigation;
  
  // Voice commands
  voiceCommands: VoiceCommand[];
  
  // Gesture control
  gestureControl: GestureControl;
  
  // Closed captions
  closedCaptions: ClosedCaptions;
  
  // Language translation
  languageTranslation: LanguageTranslation;
}

export interface SynthesisPreferences {
  // TTS engine
  ttsEngine: TTSEngine;
  
  // Neural voices
  neuralVoices: NeuralVoiceSettings;
  
  // Emotion synthesis
  emotionSynthesis: EmotionSynthesis;
  
  // Prosody control
  prosodyControl: ProsodyControl;
  
  // SSML support
  ssmlSupport: SSMLSupport;
  
  // Custom model training
  customModelTraining: CustomModelTraining;
  
  // Voice cloning
  voiceCloning: VoiceCloning;
  
  // Real-time synthesis
  realTimeSynthesis: RealTimeSynthesis;
  
  // Batch processing
  batchProcessing: BatchProcessing;
}

export interface ContentTemplate {
  id: string;
  name: string;
  description: string;
  
  // Template structure
  templateStructure: TemplateStructure;
  
  // Content sections
  contentSections: ContentSection[];
  
  // Dynamic content
  dynamicContent: DynamicContent[];
  
  // Conditional logic
  conditionalLogic: ConditionalLogic[];
  
  // Personalization tokens
  personalizationTokens: PersonalizationToken[];
  
  // Voice instructions
  voiceInstructions: VoiceInstruction[];
  
  // Timing controls
  timingControls: TimingControl[];
  
  // Template variables
  templateVariables: Record<string, any>;
  
  // Usage statistics
  usageStatistics: TemplateUsageStatistics;
}

export interface CustomVoiceProfile {
  id: string;
  name: string;
  description: string;
  
  // Voice characteristics
  voiceCharacteristics: VoiceCharacteristics;
  
  // Training data
  trainingData: TrainingData;
  
  // Model information
  modelInformation: ModelInformation;
  
  // Quality metrics
  qualityMetrics: VoiceQualityMetrics;
  
  // Usage permissions
  usagePermissions: UsagePermissions;
  
  // Licensing
  licensing: VoiceLicensing;
  
  // Custom parameters
  customParameters: CustomVoiceParameters;
  
  // Validation status
  validationStatus: ValidationStatus;
}

export interface AudioGenerationHistory {
  id: string;
  generationId: string;
  
  // Generation metadata
  generatedAt: Date;
  generationType: GenerationType;
  contentType: ContentType;
  
  // Input details
  inputText: string;
  inputLength: number;
  
  // Generation parameters
  voiceUsed: string;
  settingsUsed: VoiceConfiguration;
  
  // Output details
  outputDuration: number;
  outputSize: number;
  outputFormat: string;
  outputQuality: number;
  
  // Performance metrics
  generationTime: number;
  processingTime: number;
  
  // Quality assessment
  qualityScore: number;
  qualityMetrics: GenerationQualityMetrics;
  
  // User feedback
  userRating: number;
  userFeedback: string;
  
  // Error information
  errors: GenerationError[];
  warnings: GenerationWarning[];
  
  // Usage tracking
  playCount: number;
  lastPlayed: Date;
}

export interface PlaybackControls {
  // Basic controls
  play: boolean;
  pause: boolean;
  stop: boolean;
  
  // Navigation
  skipForward: number; // seconds
  skipBackward: number; // seconds
  
  // Speed control
  playbackSpeed: number; // 0.25 to 4.0
  
  // Volume control
  masterVolume: number; // 0.0 to 1.0
  
  // Repeat settings
  repeatMode: RepeatMode;
  
  // Shuffle settings
  shuffleMode: boolean;
  
  // Bookmarks
  bookmarks: AudioBookmark[];
  
  // Playlist management
  playlistControls: PlaylistControls;
  
  // Smart controls
  smartControls: SmartControls;
  
  // Gesture controls
  gestureControls: GestureControls;
  
  // Voice controls
  voiceControls: VoiceControls;
}

export interface IntegrationSettings {
  // Platform integrations
  platformIntegrations: PlatformIntegration[];
  
  // API integrations
  apiIntegrations: APIIntegration[];
  
  // Third-party services
  thirdPartyServices: ThirdPartyService[];
  
  // Webhook settings
  webhookSettings: WebhookSettings;
  
  // Export settings
  exportSettings: ExportSettings;
  
  // Cloud sync
  cloudSync: CloudSyncSettings;
  
  // Device sync
  deviceSync: DeviceSyncSettings;
  
  // Offline capabilities
  offlineCapabilities: OfflineCapabilities;
}

// State and Hook Types
export interface VoiceSummaryModeState {
  modes: Record<string, VoiceSummaryMode>;
  currentModeId: string | null;
  
  // Audio generation state
  isGenerating: boolean;
  generationProgress: GenerationProgress | null;
  
  // Playback state
  isPlaying: boolean;
  currentAudio: AudioInstance | null;
  playbackPosition: number;
  
  // Queue management
  audioQueue: AudioQueueItem[];
  
  // Cache management
  audioCache: Record<string, CachedAudio>;
  cacheSize: number;
  maxCacheSize: number;
  
  // Error handling
  errors: Record<string, string>;
  
  // Performance metrics
  performanceMetrics: PerformanceMetrics;
}

export interface UseVoiceSummaryModeReturn {
  // Data
  modes: VoiceSummaryMode[];
  currentMode: VoiceSummaryMode | null;
  
  // Generation state
  isGenerating: boolean;
  generationProgress: GenerationProgress | null;
  
  // Playback state
  isPlaying: boolean;
  currentAudio: AudioInstance | null;
  playbackPosition: number;
  
  // Queue management
  audioQueue: AudioQueueItem[];
  
  // Mode operations
  createMode: (config: Omit<VoiceSummaryMode, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<VoiceSummaryMode>;
  updateMode: (id: string, updates: Partial<VoiceSummaryMode>) => Promise<VoiceSummaryMode>;
  deleteMode: (id: string) => Promise<void>;
  
  // Audio generation
  generateAudio: (text: string, modeId: string, options?: GenerationOptions) => Promise<AudioInstance>;
  generateSummary: (type: SummaryType, modeId: string, options?: SummaryOptions) => Promise<AudioInstance>;
  generateReport: (reportType: ReportType, modeId: string, options?: ReportOptions) => Promise<AudioInstance>;
  
  // Batch operations
  batchGenerateAudio: (requests: BatchGenerationRequest[]) => Promise<BatchGenerationResult>;
  
  // Playback operations
  playAudio: (audioId: string) => Promise<void>;
  pauseAudio: () => void;
  stopAudio: () => void;
  seekTo: (position: number) => void;
  
  // Queue operations
  addToQueue: (audio: AudioInstance) => void;
  removeFromQueue: (audioId: string) => void;
  reorderQueue: (audioIds: string[]) => void;
  clearQueue: () => void;
  
  // Voice operations
  getAvailableVoices: () => Promise<VoiceProfile[]>;
  previewVoice: (voiceId: string, sampleText: string) => Promise<AudioInstance>;
  createCustomVoice: (config: CustomVoiceConfig) => Promise<CustomVoiceProfile>;
  
  // Template operations
  createTemplate: (template: Omit<ContentTemplate, 'id'>) => Promise<ContentTemplate>;
  updateTemplate: (id: string, updates: Partial<ContentTemplate>) => Promise<ContentTemplate>;
  deleteTemplate: (id: string) => Promise<void>;
  
  // Accessibility operations
  enableAccessibilityFeature: (feature: string, modeId: string) => Promise<void>;
  configureAccessibility: (config: AccessibilityConfig) => Promise<void>;
  
  // Performance operations
  optimizeVoiceSettings: (modeId: string) => Promise<VoiceConfiguration>;
  analyzePerformance: (modeId: string) => Promise<PerformanceAnalysis>;
  
  // Export operations
  exportAudio: (audioId: string, format: ExportFormat) => Promise<ExportResult>;
  exportSettings: (modeId: string) => Promise<SettingsExport>;
  
  // Utility functions
  setCurrentMode: (modeId: string | null) => void;
  refreshData: () => Promise<void>;
  
  // Error handling
  error: string | null;
  clearError: () => void;
}

// Enums and Union Types
export type VoiceGender = 'male' | 'female' | 'neutral' | 'child';
export type VoiceAge = 'child' | 'young_adult' | 'adult' | 'elderly';
export type VoiceAccent = 'australian' | 'new_zealand' | 'british' | 'american' | 'canadian' | 'neutral';
export type VoiceLanguage = 'en-AU' | 'en-NZ' | 'en-GB' | 'en-US' | 'en-CA' | 'multi';

export type AudioFormat = 'mp3' | 'wav' | 'ogg' | 'flac' | 'aac' | 'webm';
export type AudioQuality = 'low' | 'medium' | 'high' | 'highest' | 'lossless';

export type SummaryType = 'portfolio' | 'performance' | 'risk' | 'news' | 'alerts' | 'recommendations' | 'compliance';
export type ContentCategory = 'financial' | 'technical' | 'news' | 'alerts' | 'reports' | 'education' | 'personal';
export type DetailLevel = 'brief' | 'standard' | 'detailed' | 'comprehensive';
export type SummaryLength = 'short' | 'medium' | 'long' | 'custom';
export type UpdateFrequency = 'real_time' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'on_demand';

export type TTSEngine = 'native' | 'azure' | 'google' | 'amazon' | 'elevenlabs' | 'custom';
export type GenerationType = 'text_to_speech' | 'summary' | 'report' | 'alert' | 'notification';
export type ContentType = 'text' | 'ssml' | 'markdown' | 'html' | 'json';

export type RepeatMode = 'none' | 'single' | 'all';
export type ExportFormat = 'mp3' | 'wav' | 'json' | 'transcript' | 'settings';

// Supporting Types
export interface VoiceProfile {
  id: string;
  name: string;
  displayName: string;
  gender: VoiceGender;
  age: VoiceAge;
  accent: VoiceAccent;
  language: VoiceLanguage;
  
  // Technical details
  sampleRate: number;
  bitRate: number;
  quality: AudioQuality;
  
  // Capabilities
  capabilities: VoiceCapabilities;
  
  // Pricing
  pricing: VoicePricing;
  
  // Availability
  availability: VoiceAvailability;
  
  // Samples
  sampleAudio: string[];
  
  // Metadata
  provider: string;
  version: string;
  license: string;
}

export interface VoiceCapabilities {
  neuralVoice: boolean;
  emotionSynthesis: boolean;
  ssmlSupport: boolean;
  customPronunciation: boolean;
  realTimeGeneration: boolean;
  voiceCloning: boolean;
  multiLanguage: boolean;
  customTraining: boolean;
}

export interface VoicePricing {
  model: 'free' | 'subscription' | 'pay_per_use' | 'enterprise';
  cost: number;
  currency: string;
  unit: string;
  limits: PricingLimits;
}

export interface PricingLimits {
  charactersPerMonth: number;
  requestsPerDay: number;
  concurrent: number;
  maxDuration: number;
}

export interface VoiceAvailability {
  regions: string[];
  platforms: string[];
  isAvailable: boolean;
  maintenanceWindows: MaintenanceWindow[];
}

export interface MaintenanceWindow {
  startTime: string;
  endTime: string;
  timezone: string;
  description: string;
}

export interface PronunciationRule {
  id: string;
  pattern: string;
  replacement: string;
  isRegex: boolean;
  caseSensitive: boolean;
  enabled: boolean;
}

export interface CustomPhonetic {
  word: string;
  pronunciation: string;
  phonemeSet: string;
  language: string;
}

export interface CompressionSettings {
  algorithm: string;
  quality: number;
  bitRate: number;
  variableBitRate: boolean;
}

export interface MultiLanguageSupport {
  enabled: boolean;
  languages: string[];
  autoDetection: boolean;
  translationEnabled: boolean;
  translationServices: string[];
}

export interface VoiceSwitchingRule {
  id: string;
  condition: string;
  targetVoice: string;
  priority: number;
  enabled: boolean;
}

export interface AudioProcessing {
  normalization: boolean;
  noiseReduction: boolean;
  echoCancellation: boolean;
  compressor: CompressorSettings;
  equalizer: EqualizerSettings;
  limiter: LimiterSettings;
}

export interface CompressorSettings {
  enabled: boolean;
  threshold: number;
  ratio: number;
  attack: number;
  release: number;
}

export interface EqualizerSettings {
  enabled: boolean;
  presets: string[];
  customBands: EqualizerBand[];
}

export interface EqualizerBand {
  frequency: number;
  gain: number;
  q: number;
}

export interface LimiterSettings {
  enabled: boolean;
  threshold: number;
  lookahead: number;
  release: number;
}

export interface BackgroundAudio {
  enabled: boolean;
  audioFile: string;
  volume: number;
  fadeIn: number;
  fadeOut: number;
  loop: boolean;
}

export interface AudioEffect {
  id: string;
  name: string;
  type: string;
  parameters: Record<string, any>;
  enabled: boolean;
  order: number;
}

export interface NoiseReduction {
  enabled: boolean;
  algorithm: string;
  aggressiveness: number;
  preserveMusic: boolean;
}

export interface DynamicRange {
  enabled: boolean;
  targetLUFS: number;
  maxPeak: number;
  gating: boolean;
}

export interface SpatialAudio {
  enabled: boolean;
  format: string;
  channelLayout: string;
  binauralProcessing: boolean;
}

export interface CrossFadeSettings {
  enabled: boolean;
  duration: number;
  curve: string;
}

export interface DataSource {
  id: string;
  name: string;
  type: string;
  endpoint: string;
  apiKey?: string;
  refreshRate: number;
  enabled: boolean;
}

export interface FilteringRule {
  id: string;
  name: string;
  condition: string;
  action: string;
  priority: number;
  enabled: boolean;
}

export interface PersonalizationSettings {
  enabled: boolean;
  userPreferences: Record<string, any>;
  learningEnabled: boolean;
  adaptiveContent: boolean;
  contextualAdjustments: boolean;
}

export interface ContextAwareness {
  enabled: boolean;
  timeOfDay: boolean;
  location: boolean;
  userActivity: boolean;
  marketConditions: boolean;
  deviceCapabilities: boolean;
}

export interface SchedulingSettings {
  enabled: boolean;
  schedules: Schedule[];
  timezone: string;
  automaticUpdates: boolean;
}

export interface Schedule {
  id: string;
  name: string;
  cronExpression: string;
  summaryType: SummaryType;
  enabled: boolean;
  lastRun: Date;
  nextRun: Date;
}

export interface ScreenReaderSupport {
  enabled: boolean;
  compatibleReaders: string[];
  ariaLabels: boolean;
  skipLinks: boolean;
  headingStructure: boolean;
}

export interface HearingImpairmentSupport {
  enabled: boolean;
  closedCaptions: boolean;
  visualIndicators: boolean;
  hapticFeedback: boolean;
  signLanguage: boolean;
}

export interface VisualImpairmentSupport {
  enabled: boolean;
  highContrast: boolean;
  largeText: boolean;
  screenReader: boolean;
  brailleSupport: boolean;
}

export interface MotorImpairmentSupport {
  enabled: boolean;
  voiceControl: boolean;
  eyeTracking: boolean;
  switchControl: boolean;
  stickyKeys: boolean;
}

export interface CognitiveSupport {
  enabled: boolean;
  simplifiedInterface: boolean;
  slowedSpeech: boolean;
  repetition: boolean;
  explanations: boolean;
}

export interface KeyboardNavigation {
  enabled: boolean;
  shortcuts: KeyboardShortcut[];
  focusIndicators: boolean;
  tabOrder: boolean;
}

export interface KeyboardShortcut {
  id: string;
  key: string;
  modifiers: string[];
  action: string;
  description: string;
}

export interface VoiceCommand {
  id: string;
  phrase: string;
  action: string;
  parameters: Record<string, any>;
  enabled: boolean;
  confidence: number;
}

export interface GestureControl {
  enabled: boolean;
  gestures: Gesture[];
  sensitivity: number;
  calibration: GestureCalibration;
}

export interface Gesture {
  id: string;
  name: string;
  pattern: string;
  action: string;
  enabled: boolean;
}

export interface GestureCalibration {
  deviceOrientation: string;
  handedness: string;
  range: number;
  smoothing: number;
}

export interface ClosedCaptions {
  enabled: boolean;
  language: string;
  fontSize: number;
  fontFamily: string;
  backgroundColor: string;
  textColor: string;
  position: string;
}

export interface LanguageTranslation {
  enabled: boolean;
  sourceLanguage: string;
  targetLanguage: string;
  service: string;
  quality: string;
}

export interface NeuralVoiceSettings {
  enabled: boolean;
  modelVersion: string;
  quality: string;
  latency: string;
  customization: boolean;
}

export interface EmotionSynthesis {
  enabled: boolean;
  defaultEmotion: string;
  emotionIntensity: number;
  contextualEmotions: boolean;
  emotionMapping: Record<string, string>;
}

export interface ProsodyControl {
  enabled: boolean;
  rate: number;
  pitch: number;
  volume: number;
  emphasis: string;
  pauses: PauseControl[];
}

export interface PauseControl {
  type: string;
  duration: number;
  context: string;
}

export interface SSMLSupport {
  enabled: boolean;
  version: string;
  customTags: SSMLTag[];
  validation: boolean;
}

export interface SSMLTag {
  tag: string;
  attributes: string[];
  description: string;
}

export interface CustomModelTraining {
  enabled: boolean;
  trainingData: TrainingDataset[];
  modelType: string;
  trainingProgress: number;
  trainingStatus: string;
}

export interface TrainingDataset {
  id: string;
  name: string;
  audioFiles: string[];
  transcripts: string[];
  quality: number;
  size: number;
}

export interface VoiceCloning {
  enabled: boolean;
  sourceAudio: string[];
  cloneQuality: number;
  trainingTime: number;
  cloneStatus: string;
}

export interface RealTimeSynthesis {
  enabled: boolean;
  latency: number;
  streaming: boolean;
  buffering: BufferingSettings;
}

export interface BufferingSettings {
  preBuffer: number;
  targetBuffer: number;
  maxBuffer: number;
  adaptiveBuffering: boolean;
}

export interface BatchProcessing {
  enabled: boolean;
  batchSize: number;
  concurrency: number;
  priority: string;
  scheduling: BatchScheduling;
}

export interface BatchScheduling {
  enabled: boolean;
  schedule: string;
  retryPolicy: RetryPolicy;
}

export interface RetryPolicy {
  maxRetries: number;
  backoffStrategy: string;
  timeout: number;
}

export interface TemplateStructure {
  sections: TemplateSection[];
  variables: TemplateVariable[];
  conditions: TemplateCondition[];
  formatting: TemplateFormatting;
}

export interface TemplateSection {
  id: string;
  name: string;
  type: string;
  content: string;
  optional: boolean;
  order: number;
}

export interface TemplateVariable {
  name: string;
  type: string;
  defaultValue: any;
  validation: ValidationRule[];
}

export interface ValidationRule {
  type: string;
  rule: string;
  message: string;
}

export interface TemplateCondition {
  id: string;
  condition: string;
  action: string;
  priority: number;
}

export interface TemplateFormatting {
  dateFormat: string;
  numberFormat: string;
  currencyFormat: string;
  percentFormat: string;
}

export interface ContentSection {
  id: string;
  name: string;
  type: string;
  content: string;
  voiceInstructions: string;
  timing: TimingSettings;
  enabled: boolean;
}

export interface TimingSettings {
  pause: number;
  speed: number;
  emphasis: string;
  volume: number;
}

export interface DynamicContent {
  id: string;
  name: string;
  source: string;
  query: string;
  refreshRate: number;
  formatting: ContentFormatting;
}

export interface ContentFormatting {
  template: string;
  variables: Record<string, any>;
  filters: ContentFilter[];
}

export interface ContentFilter {
  type: string;
  parameters: Record<string, any>;
}

export interface ConditionalLogic {
  id: string;
  condition: string;
  trueContent: string;
  falseContent: string;
  priority: number;
}

export interface PersonalizationToken {
  token: string;
  value: string;
  type: string;
  source: string;
}

export interface VoiceInstruction {
  id: string;
  instruction: string;
  type: string;
  parameters: Record<string, any>;
  scope: string;
}

export interface TimingControl {
  id: string;
  type: string;
  duration: number;
  trigger: string;
  enabled: boolean;
}

export interface TemplateUsageStatistics {
  usageCount: number;
  lastUsed: Date;
  averageGenerationTime: number;
  averageRating: number;
  errorRate: number;
}

export interface VoiceCharacteristics {
  gender: VoiceGender;
  age: VoiceAge;
  accent: VoiceAccent;
  language: VoiceLanguage;
  pitch: number;
  speed: number;
  volume: number;
  emotion: string;
  style: string;
}

export interface TrainingData {
  audioFiles: TrainingAudioFile[];
  transcripts: TrainingTranscript[];
  metadata: TrainingMetadata;
  quality: DataQuality;
}

export interface TrainingAudioFile {
  id: string;
  filePath: string;
  duration: number;
  sampleRate: number;
  bitRate: number;
  format: string;
  checksum: string;
}

export interface TrainingTranscript {
  id: string;
  audioId: string;
  text: string;
  timestamps: TimestampData[];
  confidence: number;
}

export interface TimestampData {
  word: string;
  start: number;
  end: number;
  confidence: number;
}

export interface TrainingMetadata {
  speaker: SpeakerInfo;
  recording: RecordingInfo;
  annotation: AnnotationInfo;
}

export interface SpeakerInfo {
  id: string;
  name: string;
  gender: string;
  age: number;
  accent: string;
  language: string;
}

export interface RecordingInfo {
  device: string;
  environment: string;
  quality: string;
  date: Date;
  duration: number;
}

export interface AnnotationInfo {
  annotator: string;
  date: Date;
  quality: number;
  verified: boolean;
}

export interface DataQuality {
  overallScore: number;
  audioQuality: number;
  transcriptQuality: number;
  consistency: number;
  completeness: number;
}

export interface ModelInformation {
  modelId: string;
  modelType: string;
  architecture: string;
  parameters: number;
  trainingDuration: number;
  version: string;
  checksum: string;
}

export interface VoiceQualityMetrics {
  naturalness: number;
  intelligibility: number;
  similarity: number;
  consistency: number;
  stability: number;
  overallScore: number;
}

export interface UsagePermissions {
  commercial: boolean;
  personal: boolean;
  modification: boolean;
  redistribution: boolean;
  attribution: boolean;
}

export interface VoiceLicensing {
  license: string;
  terms: string;
  cost: number;
  duration: number;
  restrictions: string[];
}

export interface CustomVoiceParameters {
  parameters: Record<string, any>;
  ranges: Record<string, [number, number]>;
  presets: VoicePreset[];
}

export interface VoicePreset {
  id: string;
  name: string;
  parameters: Record<string, any>;
  description: string;
}

export interface ValidationStatus {
  isValid: boolean;
  validationDate: Date;
  issues: ValidationIssue[];
  score: number;
}

export interface ValidationIssue {
  type: string;
  severity: string;
  message: string;
  suggestion: string;
}

export interface GenerationProgress {
  stage: string;
  progress: number;
  estimatedTimeRemaining: number;
  currentOperation: string;
  stageProgress: StageProgress[];
}

export interface StageProgress {
  stage: string;
  progress: number;
  completed: boolean;
  duration: number;
}

export interface AudioInstance {
  id: string;
  generationId: string;
  text: string;
  audioUrl: string;
  audioBlob?: Blob;
  
  // Metadata
  duration: number;
  fileSize: number;
  format: string;
  
  // Generation info
  voiceUsed: string;
  settings: VoiceConfiguration;
  generatedAt: Date;
  
  // Quality metrics
  quality: number;
  bitRate: number;
  sampleRate: number;
  
  // Status
  status: string;
  
  // Playback info
  playCount: number;
  lastPlayed: Date;
  
  // Bookmarks
  bookmarks: AudioBookmark[];
  
  // Transcript
  transcript: TranscriptSegment[];
}

export interface AudioBookmark {
  id: string;
  name: string;
  position: number;
  description: string;
  createdAt: Date;
}

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
  confidence: number;
  speaker?: string;
}

export interface AudioQueueItem {
  id: string;
  audioId: string;
  position: number;
  autoPlay: boolean;
  repeat: boolean;
  crossFade: boolean;
}

export interface CachedAudio {
  audioId: string;
  audioBlob: Blob;
  metadata: AudioMetadata;
  cachedAt: Date;
  lastAccessed: Date;
  accessCount: number;
}

export interface AudioMetadata {
  duration: number;
  fileSize: number;
  format: string;
  bitRate: number;
  sampleRate: number;
  channels: number;
}

export interface PerformanceMetrics {
  generationTime: number;
  playbackLatency: number;
  cacheHitRate: number;
  errorRate: number;
  userSatisfaction: number;
}

export interface GenerationOptions {
  voiceId?: string;
  speed?: number;
  pitch?: number;
  volume?: number;
  format?: AudioFormat;
  quality?: AudioQuality;
  effects?: AudioEffect[];
  background?: BackgroundAudio;
  customSettings?: Record<string, any>;
}

export interface SummaryOptions {
  length?: SummaryLength;
  detail?: DetailLevel;
  categories?: ContentCategory[];
  filters?: FilteringRule[];
  personalization?: boolean;
  context?: Record<string, any>;
}

export interface ReportOptions {
  format?: string;
  sections?: string[];
  charts?: boolean;
  data?: boolean;
  customization?: Record<string, any>;
}

export interface BatchGenerationRequest {
  id: string;
  text: string;
  modeId: string;
  options?: GenerationOptions;
  priority?: number;
}

export interface BatchGenerationResult {
  requestId: string;
  results: BatchGenerationItem[];
  summary: BatchSummary;
  errors: BatchError[];
}

export interface BatchGenerationItem {
  requestId: string;
  audioInstance: AudioInstance;
  status: string;
  processingTime: number;
  quality: number;
}

export interface BatchSummary {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalProcessingTime: number;
  averageQuality: number;
}

export interface BatchError {
  requestId: string;
  error: string;
  timestamp: Date;
}

export interface CustomVoiceConfig {
  name: string;
  description: string;
  characteristics: VoiceCharacteristics;
  trainingData: TrainingData;
  parameters: CustomVoiceParameters;
}

export interface AccessibilityConfig {
  features: string[];
  settings: Record<string, any>;
  preferences: Record<string, any>;
}

export interface PerformanceAnalysis {
  metrics: PerformanceMetrics;
  recommendations: string[];
  optimizations: OptimizationSuggestion[];
  trends: PerformanceTrend[];
}

export interface OptimizationSuggestion {
  type: string;
  description: string;
  impact: string;
  effort: string;
  priority: number;
}

export interface PerformanceTrend {
  metric: string;
  trend: string;
  change: number;
  period: string;
}

export interface ExportResult {
  exportId: string;
  format: ExportFormat;
  fileUrl: string;
  fileSize: number;
  exportedAt: Date;
  expiresAt: Date;
}

export interface SettingsExport {
  mode: VoiceSummaryMode;
  templates: ContentTemplate[];
  customVoices: CustomVoiceProfile[];
  exportedAt: Date;
  version: string;
}

export interface SmartControls {
  enabled: boolean;
  contextualSuggestions: boolean;
  adaptiveInterface: boolean;
  predictiveActions: boolean;
  learningEnabled: boolean;
}

export interface GestureControls {
  enabled: boolean;
  gestures: Gesture[];
  sensitivity: number;
  calibration: GestureCalibration;
}

export interface VoiceControls {
  enabled: boolean;
  commands: VoiceCommand[];
  language: string;
  sensitivity: number;
  confirmationRequired: boolean;
}

export interface PlaylistControls {
  enabled: boolean;
  autoQueue: boolean;
  smartShuffle: boolean;
  dynamicPlaylists: boolean;
  playlistSuggestions: boolean;
}

export interface PlatformIntegration {
  platform: string;
  enabled: boolean;
  configuration: Record<string, any>;
  permissions: string[];
  status: string;
}

export interface APIIntegration {
  apiName: string;
  apiVersion: string;
  endpoint: string;
  authentication: AuthenticationConfig;
  rateLimits: RateLimits;
  enabled: boolean;
}

export interface AuthenticationConfig {
  type: string;
  credentials: Record<string, any>;
  refreshToken?: string;
  expiresAt?: Date;
}

export interface RateLimits {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  concurrentRequests: number;
}

export interface ThirdPartyService {
  serviceName: string;
  serviceType: string;
  configuration: Record<string, any>;
  enabled: boolean;
  status: string;
}

export interface WebhookSettings {
  enabled: boolean;
  webhooks: WebhookConfig[];
  security: WebhookSecurity;
}

export interface WebhookConfig {
  id: string;
  url: string;
  events: string[];
  headers: Record<string, string>;
  enabled: boolean;
}

export interface WebhookSecurity {
  secretKey: string;
  signature: string;
  encryption: boolean;
  verification: boolean;
}

export interface ExportSettings {
  formats: ExportFormat[];
  destinations: ExportDestination[];
  scheduling: ExportScheduling;
  compression: CompressionSettings;
}

export interface ExportDestination {
  type: string;
  configuration: Record<string, any>;
  enabled: boolean;
}

export interface ExportScheduling {
  enabled: boolean;
  schedule: string;
  retention: number;
  cleanup: boolean;
}

export interface CloudSyncSettings {
  enabled: boolean;
  provider: string;
  configuration: Record<string, any>;
  syncFrequency: string;
  conflictResolution: string;
}

export interface DeviceSyncSettings {
  enabled: boolean;
  devices: SyncDevice[];
  syncItems: string[];
  conflictResolution: string;
}

export interface SyncDevice {
  id: string;
  name: string;
  type: string;
  status: string;
  lastSync: Date;
}

export interface OfflineCapabilities {
  enabled: boolean;
  cacheSize: number;
  voiceDownloads: boolean;
  offlineGeneration: boolean;
  syncOnReconnect: boolean;
}

export interface GenerationQualityMetrics {
  overallScore: number;
  audioQuality: number;
  speechClarity: number;
  naturalness: number;
  consistency: number;
  technicalQuality: number;
}

export interface GenerationError {
  type: string;
  message: string;
  timestamp: Date;
  severity: string;
}

export interface GenerationWarning {
  type: string;
  message: string;
  timestamp: Date;
  recommendation: string;
}

export default VoiceSummaryMode; 