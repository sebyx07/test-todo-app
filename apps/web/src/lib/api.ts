// One job: every HTTP call to the API goes through here. No fetch() elsewhere.
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const BASE_URL: string = import.meta.env['VITE_API_URL'] ?? '/api';

export async function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { accept: 'application/json' },
    ...init,
  });

  if (!response.ok) throw new ApiError(response.status, `GET ${path} failed`);

  return (await response.json()) as T;
}
