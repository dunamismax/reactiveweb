export const AUTH_USERNAME_MIN_LENGTH = 3;
export const AUTH_USERNAME_MAX_LENGTH = 32;
export const AUTH_USERNAME_REGEX = /^[a-z0-9](?:[a-z0-9._-]{1,30}[a-z0-9])?$/;
export const AUTH_USERNAME_POLICY_MESSAGE =
  "Use lowercase letters, numbers, dots, underscores, or hyphens. Start/end with a letter or number.";

export const AUTH_PASSWORD_MIN_LENGTH = 8;
export const AUTH_PASSWORD_MAX_LENGTH = 128;
export const AUTH_PASSWORD_POLICY_MESSAGE =
  "Password must be at least 8 characters and include at least one letter and one number.";

const PASSWORD_HAS_LETTER_REGEX = /[A-Za-z]/;
const PASSWORD_HAS_NUMBER_REGEX = /\d/;

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

export function getPasswordPolicyError(password: string) {
  if (!PASSWORD_HAS_LETTER_REGEX.test(password) || !PASSWORD_HAS_NUMBER_REGEX.test(password)) {
    return AUTH_PASSWORD_POLICY_MESSAGE;
  }

  return null;
}
