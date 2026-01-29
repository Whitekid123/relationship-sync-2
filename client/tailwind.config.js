/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                pastelPink: '#FF9A9E',
                pastelPurple: '#FECFEF',
                pastelBlue: '#A1C4FD',
            }
        },
    },
    plugins: [],
}
