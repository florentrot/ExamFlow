
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ExamPackage } from '../models/exam-package.model';
import { ExamPackageValidatorService } from './exam-package-validator.service';

@Injectable({
  providedIn: 'root',
})
export class ExamPackageService {
  private readonly http = inject(HttpClient);
  private readonly validator = inject(ExamPackageValidatorService);

  async loadPackage(path: string): Promise<ExamPackage> {
    const data: unknown = await firstValueFrom(
      this.http.get<unknown>(path),
    );

    const errors = this.validator.validate(data);

    if (errors.length > 0) {
      throw new Error(
        `Pachetul de examen este invalid:\n${errors.join('\n')}`,
      );
    }

    return data as ExamPackage;
  }

  async importPackage(file: File): Promise<ExamPackage> {
  const text = await file.text();
  const data: unknown = JSON.parse(text);

  const errors = this.validator.validate(data);

  if (errors.length > 0) {
    throw new Error(
      `Pachetul de examen este invalid:\n${errors.join('\n')}`,
    );
  }

  return data as ExamPackage;
}
}
