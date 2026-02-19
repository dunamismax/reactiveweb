import { z } from "zod";

export const roleSchema = z.enum(["owner", "admin", "editor", "viewer"]);
export type Role = z.infer<typeof roleSchema>;

export function toRole(value: string): Role {
  if (value === "owner" || value === "admin" || value === "editor" || value === "viewer") {
    return value;
  }

  return "viewer";
}

const usernameRegex = /^[a-z0-9](?:[a-z0-9._-]{1,30}[a-z0-9])?$/;

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Username must be at least 3 characters.")
  .max(32, "Username must be 32 characters or less.")
  .regex(
    usernameRegex,
    "Use lowercase letters, numbers, dots, underscores, or hyphens. Start/end with a letter or number.",
  );

export const nameSchema = z.string().trim().min(2, "Name must be at least 2 characters.").max(80);

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(128, "Password must be 128 characters or less.");

export const userStatusSchema = z.enum(["active", "suspended"]);
export type UserStatus = z.infer<typeof userStatusSchema>;

export const demoUserSchema = z.object({
  id: z.string().uuid(),
  name: nameSchema,
  username: usernameSchema,
  mustChangePassword: z.boolean(),
  role: roleSchema,
  status: userStatusSchema,
  createdAt: z.string(),
  lastSeenAt: z.string(),
});
export type DemoUser = z.infer<typeof demoUserSchema>;

export const createUserInputSchema = z.object({
  name: nameSchema,
  username: usernameSchema,
  role: roleSchema,
  password: passwordSchema,
  confirmPassword: passwordSchema,
});
export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const signUpInputSchema = z.object({
  username: usernameSchema,
  name: nameSchema,
  password: passwordSchema,
  confirmPassword: passwordSchema,
});
export type SignUpInput = z.infer<typeof signUpInputSchema>;

export const signInInputSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
});
export type SignInInput = z.infer<typeof signInInputSchema>;

export const authActionSchema = z.discriminatedUnion("intent", [
  z.object({
    intent: z.literal("signIn"),
    username: usernameSchema,
    password: passwordSchema,
    callbackUrl: z.string().optional(),
  }),
  z.object({
    intent: z.literal("signUp"),
    username: usernameSchema,
    name: nameSchema,
    password: passwordSchema,
    confirmPassword: passwordSchema,
  }),
  z.object({
    intent: z.literal("signOut"),
    callbackUrl: z.string().optional(),
  }),
]);

export const usersActionSchema = z.discriminatedUnion("intent", [
  z.object({
    intent: z.literal("createUser"),
    name: nameSchema,
    username: usernameSchema,
    role: roleSchema,
    password: passwordSchema,
    confirmPassword: passwordSchema,
  }),
  z.object({
    intent: z.literal("cycleRole"),
    userId: z.string().uuid("Invalid user id."),
  }),
  z.object({
    intent: z.literal("toggleStatus"),
    userId: z.string().uuid("Invalid user id."),
  }),
]);

export const userDetailActionSchema = z.discriminatedUnion("intent", [
  z.object({
    intent: z.literal("cycleRole"),
    userId: z.string().uuid("Invalid user id."),
  }),
  z.object({
    intent: z.literal("toggleStatus"),
    userId: z.string().uuid("Invalid user id."),
  }),
  z.object({
    intent: z.literal("resetPassword"),
    userId: z.string().uuid("Invalid user id."),
    newPassword: passwordSchema,
    confirmPassword: passwordSchema,
  }),
]);

export const settingsActionSchema = z.discriminatedUnion("intent", [
  z.object({
    intent: z.literal("updateProfile"),
    name: nameSchema,
  }),
  z.object({
    intent: z.literal("changePassword"),
    currentPassword: passwordSchema,
    newPassword: passwordSchema,
    confirmPassword: passwordSchema,
  }),
]);

export type ActivityEvent = {
  id: string;
  actor: string;
  action: string;
  target: string;
  createdAt: string;
};

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
