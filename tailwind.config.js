/** @type {import('tailwindcss').Config} */
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
        // neutral surfaces + a single blue accent
        brandBg: '#0c0f16',          // near-black charcoal
        cardBg: '#111827',           // primary surface
        panelBg: '#161f2e',          // secondary surface
        brandPrimary: '#0f8bff',     // accent
        brandPrimaryDark: '#0b6dc7', // accent hover
      },
      fontSize: {
        brand: ["2.25rem", { lineHeight: "1.1" }],      // ~36px
        brandLg: ["2.75rem", { lineHeight: "1.1" }],   // ~44px
        tagline: ["1rem", { lineHeight: "1.2" }],      // 16px
        taglineLg: ["1.125rem", { lineHeight: "1.25" }], // 18px
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
