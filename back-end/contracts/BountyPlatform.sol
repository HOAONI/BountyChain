// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

    event TaskPosted(
        uint256 taskId,
        address indexed poster,
        string title,
        string description,
        uint256 bountyAmount,
        uint256 deadline
    );

    event TaskApplied(
        uint256 taskId,
        address indexed applicant
    );

    event TaskSubmitted(
        uint256 taskId,
        address indexed submitter,
        string proofDescription,
        string proofUrl
    );

    event TaskReviewed(
        uint256 taskId,
        address indexed reviewer,
        bool approved
    );

contract BountyPlatform {
    // 存储任务的结构体
    struct Task {
        uint256 id;                 // 任务ID
        address poster;             // 任务发布者地址
        string title;               // 任务标题
        string description;         // 任务描述
        uint256 bountyAmount;       // 悬赏金额 (以 wei 为单位)
        uint256 deadline;           // 截止日期 (Unix时间戳)
        address applicant;          // 任务接取者地址 (0x0表示未被接取)
        bool submitted;             // 任务是否已提交成果
        bool completed;             // 任务是否已完成 (审核通过)
        string proofDescription;    // 成果描述
        string proofUrl;            // 成果URL
    }

    mapping(uint256 => Task) public tasks;
    uint256 public nextTaskId;

    constructor() {
        nextTaskId = 1; // 任务ID从1开始
    }

    function postTask(
        string calldata _title,
        string calldata _description,
        uint256 _deadline
    ) external payable {
        require(msg.value > 0, "Bounty amount must be greater than 0");
        require(_deadline > block.timestamp, "Deadline must be in the future");

        tasks[nextTaskId] = Task({
            id: nextTaskId,
            poster: msg.sender,
            title: _title,
            description: _description,
            bountyAmount: msg.value,
            deadline: _deadline,
            applicant: address(0), // 初始为空地址
            submitted: false,
            completed: false,
            proofDescription: "",
            proofUrl: ""
        });

        emit TaskPosted(nextTaskId, msg.sender, _title, _description, msg.value, _deadline);

        nextTaskId++;
    }

    // 接取任务
    function applyForTask(uint256 _taskId) external {
        require(_taskId > 0 && _taskId < nextTaskId, "Task does not exist");
        Task storage task = tasks[_taskId];
        require(task.applicant == address(0), "Task already applied for");
        require(task.deadline > block.timestamp, "Task has expired");
        require(task.poster != msg.sender, "Cannot apply for your own task");

        task.applicant = msg.sender;

        emit TaskApplied(_taskId, msg.sender);
    }

    function submitTask(
        uint256 _taskId,
        string calldata _proofDescription,
        string calldata _proofUrl
    ) external {
        require(_taskId > 0 && _taskId < nextTaskId, "Task does not exist");
        Task storage task = tasks[_taskId];
        require(task.applicant == msg.sender, "Only the applicant can submit the task");
        require(!task.submitted, "Task already submitted");

        task.submitted = true;          // 设置任务已提交
        task.proofDescription = _proofDescription; // 保存成果描述
        task.proofUrl = _proofUrl;      // 保存成果URL

        emit TaskSubmitted(_taskId, msg.sender, _proofDescription, _proofUrl);
    }

    function reviewTask(uint256 _taskId, bool _approved) external {
        require(_taskId > 0 && _taskId < nextTaskId, "Task does not exist");
        Task storage task = tasks[_taskId];
        require(task.poster == msg.sender, "Only the task poster can review it");
        require(task.submitted, "Task has not been submitted yet");
        require(!task.completed, "Task already completed");

        task.completed = _approved; // 设置任务完成状态

        if (_approved) {
            (bool success,) = payable(task.applicant).call{value: task.bountyAmount}("");
            require(success, "Failed to transfer bounty");
        } else {
        }

        emit TaskReviewed(_taskId, msg.sender, _approved);
    }

    function getTask(uint256 _taskId) external view returns (
        uint256 id,
        address poster,
        string memory title,
        string memory description,
        uint256 bountyAmount,
        uint256 deadline,
        address applicant,
        bool submitted,
        bool completed,
        string memory proofDescription,
        string memory proofUrl
    ) {
        require(_taskId > 0 && _taskId < nextTaskId, "Task does not exist");
        Task storage task = tasks[_taskId];
        return (
            task.id,
            task.poster,
            task.title,
            task.description,
            task.bountyAmount,
            task.deadline,
            task.applicant,
            task.submitted,
            task.completed,
            task.proofDescription,
            task.proofUrl
        );
    }

    function getAllTaskIds() external view returns (uint256[] memory) {
        uint256[] memory taskIds = new uint256[](nextTaskId - 1);
        for (uint256 i = 1; i < nextTaskId; i++) {
            taskIds[i - 1] = i;
        }
        return taskIds;
    }

    function getTasksByPoster(address _poster) external view returns (uint256[] memory) {
        uint256 count = 0;
        for (uint256 i = 1; i < nextTaskId; i++) {
            if (tasks[i].poster == _poster) {
                count++;
            }
        }

        uint256[] memory userTaskIds = new uint256[](count);
        uint256 currentIndex = 0;
        for (uint256 i = 1; i < nextTaskId; i++) {
            if (tasks[i].poster == _poster) {
                userTaskIds[currentIndex] = i;
                currentIndex++;
            }
        }
        return userTaskIds;
    }

    function getTasksByApplicant(address _applicant) external view returns (uint256[] memory) {
        uint256 count = 0;
        for (uint256 i = 1; i < nextTaskId; i++) {
            if (tasks[i].applicant == _applicant) {
                count++;
            }
        }

        uint256[] memory userTaskIds = new uint256[](count);
        uint256 currentIndex = 0;
        for (uint256 i = 1; i < nextTaskId; i++) {
            if (tasks[i].applicant == _applicant) {
                userTaskIds[currentIndex] = i;
                currentIndex++;
            }
        }
        return userTaskIds;
    }
}