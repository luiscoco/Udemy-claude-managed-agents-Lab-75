import { apiErrorSchema } from '../../shared/contracts';
import type { ApiError } from '../../shared/contracts';
import type { z } from 'zod';

export class ApiFailure extends Error {
  constructor(public readonly detail: ApiError) { super(detail.error.message); }
}
export async function request<T>(path: string, schema: z.ZodType<T>, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5_000);
  try {
    const signal = options.signal ? AbortSignal.any([options.signal, controller.signal]) : controller.signal;
    const response = await fetch(path, { ...options, signal });
    const body: unknown = await response.json();
    if (!response.ok) {
      const error = apiErrorSchema.safeParse(body);
      if (error.success) throw new ApiFailure(error.data);
      throw new Error(`Request failed (HTTP ${response.status}).`);
    }
    return schema.parse(body);
  } finally { clearTimeout(timer); }
}
export function pause(signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    signal.throwIfAborted();
    const cancel = () => { clearTimeout(timer); signal.removeEventListener('abort', cancel); reject(new Error('Cancelled')); };
    const timer = setTimeout(() => { signal.removeEventListener('abort', cancel); resolve(); }, 100);
    signal.addEventListener('abort', cancel, { once: true });
  });
}
