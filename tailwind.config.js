/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        cartoon: ["Shrikhand", "cursive"],
        retro: ["Fredoka", "sans-serif"],
      },
      colors: {
        "mascot-purple": {
          DEFAULT: "#593c52",
          light: "#845d7d",
          dark: "#3d2838",
          subtle: "#f3ecf2",
        },
        "vintage-cream": {
          DEFAULT: "#faf5ea",
          dark: "#ede2cb",
          light: "#fffdf9",
        },
        "vintage-yellow": "#ffd15c",
        "vintage-red": "#e63946",
        "vintage-teal": "#3db4a8",
      },
      boxShadow: {
        retro: "4px 4px 0px #000",
        "retro-sm": "2.5px 2.5px 0px #000",
        "retro-lg": "6px 6px 0px #000",
        "retro-xl": "8px 8px 0px #000",
      },
    },
  },
  plugins: [],
};
