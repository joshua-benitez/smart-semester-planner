module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        brandBg: '#0b0d12',
        cardBg: '#0f1116',
        panelBg: '#13151c',
        brandPrimary: '#0f8bff',
        brandPrimaryDark: '#0b6dc7',
      },
      fontFamily: {
        sans: ['Geist', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'system-ui', 'sans-serif'],
        mono: ['Geist Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        brand: ["2.25rem", { lineHeight: "1.1" }],
        brandLg: ["2.75rem", { lineHeight: "1.1" }],
        tagline: ["1rem", { lineHeight: "1.2" }],
        taglineLg: ["1.125rem", { lineHeight: "1.25" }],
      },
      borderRadius: {
        card: '12px',
        badge: '8px',
      },
      boxShadow: {
        soft: '0 2px 8px rgba(0,0,0,0.15)',
        card: '0 4px 12px rgba(0,0,0,0.2)',
      },
    },
  },
  plugins: [],
}
