
export interface TodoStep {
  id: string;
  text: string;
  completed: boolean;
}

export interface Todo {
  id: string;
  goal: string; // Renamed from task
  description?: string;
  dueDate?: string; // ISO string
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  voiceNoteId?: string; // Links to IndexedDB voiceNote
  steps?: TodoStep[];
  pinned?: boolean;
  calendarSynced?: boolean;
  category?: 'daily' | 'new-year';
  isLocked?: boolean;
  progress?: number; // 0-100
  parentGoalId?: string; // Links daily task to a yearly goal
  progressWeight?: number; // How much this specific task contributes to the parent goal (e.g., 2, 5, 10)
  targetValue?: number; // For quantitative goals (e.g., 1000)
  currentValue?: number; // For quantitative goals (e.g., 500)
  unit?: string; // For quantitative goals (e.g., "$", "followers")
}

export interface NeuralPattern {
  frequentLabels: string[];
  preferredLanguage: string;
  lastActionType: string;
  averageTaskComplexity: number;
}

export interface VoiceNote {
  id: string;
  audioBase64: string;
  transcription: string;
  timestamp: string;
  mimeType: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

export type GTDVoice = 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';
export type GTDTheme = 'venom' | 'neural-blue' | 'solar-gold' | 'pure-white' | 'deep-purple' | 'emerald-green' | 'crimson-red' | 'cosmic';
export type EyeColor = 'blue' | 'gold' | 'white' | 'purple' | 'green' | 'red';

export interface GTDSettings {
  language: string;
  languageLabel: string;
  voice: GTDVoice;
  theme: GTDTheme;
  eyeColor: EyeColor;
  reminderMinutes: number;
  learningEnabled: boolean;
  noiseSuppression: boolean; // New setting added
  autoScheduleEnabled: boolean; // New setting for AI auto-scheduling
}

export interface UserProfile {
  id?: string;
  name: string;
  email: string;
  focusArea: string;
  onboarded: boolean;
  consistencyScore?: number; // 0-100
}

export enum AppMode {
  Chat = 'chat',
  Voice = 'voice',
  List = 'list',
  Calendar = 'calendar',
  Notes = 'notes',
  Scan = 'scan',
  NewYear = 'new-year'
}

export enum ChatSessionMode {
  Insight = 'insight',
  Override = 'override'
}

export enum AppState {
  Landing = 'landing',
  Auth = 'auth',
  Onboarding = 'onboarding',
  Main = 'main'
}
