export interface GeneratedImage {
  id: string;
  url: string; // Base64 data URL
  prompt: string;
  timestamp: number;
  style: string;
  aspectRatio: string;
  isEdited?: boolean;
}

export interface StylePreset {
  id: string;
  label: string;
  promptModifier: string; // The text appended/injected into the template
  description: string;
}

export interface GenerationConfig {
  aspectRatio: string;
  styleId: string;
  cameraType: string;
  lighting: string;
  mood: string;
}

export type AppMode = 'generate' | 'edit';
