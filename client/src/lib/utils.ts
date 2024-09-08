import { type ClassValue, clsx } from "clsx";
import { Dispatch, SetStateAction } from "react";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface UseLinkProxyReturn {
  routerAddress: string | null;
  tokenFeeAmount: string;
  tokenAmount: string;
  routerStatus: string;
  feeTankBalance: string;
  userBalance: string;
  prompt: string;
  isDeploying: boolean;
  isMinting: boolean;
  isFunding: boolean;
  isRegistering: boolean;
  isGeneratingKey: boolean;
  isProcessing: boolean;
  isSubmittingReceipt: boolean;
  setTokenFeeAmount: Dispatch<SetStateAction<string>>;
  setTokenAmount: Dispatch<SetStateAction<string>>;
  setPrompt: Dispatch<SetStateAction<string>>;
  handleDeploy: () => Promise<void>;
  handleMintTokens: () => Promise<void>;
  handleFundGas: () => Promise<void>;
  handleRegister: () => Promise<void>;
}
