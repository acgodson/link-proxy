/* eslint-disable */
import { createClient, http } from "viem";
import { sepolia } from "viem/chains";
import { createConfig } from "@privy-io/wagmi";

export const privyConfig = {
  defaultChain: sepolia,
  supportedChains: [sepolia],
  appearance: {
    theme: "light",
    accentColor: "#676FFF",
    logo: `https://linkproxy.vercel.app/vercel.png`,
    walletList: ["metamask", "rainbow"],
  },
  embeddedWallets: {
    noPromptOnSignature: false,
  },
  walletConnectCloudProjectId: "957c795c4c86e7c46609c0cd4064fa00",
};

export const supportedChains = [sepolia];

export const wagmiConfig = createConfig({
  //@ts-ignore
  chains: supportedChains,
  client({ chain }: { chain: any }) {
    return createClient({
      chain,
      transport: http(),
    });
  },
});
