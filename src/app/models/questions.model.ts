
export type QuestionType = 'single-choice' | 'multiple-choice';

export type QuestionDifficulty = 'easy' | 'medium' | 'hard';

export interface AnswerOption {
  id: string;
  text: string;
}

export interface QuestionSource {
  document: string;
  page?: number | null;
  chapter?: string;
}

export interface ExamQuestion {
  id: string;
  categoryId: string;
  type: QuestionType;
  question: string;
  answers: AnswerOption[];
  correctAnswerIds: string[];
  explanation: string;
  image: string | null;
  difficulty: QuestionDifficulty;
  source?: QuestionSource;
}
