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
  ETHAaveStrategyProxy = "ETHAaveStrategyProxy",
  AaveStrategyProxy = "AaveStrategyProxy",
  XERC20Factory = "XERC20Factory",
  XERC20 = "XERC20",
  LockBox = "LockBox",
  XERC721Factory = "XERC721Factory",
  XERC721 = "XERC721",
  ERC721LockBox = "ERC721LockBox",
  ApeStakingStrategyImpl = "ApeStakingStrategyImpl",
  ApeStakingStrategyProxy = "ApeStakingStrategyProxy",
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
  BAYC = "BAYC",
  MAYC = "MAYC",
  BAKC = "BAKC",
}

export enum TokenType {
  ERC20 = "ERC20",
  ERC721 = "ERC721",
}

export enum Strategy {
  AAVE = "AAVE",
  ETHAAVE = "ETHAAVE",
  ApeStaking = "ApeStaking",
}

export interface ITokenConfig {
  name: string;
  symbol: string;
  tokenType: TokenType;
  address?: tEthereumAddress;
  strategy?: Strategy;
  strategyPool?: tEthereumAddress;
  strategyOwner?: tEthereumAddress;
}

export interface IConfiguration {
  upgradeAdmin: tEthereumAddress;
  vaultOwner: tEthereumAddress;
  wstETH?: tEthereumAddress;
  Tokens: Partial<Record<Tokens, ITokenConfig>>;
}
