
export interface QuestionProgress {
  questionId: string;
  selectedAnswerIds: string[];
  isCorrect: boolean;
  answeredAt: string;
}

export interface ExamProgress {
  examId: string;
  answers: Record<string, QuestionProgress>;
  updatedAt: string;
}
