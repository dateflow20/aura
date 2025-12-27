
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

export type AuraVoice = 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';
export type AuraTheme = 'venom' | 'neural-blue' | 'solar-gold' | 'pure-white' | 'deep-purple' | 'emerald-green' | 'crimson-red' | 'cosmic';
export type EyeColor = 'blue' | 'gold' | 'white' | 'purple' | 'green' | 'red';

export interface AuraSettings {
  language: string;
  languageLabel: string;
  voice: AuraVoice;
  theme: AuraTheme;
  eyeColor: EyeColor;
  reminderMinutes: number;
  learningEnabled: boolean;
  noiseSuppression: boolean; // New setting added
}

export interface UserProfile {
  id?: string;
  name: string;
  email: string;
  focusArea: string;
  onboarded: boolean;
}

export enum AppMode {
  Chat = 'chat',
  Voice = 'voice',
  List = 'list',
  Calendar = 'calendar',
  Notes = 'notes',
  Scan = 'scan'
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
