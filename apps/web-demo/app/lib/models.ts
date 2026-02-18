import { z } from "zod";

export const roleSchema = z.enum(["owner", "admin", "editor", "viewer"]);
export type Role = z.infer<typeof roleSchema>;
export function toRole(value: string): Role {
  if (value === "owner" || value === "admin" || value === "editor" || value === "viewer") {
    return value;
  }

  return "viewer";
}

export const userStatusSchema = z.enum(["active", "suspended"]);
export type UserStatus = z.infer<typeof userStatusSchema>;

export const demoUserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2),
  email: z.string().email(),
  role: roleSchema,
  status: userStatusSchema,
  createdAt: z.string(),
  lastSeenAt: z.string(),
});
export type DemoUser = z.infer<typeof demoUserSchema>;

export const createUserInputSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Enter a valid email address."),
  role: roleSchema,
});
export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const inviteUserInputSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  role: roleSchema,
});
export type InviteUserInput = z.infer<typeof inviteUserInputSchema>;

export const signInInputSchema = z.object({
  email: z.string().email("Use a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});
export type SignInInput = z.infer<typeof signInInputSchema>;

export const authActionSchema = z.discriminatedUnion("intent", [
  z.object({
    intent: z.literal("signIn"),
    email: z.string().email("Use a valid email address."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    callbackUrl: z.string().optional(),
  }),
  z.object({
    intent: z.literal("signOut"),
    callbackUrl: z.string().optional(),
  }),
]);

export const usersActionSchema = z.discriminatedUnion("intent", [
  z.object({
    intent: z.literal("inviteUser"),
    email: z.string().email("Enter a valid email address."),
    role: roleSchema,
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

export const settingsActionSchema = z.discriminatedUnion("intent", [
  z.object({
    intent: z.literal("updateProfile"),
    name: z.string().min(2, "Name must be at least 2 characters."),
  }),
  z.object({
    intent: z.literal("changePassword"),
    currentPassword: z.string().min(8, "Current password must be at least 8 characters."),
    newPassword: z.string().min(8, "New password must be at least 8 characters."),
    confirmPassword: z.string().min(8, "Confirmation password must be at least 8 characters."),
  }),
]);

export const inviteAcceptSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters."),
  confirmPassword: z.string().min(8, "Confirmation password must be at least 8 characters."),
});

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
