import { ExamQuestion } from './questions.model.js';

export interface ExamSession {
  questions: ExamQuestion[];
  currentQuestionIndex: number;
  answers: Record<string, string[]>;
  startedAt: string;
  remainingSeconds: number | null;
  completed: boolean;
}