# DartZone

A modern SvelteKit web application for managing darts league matches between clubs. Features an interactive SVG dartboard with click detection, real-time scoring, GSAP-powered celebration animations, and a full league table system.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | SvelteKit (Svelte 5 with runes) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 + DaisyUI |
| Animations | GSAP (GreenSock) |
| Dartboard | Custom SVG with click detection |
| Testing | Vitest + Playwright |

## Features

- **Club Management** - Create, edit, and manage clubs with crests and rosters
- **Season & League** - Organize seasons, schedule matches, track standings
- **Interactive Dartboard** - SVG-based dartboard with precise sector detection (Single, Double, Triple, Bull, Bullseye)
- **Live Scoring** - Real-time score calculation, checkout suggestions, turn management, undo support
- **Animations** - Celebrations for Bullseye, Triple 20, 180, and checkouts
- **Statistics** - Player averages, checkout percentages, heatmaps, and progression charts

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Testing

```bash
# Unit & component tests
npm run test

# E2E tests
npx playwright test
```

### Build

```bash
npm run build
npm run preview
```

## License

See [LICENSE](LICENSE) for details.
