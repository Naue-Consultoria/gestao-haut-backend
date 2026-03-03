import { Response } from 'express';
import { ZodError } from 'zod';
import { ApiResponse } from '../types/api';

export function sendSuccess<T>(res: Response, data: T, status = 200) {
  const response: ApiResponse<T> = { success: true, data };
  res.status(status).json(response);
}

export function sendError(res: Response, error: string, status = 400) {
  const response: ApiResponse = { success: false, error };
  res.status(status).json(response);
}

export function handleValidationError(res: Response, err: unknown) {
  if (err instanceof ZodError) {
    const message = err.errors.map(e => e.message).join(', ');
    sendError(res, message, 400);
    return;
  }
  throw err;
}

export function getCurrentYear(): number {
  return new Date().getFullYear();
}

export function getCurrentMonth(): number {
  return new Date().getMonth();
}
