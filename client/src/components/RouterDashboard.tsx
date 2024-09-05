"use client";
import React, { useState } from "react";
import {
  Button,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui";
import { Wallet } from "lucide-react";

const RouterDashboard = () => {
  const [account, setAccount] = useState("");
  const [isConnected, setIsConnected] = useState(false);

  const [currentChainId, setCurrentChainId] = useState("14");
  const [routerAddress, setRouterAddress] = useState("");

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1c20] to-[#2c313c] text-white p-8">
      <div className="flex justify-between items-center mb-12">
        <h1 className="text-4xl text-gray-100 font-light tracking-wide">LP</h1>
        <div className="flex items-center">
          <Select value={currentChainId} onValueChange={setCurrentChainId}>
            <SelectTrigger className="mr-4 bg-white/10 border-white/20 focus:border-white/30 rounded-lg transition-all duration-300">
              <SelectValue placeholder="Select Network" />
            </SelectTrigger>
            <SelectContent className="bg-[#2c313c] border-white/20">
              <SelectItem value="14">Fuji Testnet</SelectItem>
            </SelectContent>
          </Select>

          <Button className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm rounded-full px-6 py-2 flex items-center transition-all duration-300">
            <Wallet className="mr-2 h-4 w-4" />
            {isConnected
              ? `${account.slice(0, 6)}...${account.slice(-4)}`
              : "Connect"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RouterDashboard;
