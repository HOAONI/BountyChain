<template>
  <div class="page submit-task flex flex-col items-center w-[800px] h-[700px] p-6">
    <div class="form-card bg-white rounded-[10px] shadow-md p-8 w-[750px] flex flex-col items-center">
      <h1 class="text-3xl font-bold my-4">提交任务成果</h1>
      <p class="text-gray-500 mb-8">请填写以下信息并上传您的任务成果，等待审核。</p>

      <div class="form-group mb-4 w-full max-w-md">
        <label for="taskId" class="block text-gray-700 text-lg font-semibold mb-2">任务ID:</label>
        <input type="text" id="taskId" placeholder="请输入您完成的任务ID" v-model="taskIdToSubmit"
               class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400">
      </div>

      <div class="form-group mb-4 w-full max-w-md">
        <label for="proofDescription" class="block text-gray-700 text-lg font-semibold mb-2">成果描述:</label>
        <textarea id="proofDescription" rows="5" placeholder="请详细描述您完成任务的过程和成果，以便审核" v-model="proofDescription"
                  class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"></textarea>
      </div>

      <div class="form-group mb-6 w-full max-w-md">
        <label for="fileUpload" class="block text-gray-700 text-lg font-semibold mb-2">上传附件 (可选):</label>
        <input type="file" id="fileUpload" @change="handleFileUpload"
               class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0 file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100">
        <p class="text-sm text-gray-400 mt-1">上传证明，来核实您已完成任务 (如图片、文档链接等)。</p>
      </div>

      <button @click="handleSubmitTask" :disabled="isLoading || !currentUserAddress"
              class="w-[180px] h-[45px] rounded-[10px] bg-gradient-to-r from-[#A8FF78] to-[#78FFD6] text-black text-xl
        leading-[45px] px-[15px] border-none cursor-pointer shadow-md transition-all duration-300
        hover:translate-y-[-3px] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
        {{ isLoading ? '提交中...' : '提交任务' }}
      </button>

      <p v-if="successMessage" class="text-green-600 mt-4 text-center">{{ successMessage }}</p>
      <p v-if="errorMessage" class="text-red-600 mt-4 text-center">{{ errorMessage }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { submitTaskProof, getTaskDetails } from '../api';
import { initEthers, getCurrentAccount } from '../utils/ethers';

const taskIdToSubmit = ref('');
const proofDescription = ref('');
const proofUrl = ref('');
const selectedFile = ref(null);

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
    console.error("SubmitTask 组件初始化 Ethers 失败:", err);
    errorMessage.value = "请连接MetaMask钱包以提交成果。";
  }
});

const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    selectedFile.value = file;
    proofUrl.value = `http://example.com/uploads/${file.name}`;
    console.log("文件选择:", file.name);
  } else {
    selectedFile.value = null;
    proofUrl.value = '';
  }
};

const handleSubmitTask = async () => {
  successMessage.value = '';
  errorMessage.value = '';

  if (!currentUserAddress.value) {
    errorMessage.value = "请先连接MetaMask钱包。";
    return;
  }

  if (!taskIdToSubmit.value || !proofDescription.value) {
    errorMessage.value = "请填写任务ID和成果描述。";
    return;
  }

  isLoading.value = true;
  try {
    const taskDetails = await getTaskDetails(taskIdToSubmit.value);
    if (!taskDetails) {
      errorMessage.value = "任务不存在。";
      isLoading.value = false;
      return;
    }
    if (taskDetails.applicant.toLowerCase() !== currentUserAddress.value.toLowerCase()) {
      errorMessage.value = "您不是该任务的接取者，无法提交。";
      isLoading.value = false;
      return;
    }
    if (taskDetails.submitted) {
      errorMessage.value = "该任务已经提交过成果。";
      isLoading.value = false;
      return;
    }
    if (Number(taskDetails.deadline) * 1000 <= Date.now()) {
      errorMessage.value = "任务已过期，无法提交成果。";
      isLoading.value = false;
      return;
    }

    const response = await submitTaskProof(
        taskIdToSubmit.value,
        proofDescription.value,
        proofUrl.value,
    );
    successMessage.value = `任务成果提交成功！交易哈希: ${response.transactionHash}`;

    taskIdToSubmit.value = '';
    proofDescription.value = '';
    proofUrl.value = '';
    selectedFile.value = null;

  } catch (error) {
    console.error("提交任务成果失败:", error);
    errorMessage.value = error.message || "提交任务成果失败，请稍后再试。";
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