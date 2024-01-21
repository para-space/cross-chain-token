import { config as dotenvConfig } from "dotenv";
dotenvConfig();
import { getMarketConfig } from "../helpers/utils";
import hre from "hardhat";
import { XERC20Factory } from "../../typechain-types";
import {
  deployAAVEStrategy,
  deployAAVEStrategyImpl,
  deployETHAAVEStrategy,
  deployFactory,
  deployLockbox,
  deployXERC20,
} from "../helpers/deployment";
import { Strategy } from "../types";
import { ZEROADDRESS } from "../helpers/constants";

export const main = async () => {
  console.log("currnet network:", hre.network.name);
  const marketConfig = getMarketConfig();
  if (!marketConfig || !marketConfig.Tokens) {
    console.log("No market token config");
    return;
  }

  const factory: XERC20Factory = await deployFactory();

  //deploy xToken and lockbox
  for (const key in marketConfig.Tokens) {
    if (Object.prototype.hasOwnProperty.call(marketConfig.Tokens, key)) {
      const tokenConfig = marketConfig.Tokens[key];
      console.log("deploying for:", tokenConfig.symbol);

      const xERC20 = await deployXERC20(
        factory,
        tokenConfig.name,
        tokenConfig.symbol
      );
      if (tokenConfig.address) {
        const lockBox = await deployLockbox(
          factory,
          await xERC20.getAddress(),
          tokenConfig.address,
          tokenConfig.symbol
        );

        let strategy;
        switch (tokenConfig.strategy) {
          case Strategy.AAVE:
            strategy = await deployAAVEStrategy(
              tokenConfig.symbol,
              tokenConfig.strategyPool,
              await lockBox.getAddress(),
              marketConfig.upgradeAdmin
            );
            break;
          case Strategy.ETHAAVE:
            strategy = await deployETHAAVEStrategy(
              marketConfig.wstETH!,
              tokenConfig.strategyPool,
              await lockBox.getAddress(),
              marketConfig.upgradeAdmin
            );
            break;
          default:
            throw new Error("invalid strategy");
        }

        const currentStrategy = await lockBox.strategy();
        if (currentStrategy === ZEROADDRESS) {
          const strategyAddr = await strategy.getAddress();
          console.log("set new strategy:", strategyAddr);
          await lockBox.setStrategy(strategyAddr);
        }
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
