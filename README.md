# 🧧 Lucky ADA

> Send lucky money (lì xì) this Lunar New Year — on Cardano.

Lucky ADA is a web dApp for gifting ADA in digital red envelopes. Create a
batch of gift envelopes, protect them with a secret-word puzzle, and share a
claim code with friends and family. Recipients unscramble the secret word to
claim their lucky money straight to their Cardano wallet.

## ✨ Features

- **Create gifts** — fund one or more red envelopes with ADA from your
  connected Cardano wallet, with a live summary of the total amount and
  estimated transaction fees.
- **Secret-word quiz** — protect each gift with a word or phrase. Recipients
  must rearrange shuffled characters to guess it before they can claim.
- **Claim by code** — anyone with a gift code can open the claim page, solve
  the puzzle, and receive ADA.
- **Cardano wallet integration** — connect any CIP-30 browser wallet (Nami,
  Eternl, Lace, etc.) via the [Mesh SDK](https://meshjs.dev/).
- **Light & dark themes** with a festive peach-blossom aesthetic.

## 🛠️ Tech Stack

- [Vite](https://vitejs.dev/) + [React 18](https://react.dev/) +
  [TypeScript](https://www.typescriptlang.org/)
- [Mesh SDK](https://meshjs.dev/) (`@meshsdk/core`, `@meshsdk/react`) for
  Cardano wallet connectivity
- [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
  (Radix UI primitives)
- [React Router](https://reactrouter.com/) for routing
- [TanStack Query](https://tanstack.com/query) for data fetching
- [Framer Motion](https://www.framer.com/motion/) for animations
- [Vitest](https://vitest.dev/) + Testing Library for tests

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (18+ recommended). Install via
  [nvm](https://github.com/nvm-sh/nvm#installing-and-updating).
- A CIP-30 compatible Cardano browser wallet extension (e.g. Nami, Eternl, Lace).

### Installation

```sh
# Clone the repository
git clone <YOUR_GIT_URL>
cd lucky-lunar-gifts

# Install dependencies (npm, or use bun — a bun.lockb is included)
npm install

# Start the development server (http://localhost:8080)
npm run dev
```

## 📜 Available Scripts

| Command             | Description                                      |
| ------------------- | ------------------------------------------------ |
| `npm run dev`       | Start the Vite dev server on port 8080           |
| `npm run build`     | Build for production                             |
| `npm run build:dev` | Build using development mode                      |
| `npm run preview`   | Preview the production build locally             |
| `npm run lint`      | Run ESLint                                        |
| `npm run test`      | Run the test suite once with Vitest              |
| `npm run test:watch`| Run tests in watch mode                          |

## 📂 Project Structure

```
src/
├── assets/            # Images (hero, etc.)
├── components/        # Shared components
│   ├── ui/            # shadcn/ui primitives
│   ├── Layout.tsx     # Page layout shell
│   ├── NavLink.tsx
│   ├── ThemeSwitcher.tsx
│   └── WalletConnect.tsx
├── contexts/
│   └── WalletContext.tsx   # Cardano wallet state (connect, balance, etc.)
├── hooks/             # Custom hooks
├── lib/               # Utilities
├── pages/
│   ├── Index.tsx      # Home — create or enter a claim code
│   ├── CreateGift.tsx # Build and fund gift envelopes
│   ├── ClaimGift.tsx  # Solve the puzzle and claim a gift
│   └── NotFound.tsx
└── App.tsx            # Routes and providers
```

## 🧭 How It Works

1. **Connect** your Cardano wallet on the Create page.
2. **Set a secret word** and add one or more envelopes, each with an ADA amount
   and a quantity.
3. **Create the gift** and share the resulting claim code.
4. **Recipients** open the claim link, unscramble the secret word, and receive
   ADA in their wallet.

> **Note:** Wallet connection and balance reading are wired up via the Mesh
> SDK. The gift-creation and claim transaction flows are scaffolded (the
> submit handlers and the claim page currently use placeholder/mock data) and
> are intended to be connected to on-chain logic.

## 🤝 Contributing

Issues and pull requests are welcome. Please run `npm run lint` and
`npm run test` before submitting changes.
