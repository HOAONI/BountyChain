const express = require('express');
const router = express.Router();
const { ethers } = require("ethers");

router.get('/', async (req, res) => {
    try {
        const bountyPlatformContract = req.app.locals.bountyPlatformContractReader;
        console.log("📝 收到获取所有任务ID的请求...");

        const taskIdsBigInt = await bountyPlatformContract.getAllTaskIds();
        const taskIds = taskIdsBigInt.map(id => id.toString());

        console.log("✅ 成功获取所有任务ID:", taskIds);
        res.json({ success: true, taskIds });
    } catch (error) {
        console.error("❌ 获取所有任务ID失败:", error);
        res.status(500).json({ success: false, message: "获取所有任务ID失败", error: error.message });
    }
});

router.get('/:taskId', async (req, res) => {
    try {
        const taskId = parseInt(req.params.taskId);
        const bountyPlatformContract = req.app.locals.bountyPlatformContractReader;
        console.log(`📝 收到获取任务详情的请求, 任务ID: ${taskId}`);

        const task = await bountyPlatformContract.getTask(taskId);
        const formattedTask = {
            id: task.id.toString(),
            poster: task.poster,
            title: task.title,
            description: task.description,
            bountyAmount: ethers.formatEther(task.bountyAmount),
            deadline: task.deadline.toString(),
            applicant: task.applicant,
            submitted: task.submitted,
            completed: task.completed,
            proofDescription: task.proofDescription,
            proofUrl: task.proofUrl
        };

        console.log("✅ 成功获取任务详情:", formattedTask);
        res.json({ success: true, task: formattedTask });
    } catch (error) {
        console.error(`❌ 获取任务详情失败 (任务ID: ${req.params.taskId}):`, error);
        if (error.reason && error.reason.includes("Task does not exist")) {
            res.status(404).json({ success: false, message: "任务不存在", error: error.message });
        } else {
            res.status(500).json({ success: false, message: "获取任务详情失败", error: error.message });
        }
    }
});

router.post('/post', async (req, res) => {
    try {
        const { title, description, bountyAmountEth, deadlineTimestamp, transactionHash } = req.body;
        console.log(`📝 收到发布新任务的请求 (前端已发送交易):`, { title, bountyAmountEth, transactionHash });

        res.status(201).json({
            success: true,
            message: "任务发布请求已接收，请等待链上确认",
            transactionHash: transactionHash,
        });
    } catch (error) {
        console.error("❌ 发布任务后端处理失败:", error);
        res.status(500).json({ success: false, message: "发布任务后端处理失败", error: error.message });
    }
});


router.post('/apply', async (req, res) => {
    try {
        const { taskId, transactionHash } = req.body;
        console.log(`📝 收到接取任务请求 (前端已发送交易), 任务ID: ${taskId}, 交易哈希: ${transactionHash}`);

        res.json({
            success: true,
            message: `任务 ${taskId} 接取请求已接收，等待链上确认`,
            transactionHash: transactionHash
        });
    } catch (error) {
        console.error("❌ 接取任务后端处理失败:", error);
        res.status(500).json({ success: false, message: "接取任务后端处理失败", error: error.message });
    }
});

router.post('/submit', async (req, res) => {
    try {
        const { taskId, proofDescription, proofUrl, transactionHash } = req.body;
        console.log(`📝 收到提交任务成果请求 (前端已发送交易), 任务ID: ${taskId}, 交易哈希: ${transactionHash}`);

        res.json({
            success: true,
            message: `任务 ${taskId} 成果提交请求已接收，等待链上确认`,
            transactionHash: transactionHash
        });
    } catch (error) {
        console.error("❌ 提交任务成果后端处理失败:", error);
        res.status(500).json({ success: false, message: "提交任务成果后端处理失败", error: error.message });
    }
});

router.post('/review', async (req, res) => {
    try {
        const { taskId, approved, transactionHash } = req.body;
        console.log(`📝 收到审核任务请求 (前端已发送交易), 任务ID: ${taskId}, 状态: ${approved}, 交易哈希: ${transactionHash}`);

        res.json({
            success: true,
            message: `任务 ${taskId} 审核请求已接收，等待链上确认`,
            transactionHash: transactionHash
        });
    } catch (error) {
        console.error("❌ 审核任务后端处理失败:", error);
        res.status(500).json({ success: false, message: "审核任务后端处理失败", error: error.message });
    }
});

router.get('/poster/:address', async (req, res) => {
    try {
        const posterAddress = req.params.address;
        const bountyPlatformContract = req.app.locals.bountyPlatformContractReader;
        console.log(`📝 收到获取发布者任务的请求, 地址: ${posterAddress}`);

        const taskIdsBigInt = await bountyPlatformContract.getTasksByPoster(posterAddress);
        const taskIds = taskIdsBigInt.map(id => id.toString());

        console.log("✅ 成功获取发布者任务ID:", taskIds);
        res.json({ success: true, taskIds });
    } catch (error) {
        console.error(`❌ 获取发布者任务失败 (地址: ${req.params.address}):`, error);
        res.status(500).json({ success: false, message: "获取发布者任务失败", error: error.message });
    }
});

router.get('/applicant/:address', async (req, res) => {
    try {
        const applicantAddress = req.params.address;
        const bountyPlatformContract = req.app.locals.bountyPlatformContractReader;
        console.log(`📝 收到获取接取者任务的请求, 地址: ${applicantAddress}`);

        const taskIdsBigInt = await bountyPlatformContract.getTasksByApplicant(applicantAddress);
        const taskIds = taskIdsBigInt.map(id => id.toString());

        console.log("✅ 成功获取接取者任务ID:", taskIds);
        res.json({ success: true, taskIds });
    } catch (error) {
        console.error(`❌ 获取接取者任务失败 (地址: ${req.params.address}):`, error);
        res.status(500).json({ success: false, message: "获取接取者任务失败", error: error.message });
    }
});


module.exports = router;