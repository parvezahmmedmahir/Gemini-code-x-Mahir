
export enum ViewType {
  CHAT = 'CHAT',
  IMAGE = 'IMAGE',
}

export enum Sender {
  USER = 'USER',
  MODEL = 'MODEL',
}

export type Theme = 'light' | 'dark';

export type AIProvider = 'gemini' | 'deepseek' | 'openai';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

export interface Attachment {
  name: string;
  content: string; // Base64 or Text content
  path?: string; // For folder structure
  type?: 'image' | 'text' | 'file';
  mimeType?: string;
}

export interface ChatMessage {
  id: string;
  sender: Sender;
  text: string;
  timestamp: number;
  isError?: boolean;
  attachments?: Attachment[];
}

export interface ModelConfig {
  temperature: number;
  topK: number;
  topP: number;
  deepThinking: boolean; // "DeepSeek R1" style reasoning
}

export interface AppSettings {
  activeProvider: AIProvider;
  enableVibration: boolean;
  autoSaveInterval: number;
  githubToken?: string;
}

export interface StoredChatSession {
  id: string;
  userId: string; // Linked to specific user
  title: string;
  messages: ChatMessage[];
  config: ModelConfig;
  lastModified: number;
}

export interface GeneratedImage {
  id: string;
  prompt: string;
  dataUrl: string; // base64
  timestamp: number;
}

export interface ImageGenerationConfig {
  stylePreset: string;
  negativePrompt: string;
  aspectRatio: "1:1" | "16:9" | "3:4";
}

export interface UploadStatus {
  fileName: string;
  progress: number; // 0 to 100
  status: 'uploading' | 'completed' | 'error';
  errorMessage?: string;
}