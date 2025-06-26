const {ethers} = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("使用以下地址部署合约:", deployer.address);

    const BountyPlatform = await ethers.getContractFactory("BountyPlatform");
    const bountyPlatform = await BountyPlatform.deploy();

    await bountyPlatform.waitForDeployment();
    const contractAddress = await bountyPlatform.getAddress();

    console.log("BountyPlatform 合约已部署到:", contractAddress);


}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });