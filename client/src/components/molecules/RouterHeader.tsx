"use client";
import React, { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import {
  Button,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/atoms";
import { Wallet, Menu, X } from "lucide-react";
import { useEthContext } from "@/evm/EthContext";

const RouterHead = () => {
  const { authenticated } = usePrivy();
  const { handleLogin, network, address } = useEthContext();
  const [currentChainId, setCurrentChainId] = useState(network.id);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const BalanceButton = ({ amount, token }: { amount: any; token: any }) => (
    <Button className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm rounded-full px-4 py-2 flex items-center transition-all duration-300">
      <span className="mr-2">{amount}</span>
      <span className="text-xs opacity-70">{token}</span>
    </Button>
  );

  return (
    <>
      <div className="flex justify-between items-center mb-12">
        <h1 className="text-3xl sm:text-4xl text-gray-100 font-light tracking-wide">
          LP
        </h1>

        {/* Desktop view */}
        <div className="hidden sm:flex items-center space-x-4">
          <Select value={currentChainId} onValueChange={setCurrentChainId}>
            <SelectTrigger className="bg-white/10 border-white/20 focus:border-white/30 rounded-lg transition-all duration-300">
              <SelectValue placeholder="Select Network" />
            </SelectTrigger>
            <SelectContent className="bg-[#2c313c] border-white/20">
              <SelectItem value="0">Eth Sepolia</SelectItem>
            </SelectContent>
          </Select>

          <BalanceButton amount="0.00" token="LINK" />
          <BalanceButton amount="0.00" token="ccipBnM" />

          <Button
            onClick={!address ? handleLogin : () => {}}
            className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm rounded-full px-6 py-2 flex items-center transition-all duration-300"
          >
            <Wallet className="mr-2 h-4 w-4" />
            {address
              ? `${address?.slice(0, 6)}...${address?.slice(-4)}`
              : "Connect"}
          </Button>
        </div>

        {/* Mobile menu button */}
        <button onClick={toggleMenu} className="sm:hidden text-white">
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile dropdown menu */}
      <div
        className={`sm:hidden ${
          isMenuOpen ? "block" : "hidden"
        } transition-all duration-300 ease-in-out`}
      >
        <div className="flex flex-col space-y-4 bg-white/10 rounded-lg p-4">
          <Select value={currentChainId} onValueChange={setCurrentChainId}>
            <SelectTrigger className="bg-white/10 border-white/20 focus:border-white/30 rounded-lg transition-all duration-300">
              <SelectValue placeholder="Select Network" />
            </SelectTrigger>
            <SelectContent className="bg-[#2c313c] border-white/20">
              <SelectItem value={network.id}>Eth Sepolia</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={!authenticated ? handleLogin : () => {}}
            className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm rounded-full px-6 py-2 flex items-center justify-center transition-all duration-300"
          >
            <Wallet className="mr-2 h-4 w-4" />
            {authenticated
              ? `${address?.slice(0, 6)}...${address?.slice(-4)}`
              : "Connect"}
          </Button>

          <Button className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm rounded-full px-6 py-2 flex items-center justify-center transition-all duration-300">
            0.00 LINK
          </Button>

          <Button className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm rounded-full px-6 py-2 flex items-center justify-center transition-all duration-300">
            0.00 ccipBnM
          </Button>
        </div>
      </div>

      {/* body Starts here mate! */}
    </>
  );
};

export default RouterHead;
