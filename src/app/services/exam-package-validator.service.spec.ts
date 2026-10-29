
import { TestBed } from '@angular/core/testing';
import { ExamPackageValidatorService } from './exam-package-validator.service';

describe('ExamPackageValidatorService', () => {
  let service: ExamPackageValidatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ExamPackageValidatorService);
  });

  const validPackage = {
    schemaVersion: 1,
    exam: {
      id: 'demo',
      title: 'Examen demonstrativ',
      description: 'Pachet de test',
      categories: [
        {
          id: 'anatomie',
          name: 'Anatomie',
        },
      ],
      settings: {
        questionsPerSimulation: 1,
        timeLimitMinutes: 10,
        passPercentage: 70,
        randomizeQuestions: true,
        randomizeAnswers: true,
      },
    },
    questions: [
      {
        id: 'q1',
        categoryId: 'anatomie',
        type: 'single-choice',
        question: 'Care variantă este corectă?',
        answers: [
          { id: 'a', text: 'Varianta A' },
          { id: 'b', text: 'Varianta B' },
        ],
        correctAnswerIds: ['a'],
        explanation: 'Varianta A este corectă.',
        image: null,
        difficulty: 'easy',
      },
    ],
  };

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should accept a valid package', () => {
    expect(service.validate(validPackage)).toEqual([]);
  });

  it('should reject an unsupported schema version', () => {
    const invalidPackage = {
      ...validPackage,
      schemaVersion: 2,
    };

    expect(service.validate(invalidPackage)).toContain(
      'Versiunea schemei trebuie să fie 1.',
    );
  });

  it('should reject a question with an unknown category', () => {
    const invalidPackage = {
      ...validPackage,
      questions: [
        {
          ...validPackage.questions[0],
          categoryId: 'categorie-inexistenta',
        },
      ],
    };

    expect(
      service.validate(invalidPackage).some((error) =>
        error.includes('categoria nu există'),
      ),
    ).toBe(true);
  });

  it('should reject a question with a nonexistent correct answer', () => {
    const invalidPackage = {
      ...validPackage,
      questions: [
        {
          ...validPackage.questions[0],
          correctAnswerIds: ['x'],
        },
      ],
    };

    expect(
      service.validate(invalidPackage).some((error) =>
        error.includes('un răspuns corect nu există'),
      ),
    ).toBe(true);
  });
});
