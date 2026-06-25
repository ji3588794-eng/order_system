import type { ApiResult } from "../types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

export async function adminApi<T>(path: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const body = (await response.json().catch(() => ({}))) as ApiResult<T>;
  if (!response.ok || body.success === false) throw body;
  return body;
}
