const DEFAULT_ADMIN_USERNAME = "fenatti";

export function getAdminUsername() {
  return process.env.ADMIN_USERNAME?.trim() || DEFAULT_ADMIN_USERNAME;
}

export function getAdminLoginEmail() {
  const configuredEmail = process.env.ADMIN_LOGIN_EMAIL?.trim();
  if (configuredEmail) return configuredEmail;

  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim())
    .find(Boolean) ?? "";
}

export function isAdminEmail(email: string | undefined | null) {
  if (!email) return false;
  const allowed = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(email.toLowerCase());
}

export function isAdminUsername(username: string | undefined | null) {
  return Boolean(username && username.trim().toLowerCase() === getAdminUsername().toLowerCase());
}

