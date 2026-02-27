import { getSafeAuthRedirectTarget } from "~/utils/auth-redirect";

export default defineNuxtRouteMiddleware(async (to) => {
  const { session, refresh } = useSession();
  const state = session.value.isAuthenticated ? session.value : await refresh();

  if (state.isAuthenticated) {
    return navigateTo(getSafeAuthRedirectTarget(to.query.next));
  }
});
