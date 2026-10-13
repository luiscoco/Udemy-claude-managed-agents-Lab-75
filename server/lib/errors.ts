import type { ErrorRequestHandler } from 'express';
import type { ZodError } from 'zod';
import type { ApiError } from '../../shared/contracts.js';

export function apiError(code: ApiError['error']['code'], message: string, validation?: ZodError): ApiError {
  return { error: { code, message, fieldErrors: validation?.issues.map((issue) => ({
    path: issue.path.map(String).join('.') || 'body', message: issue.message,
  })) ?? [] } };
}
export const apiErrorHandler: ErrorRequestHandler = (error: unknown, _request, response, _next) => {
  const status = typeof error === 'object' && error !== null && 'status' in error ? error.status : undefined;
  if (status === 400 || status === 413) {
    response.status(status).json(apiError('INVALID_REQUEST', status === 413 ? 'Request body is too large.' : 'Malformed JSON request.'));
  } else response.status(500).json(apiError('INTERNAL', 'The request could not be completed.'));
};
