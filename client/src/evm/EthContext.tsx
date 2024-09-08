import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { ConnectedWallet, usePrivy, useWallets } from "@privy-io/react-auth";
import {
  BiconomySmartAccountV2,
  Bundler,
  createSmartAccountClient,
  LightSigner,
  Paymaster,
  PaymasterMode,
} from "@biconomy/account";
import { ChainId } from "@biconomy/core-types";
import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";

interface EthContextType {
  index: number;
  address: `0x${string}` | null;
  isAccountModalOpen: boolean;
  network: any;
  switchNetwork: (index: number) => void;
  toggleAccountModal: () => void;
  handleLogin: () => void;
  handleLogout: () => void;
  publicClient: any;
  smartAccount: BiconomySmartAccountV2 | null;
  resetSmartAccount: (privyWallet: ConnectedWallet) => void;
}

const EthContext = createContext<EthContextType | undefined>(undefined);

export const Erc4337Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { authenticated, login, logout, connectWallet } = usePrivy();
  const { wallets } = useWallets();

  const [index, setIndex] = useState<number>(0);
  const [network, switchNetwork] = useState<any | null>(sepolia);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  const [smartAccount, setSmartAccount] = useState<BiconomySmartAccountV2 | null>(null);
  const [address, setAddress] = useState<`0x${string}` | null>(null);

  const toggleAccountModal = () => setIsAccountModalOpen(!isAccountModalOpen);

  const handleLogin = async () => {
    try {
      if (authenticated) {
        await logout();
      }
      login();
      connectWallet();
    } catch (e) {
      console.log((e as any).message as any);
    }
  };

  const handleLogout = async () => {
    try {
      setIsAccountModalOpen(false);
      await logout();
    } catch (e) {
      console.log(e);
      console.log((e as any).message);
    }
  };

  const publicClient = createPublicClient({
    chain: network,
    transport: http(),
  });

  async function smartAccountClient(privyWallet: ConnectedWallet) {
    if (!privyWallet) {
      console.log("not privy embedded wallet found");
      return;
    }
    // await privyWallet.switchChain("0x15B92");
    const provider = await privyWallet.getEthersProvider();
    const signer = provider?.getSigner() as LightSigner;

    const bundler = new Bundler({
      bundlerUrl: `https://bundler.biconomy.io/api/v2/${ChainId.SEPOLIA}/${process.env.NEXT_PUBLIC_BUNDLER_ID}`,
      chainId: ChainId.SEPOLIA,
    });

    const paymaster = new Paymaster({
      paymasterUrl: `https://paymaster.biconomy.io/api/v1/${ChainId.SEPOLIA}/${process.env.NEXT_PUBLIC_PAYMASTER_KEY}`,
    });

    console.log("signer, ", provider?.getSigner() as LightSigner);
    const smClient = await createSmartAccountClient({
      signer,
      chainId: ChainId.SEPOLIA,
      bundler: bundler,
      bundlerUrl: `https://bundler.biconomy.io/api/v2/${network.id}/${process.env.NEXT_PUBLIC_BUNDLER_ID}`,
      biconomyPaymasterApiKey: process.env.NEXT_PUBLIC_PAYMASTER_KEY,
      rpcUrl: "https://sepolia.infura.io/v3/2SYhsNBoKVT0rc90QfGmgHe46j4",
      paymaster: paymaster,
      paymasterUrl: `https://paymaster.biconomy.io/api/v1/${ChainId.SEPOLIA}/${process.env.NEXT_PUBLIC_PAYMASTER_KEY}`,
    });
    console.log(smClient);
    return smClient;
  }

  const resetSmartAccount = async (privyWallet: ConnectedWallet) => {
    const smartWallet = await smartAccountClient(privyWallet);
    if (smartWallet) {
      setSmartAccount(smartWallet);
      setAddress(await smartWallet.getAddress());
    }
  };

  useEffect(() => {
    if (wallets.length > 0) {
      const embeddedWallet = wallets.find((wallet) => wallet.walletClientType !== "privy");
      if (!embeddedWallet) {
        console.log("no embedded wallet wound");
        return;
      }
      console.log("embedded wallet", embeddedWallet);
      resetSmartAccount(embeddedWallet);
    }
  }, [wallets]);

  return (
    <EthContext.Provider
      value={{
        index,
        address,
        network,
        publicClient,
        isAccountModalOpen,
        toggleAccountModal,
        handleLogin,
        handleLogout,
        switchNetwork,
        smartAccount,
        resetSmartAccount,
      }}
    >
      {children}
    </EthContext.Provider>
  );
};

export const useEthContext = () => {
  const context = useContext(EthContext);
  if (context === undefined) {
    throw new Error("useGlobalContext must be used within a GlobalProvider");
  }
  return context;
};
