import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "hi", "es", "fr"],
  defaultLocale: "en",
  localePrefix: "always",
});
