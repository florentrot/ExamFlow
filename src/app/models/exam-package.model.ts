
import { ExamQuestion } from './questions.model.js'

export interface ExamCategory {
  id: string;
  name: string;
  description?: string;
}

export interface ExamSettings {
  questionsPerSimulation: number;
  timeLimitMinutes: number | null;
  passPercentage: number;
  randomizeQuestions: boolean;
  randomizeAnswers: boolean;
}

export interface ExamDefinition {
  id: string;
  title: string;
  description: string;
  categories: ExamCategory[];
  settings: ExamSettings;
}

export interface ExamPackage {
  schemaVersion: 1;
  exam: ExamDefinition;
  questions: ExamQuestion[];
}
