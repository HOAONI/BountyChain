<template>
  <div class="page home flex flex-col items-center justify-center w-[800px] h-[750px]">
    <div
        class="card bg-white flex flex-col items-center justify-center w-[750px] h-[220px] my-2 shadow-md rounded-[10px] transition-all duration-300 hover:translate-y-[-5px] hover:shadow-lg">
      <h2 class="text-2xl font-semibold">圆满之数</h2>
      <p class="text-[#999999] my-2">我成功完成的赏金任务</p>
      <span class="text-[34px] font-bold text-[#6B7DE3]">{{ completedTasksCount }}</span>
      <router-link to="/dashboard/submit-task"
                   class="text-center w-[150px] h-[40px] rounded-[10px] bg-gradient-to-r from-[#A8FF78] to-[#78FFD6] text-[16px] leading-[40px] px-[10px] border-none cursor-pointer transition-all duration-500">
        提交任务
      </router-link>
    </div>

    <div
        class="card bg-white flex flex-col items-center
                justify-center w-[750px] h-[220px] my-2 shadow-md
                rounded-[10px] transition-all duration-300
                hover:translate-y-[-5px] hover:shadow-lg">
      <h2 class="text-2xl font-semibold">悬赏榜单</h2>
      <p class="text-[#999999] my-2">系统现有任务数量</p>
      <span class="text-[34px] font-bold text-[#6B7DE3]">{{ totalTasksCount }}</span>
      <router-link to="/dashboard/apply-task"
                   class="w-[150px] h-[40px] text-center rounded-[10px]
                    bg-gradient-to-r from-[#A8FF78] to-[#78FFD6] text-[16px]
                     leading-[40px] px-[10px] border-none cursor-pointer
                     transition-all duration-500">
        去接赏金
      </router-link>
    </div>

    <div
        class="card bg-white flex flex-col items-center
                justify-center w-[750px] h-[220px] my-2 shadow-md
                rounded-[10px] transition-all duration-300
                hover:translate-y-[-5px] hover:shadow-lg">
      <h2 class="text-2xl font-semibold">吾募之令</h2>
      <p class="text-[#999999] my-2">我发布的任务数量</p>
      <span class="text-[34px] font-bold text-[#6B7DE3]">{{ postedTasksCount }}</span>
      <router-link to="/dashboard/post-task"
                   class="w-[150px] h-[40px] text-center rounded-[10px]
                    bg-gradient-to-r from-[#A8FF78] to-[#78FFD6] text-[16px]
                     leading-[40px] px-[10px] border-none cursor-pointer
                     transition-all duration-500">
        发布任务
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getAllTaskIds, getTaskDetails, getTasksPostedByUser, getTasksAppliedByUser } from '../api';
import { initEthers, getCurrentAccount } from '../utils/ethers';

const totalTasksCount = ref(0);
const postedTasksCount = ref(0);
const completedTasksCount = ref(0);

const isLoading = ref(false);
const error = ref(null);

const currentUserAddress = ref('');

const fetchCompletedTasksCount = async () => {
  try {
    const appliedTaskIds = await getTasksAppliedByUser(currentUserAddress.value);
    let count = 0;
    for (const taskId of appliedTaskIds) {
      const task = await getTaskDetails(taskId);
      if (task && task.completed) {
        count++;
      }
    }
    completedTasksCount.value = count;
  } catch (err) {
    console.error("获取已完成任务数量失败:", err);
    error.value = err.message;
  }
};


const fetchCounts = async () => {
  isLoading.value = true;
  error.value = null;

  try {
    const address = await initEthers();
    currentUserAddress.value = address;
    sessionStorage.setItem('currentUserAddress', address); // 确保 sessionStorage 更新
  } catch (err) {
    console.error("Home 组件初始化 Ethers 失败:", err);
    error.value = "请连接MetaMask钱包。";
    isLoading.value = false;
    return;
  }

  if (!currentUserAddress.value) {
    error.value = "请先连接钱包获取用户地址。";
    isLoading.value = false;
    return;
  }

  try {
    const allTaskIds = await getAllTaskIds();
    totalTasksCount.value = allTaskIds.length;

    const myPostedTaskIds = await getTasksPostedByUser(currentUserAddress.value);
    postedTasksCount.value = myPostedTaskIds.length;

    await fetchCompletedTasksCount();

  } catch (err) {
    console.error("加载首页统计数据失败:", err);
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
};

onMounted(fetchCounts);
</script>

<style scoped>
.page.home {
  background-color: #f0f5f9;
  border-radius: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.card {
  text-align: center;
  border: 1px solid #e0e0e0;
}

.card h2 {
  color: #6B7DE3;
}

.card router-link {
  display: inline-block;
  text-decoration: none;
  color: #333;
}
</style>