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
          // X-like blue
          50: '#e8f5fd',
          100: '#d1ebfb',
          500: '#1d9bf0',
          600: '#1a8cd8',
          700: '#1677b6',
          900: '#0a334d',
        },
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        },
        // X-like neutrals for dark admin surfaces
        x: {
          bg: '#0b0f14',
          panel: '#0f141b',
          panel2: '#121823',
          border: 'rgba(255,255,255,0.10)',
          text: '#e7e9ea',
          muted: 'rgba(231,233,234,0.72)',
        },
      }
    },
  },
  plugins: [],
}
