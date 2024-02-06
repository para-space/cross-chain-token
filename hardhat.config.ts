import "@typechain/hardhat";
import "@nomicfoundation/hardhat-toolbox";

import { config as dotenvConfig } from "dotenv";
import type { HardhatUserConfig } from "hardhat/config";
import type {
  HardhatNetworkAccountUserConfig,
  NetworkUserConfig,
} from "hardhat/types";
import path, { resolve } from "path";
import fs from "fs";

import { eEthereumNetwork } from "./script/types";
import {
  ARBITRUM_ETHERSCAN_KEY,
  ARBITRUM_SEPOLIA_ETHERSCAN_KEY,
  BROWSER_URLS,
  CHAIN_ID,
  ETHERSCAN_APIS,
  ETHERSCAN_KEY,
  NETWORKS_RPC_URL,
  SEPOLIA_ETHERSCAN_KEY,
} from "./hardhat-constants";

const dotenvConfigPath: string = process.env.DOTENV_CONFIG_PATH || "./.env";
dotenvConfig({ path: resolve(__dirname, dotenvConfigPath) });

const tasksPath = path.join(__dirname, "task");
fs.readdirSync(tasksPath)
  .filter((pth) => pth.includes(".ts"))
  .forEach((task) => {
    require(`${tasksPath}/${task}`);
  });

// Ensure that we have all the environment variables we need.
if (!process.env.SIGNER_KEY) throw new Error("No private key found");
const privateKey: HardhatNetworkAccountUserConfig = process.env
  .SIGNER_KEY as unknown as HardhatNetworkAccountUserConfig;

function getChainConfig(network: eEthereumNetwork): NetworkUserConfig {
  return {
    accounts: [`0x${privateKey}`],
    chainId: CHAIN_ID[network],
    url: NETWORKS_RPC_URL[network],
  };
}

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  etherscan: {
    apiKey: {
      localhost: ETHERSCAN_KEY,
      mainnet: ETHERSCAN_KEY,
      sepolia: ETHERSCAN_KEY,
      arbitrum: ARBITRUM_ETHERSCAN_KEY,
      arbitrumSepolia: ARBITRUM_SEPOLIA_ETHERSCAN_KEY,
    },
    customChains: [
      eEthereumNetwork.mainnet,
      eEthereumNetwork.sepolia,
      eEthereumNetwork.arbitrum,
      eEthereumNetwork.arbitrumSepolia,
    ].map((network) => ({
      network,
      chainId: CHAIN_ID[network]!,
      urls: {
        apiURL: ETHERSCAN_APIS[network],
        browserURL: BROWSER_URLS[network],
      },
    })),
  },
  networks: {
    [eEthereumNetwork.hardhat]: {
      chainId: CHAIN_ID[eEthereumNetwork.hardhat],
    },
    [eEthereumNetwork.mainnet]: getChainConfig(eEthereumNetwork.mainnet),
    [eEthereumNetwork.sepolia]: getChainConfig(eEthereumNetwork.sepolia),
    [eEthereumNetwork.arbitrum]: getChainConfig(eEthereumNetwork.arbitrum),
    [eEthereumNetwork.arbitrumSepolia]: getChainConfig(
      eEthereumNetwork.arbitrumSepolia
    ),
  },
  paths: {
    sources: "./contracts",
    cache: "./cache_hardhat",
    artifacts: "./artifacts",
    tests: "./test",
  },
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 999999,
      },
    },
  },
};

export default config;
