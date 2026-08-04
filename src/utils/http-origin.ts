export function hasTrustedOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const requestHost = forwardedHost || request.headers.get("host");

  if (!origin || !requestHost) return false;

  try {
    return new URL(origin).host === requestHost;
  } catch {
    return false;
  }
}
