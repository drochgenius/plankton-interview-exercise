import '@fontsource/nunito/400.css';
import '@fontsource/nunito/700.css';
import '@fontsource/nunito/800.css';
import 'katex/dist/katex.min.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { routerFuture } from './routerFuture';
import { QuizSessionProvider } from './session/QuizSessionContext';
import './styles/global.scss';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter future={routerFuture}>
      <QuizSessionProvider>
        <App />
      </QuizSessionProvider>
    </BrowserRouter>
  </StrictMode>,
);
