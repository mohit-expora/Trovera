/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#9b72cf",
        "primary-foreground": "#f8f6ff",
        secondary: "#7ba7e0",
        accent: "#d982a8",
        success: "#74c49a",
        warning: "#e8c96a",
        destructive: "#d97a7a",
        background: "#f8f6ff",
        card: "#ffffff",
        border: "#dcd9ee",
        muted: "#f0eef8",
        "muted-foreground": "#6b6a80",
        foreground: "#1a1a2e",
        "card-foreground": "#1a1a2e",
      },
    },
  },
  plugins: [],
};
