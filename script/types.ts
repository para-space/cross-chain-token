export type tEthereumAddress = string;

export enum eEthereumNetwork {
  hardhat = "hardhat",
  mainnet = "mainnet",
  sepolia = "sepolia",
  arbitrum = "arbitrum",
  arbitrumSepolia = "arbitrumSepolia",
}

export enum eContractid {
  AaveStrategyImpl = "AaveStrategyImpl",
  ETHAaveStrategyImpl = "ETHAaveStrategyImpl",
  ETHAaveStrategyProxy= "ETHAaveStrategyProxy",
  AaveStrategyProxy = "AaveStrategyProxy",
  XERC20 = "XERC20",
  LockBox = "LockBox",
}

export enum Tokens {
  USDC = "USDC",
  WETH = "WETH",
  USDT = "USDT",
  DAI = "DAI",
  WBTC = "WBTC",
  wstETH = "wstETH",
  rETH = "rETH",
  cbETH = "cbETH",
  AAVE = "AAVE",
  LINK = "LINK",
}

export enum Strategy {
  AAVE = "AAVE",
  ETHAAVE = "ETHAAVE",
}

export interface ITokenConfig {
  address: tEthereumAddress;
  strategy: Strategy;
  strategyPool?: tEthereumAddress;
  strategyOwner?: tEthereumAddress;
}

export interface IConfiguration {
  upgradeAdmin: tEthereumAddress;
  vaultOwner: tEthereumAddress;
  wstETH?: tEthereumAddress;
  Tokens: Partial<Record<Tokens, ITokenConfig>>;
}
