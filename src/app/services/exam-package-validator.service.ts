
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ExamPackageValidatorService {
  validate(data: unknown): string[] {
    const errors: string[] = [];

    if (!this.isRecord(data)) {
      return ['Pachetul trebuie să fie un obiect JSON.'];
    }

    if (data['schemaVersion'] !== 1) {
      errors.push('Versiunea schemei trebuie să fie 1.');
    }

    const exam = data['exam'];
    const questions = data['questions'];

    if (!this.isRecord(exam)) {
      errors.push('Lipsește definiția examenului sau este invalidă.');
    }

    if (!Array.isArray(questions)) {
      errors.push('Lista de întrebări trebuie să fie un array.');
    }

    if (!this.isRecord(exam) || !Array.isArray(questions)) {
      return errors;
    }

    // Validarea metadatelor examenului
    for (const field of ['id', 'title', 'description']) {
      const value = exam[field];

      if (typeof value !== 'string' || value.trim() === '') {
        errors.push(
          `Examenul trebuie să aibă câmpul "${field}" completat corect.`,
        );
      } else if (value !== value.trim()) {
        errors.push(
          `Câmpul "${field}" al examenului nu trebuie să aibă spații la început sau la sfârșit.`,
        );
      }
    }

    // Validarea setărilor
    const settings = exam['settings'];

    if (!this.isRecord(settings)) {
      errors.push('Setările examenului lipsesc sau sunt invalide.');
    } else {
      const questionsPerSimulation = settings['questionsPerSimulation'];
      const timeLimitMinutes = settings['timeLimitMinutes'];
      const passPercentage = settings['passPercentage'];

      if (
        !Number.isInteger(questionsPerSimulation) ||
        (questionsPerSimulation as number) < 1
      ) {
        errors.push(
          'Numărul de întrebări per simulare trebuie să fie un număr întreg pozitiv.',
        );
      } else if (
        (questionsPerSimulation as number) > questions.length
      ) {
        errors.push(
          'Numărul de întrebări per simulare nu poate depăși numărul total de întrebări din pachet.',
        );
      }

      if (
        timeLimitMinutes !== null &&
        (!Number.isInteger(timeLimitMinutes) ||
          (timeLimitMinutes as number) < 1)
      ) {
        errors.push(
          'Limita de timp trebuie să fie null sau un număr întreg pozitiv.',
        );
      }

      if (
        typeof passPercentage !== 'number' ||
        !Number.isFinite(passPercentage) ||
        passPercentage < 0 ||
        passPercentage > 100
      ) {
        errors.push('Procentul de promovare trebuie să fie între 0 și 100.');
      }

      if (typeof settings['randomizeQuestions'] !== 'boolean') {
        errors.push('randomizeQuestions trebuie să fie true sau false.');
      }

      if (typeof settings['randomizeAnswers'] !== 'boolean') {
        errors.push('randomizeAnswers trebuie să fie true sau false.');
      }
    }

    // Validarea categoriilor
    const categories = exam['categories'];

    if (!Array.isArray(categories)) {
      errors.push('Categoriile trebuie să fie un array.');
    } else if (categories.length === 0) {
      errors.push('Examenul trebuie să conțină cel puțin o categorie.');
    }

    const categoryIds = new Set<string>();

    if (Array.isArray(categories)) {
      categories.forEach((category, index) => {
        if (
          !this.isRecord(category) ||
          typeof category['id'] !== 'string' ||
          category['id'].trim() === '' ||
          typeof category['name'] !== 'string' ||
          category['name'].trim() === ''
        ) {
          errors.push(`Categoria de la poziția ${index + 1} este invalidă.`);
          return;
        }

        const categoryId = category['id'].trim();
        const categoryName = category['name'].trim();

        if (category['id'] !== categoryId) {
          errors.push(
            `Categoria de la poziția ${index + 1}: ID-ul nu trebuie să aibă spații la început sau la sfârșit.`,
          );
        }

        if (category['name'] !== categoryName) {
          errors.push(
            `Categoria de la poziția ${index + 1}: numele nu trebuie să aibă spații la început sau la sfârșit.`,
          );
        }

        if (categoryIds.has(categoryId)) {
          errors.push(`ID de categorie duplicat: ${categoryId}.`);
        }

        categoryIds.add(categoryId);

        if (
          category['description'] !== undefined &&
          (typeof category['description'] !== 'string' ||
            category['description'].trim() === '')
        ) {
          errors.push(
            `Categoria "${categoryName}": description trebuie să lipsească sau să fie un text nevid.`,
          );
        }
      });
    }

    // Validarea întrebărilor
    if (questions.length === 0) {
      errors.push('Examenul trebuie să conțină cel puțin o întrebare.');
    }

    const questionIds = new Set<string>();
    const questionsWithValidCategoryIds = new Set<string>();

    questions.forEach((question, index) => {
      const prefix = `Întrebarea ${index + 1}`;

      if (!this.isRecord(question)) {
        errors.push(`${prefix} nu este un obiect valid.`);
        return;
      }

      const id = question['id'];
      const categoryId = question['categoryId'];
      const type = question['type'];
      const questionText = question['question'];
      const answers = question['answers'];
      const correctAnswerIds = question['correctAnswerIds'];
      const difficulty = question['difficulty'];

      // ID-ul întrebării
      if (typeof id !== 'string' || id.trim() === '') {
        errors.push(`${prefix}: ID-ul este obligatoriu.`);
      } else {
        const questionId = id.trim();

        if (id !== questionId) {
          errors.push(
            `${prefix}: ID-ul nu trebuie să aibă spații la început sau la sfârșit.`,
          );
        }

        if (questionIds.has(questionId)) {
          errors.push(`ID de întrebare duplicat: ${questionId}.`);
        }

        questionIds.add(questionId);
      }

      // Categoria asociată
      if (
        typeof categoryId !== 'string' ||
        categoryId.trim() === '' ||
        !categoryIds.has(categoryId.trim())
      ) {
        errors.push(`${prefix}: categoria nu există în examen.`);
      } else {
        if (categoryId !== categoryId.trim()) {
          errors.push(
            `${prefix}: categoryId nu trebuie să aibă spații la început sau la sfârșit.`,
          );
        }

        questionsWithValidCategoryIds.add(categoryId.trim());
      }

      // Tipul întrebării
      if (type !== 'single-choice' && type !== 'multiple-choice') {
        errors.push(`${prefix}: tipul întrebării este invalid.`);
      }

      // Dificultatea
      if (
        difficulty !== 'easy' &&
        difficulty !== 'medium' &&
        difficulty !== 'hard'
      ) {
        errors.push(`${prefix}: dificultatea este invalidă.`);
      }

      // Textul întrebării
      if (
        typeof questionText !== 'string' ||
        questionText.trim() === ''
      ) {
        errors.push(`${prefix}: textul întrebării este obligatoriu.`);
      }

      // Variantele de răspuns
      if (!Array.isArray(answers) || answers.length < 2) {
        errors.push(`${prefix}: sunt necesare cel puțin două variante.`);
        return;
      }

      const answerIds = new Set<string>();

      answers.forEach((answer, answerIndex) => {
        if (
          !this.isRecord(answer) ||
          typeof answer['id'] !== 'string' ||
          answer['id'].trim() === '' ||
          typeof answer['text'] !== 'string' ||
          answer['text'].trim() === ''
        ) {
          errors.push(
            `${prefix}: varianta ${answerIndex + 1} este invalidă.`,
          );
          return;
        }

        const answerId = answer['id'].trim();

        if (answer['id'] !== answerId) {
          errors.push(
            `${prefix}: ID-ul variantei ${answerIndex + 1} nu trebuie să aibă spații la început sau la sfârșit.`,
          );
        }

        if (answer['text'] !== answer['text'].trim()) {
          errors.push(
            `${prefix}: textul variantei ${answerIndex + 1} nu trebuie să aibă spații la început sau la sfârșit.`,
          );
        }

        if (answerIds.has(answerId)) {
          errors.push(
            `${prefix}: ID de răspuns duplicat (${answerId}).`,
          );
        }

        answerIds.add(answerId);
      });

      // Răspunsurile corecte
      if (
        !Array.isArray(correctAnswerIds) ||
        correctAnswerIds.length === 0
      ) {
        errors.push(
          `${prefix}: trebuie să existe cel puțin un răspuns corect.`,
        );
      } else {
        if (
          type === 'single-choice' &&
          correctAnswerIds.length !== 1
        ) {
          errors.push(
            `${prefix}: o întrebare single-choice trebuie să aibă un singur răspuns corect.`,
          );
        }

        const correctIds = new Set<string>();

        correctAnswerIds.forEach((answerId) => {
          if (
            typeof answerId !== 'string' ||
            answerId.trim() === '' ||
            !answerIds.has(answerId.trim())
          ) {
            errors.push(
              `${prefix}: un răspuns corect nu există în lista de variante sau are un ID invalid.`,
            );
            return;
          }

          const normalizedAnswerId = answerId.trim();

          if (answerId !== normalizedAnswerId) {
            errors.push(
              `${prefix}: ID-urile din correctAnswerIds nu trebuie să aibă spații la început sau la sfârșit.`,
            );
          }

          if (correctIds.has(normalizedAnswerId)) {
            errors.push(`${prefix}: un răspuns corect este duplicat.`);
          }

          correctIds.add(normalizedAnswerId);
        });
      }

      // Explicația
      if (
        typeof question['explanation'] !== 'string' ||
        question['explanation'].trim() === ''
      ) {
        errors.push(
          `${prefix}: explicația trebuie să fie un text nevid.`,
        );
      }

      // Imaginea: null sau text nevid
      if (
        question['image'] !== null &&
        (typeof question['image'] !== 'string' ||
          question['image'].trim() === '')
      ) {
        errors.push(
          `${prefix}: imaginea trebuie să fie null sau un șir de caractere nevid.`,
        );
      }

      // Sursa este opțională, dar dacă există trebuie să fie validă
      const source = question['source'];

      if (source !== undefined) {
        if (
          !this.isRecord(source) ||
          typeof source['document'] !== 'string' ||
          source['document'].trim() === ''
        ) {
          errors.push(
            `${prefix}: source trebuie să conțină un câmp document valid.`,
          );
        } else {
          if (source['document'] !== source['document'].trim()) {
            errors.push(
              `${prefix}: source.document nu trebuie să aibă spații la început sau la sfârșit.`,
            );
          }

          if (
            source['page'] !== undefined &&
            source['page'] !== null &&
            (!Number.isInteger(source['page']) ||
              (source['page'] as number) < 1)
          ) {
            errors.push(
              `${prefix}: source.page trebuie să fie null sau un număr întreg pozitiv.`,
            );
          }

          if (
            source['chapter'] !== undefined &&
            (typeof source['chapter'] !== 'string' ||
              source['chapter'].trim() === '')
          ) {
            errors.push(
              `${prefix}: source.chapter trebuie să lipsească sau să fie un text nevid.`,
            );
          }
        }
      }
    });

    // Fiecare categorie trebuie să conțină cel puțin o întrebare valid asociată
    if (Array.isArray(categories)) {
      for (const category of categories) {
        if (
          this.isRecord(category) &&
          typeof category['id'] === 'string' &&
          category['id'].trim() !== ''
        ) {
          const categoryId = category['id'].trim();

          if (!questionsWithValidCategoryIds.has(categoryId)) {
            errors.push(
              `Categoria "${String(category['name'] ?? categoryId)}" nu conține nicio întrebare valid asociată.`,
            );
          }
        }
      }
    }

    return errors;
  }

  private isRecord(
    value: unknown,
  ): value is Record<string, unknown> {
    return (
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value)
    );
  }
}
