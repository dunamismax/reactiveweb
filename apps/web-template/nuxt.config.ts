export default defineNuxtConfig({
  compatibilityDate: "2026-02-27",
  devtools: { enabled: false },
  css: ["~/assets/css/main.css"],
  modules: ["@nuxtjs/tailwindcss"],
  runtimeConfig: {
    public: {
      appName: process.env.NUXT_PUBLIC_APP_NAME ?? "ReactiveWeb Template",
    },
  },
  typescript: {
    strict: true,
    typeCheck: false,
  },
});
