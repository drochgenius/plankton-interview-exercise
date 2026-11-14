import type { Choice, PublicQuiz, Question, Quiz, QuizSummary } from 'shared-types';

export class QuizModel implements Quiz {
  id: string;
  title: string;
  description: string;
  questions: Question[];

  constructor(data: Quiz) {
    this.id = data.id;
    this.title = data.title;
    this.description = data.description;
    this.questions = data.questions;
  }

  toSummary(): QuizSummary {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      questionCount: this.questions.length,
    };
  }

  /** The quiz without the correct answers. */
  toPublic(): PublicQuiz {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      questions: this.questions.map((q) => ({
        id: q.id,
        text: q.text,
        choices: q.choices.map((c: Choice) => ({ id: c.id, text: c.text })),
      })),
    };
  }
}
