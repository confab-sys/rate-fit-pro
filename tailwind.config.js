export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#0D1B2A",
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        'typewriter': {
          'from': { width: '0' },
          'to': { width: '17ch' }
        }
      },
      animation: {
        'fade-in': 'fade-in 0.6s ease-out',
        'typewriter': 'typewriter 2s steps(17) infinite',
        'cursor-blink': 'blink 0.7s steps(1) infinite'
      }
    },
  },
  plugins: [],
};
