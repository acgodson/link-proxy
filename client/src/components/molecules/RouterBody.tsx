import React, { useState } from "react";
import { Button, Input, Card, CardHeader, CardContent, CardTitle } from "@/components/atoms";
import { Zap, DollarSign, ArrowRight, AlertCircle, Check, Copy, AlertTriangle } from "lucide-react";
import { UseLinkProxyReturn } from "@/lib/utils";

const RouterCard = ({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: any;
  children: any;
}) => (
  <Card className="bg-white/5 backdrop-blur-md border-0 shadow-lg rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:bg-white/10">
    <CardHeader className="bg-gradient-to-r from-white/5 to-white/10">
      <CardTitle className="text-xl font-light flex items-center">
        <Icon className="mr-2 h-5 w-5 text-blue-400" />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="p-6 relative">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
      {children}
    </CardContent>
  </Card>
);

export const RouterBody = ({ LinkProxy }: { LinkProxy: UseLinkProxyReturn }) => {
  const [showCopiedAlert, setShowCopiedAlert] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const {
    routerStatus,
    routerAddress,
    tokenAmount,
    tokenFeeAmount,
    linkTankBalance,
    userBalance,
    feeTankBalance,
    prompt,
    isMinting,
    isDeploying,
    isRegistering,
    isFunding,
    isGeneratingKey,
    isSubmittingReceipt,
    isProcessing,
    setTokenFeeAmount,
    setPrompt,
    handleFundGas,
    handleDeploy,
    handleRegister,
    setTokenAmount,
    handleMintTokens,
    handleSubmitPrompt,
  } = LinkProxy;

  const copyToClipboard = async () => {
    if (routerAddress) {
      try {
        await navigator.clipboard.writeText(routerAddress);
        setIsCopied(true);
        setShowCopiedAlert(true);
        setTimeout(() => {
          setShowCopiedAlert(false);
          setIsCopied(false);
        }, 3000);
      } catch (err) {
        console.error("Failed to copy text: ", err);
      }
    }
  };

  const WarningBanner = () => (
    <div className="bg-yellow-500 text-black p-4 mb-8 rounded-lg shadow-md">
      <div className="flex items-center justify-center">
        <AlertTriangle className="w-6 h-6 mr-2" />
        <p className="text-center font-semibold">
          <b> Vercel's</b> timeouts may disrupt Demo's router deployment. Please fork{" "}
          <a href="https://github.com/your-repo-link" className="underline hover:text-yellow-800">
            github
          </a>{" "}
          and test locally.
        </p>
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in">
      <WarningBanner />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
        <RouterCard title="Deploy Router" icon={Zap}>
          {routerStatus !== "Not Deployed" && (
            <div className="relative mb-4">
              <Input
                type="text"
                placeholder="Router Address"
                value={routerAddress ?? ""}
                className="pr-10 bg-white/10 border-white/20 focus:border-white/30 rounded-lg transition-all duration-300 focus:ring-2 focus:ring-blue-400/50"
                disabled={true}
              />
              <button
                onClick={copyToClipboard}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors duration-300"
                title="Copy router address"
              >
                {isCopied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
              </button>
            </div>
          )}
          <Button
            onClick={handleDeploy}
            className="w-full bg-gradient-to-r from-white/10 to-white/20 hover:from-white/15 hover:to-white/25 text-white backdrop-blur-sm rounded-lg py-2 flex items-center justify-center transition-all duration-300 group"
            disabled={routerStatus !== "Not Deployed" || isDeploying}
          >
            {isDeploying ? (
              <span className="animate-pulse">Deploying...</span>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4 group-hover:animate-bounce" /> Deploy Router
              </>
            )}
          </Button>
        </RouterCard>

        <RouterCard title="Mint CCIP Token" icon={DollarSign}>
          <Input
            type="number"
            placeholder="Token Amount"
            value={Number(tokenAmount)}
            readOnly={true}
            onChange={(e) => setTokenAmount(e.target.value.toString())}
            className="mb-4 bg-white/10 border-white/20 focus:border-white/30 rounded-lg transition-all duration-300 focus:ring-2 focus:ring-green-400/50"
            disabled={isMinting}
          />
          <Button
            onClick={handleMintTokens}
            className="w-full bg-gradient-to-r from-white/10 to-white/20 hover:from-white/15 hover:to-white/25 text-white backdrop-blur-sm rounded-lg py-2 flex items-center justify-center transition-all duration-300 group"
            disabled={isMinting}
          >
            {isMinting ? (
              <span className="animate-pulse">Minting...</span>
            ) : (
              <>
                <DollarSign className="mr-2 h-4 w-4 group-hover:animate-spin" /> Mint Token
              </>
            )}
          </Button>
        </RouterCard>

        <RouterCard title="Fund Router" icon={ArrowRight}>
          {routerStatus !== "Not Deployed" && routerStatus !== "Active" && (
            <Button
              onClick={handleRegister}
              className="mb-3 w-full bg-gradient-to-r from-blue-500/10 to-blue-500/20 hover:from-blue-500/15 hover:to-blue-500/25 text-white backdrop-blur-sm rounded-lg py-2 flex items-center justify-center transition-all duration-300 group"
              disabled={isRegistering}
            >
              {isRegistering ? (
                <span className="animate-pulse">Registering...</span>
              ) : (
                <>
                  <ArrowRight className="mr-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />{" "}
                  Register Admin
                </>
              )}
            </Button>
          )}
          <Input
            type="number"
            placeholder="ccipBnM Fee Amount"
            value={tokenFeeAmount}
            onChange={(e) => setTokenFeeAmount(e.target.value)}
            className="mb-4 bg-white/10 border-white/20 focus:border-white/30 rounded-lg transition-all duration-300 focus:ring-2 focus:ring-purple-400/50"
            disabled={routerStatus !== "Active" || isFunding}
          />
          <Button
            onClick={handleFundGas}
            className="w-full bg-gradient-to-r from-white/10 to-white/20 hover:from-white/15 hover:to-white/25 text-white backdrop-blur-sm rounded-lg py-2 flex items-center justify-center transition-all duration-300 group"
            disabled={routerStatus !== "Active" || isFunding}
          >
            {isFunding ? (
              <span className="animate-pulse">Funding...</span>
            ) : (
              <>
                <ArrowRight className="mr-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />{" "}
                Fund Router
              </>
            )}
          </Button>
          {routerStatus === "Active" && (
            <div className="flex flex-row justify-between items-center">
              <p className="mt-4 text-sm text-green-300">Service: {feeTankBalance} ccipBnM</p>
              <p className="mt-4 text-sm text-orange-300">Gas: {linkTankBalance} LINK</p>
            </div>
          )}
        </RouterCard>

        <RouterCard title="Router Status" icon={AlertCircle}>
          <div
            className={`flex items-center ${
              routerStatus === "Active" ? "text-green-300" : "text-yellow-300"
            } mb-4 transition-colors duration-300`}
          >
            <AlertCircle
              className={`mr-2 h-5 w-5 ${routerStatus === "Active" ? "animate-pulse" : ""}`}
            />
            <span className="text-lg font-light">{routerStatus}</span>
          </div>
          {routerStatus === "Active" && (
            <>
              <Input
                type="text"
                placeholder="Enter a greetings prompt for GPT"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="mb-4 bg-white/10 border-white/20 focus:border-white/30 rounded-lg transition-all duration-300 focus:ring-2 focus:ring-yellow-400/50"
                disabled={isGeneratingKey || isProcessing || isSubmittingReceipt}
              />
              <Button
                className="w-full bg-gradient-to-r from-white/10 to-white/20 hover:from-white/15 hover:to-white/25 text-white backdrop-blur-sm rounded-lg py-2 flex items-center justify-center transition-all duration-300 group"
                disabled={isGeneratingKey || isProcessing || isSubmittingReceipt}
                onClick={handleSubmitPrompt}
              >
                {isGeneratingKey ? (
                  <span className="animate-pulse">Generating Key...</span>
                ) : isProcessing ? (
                  <span className="animate-pulse">Processing Request...</span>
                ) : isSubmittingReceipt ? (
                  <span className="animate-pulse">Submitting Receipt...</span>
                ) : (
                  <>
                    <span className="group-hover:animate-pulse">Submit Prompt</span>
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </>
          )}
        </RouterCard>
      </div>
    </div>
  );
};
