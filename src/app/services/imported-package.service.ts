import { Injectable } from '@angular/core';
import { ExamPackage } from '../models/exam-package.model';

@Injectable({
  providedIn: 'root',
})
export class ImportedPackageService {
  private readonly storageKey = 'exam-flow:imported-packages';

  loadAll(): ExamPackage[] {
    if (typeof localStorage === 'undefined') {
      return [];
    }

    try {
      const stored = localStorage.getItem(this.storageKey);

      if (!stored) {
        return [];
      }

      const parsed: unknown = JSON.parse(stored);

      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed as ExamPackage[];
    } catch {
      return [];
    }
  }

  save(examPackage: ExamPackage): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    const packages = this.loadAll();
    const existingIndex = packages.findIndex(
      (item) => item.exam.id === examPackage.exam.id,
    );

    if (existingIndex >= 0) {
      packages[existingIndex] = examPackage;
    } else {
      packages.push(examPackage);
    }

    localStorage.setItem(
      this.storageKey,
      JSON.stringify(packages),
    );
  }

  findById(examId: string): ExamPackage | null {
    return (
      this.loadAll().find((item) => item.exam.id === examId) ?? null
    );
  }

  saveSelectedExamId(examId: string): void {
  localStorage.setItem('exam-flow:selected-exam-id', examId);
}

loadSelectedExamId(): string | null {
  return localStorage.getItem('exam-flow:selected-exam-id');
}
}