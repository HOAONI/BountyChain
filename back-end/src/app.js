const express = require('express');
const cors = require('cors');
const { ethers } = require("ethers");
const { abi: BountyPlatformABI } = require("../artifacts/contracts/BountyPlatform.sol/BountyPlatform.json"); // 引入合约 ABI
const taskRoutes = require('./routes/tasks');
const authRoutes = require('./routes/auth');

const app = express();

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

const bountyPlatformContractReader = new ethers.Contract(
    process.env.CONTRACT_ADDRESS,
    BountyPlatformABI,
    provider
);

app.locals.provider = provider;
app.locals.bountyPlatformContractReader = bountyPlatformContractReader;
app.locals.BountyPlatformABI = BountyPlatformABI;

console.log("🌟 Ethers.js 配置完成:");
console.log(`   - RPC URL: ${process.env.RPC_URL}`);
console.log(`   - 合约地址: ${process.env.CONTRACT_ADDRESS}`);

app.use(cors({
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

app.get('/', (req, res) => {
    res.send('🚀 区块链任务悬赏后端服务已启动！(支持MetaMask前端交互模式)');
});

module.exports = app;