<template>
  <div class="page my-tasks flex flex-col items-center w-[800px] h-[750px] p-6 bg-[#f0f5f9] rounded-[20px] shadow-lg">
    <h1 class="text-3xl font-bold my-4 text-gray-800">任务管理</h1>
    <p class="text-[#999999] mb-8">管理您发布的、接取的以及需要审核的任务。</p>

    <div class="flex mb-6 w-full max-w-md justify-around bg-gray-200 rounded-[10px] shadow-inner p-1">
      <button
          @click="activeTab = 'posted'"
          :class="{
          'bg-white text-gray-800 shadow-md border-l-4 border-[#7effdb]': activeTab === 'posted',
          'text-gray-600 hover:bg-gray-100/50': activeTab !== 'posted'
        }"
          class="flex-1 py-3 text-lg cursor-pointer font-semibold rounded-[8px] transition-all duration-200 relative overflow-hidden focus:outline-none">
        我发布的
      </button>
      <button
          @click="activeTab = 'applied'"
          :class="{
          'bg-white text-gray-800 shadow-md border-l-4 border-[#7effdb]': activeTab === 'applied',
          'text-gray-600 hover:bg-gray-100/50': activeTab !== 'applied'
        }"
          class="flex-1 py-3 text-lg cursor-pointer font-semibold rounded-[8px] transition-all duration-200 relative overflow-hidden focus:outline-none">
        我接取的
      </button>
    </div>

    <div v-if="isLoading" class="text-blue-500">加载任务中...</div>
    <div v-if="error" class="text-red-500">{{ error }}</div>
    <div v-if="!isLoading && displayedTasks.length === 0" class="text-gray-600">
      {{ activeTab === 'posted' ? '您还没有发布任何任务。' : '您还没有接取任何任务。' }}
    </div>

    <div class="task-list w-[780px] flex flex-col gap-4 overflow-y-auto max-h-[650px]">
      <div v-for="task in displayedTasks" :key="task.id"
           class="task-card bg-white rounded-[10px] shadow-md p-4 flex flex-col transition-all duration-300 hover:translate-y-[-1px] hover:shadow-lg">
        <h2 class="text-xl font-semibold mb-2 text-gray-700">
          {{ task.title }} (ID: {{ task.id }})
          <span :class="getStatusClass(task)" class="text-sm ml-2 px-2 py-1 rounded-full">{{ getStatusText(task) }}</span>
        </h2>
        <p class="text-gray-600 mb-2 line-clamp-2">
          {{ task.description }}
        </p>
        <div class="flex justify-between items-center text-sm text-gray-500 mb-2">
          <span>悬赏金额: <span class="font-bold text-[#6B7DE3]">{{ task.bountyAmount }} ETH</span></span>
          <span>
            <span v-if="task.applicant !== ethers.ZeroAddress">接取者: {{ shortenAddress(task.applicant) }}</span>
            <span v-else>未被接取</span>
          </span>
          <span>截止日期: {{ formatDate(task.deadline) }}</span>
        </div>

        <div v-if="task.submitted" class="mt-2 border-t pt-2 border-gray-200">
          <p class="text-gray-700 text-sm font-semibold mb-1">成果描述:</p>
          <p class="text-gray-600 text-sm mb-1 line-clamp-2">{{ task.proofDescription || '无描述' }}</p>
          <p v-if="task.proofUrl" class="text-gray-700 text-sm font-semibold">
            成果附件: <a :href="task.proofUrl" target="_blank" class="text-blue-500 hover:underline break-all">{{ task.proofUrl }}</a>
          </p>
        </div>

        <div v-if="activeTab === 'posted' && task.submitted && !task.completed" class="flex justify-end gap-2 mt-2">
          <button
              @click="handleReviewTask(task.id, true)"
              :disabled="task.isLoadingReview || !currentUserAddress"
              class="w-[80px] h-[35px] rounded-[8px] bg-gradient-to-r from-[#A8FF78] to-[#78FFD6] text-gray-800 text-base
              leading-[35px] px-[10px] border-none cursor-pointer transition-all duration-300
              hover:translate-y-[-2px] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
            {{ task.isLoadingReview ? '处理中...' : '通过' }}
          </button>
          <button
              @click="handleReviewTask(task.id, false)"
              :disabled="task.isLoadingReview || !currentUserAddress"
              class="w-[80px] h-[35px] rounded-[8px] bg-red-500 text-white text-base
              leading-[35px] px-[10px] border-none cursor-pointer shadow-md transition-all duration-300
              hover:translate-y-[-2px] hover:shadow-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed">
            {{ task.isLoadingReview ? '处理中...' : '拒绝' }}
          </button>
        </div>
        <p v-if="task.reviewMessage" :class="task.reviewSuccess ? 'text-green-600' : 'text-red-600'" class="mt-2 text-sm text-right">{{ task.reviewMessage }}</p>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { getTasksPostedByUser, getTasksAppliedByUser, getTaskDetails, reviewTask } from '../api';
import { ethers } from 'ethers';
import { initEthers, getCurrentAccount } from '../utils/ethers';

const activeTab = ref('posted');
const postedTasks = ref([]);
const appliedTasks = ref([]);
const isLoading = ref(false);
const error = ref(null);
const currentUserAddress = ref('');

const displayedTasks = computed(() => {
  return activeTab.value === 'posted' ? postedTasks.value : appliedTasks.value;
});

const shortenAddress = (address) => {
  if (!address) return 'N/A';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A';
  const ts = Number(timestamp);
  const date = new Date(ts * 1000);
  return date.toLocaleDateString();
};

const getStatusText = (task) => {
  if (task.completed) {
    return '已完成';
  } else if (task.submitted) {
    return '待审核';
  } else if (task.applicant !== ethers.ZeroAddress) {
    return '已接取';
  } else if (Number(task.deadline) * 1000 <= Date.now()) {
    return '已过期';
  }
  return '待接取';
};

const getStatusClass = (task) => {
  if (task.completed) {
    return 'bg-green-100 text-green-700';
  } else if (task.submitted) {
    return 'bg-yellow-100 text-yellow-700';
  } else if (task.applicant !== ethers.ZeroAddress) {
    return 'bg-blue-100 text-blue-700';
  } else if (Number(task.deadline) * 1000 <= Date.now()) {
    return 'bg-red-100 text-red-700';
  }
  return 'bg-gray-100 text-gray-700';
};


const fetchMyTasks = async () => {
  isLoading.value = true;
  error.value = null;

  // [修改] 先尝试初始化 Ethers，获取当前连接的账户
  try {
    const address = await initEthers();
    currentUserAddress.value = address;
    sessionStorage.setItem('currentUserAddress', address);
  } catch (err) {
    console.error("MyTasks 组件初始化 Ethers 失败:", err);
    error.value = "请连接MetaMask钱包以管理任务。";
    isLoading.value = false;
    return;
  }

  if (!currentUserAddress.value) { // [修改] 检查 currentUserAddress
    error.value = "请先连接钱包。";
    isLoading.value = false;
    return;
  }

  try {
    const myPostedTaskIds = await getTasksPostedByUser(currentUserAddress.value);
    const fetchedPostedTasks = [];
    for (const id of myPostedTaskIds) {
      const task = await getTaskDetails(id);
      if (task) {
        fetchedPostedTasks.push({
          ...task,
          isLoadingReview: false,
          reviewMessage: '',
          reviewSuccess: false,
        });
      }
    }
    postedTasks.value = fetchedPostedTasks;

    const myAppliedTaskIds = await getTasksAppliedByUser(currentUserAddress.value);
    const fetchedAppliedTasks = [];
    for (const id of myAppliedTaskIds) {
      const task = await getTaskDetails(id);
      if (task) {
        fetchedAppliedTasks.push({
          ...task,
          isLoadingReview: false,
          reviewMessage: '',
          reviewSuccess: false,
        });
      }
    }
    appliedTasks.value = fetchedAppliedTasks;

  } catch (err) {
    console.error("加载我的任务失败:", err);
    error.value = err.message || "加载我的任务失败";
  } finally {
    isLoading.value = false;
  }
};

const handleReviewTask = async (taskId, approved) => {
  const taskArray = activeTab.value === 'posted' ? postedTasks : appliedTasks;
  const taskIndex = taskArray.value.findIndex(t => t.id === taskId.toString());
  if (taskIndex === -1) return;

  const task = taskArray.value[taskIndex];
  task.isLoadingReview = true;
  task.reviewMessage = '';
  task.reviewSuccess = false;

  try {
    // [修改] 直接调用API，不再传入私钥
    const response = await reviewTask(taskId, approved);
    task.reviewMessage = `任务审核成功！`;
    task.reviewSuccess = true;
    await fetchMyTasks();
  } catch (err) {
    console.error(`审核任务 ${taskId} 失败:`, err);
    task.reviewMessage = err.message || "审核任务失败。";
    task.reviewSuccess = false;
  } finally {
    task.isLoadingReview = false;
  }
};

onMounted(fetchMyTasks);
</script>

<style scoped>
/* 保持原有样式 */

.task-list {
  padding-right: 10px;
}

.task-card {
  border: 1px solid #e0e0e0;
}

.task-list::-webkit-scrollbar {
  width: 8px;
}

.task-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.task-list::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 10px;
}

.task-list::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>