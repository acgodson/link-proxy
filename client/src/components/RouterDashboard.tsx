"use client";
import React, { useState } from "react";
import {
  Button,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/atoms";
import { Wallet } from "lucide-react";
import RouterHead from "./molecules/RouterHeader";

const RouterDashboard = () => {

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1c20] to-[#2c313c] text-white p-8">
      <RouterHead />

      {/* body Starts here mate! */}
    </div>
  );
};

export default RouterDashboard;
