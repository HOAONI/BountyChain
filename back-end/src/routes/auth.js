const express = require('express');
const router = express.Router();
const { ethers } = require('ethers');
const { getHardhatAccounts } = require('../utils/hardhatAccounts');

const hardhatAccounts = getHardhatAccounts();
console.log(`✅ Auth路由加载成功，Hardhat测试账户已准备: ${hardhatAccounts.length}个`);

router.post('/login', async (req, res) => {
    try {
        const { address, signature, message } = req.body;

        if (!address || !signature || !message) {
            return res.status(400).json({ success: false, message: "地址、签名和消息都不能为空" });
        }

        let recoveredAddress;
        try {
            recoveredAddress = ethers.verifyMessage(message, signature);
        } catch (signError) {
            console.error("❌ 签名验证失败:", signError);
            return res.status(401).json({ success: false, message: "签名验证失败，签名或消息不匹配" });
        }

        if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
            console.log(`❌ 地址不匹配：提供的地址 ${address}, 恢复的地址 ${recoveredAddress}`);
            return res.status(401).json({ success: false, message: "登录失败：签名地址与提供地址不匹配" });
        }

        const isHardhatAccount = hardhatAccounts.some(acc => acc.address.toLowerCase() === address.toLowerCase());

        if (isHardhatAccount) {
            console.log(`✅ 登录验证成功, 地址: ${address} (Hardhat测试账户)`);
            res.json({ success: true, address: address, message: "登录成功" });
        } else {
            console.log(`⚠️ 登录验证成功, 地址: ${address} (非Hardhat测试账户)`);
            res.json({ success: true, address: address, message: "登录成功 (非Hardhat测试账户，开发模式下通常需要是测试账户)" });
        }
    } catch (error) {
        console.error("❌ 登录验证时发生服务器错误:", error);
        res.status(500).json({ success: false, message: "服务器内部错误", error: error.message });
    }
});

module.exports = router;