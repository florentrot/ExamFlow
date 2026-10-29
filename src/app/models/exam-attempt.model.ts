export interface ExamAttempt {
  id: string;
  examId: string;
  completedAt: string;
  totalQuestions: number;
  correctAnswers: number;
  scorePercentage: number;
  passed: boolean;
}