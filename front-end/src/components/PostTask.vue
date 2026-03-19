<template>
  <div class="page submit-task flex flex-col items-center w-[800px] h-[700px] p-6">
    <div class="form-card bg-white rounded-[10px] shadow-md p-8 w-[750px] flex flex-col items-center">
      <h1 class="text-3xl font-bold my-4">发布新任务</h1>
      <p class="text-gray-500 mb-8">请填写以下信息来发布您的任务。</p>
      <div class="form-group mb-4 w-full max-w-md">
        <label for="taskTitle" class="block text-gray-700 text-lg font-semibold mb-2">任务标题:</label>
        <input type="text" id="taskTitle" placeholder="请输入任务标题" v-model="taskTitle"
               class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400">
      </div>

      <div class="form-group mb-4 w-full max-w-md">
        <label for="taskDescription" class="block text-gray-700 text-lg font-semibold mb-2">任务描述:</label>
        <textarea id="taskDescription" rows="3" placeholder="详细描述任务内容、要求等" v-model="taskDescription"
                  class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"></textarea>
      </div>

      <div class="form-group mb-4 w-full max-w-md">
        <label for="bountyAmount" class="block text-gray-700 text-lg font-semibold mb-2">悬赏金额 (ETH):</label>
        <input type="number" id="bountyAmount" placeholder="请输入悬赏金额" min="0" step="0.01" v-model="bountyAmount"
               class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400">
      </div>

      <div class="form-group mb-6 w-full max-w-md">
        <label for="deadline" class="block text-gray-700 text-lg font-semibold mb-2">截止日期:</label>
        <input type="date" id="deadline" v-model="deadlineDate"
               class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400">
      </div>

      <button @click="handlePostTask" :disabled="isLoading"
              class="w-[180px] h-[45px] rounded-[10px] bg-gradient-to-r from-[#A8FF78] to-[#78FFD6] text-black text-xl
        leading-[45px] px-[15px] border-none cursor-pointer shadow-md transition-all duration-300
        hover:translate-y-[-3px] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
        {{ isLoading ? '发布中...' : '发布任务' }}
      </button>

      <p v-if="successMessage" class="text-green-600 mt-4 text-center">{{ successMessage }}</p>
      <p v-if="errorMessage" class="text-red-600 mt-4 text-center">{{ errorMessage }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { postNewTask } from '../api';
import { initEthers, getCurrentAccount } from '../utils/ethers';

const taskTitle = ref('');
const taskDescription = ref('');
const bountyAmount = ref(0.01);
const deadlineDate = ref('');

const isLoading = ref(false);
const successMessage = ref('');
const errorMessage = ref('');

const currentUserAddress = ref('');

onMounted(async () => {
  try {
    const address = await initEthers();
    currentUserAddress.value = address;
    sessionStorage.setItem('currentUserAddress', address);
  } catch (err) {
    console.error("PostTask 组件初始化 Ethers 失败:", err);
    errorMessage.value = "请连接MetaMask钱包以发布任务。";
  }
});

const handlePostTask = async () => {
  successMessage.value = '';
  errorMessage.value = '';

  if (!currentUserAddress.value) {
    errorMessage.value = "请先连接MetaMask钱包。";
    return;
  }

  if (!taskTitle.value || !taskDescription.value || bountyAmount.value <= 0 || !deadlineDate.value) {
    errorMessage.value = "请填写所有必填字段，并确保悬赏金额大于0。";
    return;
  }

  isLoading.value = true;
  try {
    const date = new Date(deadlineDate.value);
    date.setHours(23, 59, 59, 999);
    const deadlineTimestamp = Math.floor(date.getTime() / 1000);

    if (deadlineTimestamp <= Math.floor(Date.now() / 1000)) {
      errorMessage.value = "截止日期必须在未来。";
      isLoading.value = false;
      return;
    }

    const taskData = {
      title: taskTitle.value,
      description: taskDescription.value,
      bountyAmountEth: bountyAmount.value,
      deadlineTimestamp: deadlineTimestamp,
    };

    const response = await postNewTask(taskData);
    successMessage.value = `任务发布成功！交易哈希: ${response.transactionHash}，任务ID: ${response.taskId || '未知'}`; // [修改] taskId可能为空

    taskTitle.value = '';
    taskDescription.value = '';
    bountyAmount.value = 0.01;
    deadlineDate.value = '';

  } catch (error) {
    console.error("发布任务失败:", error);
    errorMessage.value = error.message || "发布任务失败，请稍后再试。";
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.page.submit-task {
  background-color: #f0f5f9;
  border-radius: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.form-card {
  border: 1px solid #e0e0e0;
}
</style>