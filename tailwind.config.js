/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class", // 👈 el tema lo controla la clase .dark en <html>
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  // Mantén utilidades/ clases que podrías usar condicionalmente
  safelist: [
    // Para evitar que se purguen estas utilidades arbitrarias que ya usas
    "[color-scheme:light]",
    "dark:[color-scheme:dark]",

    // Tus clases de componentes (por si se renderizan condicionalmente)
    "page-shell",
    "page-surface",
    "users-shell",
    "users-thead",
    "users-counter",
    "force-ink",
    "btn", "btn--cyan", "btn--rose", "btn-new",
    "pill",
    "pill--role-admin", "pill--role-sub", "pill--role-user",
    "pill--ok", "pill--off",
  ],

  theme: {
    extend: {
      colors: {
        // Paleta de marca (opcional)
        primary: {
          50:  "#fffbea",
          100: "#fff3c4",
          200: "#fce588",
          300: "#fadb5f",
          400: "#f7c948",
          500: "#f0b429",
          600: "#de911d",
          700: "#cb6e17",
          800: "#b44d12",
          900: "#8d2b0b",
        },
      },
      boxShadow: {
        glow: "0 0 10px rgba(255,214,10,0.6)",
      },
      // (Opcional) alias para gradientes si los quieres reutilizar como utilities
      backgroundImage: {
        "app-radial-a":
          "radial-gradient(1200px 600px at 10% -10%, var(--tw-gradient-from) 0%, transparent 60%)",
        "app-radial-b":
          "radial-gradient(900px 500px at 110% 0%, var(--tw-gradient-from) 0%, transparent 55%)",
      },
    },
  },

  plugins: [
    // deja vacío si no tienes instalados plugins; añade los que uses:
    // require("@tailwindcss/forms"),
    // require("@tailwindcss/typography"),
  ],
};
