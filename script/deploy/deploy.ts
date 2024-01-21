import { config as dotenvConfig } from "dotenv";
dotenvConfig();
import { getMarketConfig } from "../helpers/utils";
import hre, { ethers } from "hardhat";
import { XERC20Factory, XERC20Lockbox } from "../../typechain-types";
import {
  deployAAVEStrategy,
  deployAAVEStrategyImpl,
  deployETHAAVEStrategy,
  deployFactory,
  deployLockbox,
  deployXERC20,
} from "../helpers/deployment";
import { Strategy } from "../types";

export const main = async () => {
  console.log("currnet network:", hre.network.name);
  const marketConfig = getMarketConfig();
  if (!marketConfig || !marketConfig.Tokens) {
    console.log("No market token config");
    return;
  }

  const factory: XERC20Factory = await deployFactory();

  const aaveStrategyImpl = await deployAAVEStrategyImpl();

  //deploy xToken and lockbox
  for (const key in marketConfig.Tokens) {
    if (Object.prototype.hasOwnProperty.call(marketConfig.Tokens, key)) {
      const tokenConfig = marketConfig.Tokens[key];
      console.log("deploying for:", tokenConfig.symbol);

      const xERC20Addr = await deployXERC20(
        factory,
        tokenConfig.name,
        tokenConfig.symbol
      );
      if (tokenConfig.address) {
        const lockBox = await deployLockbox(
          factory,
          xERC20Addr,
          tokenConfig.address,
          tokenConfig.symbol
        );

        let strategy;
        switch (tokenConfig.strategy) {
          case Strategy.AAVE:
            strategy = await deployAAVEStrategy(
              aaveStrategyImpl,
              tokenConfig.strategyPool,
              lockBox,
              marketConfig.upgradeAdmin
            );
            break;
          case Strategy.ETHAAVE:
            strategy = await deployETHAAVEStrategy(
              marketConfig.wstETH!,
              tokenConfig.strategyPool,
              lockBox,
              marketConfig.upgradeAdmin
            );
            break;
          default:
            throw new Error("invalid strategy");
        }

        const lockboxFactory = await ethers.getContractFactory("XERC20Lockbox");
        const lockBoxContract = lockboxFactory.attach(
          lockBox
        ) as unknown as XERC20Lockbox;
        await lockBoxContract.setStrategy(strategy);
      }
    }
  }
};

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
