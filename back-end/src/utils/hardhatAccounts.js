const { ethers } = require('ethers');

const HARDHAT_DEFAULT_MNEMONIC = 'test test test test test test test test test test test junk';


function getHardhatAccounts() {
    const accounts = [];
    try {
        console.log("🛠️ 正在生成 Hardhat 测试账户...");

        for (let i = 0; i < 20; i++) {
            const path = `m/44'/60'/0'/0/${i}`;
            const wallet = ethers.HDNodeWallet.fromPhrase(HARDHAT_DEFAULT_MNEMONIC, path);

            accounts.push({
                address: wallet.address,
                privateKey: wallet.privateKey
            });
        }
        console.log(`✅ 成功加载 ${accounts.length} 个Hardhat测试账户`);
    } catch (error) {
        console.error("❌ 生成 Hardhat 账户失败:", error);
        throw new Error("无法生成Hardhat测试账户，请检查ethers.js版本和配置。");
    }
    return accounts;
}

module.exports = {
    getHardhatAccounts
};