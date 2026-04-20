import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "guild-bg": "var(--bg)",
        "guild-surface": "var(--surface)",
        "guild-surface-raised": "var(--surface-raised)",
        "guild-border": "var(--border)",
        "guild-border-subtle": "var(--border-subtle)",
        "guild-gold": "var(--gold)",
        "guild-gold-bright": "var(--gold-bright)",
        "guild-gold-dim": "var(--gold-dim)",
        "guild-text": "var(--text)",
        "guild-text-muted": "var(--text-muted)",
        "guild-text-faint": "var(--text-faint)",
        "guild-danger": "var(--danger)",
        "guild-success": "var(--success)",
      },
      fontFamily: {
        display: ["var(--font-cinzel-decorative)", "Georgia", "serif"],
        heading: ["var(--font-cinzel)", "Georgia", "serif"],
        body: ["var(--font-crimson)", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
