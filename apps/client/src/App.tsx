import { Route, Routes } from 'react-router-dom';
import { IntroPage } from './pages/IntroPage';
import { QuestionPage } from './pages/QuestionPage';
import { QuizListPage } from './pages/QuizListPage';
import { ResultPage } from './pages/ResultPage';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<QuizListPage />} />
      <Route path="/quizzes/:id" element={<IntroPage />} />
      <Route path="/quizzes/:id/play" element={<QuestionPage />} />
      <Route path="/quizzes/:id/result" element={<ResultPage />} />
    </Routes>
  );
}
