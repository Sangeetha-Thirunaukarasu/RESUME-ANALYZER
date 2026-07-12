/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // <-- Crucial: Must scan every nested source file
  ],
  theme: {
    extend: {
      animation: {
        fadeIn: "fadeIn 0.3s ease-out forwards",
        scaleIn: "scaleIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.9)" },
          "100%": { transform: "scale(1)" },
        }
      }
    },
  },
  plugins: [],
}
