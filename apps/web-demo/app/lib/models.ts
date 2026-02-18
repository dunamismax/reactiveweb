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
    intent: z.literal("createUser"),
    name: z.string().min(2, "Name must be at least 2 characters."),
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

export type ActivityEvent = {
  id: string;
  actor: string;
  action: string;
  target: string;
  createdAt: string;
};
