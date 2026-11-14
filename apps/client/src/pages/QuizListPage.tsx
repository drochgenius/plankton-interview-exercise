import { listQuizzes } from '../api';
import { ButtonLink } from '../components/Button';
import { Layout } from '../components/Layout';
import { LoadError, Loading } from '../components/QueryStatus';
import { useQuery } from '../hooks/useQuery';
import styles from './Pages.module.scss';

export function QuizListPage() {
  const query = useQuery(listQuizzes);

  return (
    <Layout>
      <h1>Pick a quiz</h1>
      {query.status === 'loading' && <Loading />}
      {query.status === 'error' && <LoadError what="the quizzes" onRetry={query.reload} />}
      {query.status === 'success' && (
        <ul className={styles.quizList}>
          {query.data.map((quiz) => (
            <li key={quiz.id} className={styles.quizItem}>
              <h2>{quiz.title}</h2>
              <p>{quiz.description}</p>
              <p className={styles.meta}>{quiz.questionCount} questions</p>
              <ButtonLink to={`/quizzes/${quiz.id}`} aria-label={`Choose ${quiz.title}`}>
                Choose quiz
              </ButtonLink>
            </li>
          ))}
        </ul>
      )}
    </Layout>
  );
}
