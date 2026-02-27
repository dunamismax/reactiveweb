import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const PASSWORD_VERSION = "scrypt.v1";
const DEFAULT_SALT_BYTES = 16;
const DEFAULT_KEY_BYTES = 64;
const BOOTSTRAP_PASSWORD_SALT = "reactiveweb-web-demo-bootstrap";

function parseHash(encoded: string) {
  const [version, salt, keyHex] = encoded.split(":");
  if (!version || !salt || !keyHex) return null;
  if (version !== PASSWORD_VERSION) return null;
  if (!/^[0-9a-f]+$/i.test(keyHex)) return null;

  return {
    salt,
    key: Buffer.from(keyHex, "hex"),
  };
}

export function hashPasswordWithSalt(password: string, salt: string) {
  const derived = scryptSync(password, salt, DEFAULT_KEY_BYTES);
  return `${PASSWORD_VERSION}:${salt}:${derived.toString("hex")}`;
}

export function hashPassword(password: string) {
  const salt = randomBytes(DEFAULT_SALT_BYTES).toString("hex");
  return hashPasswordWithSalt(password, salt);
}

export function hashBootstrapPassword(password: string) {
  return hashPasswordWithSalt(password, BOOTSTRAP_PASSWORD_SALT);
}

export function verifyPassword(password: string, encodedHash: string) {
  const parsed = parseHash(encodedHash);
  if (!parsed) return false;

  const derived = scryptSync(password, parsed.salt, parsed.key.length);
  return timingSafeEqual(parsed.key, derived);
}
