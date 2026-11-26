import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { ApiError, scoreAnswers } from '../api';
import { Button } from '../components/Button';
import { ChoiceCard } from '../components/ChoiceCard';
import choiceStyles from '../components/ChoiceCard.module.scss';
import { Actions, Card, ErrorBox, Layout } from '../components/Layout';
import { MathText } from '../components/MathText';
import { QuizProgress } from '../components/QuizProgress';
import { useQuizSession } from '../session/QuizSessionContext';
import { toAnswers } from '../session/quizSession.reducer';

export function QuestionPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { session, dispatch } = useQuizSession();
  const [submitting, setSubmitting] = useState(false);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  if (!session || session.quizId !== id) {
    return <Navigate to={`/quizzes/${id}`} replace />;
  }
  // Already finished (for example the player pressed the browser Back button).
  if (session.score) {
    return <Navigate to={`/quizzes/${id}/result`} replace />;
  }

  const total = session.questions.length;
  const index = session.currentIndex;
  const question = session.questions[index];
  if (!question) return <Navigate to={`/quizzes/${id}`} replace />;

  const selected = session.answers[question.id];
  const isLast = index === total - 1;

  async function finish() {
    if (!session) return;
    setSubmitting(true);
    setErrorDetail(null);
    try {
      const score = await scoreAnswers(id, session.participantName, toAnswers(session));
      dispatch({ type: 'scored', score });
      navigate(`/quizzes/${id}/result`);
    } catch (error) {
      setErrorDetail(error instanceof ApiError ? error.message : 'The server did not answer.');
      setSubmitting(false);
    }
  }

  const failed = errorDetail !== null;
  const label = failed ? 'Try again' : isLast ? 'Finish' : 'Next';
  const onClick = isLast ? finish : () => dispatch({ type: 'next' });

  return (
    <Layout>
      <QuizProgress total={total} completed={index} current={index} />
      <Card>
        <fieldset className={choiceStyles.choices} key={question.id}>
          <legend className={choiceStyles.question}>
            <MathText text={question.text} />
          </legend>
          {question.choices.map((choice) => (
            <ChoiceCard
              key={choice.id}
              name={question.id}
              choice={choice}
              selected={selected === choice.id}
              onSelect={(choiceId) => dispatch({ type: 'selectAnswer', choiceId })}
            />
          ))}
        </fieldset>
        {failed && (
          <ErrorBox
            message="Oops! We could not check your answers. Please try again."
            detail={errorDetail}
          />
        )}
        <Actions hint={selected ? undefined : 'Pick an answer to go on.'}>
          <Button disabled={!selected || submitting} onClick={onClick}>
            {label}
          </Button>
        </Actions>
      </Card>
    </Layout>
  );
}
