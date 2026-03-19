import {ethers} from 'ethers';
import BountyPlatformABI from '../../../back-end/artifacts/contracts/BountyPlatform.sol/BountyPlatform.json'; // 引入 ABI

const CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

let provider = null;
let signer = null;
let bountyPlatformContract = null; // 可写合约实例
let bountyPlatformContractReader = null; // 只读合约实例


export const initEthers = async () => {
    if (window.ethereum) {
        provider = new ethers.BrowserProvider(window.ethereum);
        try {
            await provider.send("eth_requestAccounts", []);
            signer = await provider.getSigner();

            bountyPlatformContract = new ethers.Contract(
                CONTRACT_ADDRESS,
                BountyPlatformABI.abi,
                signer
            );
            bountyPlatformContractReader = new ethers.Contract(
                CONTRACT_ADDRESS,
                BountyPlatformABI.abi,
                provider
            );

            console.log("✅ Ethers.js 和 MetaMask 初始化成功！");
            console.log("   - 当前连接地址:", signer.address);
            return signer.address;
        } catch (error) {
            console.error("❌ 初始化 Ethers.js 或连接 MetaMask 失败:", error);
            throw new Error("请连接MetaMask并授权访问。");
        }
    } else {
        console.error("❌ MetaMask 未安装或未检测到！");
        throw new Error("请安装MetaMask浏览器扩展以使用此应用。");
    }
};


export const getCurrentAccount = async () => {
    if (signer) {
        return await signer.getAddress();
    }
    if (window.ethereum) {
        const tempProvider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await tempProvider.listAccounts();
        return accounts.length > 0 ? accounts[0].address : null;
    }
    return null;
};


export const getBountyPlatformContract = () => {
    if (!bountyPlatformContract) {
        throw new Error("Ethers.js 和 MetaMask 未初始化。请先调用 initEthers()");
    }
    return bountyPlatformContract;
};


export const getBountyPlatformContractReader = () => {
    if (!bountyPlatformContractReader) {
        throw new Error("Ethers.js 和 MetaMask 未初始化。请先调用 initEthers()");
    }
    return bountyPlatformContractReader;

};


export const getSigner = () => {
    if (!signer) {
        throw new Error("Ethers.js 和 MetaMask 未初始化。请先调用 initEthers()");
    }
    return signer;
};


export const onAccountsChanged = (callback) => {
    if (window.ethereum) {
        window.ethereum.on('accountsChanged', (accounts) => {
            console.log("MetaMask 账户已切换:", accounts);
            callback(accounts[0] || null); // 传递新的地址
            if (accounts.length > 0) {
                initEthers().then(() => {
                    console.log("Ethers.js 重新初始化以适应新账户。");
                }).catch(err => {
                    console.error("MetaMask 账户切换后重新初始化失败:", err);
                });
            } else {
                console.log("MetaMask 所有账户都被移除，请重新连接。");
                sessionStorage.clear(); // 清除会话状态
            }
        });
    }
};


export const onChainChanged = (callback) => {
    if (window.ethereum) {
        window.ethereum.on('chainChanged', (chainId) => {
            console.log("MetaMask 网络已切换:", chainId);
            callback(chainId);
            initEthers().then(() => {
                console.log("Ethers.js 重新初始化以适应新网络。");
            }).catch(err => {
                console.error("MetaMask 网络切换后重新初始化失败:", err);
            });
        });
    }
};