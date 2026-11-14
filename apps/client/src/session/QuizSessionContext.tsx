import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react';
import { sessionReducer, type SessionAction, type SessionState } from './quizSession.reducer';

interface QuizSessionValue {
  session: SessionState;
  dispatch: Dispatch<SessionAction>;
}

const QuizSessionContext = createContext<QuizSessionValue | null>(null);

/** The session lives in memory only. A page refresh starts over. */
export function QuizSessionProvider({ children }: { children: ReactNode }) {
  const [session, dispatch] = useReducer(sessionReducer, null);
  const value = useMemo(() => ({ session, dispatch }), [session]);
  return <QuizSessionContext.Provider value={value}>{children}</QuizSessionContext.Provider>;
}

export function useQuizSession(): QuizSessionValue {
  const value = useContext(QuizSessionContext);
  if (!value) throw new Error('useQuizSession must be used inside QuizSessionProvider');
  return value;
}
