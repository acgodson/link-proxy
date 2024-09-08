import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useEthContext } from "@/evm/EthContext";
import {
  CustomRouter__factory,
  Mock_Token__factory as ERC20__factory,
} from "@/lib/ccip/ethers-contracts";
import { useWallets } from "@privy-io/react-auth";
import {
  getDummyTokensFromNetwork,
  getNetworkConfig,
  SupportedNetworks,
} from "../../../contracts-foundry/ts-scripts/helpers/config";
import {
  loadDeployedAddresses,
  requestTokensFromFaucet,
  storeDeployedAddresses,
} from "@/lib/ccip/utils";
import { PaymasterMode } from "@biconomy/account";

const sourceNetwork = SupportedNetworks.ETHEREUM_SEPOLIA;
const targetNetwork = SupportedNetworks.BASE_SEPOLIA;

const controllerAddress = process.env.NEXT_PUBLIC_CONTROLLER_ADDRESS as string;
const vaultAddress = process.env.NEXT_PUBLIC_VAULT_ADDRESS as string;

export const useLinkProxy = () => {
  const { address, smartAccount } = useEthContext();
  const { wallets } = useWallets();

  const [routerAddress, setRouterAddress] = useState<string | null>(null);
  const [tokenFeeAmount, setTokenFeeAmount] = useState("0");
  const [tokenAmount, setTokenAmount] = useState("4");
  const [routerStatus, setRouterStatus] = useState("Not Deployed");
  const [feeTankBalance, setFeeTankBalance] = useState("0.00");
  const [linkTankBalance, setLinkTankBalance] = useState("0.00");
  const [userBalance, setUserBalance] = useState("0.00");
  const [prompt, setPrompt] = useState("");
  const [isDeploying, setIsDeploying] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [isFunding, setIsFunding] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmittingReceipt, setIsSubmittingReceipt] = useState(false);

  const checkUserTokenBalance = async () => {
    if (!address) return;

    const config = getNetworkConfig(sourceNetwork);
    const provider = new ethers.providers.JsonRpcProvider(config.rpc);
    const { ccipBnM } = getDummyTokensFromNetwork(sourceNetwork);

    if (!provider) {
      return;
    }
    const token = ERC20__factory.connect(ccipBnM, provider);
    try {
      const amount = await token.balanceOf(address);
      setUserBalance(ethers.utils.formatEther(amount));
    } catch (error) {
      console.error("Error checking router status:", error);
      setUserBalance("0");
    }
  };

  async function fetchRouterStats() {
    if (!address || !routerAddress) return;
    const config = getNetworkConfig(sourceNetwork);
    const provider = new ethers.providers.JsonRpcProvider(config.rpc);
    const router = CustomRouter__factory.connect(routerAddress, provider);
    console.log("the address", address);
    const admin = await router.routerAdmins(address);
    console.log("retrieved admin status", admin);
    if (admin) {
      console.log("admin registered");
      setRouterStatus("Active");
      checkRouterStatus(routerAddress);
    }
  }

  const checkRouterStatus = async (_address: string): Promise<void> => {
    if (!address) return;
    const config = getNetworkConfig(sourceNetwork);
    const provider = new ethers.providers.JsonRpcProvider(config.rpc);
    const router = CustomRouter__factory.connect(_address, provider);
    try {
      const admin = await router.routerAdmins(address);
      setRouterStatus(admin ? "Active" : "Not Registered (Not Admin)");
      console.log("admin status", admin);
      const LinkContract = ERC20__factory.connect(
        getDummyTokensFromNetwork(sourceNetwork).ccipBnM,
        provider
      );
      const balance = await LinkContract.balanceOf(_address);
      setLinkTankBalance(ethers.utils.formatEther(balance));

      if (admin) {
        const balance = await router.feeTank(address);
        setFeeTankBalance(ethers.utils.formatEther(balance));
      }
    } catch (error) {
      console.error("Error checking router status:", error);
      setRouterStatus("Error");
    }
  };

  const handleDeploy = async () => {
    console.log("Initiating deployment...");
    setIsDeploying(true);
    try {
      const response = await fetch("/api/deploy-router", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sourceNetwork: sourceNetwork,
          targetNetwork: targetNetwork,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.routerAddress) {
        setRouterAddress(data.routerAddress);
        setRouterStatus("Deployed");
        console.log(`Router successfully deployed to: ${data.routerAddress}`);
        console.log("Router deployed to:", data.routerAddress);

        // Update stored addresses if needed
        const deployed = await loadDeployedAddresses();
        deployed.customRouter[sourceNetwork] = data.routerAddress;
        await storeDeployedAddresses(deployed);
      } else {
        throw new Error("Deployment response did not include a router address");
      }
    } catch (error: any) {
      console.error("Error deploying router:", error);
      console.log(`Deployment failed: ${error.message}. Check console for more details.`);
    } finally {
      setIsDeploying(false);
    }
  };

  const handleMintTokens = async () => {
    if (!tokenAmount || !smartAccount || !address) {
      alert("Please connect your wallet and enter a token amount.");
      return;
    }
    setIsMinting(true);

    try {
      const targetAmount = ethers.utils.parseEther(tokenAmount);
      const network = SupportedNetworks.ETHEREUM_SEPOLIA; // Or whichever network you're using

      console.log(`Requesting ${tokenAmount} tokens from faucet...`);
      const finalBalance = await requestTokensFromFaucet(network, targetAmount, smartAccount);

      console.log(`Tokens received. Final balance: ${ethers.utils.formatEther(finalBalance)}`);
      alert(`${ethers.utils.formatEther(finalBalance)} tokens received successfully!`);

      await checkUserTokenBalance();
    } catch (error) {
      console.error("Error receiving tokens from faucet:", error);
      alert("Failed to receive tokens. Please try again.");
    } finally {
      setIsMinting(false);
    }
  };

  const handleFundGas = async () => {
    if (!address || !smartAccount) {
      alert("Please connect your wallet first.");
      return;
    }
    if (!routerAddress || !tokenFeeAmount) {
      alert("missing inputs");
      return;
    }
    setIsFunding(true);
    try {
      const sourceConfig = getNetworkConfig(sourceNetwork);
      const userAddress = await smartAccount.getAddress();
      // Connect to the BnM token and CustomRouter contracts
      const provider = new ethers.providers.JsonRpcProvider(sourceConfig.rpc);
      const bnmToken = ERC20__factory.connect(sourceConfig.ccipBnMAddress, provider);
      const customRouter = CustomRouter__factory.connect(routerAddress, provider);
      // Check if the user is a router admin
      const isAdmin = await customRouter.routerAdmins(userAddress);
      if (!isAdmin) {
        throw new Error("Account is not a router Admin");
      }
      // Calculate the amount to deposit
      const amount = ethers.utils.parseEther(tokenFeeAmount);

      // Check current allowance
      const currentAllowance = await bnmToken.allowance(userAddress, routerAddress);

      // Prepare transactions
      const transactions = [];

      // Add approval transaction if needed
      if (currentAllowance.lt(amount)) {
        const approveTx = await bnmToken.populateTransaction.approve(
          routerAddress,
          ethers.constants.MaxUint256
        );
        transactions.push({
          to: sourceConfig.ccipBnMAddress,
          data: approveTx.data,
        });
      }
      // Add deposit transaction
      const depositTx = await customRouter.populateTransaction.depositToFeeTank(address, amount);
      transactions.push({
        to: routerAddress,
        data: depositTx.data,
      });

      // Build and send the UserOperation
      const userOp = await smartAccount.buildUserOp(
        transactions.map((tx) => ({ ...tx, value: 0 })),
        {
          paymasterServiceData: {
            mode: PaymasterMode.SPONSORED,
          },
        }
      );

      const userOpResponse = await smartAccount.sendUserOp(userOp);

      // Wait for the transaction to be mined
      const transactionDetails = await userOpResponse.wait();

      console.log("Fund gas transaction hash:", transactionDetails.receipt);
      alert(`Successfully funded ${tokenFeeAmount} tokens to the fee tank.`);
      // Update router status
      await checkRouterStatus(routerAddress);
    } catch (error) {
      console.error("Error funding gas:", error);
      alert("Failed to fund gas. Please try again.");
    } finally {
      setIsFunding(false);
    }
  };

  const handleRegister = async () => {
    if (!smartAccount || !routerAddress) {
      alert("Please connect your wallet and provide a router address.");
      return;
    }

    if (!routerAddress || !tokenFeeAmount) {
      alert("missing inputs");
      return;
    }

    setIsRegistering(true);

    try {
      const sourceConfig = getNetworkConfig(sourceNetwork);
      const userAddress = await smartAccount.getAddress();

      // Connect to the CustomRouter contract
      const provider = new ethers.providers.JsonRpcProvider(sourceConfig.rpc);
      const router = CustomRouter__factory.connect(routerAddress, provider);

      // Check if the address is already an admin
      const isAdmin = await router.routerAdmins(userAddress);

      if (isAdmin) {
        console.log("Address is already registered as an admin");
        setRouterStatus("Active");
        return;
      }

      // Prepare the registerAdmin transaction
      const registerTx = await router.populateTransaction.registerAdmin(userAddress);

      // Prepare the transaction for the UserOperation
      const tx = {
        to: routerAddress,
        data: registerTx.data,
        value: 0,
      };

      // Build the UserOperation
      const userOp = await smartAccount.buildUserOp([tx], {
        paymasterServiceData: {
          mode: PaymasterMode.SPONSORED,
        },
      });

      // Send the UserOperation
      const userOpResponse = await smartAccount.sendUserOp(userOp);

      // Wait for the transaction to be mined
      const transactionDetails = await userOpResponse.wait();

      console.log("Admin registration transaction hash:", transactionDetails.receipt);
      console.log("Admin registered");
      setRouterStatus("Active");

      // Optionally verify the registration again
      const adminVerification = await router.routerAdmins(userAddress);
      if (adminVerification) {
        console.log("Admin registration verified successfully");
      } else {
        console.warn("Admin registration could not be verified");
      }
    } catch (error) {
      console.error("Error registering admin:", error);
      alert("Failed to register admin. Please try again.");
    } finally {
      setIsRegistering(false);
    }
  };

  async function fetchAddresses() {
    const deployed = await loadDeployedAddresses();
    const _customRouter = deployed.customRouter[sourceNetwork];
    if (_customRouter && _customRouter.length > 0) {
      setRouterAddress(_customRouter);
      setRouterStatus("Deployed");
    }
  }

  useEffect(() => {
    fetchAddresses();
  }, []);

  useEffect(() => {
    if (address) {
      checkUserTokenBalance();
    }
  }, [address]);

  useEffect(() => {
    if (address && routerAddress) {
      fetchRouterStats();
    }
  }, [address, routerAddress]);

  return {
    routerAddress,
    tokenFeeAmount,
    tokenAmount,
    routerStatus,
    linkTankBalance,
    feeTankBalance,
    userBalance,
    prompt,
    isDeploying,
    isMinting,
    isFunding,
    isRegistering,
    isGeneratingKey,
    isProcessing,
    isSubmittingReceipt,
    setTokenFeeAmount,
    setTokenAmount,
    setPrompt,
    handleDeploy,
    handleMintTokens,
    handleFundGas,
    handleRegister,
    // handleSubmitPrompt,
  };
};
