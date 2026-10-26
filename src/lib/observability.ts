import { randomUUID } from "crypto";

export function requestId(): string {
  return randomBytesSafe();
}

function randomBytesSafe(): string {
  try {
    return randomUUID();
  } catch {
    return `req-${Date.now()}`;
  }
}

export function logStage(
  id: string,
  stage: string,
  fields: Record<string, string | number | boolean | null> = {}
): void {
  console.log(
    JSON.stringify({
      ts: new Date().toISOString(),
      requestId: id,
      stage,
      ...fields,
    })
  );
}
