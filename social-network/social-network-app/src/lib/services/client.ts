import { SERVICE_URLS, type ServiceName } from "./config";

export class ServiceError extends Error {
  constructor(
    public service: ServiceName,
    public status: number,
    message: string
  ) {
    super(`${service} responded ${status}: ${message}`);
  }
}

export async function callService<T>(
  service: ServiceName,
  path: string,
  init?: RequestInit
): Promise<T> {
  const url = `${SERVICE_URLS[service]}${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
      cache: "no-store",
    });
  } catch (err) {
    throw new ServiceError(service, 0, `unreachable at ${url} (${(err as Error).message})`);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new ServiceError(service, res.status, body || res.statusText);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
