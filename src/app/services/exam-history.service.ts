import { Injectable } from '@angular/core';
import { ExamAttempt } from '../models/exam-attempt.model';

@Injectable({
  providedIn: 'root',
})
export class ExamHistoryService {
  private storageKey(examId: string): string {
    return `exam-flow:history:${examId}`;
  }

  load(examId: string): ExamAttempt[] {
    if (typeof localStorage === 'undefined') {
      return [];
    }

    try {
      const stored = localStorage.getItem(this.storageKey(examId));

      if (!stored) {
        return [];
      }

      const parsed: unknown = JSON.parse(stored);

      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed.filter(
        (item): item is ExamAttempt =>
          typeof item === 'object' &&
          item !== null &&
          'id' in item &&
          'examId' in item &&
          'completedAt' in item &&
          'totalQuestions' in item &&
          'correctAnswers' in item &&
          'scorePercentage' in item &&
          'passed' in item &&
          item.examId === examId,
      );
    } catch {
      return [];
    }
  }

  save(attempt: ExamAttempt): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    const history = this.load(attempt.examId);

    const updatedHistory = [attempt, ...history];

    localStorage.setItem(
      this.storageKey(attempt.examId),
      JSON.stringify(updatedHistory),
    );
  }
}