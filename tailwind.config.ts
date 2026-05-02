const config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#0F6E56',
          light: '#E1F5EE',
          mid: '#1D9E75',
          dark: '#085041',
        },
        page: {
          white: '#FFFFFF',
          cream: '#F7F6F1',
          card: '#E8E8E4',
        },
        ink: {
          primary: '#0D0D0D',
          secondary: '#6B6B6B',
          muted: '#9B9B9B',
          footer: '#444444',
        },
        verdict: {
          misleading: '#EF9F27',
          misleadingText: '#412402',
          true: '#1D9E75',
          trueText: '#FFFFFF',
          unverifiable: '#E8E8E4',
          unverifiableText: '#5F5E5A',
        },
        cta: {
          amber: '#EF9F27',
          amberText: '#412402',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
