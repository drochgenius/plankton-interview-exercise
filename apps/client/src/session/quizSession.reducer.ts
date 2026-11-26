import type { Answer, PublicQuestion, Score, Submission } from 'shared-types';

export interface QuizSessionState {
  quizId: string;
  participantName: string;
  /** Already shuffled. */
  questions: PublicQuestion[];
  currentIndex: number;
  /** Chosen choice id for each question id. */
  answers: Record<string, string>;
  /** Set when the quiz is finished and checked. Not saved yet. */
  score: Score | null;
  /** Set once the score has been saved. */
  submission: Submission | null;
}

/** `null` means there is no session yet. */
export type SessionState = QuizSessionState | null;

export type SessionAction =
  | { type: 'start'; quizId: string; participantName: string; questions: PublicQuestion[] }
  | { type: 'selectAnswer'; choiceId: string }
  | { type: 'next' }
  | { type: 'scored'; score: Score }
  | { type: 'finish'; submission: Submission };

/** The answers the player chose, in question order. Unanswered questions are left out. */
export function toAnswers(session: QuizSessionState): Answer[] {
  return session.questions.flatMap((q) => {
    const choiceId = session.answers[q.id];
    return choiceId ? [{ questionId: q.id, choiceId }] : [];
  });
}

export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'start':
      return {
        quizId: action.quizId,
        participantName: action.participantName,
        questions: action.questions,
        currentIndex: 0,
        answers: {},
        score: null,
        submission: null,
      };
    case 'selectAnswer': {
      const question = state?.questions[state.currentIndex];
      if (!state || !question) return state;
      return { ...state, answers: { ...state.answers, [question.id]: action.choiceId } };
    }
    case 'next':
      if (!state || state.currentIndex >= state.questions.length - 1) return state;
      return { ...state, currentIndex: state.currentIndex + 1 };
    case 'scored':
      return state ? { ...state, score: action.score } : state;
    case 'finish':
      return state ? { ...state, submission: action.submission } : state;
  }
}
