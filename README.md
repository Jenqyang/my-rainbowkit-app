# Sound Capsule | Bitcoin NFT Audio Storage

## Project Overview

Sound Capsule is an audio storage platform based on the Bitcoin blockchain, allowing users to permanently preserve precious sounds as NFTs. Whether it's a hometown accent, a baby's first words, or recordings of special events, Sound Capsule ensures these valuable sound memories are never lost.

🔗 Live Demo: [https://my-rainbowkit-app-wheat.vercel.app/](https://my-rainbowkit-app-wheat.vercel.app/)

## Core Features

- **Blockchain Audio Storage**: Permanently store audio files using Bitcoin blockchain and IPFS technology
- **NFT Minting**: Mint audio files as unique NFTs
- **Audio Browsing**: Explore the collection of uploaded audio capsules
- **Audio Playback**: Play stored audio files directly on the platform
- **Wallet Connection**: Seamless wallet connection experience via RainbowKit

## Tech Stack

- **Frontend Framework**: [Next.js](https://nextjs.org/) (Page Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Web3 Integration**:
  - [RainbowKit](https://rainbowkit.com) - Wallet connection UI
  - [wagmi](https://wagmi.sh) - React Hooks for Ethereum
  - [viem](https://viem.sh) - Ethereum interaction library
- **Storage**: [Pinata](https://pinata.cloud/) (IPFS storage)
- **Package Management**: [pnpm](https://pnpm.io/)

## Quick Start

1. Clone the repository

```bash
git clone https://github.com/yourusername/sound-capsule.git
cd sound-capsule
```

2. Install dependencies

```bash
pnpm install
```

3. Configure environment variables

Create a `.env` file and add the necessary environment variables:

```
PINATA_JWT=your_pinata_api_key
NEXT_PUBLIC_GATEWAY_URL=your_pinata_gateway_url
```

4. Start the development server

```bash
pnpm dev
```

5. Visit [http://localhost:3000](http://localhost:3000) to view the application

## Project Structure

```
├── public/            # Static assets
├── src/
│   ├── components/    # React components
│   ├── pages/         # Next.js pages
│   ├── hooks/         # Custom React hooks
│   ├── utils/         # Utility functions
│   └── styles/        # Global styles
├── .env.local         # Environment variables
└── next.config.js     # Next.js configuration
```

## Contribution Guidelines

Contributions are welcome! Feel free to submit Pull Requests or create Issues.

## License

© 2025 Sound Capsule. All rights reserved.

---

Powered by Bitcoin blockchain and IPFS.
