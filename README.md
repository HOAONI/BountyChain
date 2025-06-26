# 赏金猎人系统运行指南

## **注意！**建议启用两个浏览器来操作。否则切换账号在另一个标签页登录的话，会导致前一个失效。

1. ## 进入 backend 目录

   ```bash
   cd back-end
   npm install
   ```

   1.1 启动 hardhat (第 1 个终端)

   ```bash
   npx hardhat node
   ```

   1.2 部署合约(第 2 个终端)

   ```bash
   npx hardhat run scripts/deploy.js --network localhost
   ```

   1.3 启动后台服务(第 3 个终端)

   ```bash
   node server.js
   ```

2. ## 进入前端目录并启动前端服务

   ```bash
   cd ../front-end
   npm install
   npm run dev
   ```

   

3. ## 浏览器打开前端链接

4. ### metamask配置本地hardhat网络，导入hardhat生成的20个随机账号

   ![image-20250626225458188](/Users/hoaon/Library/Application Support/typora-user-images/image-20250626225458188.png)

   ![image-20250626225726965](/Users/hoaon/Library/Application Support/typora-user-images/image-20250626225726965.png)

   ![image-20250626225749285](/Users/hoaon/Library/Application Support/typora-user-images/image-20250626225749285.png)

   ![image-20250626225835263](/Users/hoaon/Library/Application Support/typora-user-images/image-20250626225835263.png)

   ![image-20250626225852694](/Users/hoaon/Library/Application Support/typora-user-images/image-20250626225852694.png)

   ![image-20250626225916667](/Users/hoaon/Library/Application Support/typora-user-images/image-20250626225916667.png)

   ![image-20250626230030510](/Users/hoaon/Library/Application Support/typora-user-images/image-20250626230030510.png)

   

   

   

   

   