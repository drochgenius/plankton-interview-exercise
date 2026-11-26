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

/** The result of checking answers, before anything is saved. */
export interface Score {
  score: number;
  total: number;
}

/** Percent of questions that must be right to pass. */
export const PASS_PERCENT = 50;

export function isPassing(score: number, total: number): boolean {
  return total > 0 && (score / total) * 100 >= PASS_PERCENT;
}

/** One row on a scoreboard. */
export type ScoreEntry = Pick<
  Submission,
  'id' | 'participantName' | 'score' | 'total' | 'submittedAt'
>;

export interface Scoreboard {
  /** Highest score first. */
  passed: ScoreEntry[];
  /** Lowest score first. */
  failed: ScoreEntry[];
}
