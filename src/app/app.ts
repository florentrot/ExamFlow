import { ProgressService } from './services/progress.service';
import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  inject,
} from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { ExamPackageService } from './services/exam-package.service';
import { ExamPackage } from './models/exam-package.model';
import { ExamSession } from './models/exam-session.model';
import { ExamHistoryService } from './services/exam-history.service';
import { ExamAttempt } from './models/exam-attempt.model';
import { ImportedPackageService } from './services/imported-package.service';


@Component({
  selector: 'app-root',
  imports: [RouterOutlet, DecimalPipe, DatePipe],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit, OnDestroy {
  private readonly examPackageService = inject(ExamPackageService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly progressService = inject(ProgressService);
  private readonly examHistoryService = inject(ExamHistoryService);
  private readonly importedPackageService = inject(ImportedPackageService);

  protected readonly selectedAnswers: Record<string, string[]> = {};
protected readonly answeredQuestions: Record<string, boolean> = {};
protected readonly correctQuestions: Record<string, boolean> = {};
protected readonly Object = Object;

  protected examPackage: ExamPackage | null = null;
  protected loading = true;
  protected errorMessage = '';
  protected completedQuestions = 0;
  protected activeSection = 'home';

  protected selectedCategoryId: string | null = null;
  protected examSession: ExamSession | null = null;
  protected showIncorrectQuestions = false;
  protected retryQuestionIds: string[] = [];
  protected importedPackages: ExamPackage[] = [];

  protected importingPackage = false;
protected importMessage = '';
protected importError = false;

  protected simulationScore = 0;
protected simulationCorrectAnswers = 0;
protected simulationPassed = false;

protected examHistory: ExamAttempt[] = [];

  private timerId: ReturnType<typeof setInterval> | null = null;
  protected remainingTimeLabel = '';

  protected readonly exam = {
    completedQuestions: 0,
    accuracy: 0,
  };

  protected get progress(): number {
    const total = this.examPackage?.questions.length ?? 0;

    if (total === 0) {
      return 0;
    }

    return Math.min(
      100,
      (this.completedQuestions / total) * 100,
    );
  }

  protected get selectedCategory() {
  return (
    this.examPackage?.exam.categories.find(
      (category) => category.id === this.selectedCategoryId,
    ) ?? null
  );
}

protected get selectedQuestions() {
  return (
    this.examPackage?.questions.filter(
      (question) => question.categoryId === this.selectedCategoryId,
    ) ?? []
  );
}

protected get incorrectQuestions() {
  const examId = this.examPackage?.exam.id;

  if (!examId || !this.examPackage) {
    return [];
  }

  const incorrectIds =
    this.progressService.getIncorrectQuestionIds(examId);

  return this.examPackage.questions.filter((question) =>
    incorrectIds.includes(question.id),
  );
}

protected get bestSimulationScore(): number {
  if (this.examHistory.length === 0) {
    return 0;
  }

  return Math.max(
    ...this.examHistory.map(attempt => attempt.scorePercentage)
  );
}

protected selectCategory(categoryId: string | null): void {
  this.selectedCategoryId = categoryId;
}

protected selectAnswer(
  questionId: string,
  answerId: string,
  type: 'single-choice' | 'multiple-choice',
): void {
  if (this.answeredQuestions[questionId]) {
    return;
  }

  const current = this.selectedAnswers[questionId] ?? [];

  if (type === 'single-choice') {
    this.selectedAnswers[questionId] = [answerId];
    this.checkAnswer(questionId);
    return;
  }

  this.selectedAnswers[questionId] = current.includes(answerId)
    ? current.filter((id) => id !== answerId)
    : [...current, answerId];
}

protected retryIncorrectQuestion(questionId: string): void {
  const question = this.examPackage?.questions.find(
    (item) => item.id === questionId,
  );

  if (!question) return;

  this.retryQuestionIds = [questionId];

  delete this.selectedAnswers[questionId];
  delete this.answeredQuestions[questionId];
  delete this.correctQuestions[questionId];

  this.selectCategory(question.categoryId);
}

private startTimer(): void {
  this.stopTimer();

  if (this.examSession?.remainingSeconds === null ||
      this.examSession?.remainingSeconds === undefined) {
    this.remainingTimeLabel = 'Fără limită de timp';
    return;
  }

  this.updateRemainingTimeLabel();

  this.timerId = setInterval(() => {
    const session = this.examSession;

    if (!session || session.completed) {
      this.stopTimer();
      return;
    }

    if (session.remainingSeconds === null) {
      this.stopTimer();
      return;
    }

session.remainingSeconds = Math.max(
  0,
  session.remainingSeconds - 1,
);

this.updateRemainingTimeLabel();

if (session.remainingSeconds === 0) {
  this.finishExamSimulation();
  this.cdr.detectChanges();
  return;
}

this.cdr.detectChanges();

    if (session.remainingSeconds === 0) {
      this.finishExamSimulation();
    }
  }, 1000);
}

private stopTimer(): void {
  if (this.timerId !== null) {
    clearInterval(this.timerId);
    this.timerId = null;
  }
}

private updateRemainingTimeLabel(): void {
  const seconds = this.examSession?.remainingSeconds;

  if (seconds === null || seconds === undefined) {
    this.remainingTimeLabel = 'Fără limită de timp';
    return;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  this.remainingTimeLabel =
    `${String(minutes).padStart(2, '0')}:` +
    `${String(remainingSeconds).padStart(2, '0')}`;
}

ngOnDestroy(): void {
  this.stopTimer();
  this.sectionObserver?.disconnect();
  this.sectionObserver = null;
}

private refreshProgress(): void {
  const examId = this.examPackage?.exam.id;

  if (!examId) {
    return;
  }

  const savedProgress = this.progressService.load(examId);
  const answers = Object.values(savedProgress.answers);

  this.completedQuestions = answers.length;
  this.exam.accuracy =
    answers.length > 0
      ? Math.round(
          (answers.filter((answer) => answer.isCorrect).length /
            answers.length) *
            100,
        )
      : 0;
}

protected checkAnswer(questionId: string): void {
  const question = this.examPackage?.questions.find(
    (item) => item.id === questionId,
  );

  if (!question || this.answeredQuestions[questionId]) {
    return;
  }

  const selected = [...(this.selectedAnswers[questionId] ?? [])].sort();
  const correct = [...question.correctAnswerIds].sort();

  if (selected.length === 0) {
    return;
  }

  this.correctQuestions[questionId] =
    selected.length === correct.length &&
    selected.every((id, index) => id === correct[index]);

  this.answeredQuestions[questionId] = true;

  const examId = this.examPackage?.exam.id;

if (examId) {
  this.progressService.saveAnswer(
    examId,
    questionId,
    selected,
    this.correctQuestions[questionId],
  );

  this.refreshProgress();
}
}

protected startExamSimulation(): void {
  const examPackage = this.examPackage;

  if (!examPackage) {
    return;
  }

  const settings = examPackage.exam.settings;
  const questions = [...examPackage.questions];

  if (settings.randomizeQuestions) {
    for (let i = questions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [questions[i], questions[j]] = [questions[j], questions[i]];
    }
  }

  const selectedQuestions = questions.slice(
    0,
    Math.max(0, settings.questionsPerSimulation),
  );

  this.examSession = {
    questions: selectedQuestions,
    currentQuestionIndex: 0,
    answers: {},
    startedAt: new Date().toISOString(),
    remainingSeconds:
      settings.timeLimitMinutes === null
        ? null
        : settings.timeLimitMinutes * 60,
    completed: false,
  };
  this.startTimer();
  this.selectCategory(null);
}

protected selectSimulationAnswer(
  questionId: string,
  answerId: string,
  type: 'single-choice' | 'multiple-choice',
): void {
  const session = this.examSession;

  if (!session || session.completed) {
    return;
  }

  const currentAnswers = session.answers[questionId] ?? [];

  if (type === 'single-choice') {
    session.answers[questionId] = [answerId];
    return;
  }

  session.answers[questionId] = currentAnswers.includes(answerId)
    ? currentAnswers.filter((id) => id !== answerId)
    : [...currentAnswers, answerId];
}

protected nextSimulationQuestion(): void {
  const session = this.examSession;

  if (!session || session.completed) {
    return;
  }

  if (session.currentQuestionIndex < session.questions.length - 1) {
    session.currentQuestionIndex++;
  }
}

protected previousSimulationQuestion(): void {
  const session = this.examSession;

  if (!session || session.completed) {
    return;
  }

  if (session.currentQuestionIndex > 0) {
    session.currentQuestionIndex--;
  }
}

protected finishExamSimulation(): void {
  const session = this.examSession;
  const examPackage = this.examPackage;

  if (!session || !examPackage || session.completed) {
    return;
  }

  session.completed = true;
  this.stopTimer();

  const totalQuestions = session.questions.length;

  this.simulationCorrectAnswers = session.questions.filter((question) => {
    const selected = [...(session.answers[question.id] ?? [])].sort();
    const correct = [...question.correctAnswerIds].sort();

    return (
      selected.length === correct.length &&
      selected.every((id, index) => id === correct[index])
    );
  }).length;

  this.simulationScore =
    totalQuestions > 0
      ? Math.round((this.simulationCorrectAnswers / totalQuestions) * 100)
      : 0;

  this.simulationPassed =
    totalQuestions > 0 &&
    this.simulationScore >= examPackage.exam.settings.passPercentage;

    this.examHistoryService.save({
  id: crypto.randomUUID(),
  examId: examPackage.exam.id,
  completedAt: new Date().toISOString(),
  totalQuestions,
  correctAnswers: this.simulationCorrectAnswers,
  scorePercentage: this.simulationScore,
  passed: this.simulationPassed,
});

this.examHistory = this.examHistoryService.load(examPackage.exam.id);
}

protected async onPackageSelected(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) {
    return;
  }

  this.importingPackage = true;
  this.importMessage = '';
  this.importError = false;


try {
  const importedPackage =
    await this.examPackageService.importPackage(file);
  this.importedPackageService.save(importedPackage);
  this.importedPackages = this.importedPackageService.loadAll();


    this.examPackage = importedPackage;
    this.examHistory = this.examHistoryService.load(
      importedPackage.exam.id,
    );

    this.selectedCategoryId = null;
    this.examSession = null;
    this.completedQuestions = 0;
    this.exam.accuracy = 0;

    this.importMessage =
      `Examenul „${importedPackage.exam.title}” a fost încărcat cu succes.`;

    this.refreshProgress();
  } catch (error: unknown) {
    this.importError = true;
    this.importMessage =
      error instanceof Error
        ? error.message
        : 'Fișierul JSON nu a putut fi importat.';
  } finally {
    this.importingPackage = false;
    input.value = '';
    this.cdr.detectChanges();
  }
}

  private sectionObserver: IntersectionObserver | null = null;

ngOnInit(): void {
  this.loadInitialPackage();

  this.sectionObserver = new IntersectionObserver(
    (entries) => {
      const visibleSections = entries
        .filter((entry) => entry.isIntersecting)
        .sort(
          (a, b) => b.intersectionRatio - a.intersectionRatio,
        );

      const sectionId = visibleSections[0]?.target.id;

      if (sectionId) {
        this.activeSection = sectionId;
        this.cdr.detectChanges();
      }
    },
    {
      root: null,
      rootMargin: '-15% 0px -65% 0px',
      threshold: [0, 0.25, 0.5, 0.75, 1],
    },
  );

  ['exams', 'mistakes', 'progress'].forEach((id) => {
    const section = document.getElementById(id);

    if (section) {
      this.sectionObserver?.observe(section);
    }
  });
}


private async loadInitialPackage(): Promise<void> {
  try {
    const bundledPackagePaths = [
      '/exam-packages/examflow-instructor-fitness-anatomie-capitolul-1.json',
      '/exam-packages/examflow-instructor-fitness-capitolul-2.json',
    ];

    const bundledPackages = await Promise.all(
      bundledPackagePaths.map((path) =>
        this.examPackageService.loadPackage(path),
      ),
    );

    const importedPackages = this.importedPackageService.loadAll();

    // Examenele incluse în aplicație au prioritate la ID-uri duplicate.
    const packagesById = new Map<string, ExamPackage>();

    for (const examPackage of importedPackages) {
      packagesById.set(examPackage.exam.id, examPackage);
    }

    for (const examPackage of bundledPackages) {
      packagesById.set(examPackage.exam.id, examPackage);
    }

    this.importedPackages = Array.from(packagesById.values());

    const selectedExamId =
      this.importedPackageService.loadSelectedExamId();

    const selectedPackage = selectedExamId
      ? this.importedPackages.find(
          (item) => item.exam.id === selectedExamId,
        )
      : undefined;

    const examPackage =
      selectedPackage ??
      bundledPackages[0];

    this.examPackage = examPackage;
    this.examHistory = this.examHistoryService.load(
      examPackage.exam.id,
    );

    const savedProgress = this.progressService.load(
      examPackage.exam.id,
    );

    for (const [questionId, answer] of Object.entries(
      savedProgress.answers,
    )) {
      this.selectedAnswers[questionId] = [
        ...answer.selectedAnswerIds,
      ];
      this.answeredQuestions[questionId] = true;
      this.correctQuestions[questionId] = answer.isCorrect;
    }

    this.refreshProgress();
    this.loading = false;
  } catch (error: unknown) {
    console.error('Eroare la încărcarea pachetului:', error);

    this.errorMessage =
      error instanceof Error
        ? error.message
        : 'Nu s-a putut încărca pachetul de examen.';

    this.loading = false;
  } finally {
    this.cdr.detectChanges();
  }
}



protected selectImportedPackage(examId: string): void {
  const examPackage =
    this.importedPackages.find((item) => item.exam.id === examId) ??
    this.importedPackageService.findById(examId);

  if (!examPackage) {
    this.errorMessage = 'Examenul selectat nu a fost găsit.';
    return;
  }

  this.importedPackageService.saveSelectedExamId(examId);

  this.examPackage = examPackage;
  this.examHistory = this.examHistoryService.load(examId);
  this.selectedCategoryId = null;
  this.examSession = null;
  this.errorMessage = '';
  this.importMessage = '';

  this.selectedAnswersClear();
  this.refreshProgress();

  this.cdr.detectChanges();
}


private selectedAnswersClear(): void {
  for (const questionId of Object.keys(this.selectedAnswers)) {
    delete this.selectedAnswers[questionId];
    delete this.answeredQuestions[questionId];
    delete this.correctQuestions[questionId];
  }

  const savedProgress = this.progressService.load(
    this.examPackage!.exam.id,
  );

  for (const [questionId, answer] of Object.entries(savedProgress.answers)) {
    this.selectedAnswers[questionId] = [...answer.selectedAnswerIds];
    this.answeredQuestions[questionId] = true;
    this.correctQuestions[questionId] = answer.isCorrect;
  }
}

}
