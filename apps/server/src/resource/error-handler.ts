import type { ErrorRequestHandler } from 'express';
import { NotFoundError, ValidationError } from '../services/errors.ts';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ValidationError) {
    res.status(400).json({ error: err.message });
    return;
  }
  if (err instanceof NotFoundError) {
    res.status(404).json({ error: err.message });
    return;
  }
  // Malformed JSON bodies are rejected by express.json().
  if (err?.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'The request body is not valid JSON.' });
    return;
  }
  console.error('Unexpected error:', err);
  res.status(500).json({ error: 'Something went wrong on the server.' });
};
