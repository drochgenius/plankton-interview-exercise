export interface Choice {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  text: string;
  choices: Choice[];
  correctChoiceId: string;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  questions: Question[];
}

export interface Answer {
  questionId: string;
  choiceId: string;
}

export interface Submission {
  id: string;
  quizId: string;
  participantName: string;
  answers: Answer[];
  score: number;
  total: number;
  /** ISO 8601 timestamp. */
  submittedAt: string;
}

export interface QuizSummary {
  id: string;
  title: string;
  description: string;
  questionCount: number;
}

/** A question as sent to the client: the correct answer is left out. */
export type PublicQuestion = Omit<Question, 'correctChoiceId'>;

/** A quiz as sent to the client. */
export type PublicQuiz = Omit<Quiz, 'questions'> & { questions: PublicQuestion[] };
