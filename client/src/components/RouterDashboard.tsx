"use client";
import React, { useState } from "react";
import { useLinkProxy } from "@/hooks/useLinkProxy";
import RouterHead from "./molecules/RouterHeader";
import { RouterBody } from "./molecules/RouterBody";

const RouterDashboard = () => {
  const linkProxy = useLinkProxy();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1c20] to-[#2c313c] text-white p-8">
      <RouterHead LinkProxy={linkProxy} />
      <RouterBody LinkProxy={linkProxy} />
    </div>
  );
};

export default RouterDashboard;
