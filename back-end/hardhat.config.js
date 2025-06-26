// hardhat.config.js
require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
const config = {
    solidity: "0.8.28",
    networks: {
        hardhat: {
            // Hardhat 会自动填充这里的 accounts
            // 我们不需要手动写，但要确保这个结构存在
        },
        // 你可能还有其他网络，比如 localhost
        localhost: {
            url: "http://127.0.0.1:8545",
            // 如果 npx hardhat node 运行时，它会使用默认的20个账户
        }
    }
};

module.exports = config; // 导出整个 config 对象
