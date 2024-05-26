/** @type {import('tailwindcss').Config} */
import animationDelay from "tailwindcss-animation-delay";
export default {
    plugins: [animationDelay],
    theme: {
        extend: {
            fontFamily: {
                custom: ["AudioWide", "sans-serif"],
            },
            animation: {
                "fade-in": "fadeIn 0.5s ease-in forwards",
                "fade-out": "fadeOut 0.5s ease-out forwards",
            },
            keyframes: {
                fadeIn: {
                    "0%": { opacity: 0 },
                    "100%": { opacity: 1 },
                },
                fadeOut: {
                    "0%": { opacity: 1 },
                    "100%": { opacity: 0 },
                },
            },
        },
    },
    content: ["./index.html", "./src/**/*.{svelte,js,ts}"], // for unused CSS
    variants: {
        extend: {},
    },
    darkMode: false, // or 'media' or 'class'
};
