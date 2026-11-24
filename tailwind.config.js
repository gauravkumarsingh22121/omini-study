/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#9718FB',
          hover: '#830EE4',
          light: '#F4E6FF',
          dark: '#1E0532',
        },
        mindgrasp: {
          50: '#FAF5FF',
          100: '#F4E6FF',
          200: '#EAD1FD',
          300: '#D8B4FE',
          400: '#C084FC',
          500: '#A855F7',
          600: '#9718FB',
          700: '#7E12D3',
          800: '#640BA9',
          900: '#1E0532',
        },
        omini: {
          50: '#FAF5FF',
          100: '#F4E6FF',
          200: '#EAD1FD',
          300: '#D8B4FE',
          400: '#C084FC',
          500: '#A855F7',
          600: '#9718FB',
          700: '#7E12D3',
          800: '#640BA9',
          900: '#1E0532',
        },
        secondary: '#6A6A7A',
        dark: '#1A1A24',
      },
      fontFamily: {
        serif: ['Besley', 'Georgia', 'serif'],
        sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'mindgrasp': '0 10px 30px -5px rgba(151, 24, 251, 0.12), 0 4px 6px -2px rgba(151, 24, 251, 0.05)',
        'mindgrasp-lg': '0 20px 40px -10px rgba(151, 24, 251, 0.2)',
        'omini': '0 10px 30px -5px rgba(151, 24, 251, 0.12), 0 4px 6px -2px rgba(151, 24, 251, 0.05)',
        'omini-lg': '0 20px 40px -10px rgba(151, 24, 251, 0.2)',
      }
    },
  },
  plugins: [],
}
