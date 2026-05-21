export type TutorialCategory =
  | 'planting'
  | 'watering'
  | 'pest'
  | 'harvest'
  | 'storage'
  | 'marketing'
  | 'all';

export type TutorialDifficulty = 'beginner' | 'intermediate' | 'advanced';

export type TutorialLanguage = 'en' | 'sn' | 'nd';

export interface TutorialSection {
  heading?: string;
  body: string;
  tip?: string;
}

export interface Tutorial {
  id: string;
  title: string;
  category: Exclude<TutorialCategory, 'all'>;
  emoji: string;
  durationMin: number;
  difficulty: TutorialDifficulty;
  language: TutorialLanguage;
  featured?: boolean;
  summary: string;
  sections: TutorialSection[];
  relatedIds: string[];
}

export const TUTORIAL_CATEGORIES = [
  'All',
  'Planting',
  'Watering',
  'Pest Control',
  'Harvest',
  'Storage',
  'Marketing',
] as const;

export type TutorialCategoryFilter = (typeof TUTORIAL_CATEGORIES)[number];
