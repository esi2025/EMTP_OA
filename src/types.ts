export type Role = 'Admin' | 'Translator' | 'DeptManager' | 'User';

export interface ADUser {
  username: string;
  name: string;
  email: string;
  department: string;
  role: Role;
  active: boolean;
  lastActive: string;
}

export type TranslationEngineType = 'NLLB-200' | 'MarianMT' | 'LibreTranslate' | 'SeamlessM4T' | 'OpenAI' | 'DeepL' | 'Azure' | 'GoogleCloud';

export interface EngineConfig {
  id: TranslationEngineType;
  name: string;
  category: 'open-source' | 'commercial';
  enabled: boolean;
  priority: number;
}

export interface GlossaryTerm {
  id: string;
  term: string; // The primary word (usually Persian)
  definitionFa: string;
  definitionEn: string;
  definitionRu: string;
  equivalentEn: string;
  equivalentRu: string;
  status: 'approved' | 'pending';
  tags: string[];
  department: string;
  category: string;
  project: string;
  version: number;
  author: string;
  lastModified: string;
}

export interface TranslationRecord {
  id: string;
  sourceLang: string;
  targetLang: string;
  originalText: string;
  translatedText: string;
  engine: TranslationEngineType;
  timestamp: string;
  category?: string;
  department?: string;
  user: string;
  symbolsCount: number;
  durationMs: number;
  project?: string;
}

export interface FileJob {
  id: string;
  fileName: string;
  fileType: string;
  originalSize: string;
  status: 'pending' | 'processing' | 'done' | 'failed';
  progress: number;
  sourceLang: string;
  targetLang: string;
  resultText?: string;
  date: string;
}

export interface AnalyticsSummary {
  totalTranslations: number;
  totalCharacters: number;
  averageResponseTime: number;
  activeUsers: number;
  languagesDistribution: { name: string; value: number }[];
  volumeTimeline: { date: string; count: number; characters: number }[];
  engineUsage: { name: string; count: number }[];
  departmentUsage: { name: string; count: number }[];
  mostSearchedTerms: { term: string; count: number; category: string }[];
  systemLoad: { time: string; cpu: number; memory: number; requests: number }[];
  engineScores?: { name: string; average: number; votesCount: number }[];
}

export interface STTJob {
  id: string;
  fileName: string;
  duration: string;
  status: 'processing' | 'completed' | 'failed';
  transcription?: string;
  language?: string;
}
