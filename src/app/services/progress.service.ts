
import { Injectable } from '@angular/core';
import { ExamProgress, QuestionProgress } from '../models/exam-progress.model';

@Injectable({
  providedIn: 'root',
})
export class ProgressService {
  private storageKey(examId: string): string {
    return `exam-flow:progress:${examId}`;
  }

  load(examId: string): ExamProgress {
    const emptyProgress: ExamProgress = {
      examId,
      answers: {},
      updatedAt: new Date().toISOString(),
    };

    if (typeof localStorage === 'undefined') {
      return emptyProgress;
    }

    try {
      const stored = localStorage.getItem(this.storageKey(examId));

      if (!stored) {
        return emptyProgress;
      }

      const parsed: unknown = JSON.parse(stored);

      if (
        typeof parsed !== 'object' ||
        parsed === null ||
        !('examId' in parsed) ||
        !('answers' in parsed) ||
        !('updatedAt' in parsed)
      ) {
        return emptyProgress;
      }

      const progress = parsed as ExamProgress;

      if (
        progress.examId !== examId ||
        typeof progress.answers !== 'object' ||
        progress.answers === null ||
        Array.isArray(progress.answers)
      ) {
        return emptyProgress;
      }

      return progress;
    } catch {
      return emptyProgress;
    }
  }

  saveAnswer(
    examId: string,
    questionId: string,
    selectedAnswerIds: string[],
    isCorrect: boolean,
  ): ExamProgress {
    const progress = this.load(examId);

    const questionProgress: QuestionProgress = {
      questionId,
      selectedAnswerIds: [...selectedAnswerIds],
      isCorrect,
      answeredAt: new Date().toISOString(),
    };

    const updatedProgress: ExamProgress = {
      ...progress,
      answers: {
        ...progress.answers,
        [questionId]: questionProgress,
      },
      updatedAt: new Date().toISOString(),
    };

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(
        this.storageKey(examId),
        JSON.stringify(updatedProgress),
      );
    }

    return updatedProgress;
  }

getIncorrectQuestionIds(examId: string): string[] {
  const progress = this.load(examId);

  return Object.values(progress.answers)
    .filter((answer) => !answer.isCorrect)
    .map((answer) => answer.questionId);
}
}
