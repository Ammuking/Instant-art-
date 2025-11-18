import { StylePreset, GenerationConfig } from './types';
import { MonitorPlay, Palette, Camera, Zap, Image as ImageIcon, Brush } from 'lucide-react';

export const ASPECT_RATIOS = [
  { id: '1:1', label: 'Square (1:1)', width: 1024, height: 1024, orientation: 'square' },
  { id: '16:9', label: 'Landscape (16:9)', width: 1920, height: 1080, orientation: 'wide landscape' },
  { id: '9:16', label: 'Portrait (9:16)', width: 1080, height: 1920, orientation: 'tall portrait' },
  { id: '4:3', label: 'Standard (4:3)', width: 1440, height: 1080, orientation: 'standard landscape' },
];

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: 'cinematic',
    label: 'Cinematic',
    description: 'Movie-like visual quality with dramatic lighting',
    promptModifier: 'cinematic photorealistic, 8k, highly detailed, dramatic lighting, movie still',
  },
  {
    id: 'anime',
    label: 'Anime',
    description: 'High-quality Japanese animation style',
    promptModifier: 'anime style, studio ghibli inspired, cel shaded, vibrant colors, detailed background',
  },
  {
    id: 'photorealistic',
    label: 'Photorealistic',
    description: 'Indistinguishable from a real photograph',
    promptModifier: 'photorealistic, raw photo, 8k uhd, dslr, soft lighting, high quality, film grain, Fujifilm XT3',
  },
  {
    id: 'digital-art',
    label: 'Digital Art',
    description: 'Clean, modern digital illustration',
    promptModifier: 'digital art, trending on artstation, concept art, smooth, sharp focus, illustration',
  },
  {
    id: 'oil-painting',
    label: 'Oil Painting',
    description: 'Classic textured oil on canvas',
    promptModifier: 'oil painting, impasto, textured canvas, classical art style, visible brushstrokes',
  },
  {
    id: 'cyberpunk',
    label: 'Cyberpunk',
    description: 'Neon, futuristic, high-tech aesthetic',
    promptModifier: 'cyberpunk, synthwave, neon lights, futuristic city, high tech, sci-fi, chromatic aberration',
  }
];

export const DEFAULT_CONFIG: GenerationConfig = {
  aspectRatio: '1:1',
  styleId: 'cinematic',
  cameraType: '50mm prime, f/1.8',
  lighting: 'soft studio lighting',
  mood: 'cinematic and dramatic'
};

// Template based on the user's request
export const constructPrompt = (userPrompt: string, config: GenerationConfig): string => {
  const style = STYLE_PRESETS.find(s => s.id === config.styleId) || STYLE_PRESETS[0];
  
  // Mapping aspect ratio to explicit pixel dimensions for the prompt context
  const ratio = ASPECT_RATIOS.find(r => r.id === config.aspectRatio) || ASPECT_RATIOS[0];
  const size = `${ratio.width}x${ratio.height}`;

  // Ensure we don't print undefined if config values are missing
  const camera = config.cameraType || 'standard lens';
  const lighting = config.lighting || 'natural lighting';
  const mood = config.mood || 'neutral';

  // Constructed to be extremely explicit about resolution for the model
  // Putting Aspect Ratio instructions FIRST significantly improves adherence for Gemini Flash Image
  return `Create a ${ratio.orientation} image (${ratio.id} aspect ratio). ${userPrompt}. Render details: ${style.promptModifier}, Camera: ${camera}, Lighting: ${lighting}, Mood: ${mood}. Output specs: ${size} resolution, PNG.`;
};