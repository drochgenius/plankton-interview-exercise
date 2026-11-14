import type { NextFunction, Request, RequestHandler, Response } from 'express';

/** Express 4 ignores rejected promises, so forward them to the error middleware. */
export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    handler(req, res, next).catch(next);
  };
}
