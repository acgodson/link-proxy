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

  const [routerAddress, setRouterAddress] = useState(null);
  const [tokenFeeAmount, setTokenFeeAmount] = useState("");
  const [tokenAmount, setTokenAmount] = useState("4");
  const [routerStatus, setRouterStatus] = useState("Not Deployed");
  const [feeTankBalance, setFeeTankBalance] = useState("0.00");
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
    if (!address || !smartAccount) {
      alert("Please connect your wallet first.");
      return;
    }
    setIsDeploying(true);
    const config = getNetworkConfig(sourceNetwork);

    // const provider = new ethers.providers.JsonRpcProvider(config.rpc);
    // const signer = smartAccount.getSigner() as unknown as ethers.Signer;

    const targetConfig = getNetworkConfig(targetNetwork);
    const { ccipBnM } = getDummyTokensFromNetwork(sourceNetwork);

    const factory = new CustomRouter__factory();

    try {
      const deployTx = factory.getDeployTransaction(
        config.routerAddress,
        config.linkTokenAddress,
        controllerAddress,
        vaultAddress,
        ccipBnM,
        targetConfig.chainSelector
      );

      const tx = {
        to: ethers.constants.AddressZero,
        data: deployTx.data ? deployTx.data.toString() : "",
      };

      const userOp = await smartAccount.buildUserOp([tx], {
        paymasterServiceData: {
          mode: PaymasterMode.ERC20,
          preferredToken: config.linkTokenAddress,
        },
      });
      const userOpResponse = await smartAccount.sendUserOp(userOp);

      const transactionDetails = await userOpResponse.wait();

      const deployedAddress = transactionDetails.receipt.contractAddress;

      if (deployedAddress) {
        const deployed = await loadDeployedAddresses();
        deployed.customRouter[sourceNetwork] = deployedAddress;
        await storeDeployedAddresses(deployed);

        setRouterAddress(deployedAddress);
        setRouterStatus("Deployed");

        console.log("Router deployed to:", deployedAddress);
      }
    } catch (error) {
      console.error("Error deploying router:", error);
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
      const depositTx = await customRouter.populateTransaction.depositToFeeTank(amount);
      transactions.push({
        to: routerAddress,
        data: depositTx.data,
      });

      // Build and send the UserOperation
      const userOp = await smartAccount.buildUserOp(
        transactions.map((tx) => ({ ...tx, value: 0 }))
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
      const userOp = await smartAccount.buildUserOp([tx]);

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
