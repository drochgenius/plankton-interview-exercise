import type { PublicQuestion, Submission } from 'shared-types';

export interface QuizSessionState {
  quizId: string;
  participantName: string;
  /** Already shuffled. */
  questions: PublicQuestion[];
  currentIndex: number;
  /** Chosen choice id for each question id. */
  answers: Record<string, string>;
  submission: Submission | null;
}

/** `null` means there is no session yet. */
export type SessionState = QuizSessionState | null;

export type SessionAction =
  | { type: 'start'; quizId: string; participantName: string; questions: PublicQuestion[] }
  | { type: 'selectAnswer'; choiceId: string }
  | { type: 'next' }
  | { type: 'finish'; submission: Submission };

export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'start':
      return {
        quizId: action.quizId,
        participantName: action.participantName,
        questions: action.questions,
        currentIndex: 0,
        answers: {},
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
    case 'finish':
      return state ? { ...state, submission: action.submission } : state;
  }
}
