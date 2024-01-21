import hre, { network, run } from "hardhat";
import { EAConfigs } from "./constants";
import { eEthereumNetwork, IConfiguration } from "../types";
import fs from "fs";
import path from "path";

export const deploymentsPath = path.join(__dirname, `/../../deployments/`);

export interface DeployInfo {
  address: string;
  constructorArgs: Array<any>;
}

export type ProjectAddresses = Record<string, DeployInfo>;

export const clearDeployInfo = () => {
  const addressesPath = deploymentsPath + `${hre.network.name}_addresses.json`;
  if (fs.existsSync(addressesPath)) {
    let deploymentAddresses: ProjectAddresses = {};
    fs.writeFileSync(
      addressesPath,
      JSON.stringify(deploymentAddresses, null, 2)
    );
  }
};

export const getDeployInfo = () => {
  const addressesPath = deploymentsPath + `${hre.network.name}_addresses.json`;
  if (!fs.existsSync(addressesPath)) {
    return {};
  }
  const deploymentAddressesString = fs.readFileSync(addressesPath, "utf-8");
  let deploymentAddresses: ProjectAddresses = JSON.parse(
    deploymentAddressesString
  );
  return deploymentAddresses;
};

export const getContractDeployInfo = async (key: string) => {
  const deploymentAddresses = getDeployInfo();
  return deploymentAddresses[key] as DeployInfo;
};

export const storeDeployInfo = async (key: string, info: DeployInfo) => {
  if (!fs.existsSync(deploymentsPath)) {
    await fs.promises.mkdir(deploymentsPath, { recursive: true });
  }

  const addressesPath = deploymentsPath + `${hre.network.name}_addresses.json`;
  const outputExists = fs.existsSync(addressesPath);
  let deploymentAddresses: ProjectAddresses = {};
  if (outputExists) {
    const deploymentAddressesString = fs.readFileSync(addressesPath, "utf-8");
    deploymentAddresses = JSON.parse(deploymentAddressesString);
  }
  deploymentAddresses[key] = info;
  fs.writeFileSync(addressesPath, JSON.stringify(deploymentAddresses, null, 2));
};

export const verify = async (address: string, args: any[]) => {
  try {
    await run("verify:verify", {
      address,
      constructorArguments: args,
    });
  } catch (error) {
    console.log("Error during verification", error);
  }
};

export const getMarketConfig = (): IConfiguration => {
  return EAConfigs[network.name];
};
