export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path.startsWith("/auth")) {
    return;
  }

  const { session, refresh } = useSession();
  const state = session.value.isAuthenticated ? session.value : await refresh();

  if (!state.isAuthenticated) {
    return navigateTo({
      path: "/auth",
      query: {
        next: to.fullPath,
      },
    });
  }

  if (state.user?.mustChangePassword && !to.path.startsWith("/settings")) {
    return navigateTo("/settings?required=password-change");
  }
});
