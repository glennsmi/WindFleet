/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Map CSS variables to Tailwind color names
        primary: 'var(--color-primary)',
        'primary-dark': 'var(--color-primary-dark)',
        'teal-light': 'var(--color-teal-light)',
        'accent-warm': 'var(--color-accent-warm)',
        'accent-coral': 'var(--color-accent-coral)',
        'neutral-light': 'var(--color-neutral-light)',
        'neutral-dark': 'var(--color-neutral-dark)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
      },
    },
  },
  plugins: [],
}

 