export interface Medication {
  id: string;
  name: string;
  dosage: string;
  time: string; // HH:mm format
  history: string[]; // ISO Date strings of when it was taken
}

export interface SymptomLog {
  id: string;
  date: string; // ISO Date string
  painLevel: number; // 0-10
  urgency: 'baixa' | 'media' | 'alta';
  discomfort: 'nenhum' | 'leve' | 'moderado' | 'intenso';
  notes?: string;
}

export type ScreenName = 'dashboard' | 'medication' | 'symptoms' | 'education' | 'reports' | 'ai_assistant';

export interface UserStats {
  streakDays: number;
  lastLogin: string;
}

export interface EducationArticle {
  id: string;
  title: string;
  content: string;
  icon: 'info' | 'pill' | 'alert' | 'check';
}

export interface ForumReply {
  id: string;
  author: string;
  content: string;
  date: string; // ISO Date
}

export interface ForumPost {
  id: string;
  title: string;
  content: string;
  author: string;
  date: string; // ISO Date
  replies: ForumReply[];
  likes: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}