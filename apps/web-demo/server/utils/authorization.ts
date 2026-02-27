import { createError } from "h3";

import type { Role } from "./models";

type Actor = {
  id: string;
  role: Role;
};

type TargetUser = {
  id: string;
  role: Role;
};

function canManageUsers(role: Role) {
  return role === "owner" || role === "admin";
}

export function assertCanCreateUser(actor: Actor, desiredRole: Role) {
  if (!canManageUsers(actor.role)) {
    throw createError({
      statusCode: 403,
      statusMessage: "Only owner/admin accounts can create users.",
    });
  }

  if (actor.role === "admin" && (desiredRole === "owner" || desiredRole === "admin")) {
    throw createError({
      statusCode: 403,
      statusMessage: "Admin accounts cannot create owner/admin users.",
    });
  }
}

export function assertCanMutateUser(
  actor: Actor,
  target: TargetUser,
  intent: "cycleRole" | "toggleStatus" | "resetPassword",
) {
  if (!canManageUsers(actor.role)) {
    throw createError({
      statusCode: 403,
      statusMessage: "Only owner/admin accounts can update users.",
    });
  }

  if (actor.id === target.id) {
    const message =
      intent === "cycleRole"
        ? "You cannot change your own role."
        : intent === "toggleStatus"
          ? "You cannot change your own status."
          : "Use Settings to change your own password.";
    throw createError({ statusCode: 403, statusMessage: message });
  }

  if (actor.role === "admin" && (target.role === "owner" || target.role === "admin")) {
    throw createError({
      statusCode: 403,
      statusMessage: "Admin accounts cannot modify owner/admin users.",
    });
  }
}
