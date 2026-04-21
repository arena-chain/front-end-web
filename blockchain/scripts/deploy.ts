import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deploying with: ${deployer.address}`);

    const ArenaTicketNFT = await ethers.getContractFactory("ArenaTicketNFT");
    const contract = await ArenaTicketNFT.deploy(deployer.address);

    await contract.waitForDeployment();
    const address = await contract.getAddress();

    console.log(`ArenaTicketNFT deployed at: ${address}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
