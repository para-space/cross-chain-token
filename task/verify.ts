import { task } from "hardhat/config";

task("verify-contracts", "verify contract")
  .addParam("contract", "The Id of the contract to verify")
  .setAction(async ({ contract }) => {
    const { getDeployInfo, verify } = await import("../script/helpers/utils");
    const deployInfo = getDeployInfo();
    const contractDeployInfo = deployInfo[contract];
    if (contractDeployInfo.address) {
      await verify(
        contractDeployInfo.address,
        contractDeployInfo.constructorArgs
      );
    }
  });
