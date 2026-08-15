export function getSafeAuthRedirect(value: string | null | undefined, fallback = "/app") {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : fallback;
}

export function getAuthCallbackUrl(origin: string, next: string) {
  const safeOrigin = origin.replace(/\/$/, "");
  return `${safeOrigin}/auth/callback?next=${encodeURIComponent(getSafeAuthRedirect(next))}`;
}

export function isInvitationRedirect(path: string) {
  return path.startsWith("/invitations/");
}

export function isPasswordResetRedirect(path: string) {
  return path === "/reset-password/update";
}
