<template>
  <div class="page apply-task flex flex-col items-center w-[800px] h-[750px] p-6">
    <h1 class="text-3xl font-bold my-4">可接取的悬赏任务</h1>
    <p class="text-gray-500 mb-8">浏览以下任务，选择您感兴趣的并接取。</p>

    <div v-if="isLoading" class="text-blue-500">加载任务中...</div>
    <div v-if="error" class="text-red-500">{{ error }}</div>
    <div v-if="!isLoading && tasks.length === 0" class="text-gray-600">目前没有可接取的任务。</div>

    <div class="task-list w-[780px] flex flex-col gap-4 overflow-y-auto max-h-[650px]">
      <div v-for="task in tasks" :key="task.id"
           class="task-card bg-white rounded-[10px] shadow-md p-4 flex flex-col transition-all duration-300 hover:translate-y-[-3px] hover:shadow-lg">
        <h2 class="text-xl font-semibold mb-2">{{ task.title }} (ID: {{ task.id }})</h2>
        <p class="text-gray-600 mb-2 line-clamp-2">
          {{ task.description }}
        </p>
        <div class="flex justify-between items-center text-sm text-gray-500 mb-2">
          <span>悬赏金额: <span class="font-bold text-[#6B7DE3]">{{ task.bountyAmount }} ETH</span></span>
          <span>截止日期: {{ formatDate(task.deadline) }}</span>
        </div>
        <button
            @click="handleApplyTask(task.id)"
            :disabled="task.isLoading || task.applicant !== ethers.ZeroAddress || task.completed || !currentUserAddress"
            class="w-[120px] h-[35px] rounded-[8px] bg-gradient-to-r from-[#A8FF78] to-[#78FFD6] text-black text-base
            leading-[35px] px-[10px] border-none cursor-pointer shadow-md transition-all duration-300
            hover:translate-y-[-2px] hover:shadow-lg self-end
            disabled:opacity-50 disabled:cursor-not-allowed">
          {{ task.isLoading ? '接取中...' : (task.applicant !== ethers.ZeroAddress ? '已接取' : (task.completed ? '已完成' : '接取任务')) }}
        </button>
        <p v-if="task.successMessage" class="text-green-600 mt-2 text-sm text-right">{{ task.successMessage }}</p>
        <p v-if="task.errorMessage" class="text-red-600 mt-2 text-sm text-right">{{ task.errorMessage }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import {onMounted, ref} from 'vue';
import {applyForTask, getAllTaskIds, getTaskDetails} from '../api';
import {ethers} from 'ethers';
import {initEthers} from '../utils/ethers'; // [新增] 引入 ethers 工具

const tasks = ref([]);
const isLoading = ref(false);
const error = ref(null);
const currentUserAddress = ref('');

const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A';
  const ts = Number(timestamp);
  const date = new Date(ts * 1000);
  return date.toLocaleDateString();
};

const fetchTasks = async () => {
  isLoading.value = true;
  error.value = null;

  try {
    const address = await initEthers();
    currentUserAddress.value = address;
    sessionStorage.setItem('currentUserAddress', address);
  } catch (err) {
    console.error("ApplyTask 组件初始化 Ethers 失败:", err);
    error.value = "请连接MetaMask钱包以获取任务。";
    isLoading.value = false;
    return;
  }

  if (!currentUserAddress.value) {
    error.value = "请先连接钱包。";
    isLoading.value = false;
    return;
  }

  try {
    const taskIds = await getAllTaskIds();
    const fetchedTasks = [];
    for (const id of taskIds) {
      const task = await getTaskDetails(id);
      if (task.poster.toLowerCase() !== currentUserAddress.value.toLowerCase() &&
          task.applicant === ethers.ZeroAddress &&
          Number(task.deadline) * 1000 > Date.now()
      ) {
        fetchedTasks.push({
          ...task,
          isLoading: false,
          successMessage: '',
          errorMessage: ''
        });
      }
    }
    tasks.value = fetchedTasks;
  } catch (err) {
    console.error("加载任务失败:", err);
    error.value = err.message || "加载任务失败";
  } finally {
    isLoading.value = false;
  }
};

const handleApplyTask = async (taskId) => {
  const taskIndex = tasks.value.findIndex(t => t.id === taskId.toString());
  if (taskIndex === -1) return;

  const task = tasks.value[taskIndex];
  task.isLoading = true;
  task.successMessage = '';
  task.errorMessage = '';

  try {
    const response = await applyForTask(taskId);
    task.successMessage = `成功接取任务！`;
    await fetchTasks();
  } catch (err) {
    console.error(`接取任务 ${taskId} 失败:`, err);
    task.errorMessage = err.message || "接取任务失败。";
  } finally {
    task.isLoading = false;
  }
};

onMounted(fetchTasks);
</script>

<style scoped>
.page.apply-task {
  background-color: #f0f5f9;
  border-radius: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

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