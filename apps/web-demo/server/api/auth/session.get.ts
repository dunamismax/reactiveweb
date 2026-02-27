import { getDemoUserCount } from "@reactiveweb/db";

import { getSessionUser } from "../../utils/auth-session";

export default defineEventHandler(async (event) => {
  const user = await getSessionUser(event);

  if (!user) {
    return {
      isAuthenticated: false,
      currentUserName: "Visitor Session",
      userCount: 0,
      user: null,
    };
  }

  const userCount = await getDemoUserCount();

  return {
    isAuthenticated: true,
    currentUserName: user.name,
    userCount,
    user,
  };
});
