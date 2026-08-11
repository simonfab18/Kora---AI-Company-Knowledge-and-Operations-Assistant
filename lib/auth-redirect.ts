export function getSafeAuthRedirect(value: string | null | undefined, fallback = "/app") {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : fallback;
}

export function isInvitationRedirect(path: string) {
  return path.startsWith("/invitations/");
}