import React from "react";

const SplashScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-[#1a1c20] to-[#2c313c]">
      <div className="text-white text-4xl font-bold animate-pulse">
        Link Proxy...
      </div>
    </div>
  );
};

export default SplashScreen;
