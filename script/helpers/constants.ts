import { config as dotenvConfig } from "dotenv";
import {
  eEthereumNetwork,
  IConfiguration,
  Strategy,
  TokenType,
} from "../types";

dotenvConfig();

export const ZEROADDRESS = "0x0000000000000000000000000000000000000000";

export const SepoliaConfig: IConfiguration = {
  upgradeAdmin: "0x018281853eCC543Aa251732e8FDaa7323247eBeB",
  vaultOwner: "0x018281853eCC543Aa251732e8FDaa7323247eBeB",
  socketConfig: {
    socketBridge: "0x07e11D1A1543B0D0b91684eb741d1ab7D51ae237",
  },
  Tokens: {
    DAI: {
      tokenType: TokenType.ERC20,
      name: "Dai Stablecoin",
      symbol: "DAI",
      address: "0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357",
      strategy: Strategy.AAVE,
      strategyPool: "0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951",
    },
    LINK: {
      tokenType: TokenType.ERC20,
      name: "ChainLink Token",
      symbol: "LINK",
      address: "0xf8Fb3713D459D7C1018BD0A49D19b4C44290EBE5",
      strategy: Strategy.AAVE,
      strategyPool: "0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951",
    },
    USDC: {
      tokenType: TokenType.ERC20,
      name: "USD Coin",
      symbol: "USDC",
      address: "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8",
      strategy: Strategy.AAVE,
      strategyPool: "0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951",
    },
    WBTC: {
      tokenType: TokenType.ERC20,
      name: "Wrapped BTC",
      symbol: "WBTC",
      address: "0x29f2D40B0605204364af54EC677bD022dA425d03",
      strategy: Strategy.AAVE,
      strategyPool: "0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951",
    },
    WETH: {
      tokenType: TokenType.ERC20,
      name: "Wrapped Ether",
      symbol: "WETH",
      address: "0xC558DBdd856501FCd9aaF1E62eae57A9F0629a3c",
      strategy: Strategy.AAVE,
      strategyPool: "0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951",
    },
    USDT: {
      tokenType: TokenType.ERC20,
      name: "Tether USD",
      symbol: "USDT",
      address: "0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0",
      strategy: Strategy.AAVE,
      strategyPool: "0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951",
    },
    AAVE: {
      tokenType: TokenType.ERC20,
      name: "Aave Token",
      symbol: "AAVE",
      address: "0x88541670E55cC00bEEFD87eB59EDd1b7C511AC9a",
      strategy: Strategy.AAVE,
      strategyPool: "0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951",
    },
    BAYC: {
      tokenType: TokenType.ERC721,
      name: "BoredApeYachtClub",
      symbol: "BAYC",
      address: "0x5f45CA92B70D37C672E4a4aAC066d38aC5da7a25",
      strategy: Strategy.ApeStaking,
      strategyPool: "0x69a2e10e626a08654017075B7B0B1797ae67fe50",
    },
    MAYC: {
      tokenType: TokenType.ERC721,
      name: "MutantApeYachtClub",
      symbol: "MAYC",
      address: "0x8d2Fd271D85b3bb23209f075fB869c4f71652904",
      strategy: Strategy.ApeStaking,
      strategyPool: "0x69a2e10e626a08654017075B7B0B1797ae67fe50",
    },
    BAKC: {
      tokenType: TokenType.ERC721,
      name: "BoredApeKennelClub",
      symbol: "BAKC",
      address: "0x3D5913140b3B6F03B545e2703D7910bc1b476203",
      strategy: Strategy.ApeStaking,
      strategyPool: "0x69a2e10e626a08654017075B7B0B1797ae67fe50",
    },
  },
};

export const ArbitrumSepoliaConfig: IConfiguration = {
  upgradeAdmin: "0x018281853eCC543Aa251732e8FDaa7323247eBeB",
  vaultOwner: "0x018281853eCC543Aa251732e8FDaa7323247eBeB",
  socketConfig: {
    socketBridge: "0xEA59E2b1539b514290dD3dCEa989Ea36279aC6F2",
  },
  Tokens: {
    DAI: {
      tokenType: TokenType.ERC20,
      name: "Dai Stablecoin",
      symbol: "DAI",
    },
    BAYC: {
      tokenType: TokenType.ERC721,
      name: "BoredApeYachtClub",
      symbol: "BAYC",
    },
  },
};

export const EAConfigs: Partial<Record<eEthereumNetwork, IConfiguration>> = {
  //[eEthereumNetwork.hardhat]: HardhatConfig,
  //[eEthereumNetwork.mainnet]: MainnetConfig,
  [eEthereumNetwork.sepolia]: SepoliaConfig,
  [eEthereumNetwork.arbitrumSepolia]: ArbitrumSepoliaConfig,
};
