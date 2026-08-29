import { createAppKit } from "@reown/appkit";
import { EthersAdapter } from "@reown/appkit-adapter-ethers";
import { sepolia } from "@reown/appkit/networks";

const projectId = "a519260b229294a334a85aa7191bd61b"; // paste your project ID here

const metadata = {
  name: "AgroVault",
  description: "AgroVault — blockchain cooperative platform for farmers and buyers",
  url: "https://agrovault-eight.vercel.app",
  icons: ["https://agrovault-eight.vercel.app/favicon.ico"],
};

export const appKit = createAppKit({
  adapters: [new EthersAdapter()],
  networks: [sepolia],
  metadata,
  projectId,
  features: {
    analytics: false,
  },
});