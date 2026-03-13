/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                inter: ["Inter", "sans-serif"],
            },
            colors: {
                brand: {
                    50: "#f0e9ff",
                    100: "#ddd0ff",
                    200: "#bba3ff",
                    300: "#9975ff",
                    400: "#7747ff",
                    500: "#6025f5",
                    600: "#5118d4",
                    700: "#420ea8",
                    800: "#32087c",
                    900: "#1e0450",
                },
            },
            animation: {
                "scan-beam": "scanBeam 2s ease-in-out infinite",
                "pulse-ring": "pulseRing 2s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite",
                "fade-up": "fadeUp 0.5s ease-out forwards",
                "spin-slow": "spin 3s linear infinite",
            },
            keyframes: {
                scanBeam: {
                    "0%, 100%": { transform: "translateY(0%)", opacity: "0.8" },
                    "50%": { transform: "translateY(200px)", opacity: "1" },
                },
                pulseRing: {
                    "0%": { transform: "scale(0.95)", boxShadow: "0 0 0 0 rgba(96, 37, 245, 0.7)" },
                    "70%": { transform: "scale(1)", boxShadow: "0 0 0 12px rgba(96, 37, 245, 0)" },
                    "100%": { transform: "scale(0.95)", boxShadow: "0 0 0 0 rgba(96, 37, 245, 0)" },
                },
                fadeUp: {
                    "0%": { opacity: "0", transform: "translateY(24px)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
            },
        },
    },
    plugins: [],
}
