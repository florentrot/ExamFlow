
import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ExamPackageService } from './exam-package.service';

describe('ExamPackageService', () => {
  let service: ExamPackageService;
  let httpTestingController: HttpTestingController;

  const validPackage = {
    schemaVersion: 1,
    exam: {
      id: 'demo',
      title: 'Examen demonstrativ',
      description: 'Pachet de test',
      categories: [
        { id: 'anatomie', name: 'Anatomie' },
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

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ExamPackageService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(ExamPackageService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });


it('should load and validate a package', async () => {
  const resultPromise = service.loadPackage(
    '/exam-packages/instructor-fitness.json',
  );

  const request = httpTestingController.expectOne(
    '/exam-packages/instructor-fitness.json',
  );

  expect(request.request.method).toBe('GET');
  request.flush(validPackage);

  await resultPromise.then((result) => {
    expect(result).toEqual(validPackage);
  });
});




it('should reject an invalid package', async () => {
  const invalidPackage = {
    ...validPackage,
    schemaVersion: 2,
  };

  const resultPromise = service.loadPackage('/exam-packages/invalid.json');

  const request = httpTestingController.expectOne(
    '/exam-packages/invalid.json',
  );

  request.flush(invalidPackage);

  let rejected = false;
  let errorMessage = '';

  try {
    await resultPromise;
  } catch (error) {
    rejected = true;

    if (error instanceof Error) {
      errorMessage = error.message;
    }
  }

  expect(rejected).toBe(true);
  expect(errorMessage).toContain(
    'Versiunea schemei trebuie să fie 1.',
  );
});


});
