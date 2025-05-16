This is a [RainbowKit](https://rainbowkit.com) + [wagmi](https://wagmi.sh) + [Next.js](https://nextjs.org/) project bootstrapped with [`create-rainbowkit`](/packages/create-rainbowkit).

## Project Structure

```mermaid
graph TD
    subgraph Frontend
        A[pages/_app.tsx] --> B[RainbowKit Provider]
        A --> C[WagmiProvider]
        A --> D[QueryClientProvider]
        B --> E[pages/index.tsx]
        C --> E
        D --> E
    end
    
    subgraph Web3
        F[wagmi.ts] --> C
        F --> G[Blockchain Networks]
        G --> G1[Mainnet]
        G --> G2[Polygon]
        G --> G3[Optimism]
        G --> G4[Arbitrum]
        G --> G5[Base]
        G --> G6[Sepolia - Optional]
    end
    
    subgraph Backend
        H[API Routes] --> I[/api/files]
        I --> J[GET - Fetch Files]
        I --> K[POST - Upload File]
        K --> L[Pinata IPFS Service]
        J --> L
    end
    
    subgraph User Interface
        E --> M[ConnectButton]
        E --> N[File Upload]
        E --> O[File Explorer]
        M --> P[Wallet Connection]
        N --> K
        O --> J
    end
    
    subgraph Styles
        Q[styles/globals.css] --> A
        R[styles/Home.module.css] --> E
    end
```

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.tsx`. The page auto-updates as you edit the file.

## Learn More

To learn more about this stack, take a look at the following resources:

- [RainbowKit Documentation](https://rainbowkit.com) - Learn how to customize your wallet connection flow.
- [wagmi Documentation](https://wagmi.sh) - Learn how to interact with Ethereum.
- [Next.js Documentation](https://nextjs.org/docs) - Learn how to build a Next.js application.

You can check out [the RainbowKit GitHub repository](https://github.com/rainbow-me/rainbowkit) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
