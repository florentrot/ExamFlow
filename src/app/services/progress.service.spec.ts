import { TestBed } from '@angular/core/testing';
import { ProgressService } from './progress.service';

describe('ProgressService', () => {
  let service: ProgressService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProgressService);
    localStorage.clear();
  });

  it('should save and load an answer', () => {
    service.saveAnswer('exam-1', 'q1', ['a2'], true);

    const progress = service.load('exam-1');

    expect(progress.answers['q1'].selectedAnswerIds).toEqual(['a2']);
    expect(progress.answers['q1'].isCorrect).toBe(true);
  });

  it('should return incorrect question IDs', () => {
    service.saveAnswer('exam-1', 'q1', ['a1'], false);
    service.saveAnswer('exam-1', 'q2', ['a2'], true);

    expect(service.getIncorrectQuestionIds('exam-1')).toEqual(['q1']);
  });

  it('should replace an earlier answer when retrying', () => {
    service.saveAnswer('exam-1', 'q1', ['a1'], false);
    service.saveAnswer('exam-1', 'q1', ['a2'], true);

    const progress = service.load('exam-1');

    expect(Object.keys(progress.answers).length).toBe(1);
    expect(progress.answers['q1'].isCorrect).toBe(true);
    expect(service.getIncorrectQuestionIds('exam-1')).toEqual([]);
  });
});