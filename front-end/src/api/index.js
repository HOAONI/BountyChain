import axios from 'axios';
import { ethers } from 'ethers';
import { getBountyPlatformContract, getBountyPlatformContractReader } from '../utils/ethers';

const API_BASE_URL = 'http://localhost:3000/api/tasks';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

const handleError = (error) => {
    if (error.response) {
        console.error('API 响应错误:', error.response.data);
        throw new Error(error.response.data.message || `请求失败，状态码: ${error.response.status}`);
    } else if (error.request) {
        console.error('API 请求错误: 没有收到响应', error.request);
        throw new Error('网络请求失败，请检查后端服务是否运行');
    } else {
        console.error('API 错误:', error.message);
        throw new Error(`API 请求配置错误: ${error.message}`);
    }
};


export const getAllTaskIds = async () => {
    try {
        const response = await api.get('/');
        return response.data.taskIds;
    } catch (error) {
        handleError(error);
    }
};

export const getTaskDetails = async (taskId) => {
    try {
        const response = await api.get(`/${taskId}`);
        return response.data.task;
    } catch (error) {
        handleError(error);
    }
};

export const postNewTask = async (taskData) => {
    try {
        const bountyPlatformContract = getBountyPlatformContract(); // 获取可写合约实例
        const bountyAmountWei = ethers.parseEther(taskData.bountyAmountEth.toString());
        const deadline = BigInt(taskData.deadlineTimestamp);

        console.log("准备通过 MetaMask 发布新任务...", taskData);

        const tx = await bountyPlatformContract.postTask(
            taskData.title,
            taskData.description,
            deadline,
            { value: bountyAmountWei } // 发送ETH作为赏金
        );

        console.log("交易已发送，等待确认:", tx.hash);
        const receipt = await tx.wait(); // 等待交易确认
        console.log("交易确认成功，区块号:", receipt.blockNumber);

        let newTaskId = null;
        for (const log of receipt.logs) {
            try {
                const parsedLog = bountyPlatformContract.interface.parseLog(log);
                if (parsedLog && parsedLog.name === 'TaskPosted') {
                    newTaskId = parsedLog.args.taskId.toString();
                    console.log("🎉 成功解析 TaskPosted 事件，新任务ID:", newTaskId);
                    break;
                }
            } catch (e) {
            }
        }



        return {
            success: true,
            message: "任务发布成功",
            transactionHash: tx.hash,
            taskId: newTaskId
        };

    } catch (error) {
        console.error("发布任务失败:", error);
        let errorMessage = "发布任务失败";
        if (error.code === 4001) {
            errorMessage = "交易已被用户拒绝。";
        } else if (error.reason) {
            errorMessage = `链上错误: ${error.reason}`;
        }
        throw new Error(errorMessage);
    }
};

export const applyForTask = async (taskId) => {
    try {
        const bountyPlatformContract = getBountyPlatformContract();
        console.log(`准备通过 MetaMask 接取任务, 任务ID: ${taskId}`);

        const tx = await bountyPlatformContract.applyForTask(taskId);
        console.log("交易已发送，等待确认:", tx.hash);
        await tx.wait();
        console.log("交易确认成功");

        return {
            success: true,
            message: `任务 ${taskId} 接取成功`,
            transactionHash: tx.hash
        };
    } catch (error) {
        console.error(`接取任务 ${taskId} 失败:`, error);
        let errorMessage = "接取任务失败";
        if (error.code === 4001) {
            errorMessage = "交易已被用户拒绝。";
        } else if (error.reason) {
            errorMessage = `链上错误: ${error.reason}`;
        }
        throw new Error(errorMessage);
    }
};

export const submitTaskProof = async (taskId, proofDescription, proofUrl) => {
    try {
        const bountyPlatformContract = getBountyPlatformContract();
        console.log(`准备通过 MetaMask 提交任务成果, 任务ID: ${taskId}`);

        const tx = await bountyPlatformContract.submitTask(taskId, proofDescription, proofUrl);
        console.log("交易已发送，等待确认:", tx.hash);
        await tx.wait();
        console.log("交易确认成功");

        return {
            success: true,
            message: `任务 ${taskId} 成果提交成功`,
            transactionHash: tx.hash
        };
    } catch (error) {
        console.error("提交任务成果失败:", error);
        let errorMessage = "提交任务成果失败";
        if (error.code === 4001) {
            errorMessage = "交易已被用户拒绝。";
        } else if (error.reason) {
            errorMessage = `链上错误: ${error.reason}`;
        }
        throw new Error(errorMessage);
    }
};

export const reviewTask = async (taskId, approved) => {
    try {
        const bountyPlatformContract = getBountyPlatformContract();
        console.log(`准备通过 MetaMask 审核任务, 任务ID: ${taskId}, 状态: ${approved}`);

        const tx = await bountyPlatformContract.reviewTask(taskId, approved);
        console.log("交易已发送，等待确认:", tx.hash);
        await tx.wait();
        console.log("交易确认成功");

        return {
            success: true,
            message: `任务 ${taskId} 审核成功，状态: ${approved ? '通过' : '拒绝'}`,
            transactionHash: tx.hash
        };
    } catch (error) {
        console.error("审核任务失败:", error);
        let errorMessage = "审核任务失败";
        if (error.code === 4001) {
            errorMessage = "交易已被用户拒绝。";
        } else if (error.reason) {
            errorMessage = `链上错误: ${error.reason}`;
        }
        throw new Error(errorMessage);
    }
};

export const getTasksPostedByUser = async (posterAddress) => {
    try {
        const response = await api.get(`/poster/${posterAddress}`);
        return response.data.taskIds;
    } catch (error) {
        handleError(error);
    }
};

export const getTasksAppliedByUser = async (applicantAddress) => {
    try {
        const response = await api.get(`/applicant/${applicantAddress}`);
        return response.data.taskIds;
    } catch (error) {
        handleError(error);
    }
};