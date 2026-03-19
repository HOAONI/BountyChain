import axios from 'axios';
import {getSigner} from '../utils/ethers';

const API_BASE_URL = 'http://localhost:3000/api/auth'; // 指向认证路由

const authApi = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
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

export const loginWithMetaMask = async () => {
    try {
        const signer = getSigner();
        const address = await signer.getAddress();

        const message = `欢迎登录区块链任务悬赏平台！\n\n您的地址是: ${address}\n时间: ${new Date().toISOString()}`;

        const signature = await signer.signMessage(message);
        console.log("已获取签名:", signature);

        const response = await authApi.post('/login', {address, signature, message});
        return response.data;
    } catch (error) {
        handleError(error);
    }
};