import { useCallback, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getQuiz } from '../api';
import { Button } from '../components/Button';
import { Actions, Card, Layout } from '../components/Layout';
import { LoadError, Loading } from '../components/QueryStatus';
import { QuizProgress } from '../components/QuizProgress';
import { useQuery } from '../hooks/useQuery';
import { useQuizSession } from '../session/QuizSessionContext';
import { shuffle } from '../session/shuffle';
import styles from './Pages.module.scss';

const STEPS = [
  'Type your name.',
  'Read each question.',
  'Tap the answer you think is right.',
  'Press Next to go on.',
  'See your score at the end!',
];

export function IntroPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { dispatch } = useQuizSession();
  const [name, setName] = useState('');
  const query = useQuery(useCallback(() => getQuiz(id), [id]));

  const canStart = name.trim() !== '';

  function start(event: FormEvent) {
    event.preventDefault();
    if (!canStart || query.status !== 'success') return;
    dispatch({
      type: 'start',
      quizId: id,
      participantName: name.trim(),
      questions: shuffle(query.data.questions),
    });
    navigate(`/quizzes/${id}/play`);
  }

  if (query.status === 'loading') {
    return (
      <Layout>
        <Loading />
      </Layout>
    );
  }
  if (query.status === 'error') {
    return (
      <Layout>
        <LoadError what="this quiz" onRetry={query.reload} />
      </Layout>
    );
  }

  const quiz = query.data;
  const total = quiz.questions.length;

  return (
    <Layout>
      <QuizProgress total={total} completed={0} current={null} />
      <Card>
        <h1>{quiz.title}</h1>
        <p>{quiz.description}</p>
        <p>
          This quiz has {total} questions. You see one question at a time. You cannot go back. Your
          score is saved at the end.
        </p>
        <ol className={styles.steps}>
          {STEPS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <form onSubmit={start}>
          <label className={styles.label} htmlFor="participant-name">
            Your name
          </label>
          <input
            id="participant-name"
            className={styles.nameInput}
            value={name}
            autoComplete="off"
            onChange={(event) => setName(event.target.value)}
          />
          <Actions hint={canStart ? undefined : 'Type your name to start.'}>
            <Button type="submit" disabled={!canStart}>
              Start quiz
            </Button>
          </Actions>
        </form>
      </Card>
    </Layout>
  );
}
