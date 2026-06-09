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

- [Bun](https://bun.sh/) (the project ships with a `bun.lockb` lockfile).
  Install it with `curl -fsSL https://bun.sh/install | bash`.
- A CIP-30 compatible Cardano browser wallet extension (e.g. Nami, Eternl, Lace).

### Installation

```sh
# Clone the repository
git clone <YOUR_GIT_URL>
cd lucky-lunar-gifts

# Install dependencies
bun install

# Configure the blockchain provider (see below)
cp .env.example .env

# Start the development server (http://localhost:8080)
bun run dev
```

### Configuration

On-chain features (creating and claiming gifts) require a
[Blockfrost](https://blockfrost.io) project. Copy `.env.example` to `.env` and
fill in:

| Variable                     | Description                                              |
| ---------------------------- | -------------------------------------------------------- |
| `VITE_CARDANO_NETWORK`       | `mainnet`, `preprod`, or `preview`                       |
| `VITE_BLOCKFROST_PROJECT_ID` | Blockfrost project ID for the **same** network           |

The compiled validator (`src/contracts/plutus.json`) is vendored from the
[`contracts/`](./contracts) Aiken project. Re-run `aiken build` and copy the
updated blueprint into `src/contracts/` whenever the validator changes.

## 📜 Available Scripts

| Command             | Description                                      |
| ------------------- | ------------------------------------------------ |
| `bun run dev`       | Start the Vite dev server on port 8080           |
| `bun run build`     | Build for production                             |
| `bun run build:dev` | Build using development mode                      |
| `bun run preview`   | Preview the production build locally             |
| `bun run lint`      | Run ESLint                                        |
| `bun run test`      | Run the test suite once with Vitest              |
| `bun run test:watch`| Run tests in watch mode                          |

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
├── contracts/
│   └── plutus.json    # Vendored compiled validator (CIP-57 blueprint)
├── hooks/             # Custom hooks
├── lib/
│   ├── cardano.ts     # Provider, network config, script address, tx builder
│   ├── secret.ts      # Secret-word normalization + sha2-256 hashing
│   ├── giftCode.ts    # Shareable gift-code encode/decode
│   ├── gift.ts        # create / claim / refund transaction builders
│   └── utils.ts
├── pages/
│   ├── Index.tsx      # Home — create or enter a claim code
│   ├── CreateGift.tsx # Build and fund gift envelopes
│   ├── ClaimGift.tsx  # Solve the puzzle and claim a gift
│   ├── MyGifts.tsx    # List your gifts and refund after the deadline
│   └── NotFound.tsx
└── App.tsx            # Routes and providers
```

## 🧭 How It Works

1. **Connect** your Cardano wallet on the Create page.
2. **Set a secret word** and add one or more envelopes, each with an ADA amount
   and a quantity.
3. **Create the gift.** The client locks the ADA into the `gift` validator —
   one script UTxO per envelope, each carrying `sha2_256(secret)` — and returns
   a shareable gift code.
4. **Recipients** open the claim link, unscramble the secret word, connect a
   wallet, and submit a claim transaction that spends the envelopes to their
   address (the validator checks `sha2_256(answer) == secret_hash`).
5. **Refund:** the **My Gifts** page lists the gifts you created (discovered
   from chain state by matching the datum's `owner`), and lets you reclaim any
   unclaimed envelopes once the deadline has passed.

The on-chain logic lives in [`contracts/`](./contracts); the off-chain
transaction building (lock / claim / refund) lives in
[`src/lib/gift.ts`](./src/lib/gift.ts) and is built with the Mesh SDK.

> **Note:** The shareable gift code carries the lock transaction hash, the
> deadline, and the *scrambled* characters of the secret (the puzzle hint) —
> never the solution. The secret word stays off-chain; only its hash is stored.
> Because the validator is a hash-lock, once the first claim reveals the
> preimage on-chain, anyone could claim the remaining envelopes of that gift.

## 🤝 Contributing

Issues and pull requests are welcome. Please run `bun run lint` and
`bun run test` before submitting changes.
