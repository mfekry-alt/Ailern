/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Figma Design Tokens - Support both direct usage and scale
        primary: {
          DEFAULT: '#2563EB', // Blue-600 matching the header/button
          50: '#0d7ff2', // Azure Radiance
          500: '#2563eb', // Royal Blue
          600: '#2563eb',
          700: '#1d4ed8',
        },
        secondary: {
          DEFAULT: '#3B82F6',
          600: '#3B82F6',
        },
        'background-light': '#F8FAFC', // Slate-50 matching dashboard bg
        'background-dark': '#0F172A', // Slate-900
        'card-light': '#FFFFFF',
        'card-dark': '#1E293B',
        'text-main-light': '#1E293B',
        'text-main-dark': '#F1F5F9',
        'text-muted-light': '#64748B',
        'text-muted-dark': '#94A3B8',
        azure: {
          8: '#111318',  // Woodsmoke
          11: '#111827', // Ebony
          46: '#60758a', // Lynch
          50: '#0d7ff2', // Azure Radiance
          53: '#2563eb', // Royal Blue
          88: '#dbe0e6', // Border color
        },
        grey: {
          46: '#6b7280', // Pale Sky
          93: '#dcfce7', // Border
          96: '#f3f4f6', // Athens Gray
        },
        white: {
          solid: '#ffffff',
        },
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
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
      },
      fontFamily: {
        sans: ['Public Sans', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Public Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        14: '14px',
        20: '20px',
        30: '30px',
      },
      lineHeight: {
        20: '20px',
        28: '28px',
        36: '36px',
        37.5: '37.5px',
      },
      letterSpacing: {
        '-0.75': '-0.75px',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '112': '28rem',
        '128': '32rem',
      },
      boxShadow: {
        'figma': '0px 10px 25px -5px rgba(0,0,0,0.05), 0px 10px 10px -5px rgba(0,0,0,0.05)',
        'soft': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'medium': '0 4px 12px rgba(0, 0, 0, 0.1)',
        'large': '0 8px 24px rgba(0, 0, 0, 0.12)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}

