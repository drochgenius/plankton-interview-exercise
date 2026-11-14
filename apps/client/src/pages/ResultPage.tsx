import { Navigate, useParams } from 'react-router-dom';
import { ButtonLink } from '../components/Button';
import { Actions, Card, Layout } from '../components/Layout';
import { QuizProgress } from '../components/QuizProgress';
import { useQuizSession } from '../session/QuizSessionContext';
import styles from './Pages.module.scss';

export function resultMessage(score: number, total: number): string {
  const percent = total === 0 ? 0 : (score / total) * 100;
  if (percent === 100) return 'Perfect! You got every question right!';
  if (percent >= 60) return 'Great job! You did well.';
  return 'Nice try! Practice makes you stronger.';
}

export function ResultPage() {
  const { id = '' } = useParams();
  const { session } = useQuizSession();

  if (!session || session.quizId !== id || !session.submission) {
    return <Navigate to={`/quizzes/${id}`} replace />;
  }

  const { score, total } = session.submission;

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
        <Actions>
          <ButtonLink to="/">Back to quizzes</ButtonLink>
        </Actions>
      </Card>
    </Layout>
  );
}
