// test/BountyPlatform.test.js
const { expect } = require("chai"); // 导入 Chai 断言库
const { ethers } = require("hardhat"); // 导入 Hardhat 的 ethers 库

describe("BountyPlatform", function () {
    let BountyPlatform; // 合约工厂
    let bountyPlatform; // 合约实例
    let owner;          // 部署者 (合约所有者)
    let addr1;          // 第一个测试账户
    let addr2;          // 第二个测试账户
    let addrs;          // 其他测试账户

    // 在所有测试用例之前执行一次
    before(async function () {
        // 获取所有签名者 (测试账户)
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
        // 获取 BountyPlatform 合约工厂
        BountyPlatform = await ethers.getContractFactory("BountyPlatform");
    });

    // 在每个测试用例之前执行
    beforeEach(async function () {
        // 每次测试前都重新部署一个全新的合约实例，确保测试环境的独立性
        bountyPlatform = await BountyPlatform.deploy();
        await bountyPlatform.waitForDeployment();
    });

    describe("部署", function () {
        it("应该设置正确的 nextTaskId", async function () {
            // 验证 nextTaskId 初始值是否为 1
            expect(await bountyPlatform.nextTaskId()).to.equal(1);
        });
    });

    describe("发布任务", function () {
        it("应该允许用户发布任务并支付悬赏", async function () {
            const title = "测试任务";
            const description = "这是一个测试任务描述";
            const bounty = ethers.parseEther("0.1"); // 0.1 ETH
            const deadline = Math.floor(Date.now() / 1000) + 3600; // 未来一小时

            // 获取部署者在发布任务前的余额
            const initialBalance = await ethers.provider.getBalance(owner.address);

            // 发布任务，并发送 0.1 ETH 作为悬赏
            await expect(bountyPlatform.postTask(title, description, deadline, { value: bounty }))
                .to.emit(bountyPlatform, "TaskPosted") // 验证是否触发 TaskPosted 事件
                .withArgs(1, owner.address, title, description, bounty, deadline); // 验证事件参数

            // 验证合约中 nextTaskId 是否增加
            expect(await bountyPlatform.nextTaskId()).to.equal(2);

            // 验证任务详情是否正确存储
            const task = await bountyPlatform.tasks(1);
            expect(task.poster).to.equal(owner.address);
            expect(task.title).to.equal(title);
            expect(task.bountyAmount).to.equal(bounty);
            expect(task.deadline).to.equal(deadline);
            expect(task.applicant).to.equal(ethers.ZeroAddress); // 初始接取者地址为零地址

            // 验证部署者的余额是否减少 (扣除悬赏金额和 Gas 费用)
            const finalBalance = await ethers.provider.getBalance(owner.address);
            // 这里我们粗略检查余额减少，精确的 Gas 费用计算较为复杂
            expect(finalBalance).to.be.lt(initialBalance - bounty);
        });

        it("应该拒绝发布金额为零的任务", async function () {
            const title = "零赏金任务";
            const description = "这是一个零赏金任务描述";
            const deadline = Math.floor(Date.now() / 1000) + 3600;

            // 期望发布失败，并抛出错误信息
            await expect(bountyPlatform.postTask(title, description, deadline, { value: 0 }))
                .to.be.revertedWith("Bounty amount must be greater than 0");
        });

        it("应该拒绝发布截止日期在过去的任务", async function () {
            const title = "过期任务";
            const description = "这是一个过期任务描述";
            const bounty = ethers.parseEther("0.1");
            const deadline = Math.floor(Date.now() / 1000) - 3600; // 过去一小时

            await expect(bountyPlatform.postTask(title, description, deadline, { value: bounty }))
                .to.be.revertedWith("Deadline must be in the future");
        });
    });

    describe("接取任务", function () {
        beforeEach(async function () {
            // 先发布一个任务供后续测试使用
            const title = "可接取任务";
            const description = "描述";
            const bounty = ethers.parseEther("0.1");
            const deadline = Math.floor(Date.now() / 1000) + 3600;
            await bountyPlatform.postTask(title, description, deadline, { value: bounty });
        });

        it("应该允许用户接取一个未被接取的任务", async function () {
            const taskId = 1;
            // 使用 addr1 账户接取任务
            await expect(bountyPlatform.connect(addr1).applyForTask(taskId))
                .to.emit(bountyPlatform, "TaskApplied") // 验证是否触发 TaskApplied 事件
                .withArgs(taskId, addr1.address); // 验证事件参数

            const task = await bountyPlatform.tasks(taskId);
            expect(task.applicant).to.equal(addr1.address); // 验证接取者是否为 addr1
        });

        it("应该拒绝发布者接取自己的任务", async function () {
            const taskId = 1;
            // 期望发布者接取自己的任务时失败
            await expect(bountyPlatform.connect(owner).applyForTask(taskId))
                .to.be.revertedWith("Cannot apply for your own task");
        });

        it("应该拒绝接取不存在的任务", async function () {
            const taskId = 99; // 不存在的任务ID
            await expect(bountyPlatform.connect(addr1).applyForTask(taskId))
                .to.be.revertedWith("Task does not exist");
        });

        it("应该拒绝接取已被接取的任务", async function () {
            const taskId = 1;
            await bountyPlatform.connect(addr1).applyForTask(taskId); // addr1 先接取

            // addr2 尝试接取已被 addr1 接取的任务，期望失败
            await expect(bountyPlatform.connect(addr2).applyForTask(taskId))
                .to.be.revertedWith("Task already applied for");
        });

        it("应该拒绝接取已过期的任务", async function () {
            // 发布一个截止日期在未来的任务，但其截止日期离当前时间很近
            const title = "即将过期任务";
            const description = "描述";
            const bounty = ethers.parseEther("0.1");
            // 将截止日期设置为当前时间 + 10 秒，以便我们稍后可以快进时间
            const futureDeadline = Math.floor(Date.now() / 1000) + 10;
            await bountyPlatform.postTask(title, description, futureDeadline, { value: bounty });

            const taskId = 2; // 这是新发布的任务ID (因为 beforeEach 已经发布了一个任务1)

            // 将区块链时间快进到截止日期之后
            // Hardhat 允许我们通过 evm_increaseTime 和 evm_mine 来控制区块链时间
            await ethers.provider.send("evm_increaseTime", [20]); // 快进 20 秒，确保过了截止日期
            await ethers.provider.send("evm_mine", []); // 挖一个新区块，使时间快进生效

            // 尝试接取过期任务，期望失败
            await expect(bountyPlatform.connect(addr1).applyForTask(taskId))
                .to.be.revertedWith("Task has expired");
        });
    });

    describe("提交任务成果", function () {
        beforeEach(async function () {
            // 发布一个任务
            const title = "可提交任务";
            const description = "描述";
            const bounty = ethers.parseEther("0.1");
            const deadline = Math.floor(Date.now() / 1000) + 3600;
            await bountyPlatform.postTask(title, description, deadline, { value: bounty });
            // addr1 接取任务
            await bountyPlatform.connect(addr1).applyForTask(1);
        });

        it("应该允许任务接取者提交成果", async function () {
            const taskId = 1;
            const proofDescription = "任务成果描述";
            const proofUrl = "http://example.com/proof";

            // addr1 提交成果
            await expect(bountyPlatform.connect(addr1).submitTask(taskId, proofDescription, proofUrl))
                .to.emit(bountyPlatform, "TaskSubmitted") // 验证是否触发 TaskSubmitted 事件
                .withArgs(taskId, addr1.address, proofDescription, proofUrl); // 验证事件参数

            const task = await bountyPlatform.tasks(taskId);
            expect(task.submitted).to.be.true; // 验证提交状态
            expect(task.proofDescription).to.equal(proofDescription);
            expect(task.proofUrl).to.equal(proofUrl);
        });

        it("应该拒绝非接取者提交成果", async function () {
            const taskId = 1;
            const proofDescription = "任务成果描述";
            const proofUrl = "http://example.com/proof";

            // addr2 尝试提交，期望失败
            await expect(bountyPlatform.connect(addr2).submitTask(taskId, proofDescription, proofUrl))
                .to.be.revertedWith("Only the applicant can submit the task");
        });

        it("应该拒绝重复提交成果", async function () {
            const taskId = 1;
            const proofDescription = "任务成果描述";
            const proofUrl = "http://example.com/proof";

            await bountyPlatform.connect(addr1).submitTask(taskId, proofDescription, proofUrl); // 第一次提交

            // 再次提交，期望失败
            await expect(bountyPlatform.connect(addr1).submitTask(taskId, proofDescription, proofUrl))
                .to.be.revertedWith("Task already submitted");
        });
    });

    describe("审核任务", function () {
        beforeEach(async function () {
            // 发布一个任务
            const title = "待审核任务";
            const description = "描述";
            const bounty = ethers.parseEther("0.1");
            const deadline = Math.floor(Date.now() / 1000) + 3600;
            await bountyPlatform.postTask(title, description, deadline, { value: bounty });
            // addr1 接取任务
            await bountyPlatform.connect(addr1).applyForTask(1);
            // addr1 提交成果
            await bountyPlatform.connect(addr1).submitTask(1, "成果", "url");
        });

        it("应该允许发布者通过任务并支付悬赏", async function () {
            const taskId = 1;
            const bounty = ethers.parseEther("0.1");

            // 获取 addr1 在通过任务前的余额
            const initialApplicantBalance = await ethers.provider.getBalance(addr1.address);
            const initialContractBalance = await ethers.provider.getBalance(await bountyPlatform.getAddress());

            // 发布者 owner 通过任务
            await expect(bountyPlatform.connect(owner).reviewTask(taskId, true))
                .to.emit(bountyPlatform, "TaskReviewed") // 验证是否触发 TaskReviewed 事件
                .withArgs(taskId, owner.address, true); // 验证事件参数

            const task = await bountyPlatform.tasks(taskId);
            expect(task.completed).to.be.true; // 验证任务状态为已完成

            // 验证 addr1 的余额是否增加
            const finalApplicantBalance = await ethers.provider.getBalance(addr1.address);
            expect(finalApplicantBalance).to.be.gt(initialApplicantBalance); // 至少增加悬赏金额

            // 验证合约余额是否减少 (悬赏已支付)
            const finalContractBalance = await ethers.provider.getBalance(await bountyPlatform.getAddress());
            // 修复: 使用 BigInt 的减法运算符
            expect(finalContractBalance).to.be.lt(initialContractBalance - bounty); // 减去悬赏金额
        });

        it("应该允许发布者拒绝任务", async function () {
            const taskId = 1;

            // 发布者 owner 拒绝任务
            await expect(bountyPlatform.connect(owner).reviewTask(taskId, false))
                .to.emit(bountyPlatform, "TaskReviewed") // 验证是否触发 TaskReviewed 事件
                .withArgs(taskId, owner.address, false); // 验证事件参数

            const task = await bountyPlatform.tasks(taskId);
            expect(task.completed).to.be.false; // 验证任务状态为未完成
            // 验证合约余额没有变化 (因为拒绝时没有退款逻辑，金额保留在合约中)
            const initialContractBalance = await ethers.provider.getBalance(await bountyPlatform.getAddress());
            await bountyPlatform.connect(owner).reviewTask(taskId, false); // 再次调用以确保逻辑
            const finalContractBalance = await ethers.provider.getBalance(await bountyPlatform.getAddress());
            expect(finalContractBalance).to.equal(initialContractBalance);
        });

        it("应该拒绝非发布者审核任务", async function () {
            const taskId = 1;
            // addr1 尝试审核 (他自己是接取者)，期望失败
            await expect(bountyPlatform.connect(addr1).reviewTask(taskId, true))
                .to.be.revertedWith("Only the task poster can review it");
        });

        it("应该拒绝审核未提交成果的任务", async function () {
            // 发布一个新任务，但不提交成果
            const title = "未提交任务";
            const description = "描述";
            const bounty = ethers.parseEther("0.1");
            const deadline = Math.floor(Date.now() / 1000) + 3600;
            await bountyPlatform.postTask(title, description, deadline, { value: bounty });
            await bountyPlatform.connect(addr1).applyForTask(2); // 接取新任务 (ID 2)

            // 尝试审核未提交成果的任务，期望失败
            await expect(bountyPlatform.connect(owner).reviewTask(2, true))
                .to.be.revertedWith("Task has not been submitted yet");
        });

        it("应该拒绝重复审核已完成的任务", async function () {
            const taskId = 1;
            await bountyPlatform.connect(owner).reviewTask(taskId, true); // 第一次审核并完成

            // 再次尝试审核已完成的任务，期望失败
            await expect(bountyPlatform.connect(owner).reviewTask(taskId, true))
                .to.be.revertedWith("Task already completed");
        });
    });

    describe("获取任务", function () {
        beforeEach(async function () {
            // 发布多个任务
            const title1 = "任务1";
            const desc1 = "描述1";
            const bounty1 = ethers.parseEther("0.05");
            const deadline1 = Math.floor(Date.now() / 1000) + 100;
            await bountyPlatform.postTask(title1, desc1, deadline1, { value: bounty1 }); // ID: 1

            const title2 = "任务2";
            const desc2 = "描述2";
            const bounty2 = ethers.parseEther("0.1");
            const deadline2 = Math.floor(Date.now() / 1000) + 200;
            await bountyPlatform.postTask(title2, desc2, deadline2, { value: bounty2 }); // ID: 2

            const title3 = "任务3";
            const desc3 = "描述3";
            const bounty3 = ethers.parseEther("0.15");
            const deadline3 = Math.floor(Date.now() / 1000) + 300;
            await bountyPlatform.connect(addr1).postTask(title3, desc3, deadline3, { value: bounty3 }); // ID: 3 (由 addr1 发布)

            // 接取和提交任务，以便测试不同状态的任务
            await bountyPlatform.connect(addr2).applyForTask(1); // addr2 接取任务1
            await bountyPlatform.connect(addr2).submitTask(1, "成果1", "url1");
            await bountyPlatform.connect(owner).reviewTask(1, true); // owner 通过任务1

            await bountyPlatform.connect(addr2).applyForTask(2); // addr2 接取任务2
        });

        it("应该能够获取单个任务的详细信息", async function () {
            const task = await bountyPlatform.getTask(1);
            expect(task.id).to.equal(1);
            expect(task.poster).to.equal(owner.address);
            expect(task.title).to.equal("任务1");
            expect(task.applicant).to.equal(addr2.address);
            expect(task.submitted).to.be.true;
            expect(task.completed).to.be.true;
            expect(task.proofDescription).to.equal("成果1");
            expect(task.proofUrl).to.equal("url1");
        });

        it("应该能够获取所有任务的 ID 列表", async function () {
            const allTaskIds = await bountyPlatform.getAllTaskIds();
            expect(allTaskIds.length).to.equal(3);
            expect(allTaskIds).to.deep.equal([1n, 2n, 3n]); // Hardhat 返回的是 BigInt
        });

        it("应该能够获取特定发布者发布的任务 ID 列表", async function () {
            const ownerTasks = await bountyPlatform.getTasksByPoster(owner.address);
            expect(ownerTasks.length).to.equal(2);
            expect(ownerTasks).to.deep.equal([1n, 2n]);

            const addr1Tasks = await bountyPlatform.getTasksByPoster(addr1.address);
            expect(addr1Tasks.length).to.equal(1);
            expect(addr1Tasks).to.deep.equal([3n]);

            const nonExistentTasks = await bountyPlatform.getTasksByPoster(ethers.ZeroAddress);
            expect(nonExistentTasks.length).to.equal(0);
        });

        it("应该能够获取特定接取者接取的任务 ID 列表", async function () {
            const addr2Tasks = await bountyPlatform.getTasksByApplicant(addr2.address);
            expect(addr2Tasks.length).to.equal(2);
            expect(addr2Tasks).to.deep.equal([1n, 2n]);

            const ownerAppliedTasks = await bountyPlatform.getTasksByApplicant(owner.address);
            expect(ownerAppliedTasks.length).to.equal(0);
        });
    });
});