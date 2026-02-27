import { z } from "zod";
import {
  AUTH_PASSWORD_MAX_LENGTH,
  AUTH_PASSWORD_MIN_LENGTH,
  AUTH_PASSWORD_POLICY_MESSAGE,
  AUTH_USERNAME_MAX_LENGTH,
  AUTH_USERNAME_MIN_LENGTH,
  AUTH_USERNAME_POLICY_MESSAGE,
  AUTH_USERNAME_REGEX,
  getPasswordPolicyError,
  normalizeUsername,
} from "./auth-policy";

export const roleSchema = z.enum(["owner", "admin", "editor", "viewer"]);
export type Role = z.infer<typeof roleSchema>;

export function toRole(value: string): Role {
  if (value === "owner" || value === "admin" || value === "editor" || value === "viewer") {
    return value;
  }

  return "viewer";
}

export const usernameSchema = z.preprocess(
  (value) => (typeof value === "string" ? normalizeUsername(value) : value),
  z
    .string()
    .min(
      AUTH_USERNAME_MIN_LENGTH,
      `Username must be at least ${AUTH_USERNAME_MIN_LENGTH} characters.`,
    )
    .max(
      AUTH_USERNAME_MAX_LENGTH,
      `Username must be ${AUTH_USERNAME_MAX_LENGTH} characters or less.`,
    )
    .regex(AUTH_USERNAME_REGEX, AUTH_USERNAME_POLICY_MESSAGE),
);

export const nameSchema = z.string().trim().min(2, "Name must be at least 2 characters.").max(80);

export const passwordSchema = z
  .string()
  .min(
    AUTH_PASSWORD_MIN_LENGTH,
    `Password must be at least ${AUTH_PASSWORD_MIN_LENGTH} characters.`,
  )
  .max(AUTH_PASSWORD_MAX_LENGTH, `Password must be ${AUTH_PASSWORD_MAX_LENGTH} characters or less.`)
  .refine((value) => !getPasswordPolicyError(value), {
    message: AUTH_PASSWORD_POLICY_MESSAGE,
  });

export const createUserInputSchema = z
  .object({
    name: nameSchema,
    username: usernameSchema,
    role: roleSchema,
    password: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine((input) => input.password === input.confirmPassword, {
    message: "Password confirmation does not match.",
    path: ["confirmPassword"],
  });

export const signUpInputSchema = z
  .object({
    username: usernameSchema,
    name: nameSchema,
    password: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine((input) => input.password === input.confirmPassword, {
    message: "Password confirmation does not match.",
    path: ["confirmPassword"],
  });

export const signInInputSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
});

export const updateProfileInputSchema = z.object({
  name: nameSchema,
});

export const changePasswordInputSchema = z
  .object({
    currentPassword: passwordSchema,
    newPassword: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine((input) => input.newPassword === input.confirmPassword, {
    message: "New password confirmation does not match.",
    path: ["confirmPassword"],
  });

export const resetPasswordInputSchema = z
  .object({
    newPassword: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine((input) => input.newPassword === input.confirmPassword, {
    message: "Password confirmation does not match.",
    path: ["confirmPassword"],
  });

export const activityQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  action: z.string().optional(),
  actor: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  q: z.string().optional(),
});

export type ActivityQuery = z.infer<typeof activityQuerySchema>;

export type DemoUser = {
  id: string;
  name: string;
  username: string;
  mustChangePassword: boolean;
  role: Role;
  status: "active" | "suspended";
  createdAt: string;
  lastSeenAt: string;
};

export type ActivityEvent = {
  id: string;
  actor: string;
  action: string;
  target: string;
  createdAt: string;
};
