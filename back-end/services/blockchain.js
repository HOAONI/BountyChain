const { ethers } = require("ethers");
require('dotenv').config();

const TaskContractABI = require("../artifacts/contracts/TaskContract.sol/TaskContract.json").abi;

const contractAddress = process.env.CONTRACT_ADDRESS;
const jsonRpcUrl = process.env.JSON_RPC_URL;

const provider = new ethers.JsonRpcProvider(jsonRpcUrl);

const readOnlyContract = new ethers.Contract(contractAddress, TaskContractABI, provider);

const signer = new ethers.Wallet(
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", // Hardhat 第一个账户的私钥
    provider
);

const writeableContract = new ethers.Contract(contractAddress, TaskContractABI, signer);

console.log("区块链服务初始化成功...");
console.log(`合约地址: ${contractAddress}`);


const getAllTasks = async () => {
    console.log("正在从区块链获取所有任务...");
    try {
        const tasks = await readOnlyContract.getAllTasks();
        return tasks.map(task => ({
            id: Number(task.id),
            title: task.title,
            description: task.description,
            reward: ethers.formatEther(task.reward),
            creator: task.creator,
            assignee: task.assignee,
            status: Number(task.status)
        }));
    } catch (error) {
        console.error("获取任务失败:", error);
        throw error;
    }
};


const createTask = async (title, description, rewardInEther) => {
    console.log(`正在创建新任务: ${title}, 赏金: ${rewardInEther} ETH`);
    try {
        const rewardInWei = ethers.parseEther(rewardInEther);

        const tx = await writeableContract.createTask(title, description, {
            value: rewardInWei // msg.value
        });

        await tx.wait();

        console.log("任务创建成功! 交易哈希:", tx.hash);
        return { success: true, txHash: tx.hash };
    } catch (error) {
        console.error("创建任务失败:", error);
        throw error;
    }
};

module.exports = {
    getAllTasks,
    createTask,
};