import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { isPassing, type Scoreboard as ScoreboardData } from 'shared-types';
import { ApiError, getScoreboard, submitAnswers } from '../api';
import { Button, ButtonLink } from '../components/Button';
import { Actions, Card, ErrorBox, Layout } from '../components/Layout';
import { QuizProgress } from '../components/QuizProgress';
import { Scoreboard } from '../components/Scoreboard';
import { useQuizSession } from '../session/QuizSessionContext';
import { toAnswers } from '../session/quizSession.reducer';
import styles from './Pages.module.scss';

export function resultMessage(score: number, total: number): string {
  const percent = total === 0 ? 0 : (score / total) * 100;
  if (percent === 100) return 'Perfect! You got every question right!';
  if (percent >= 60) return 'Great job! You did well.';
  return 'Nice try! Practice makes you stronger.';
}

export function ResultPage() {
  const { id = '' } = useParams();
  const { session, dispatch } = useQuizSession();
  const [submitting, setSubmitting] = useState(false);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [scoreboard, setScoreboard] = useState<ScoreboardData | null>(null);

  const saved = session?.submission ?? null;

  // Loads the scoreboard once the score has been saved.
  useEffect(() => {
    if (!saved || scoreboard) return;
    let cancelled = false;
    getScoreboard(id)
      .then((data) => {
        if (!cancelled) setScoreboard(data);
      })
      .catch(() => {
        if (!cancelled) setErrorDetail('The scoreboard could not load. Your score is saved.');
      });
    return () => {
      cancelled = true;
    };
  }, [id, saved, scoreboard]);

  if (!session || session.quizId !== id || !session.score) {
    return <Navigate to={`/quizzes/${id}`} replace />;
  }

  const { score, total } = session.score;

  async function submit() {
    if (!session) return;
    setSubmitting(true);
    setErrorDetail(null);
    try {
      const submission = await submitAnswers(id, session.participantName, toAnswers(session));
      dispatch({ type: 'finish', submission });
    } catch (error) {
      setErrorDetail(error instanceof ApiError ? error.message : 'The server did not answer.');
      setSubmitting(false);
    }
  }

  return (
    <Layout>
      <QuizProgress total={total} completed={total} current={null} />
      <Card>
        <p className={styles.celebrate} aria-hidden="true">
          🎉
        </p>
        <h1>
          You got {score} out of {total}
        </h1>
        <p className={styles.score} aria-hidden="true">
          {score} / {total}
        </p>
        <p>{resultMessage(score, total)}</p>
        {errorDetail && <ErrorBox message="Oops! Something went wrong." detail={errorDetail} />}
        <Actions>
          <ButtonLink to="/">Back to quizzes</ButtonLink>
          {!saved && (
            <Button disabled={submitting} onClick={submit}>
              Submit Score
            </Button>
          )}
        </Actions>
      </Card>

      {saved && scoreboard && (
        <Scoreboard
          data={scoreboard}
          startOn={isPassing(score, total) ? 'passed' : 'failed'}
          yourId={saved.id}
        />
      )}
    </Layout>
  );
}
