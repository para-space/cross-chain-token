import { config as dotenvConfig } from "dotenv";
dotenvConfig();
import { getMarketConfig } from "../helpers/utils";
import hre from "hardhat";
import { XERC20Factory, XERC721Factory } from "../../typechain-types";
import {
  deployAAVEStrategy,
  deployApeStakingStrategy,
  deployERC721Factory,
  deployERC721Lockbox,
  deployETHAAVEStrategy,
  deployFactory,
  deployLockbox,
  deploySocketAdapter,
  deployXERC20,
  deployXERC721,
} from "../helpers/deployment";
import { Strategy, TokenType } from "../types";
import { ZEROADDRESS } from "../helpers/constants";

export const main = async () => {
  console.log("currnet network:", hre.network.name);
  const marketConfig = getMarketConfig();
  if (!marketConfig || !marketConfig.Tokens) {
    console.log("No market token config");
    return;
  }

  if (marketConfig.socketConfig) {
    await deploySocketAdapter(marketConfig.socketConfig.socketBridge);
  }

  let erc20Factory: XERC20Factory;
  let erc721Factory: XERC721Factory;

  //deploy xToken and lockbox
  for (const key in marketConfig.Tokens) {
    if (Object.prototype.hasOwnProperty.call(marketConfig.Tokens, key)) {
      const tokenConfig = marketConfig.Tokens[key];
      console.log("deploying for:", tokenConfig.symbol);

      if (!erc20Factory) {
        erc20Factory = await deployFactory();
      }

      if (tokenConfig.tokenType == TokenType.ERC20) {
        const xERC20 = await deployXERC20(
          erc20Factory,
          tokenConfig.name,
          tokenConfig.symbol
        );
        if (tokenConfig.address) {
          const lockBox = await deployLockbox(
            erc20Factory,
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
              throw new Error("invalid erc20 strategy");
          }

          const currentStrategy = await lockBox.strategy();
          if (currentStrategy === ZEROADDRESS) {
            const strategyAddr = await strategy.getAddress();
            console.log("set new strategy:", strategyAddr);
            await lockBox.setStrategy(strategyAddr);
          }
        }
      } else if (tokenConfig.tokenType == TokenType.ERC721) {
        if (!erc721Factory) {
          erc721Factory = await deployERC721Factory();
        }

        const xERC721 = await deployXERC721(
          erc721Factory,
          tokenConfig.name,
          tokenConfig.symbol
        );
        if (tokenConfig.address) {
          await deployERC721Lockbox(
            erc721Factory,
            await xERC721.getAddress(),
            tokenConfig.address,
            tokenConfig.symbol
          );

          switch (tokenConfig.strategy) {
            case Strategy.ApeStaking:
              await deployApeStakingStrategy(marketConfig.upgradeAdmin);
              break;
            default:
              throw new Error("invalid erc721 strategy");
          }
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
