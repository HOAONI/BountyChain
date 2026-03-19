<template>
  <div class="login" id="login">
    <img src="/public/images/logo.png" alt="img-login"/>
    <h1 class="mx-auto text-[34px]">连接钱包</h1>
    <p>请使用 MetaMask 登录以安全连接到任务悬赏系统</p>

    <button @click="connectWallet" :disabled="isLoading">
      {{ isLoading ? '连接并签名中...' : '使用 MetaMask 登录' }}
    </button>
    <p v-if="errorMessage" class="error-message text-red-500 mt-4">{{ errorMessage }}</p>
  </div>
</template>

<script setup>
import {ref} from "vue";
import {useRouter} from "vue-router";
import {ethers} from "ethers";
import {verifyLoginSignature} from "../api/auth.js";

const errorMessage = ref("");
const isLoading = ref(false);
const router = useRouter();

const connectWallet = async () => {
  errorMessage.value = "";
  isLoading.value = true;

  if (typeof window.ethereum === 'undefined') {
    errorMessage.value = "请先安装 MetaMask！";
    isLoading.value = false;
    return;
  }

  try {
    const accounts = await window.ethereum.request({method: 'eth_requestAccounts'});
    const userAddress = accounts[0];

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    const nonce = Math.floor(Math.random() * 1000000);
    const message = `欢迎登录任务悬赏平台！\n\n请签名以确认您的身份。\n\nNonce: ${nonce}`;

    const signature = await signer.signMessage(message);

    const response = await verifyLoginSignature(userAddress, signature, message);

    if (response && response.success) {
      console.log("登录成功，地址:", response.address);
      sessionStorage.setItem("currentUserAddress", response.address);
      router.push("/dashboard");
    } else {
      errorMessage.value = response.message || "登录验证失败。";
    }
  } catch (error) {
    console.error("连接或签名失败:", error);
    if (error.code === 4001) {
      errorMessage.value = "您已取消签名请求。";
    } else {
      errorMessage.value = error.message || "发生未知错误。";
    }
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.login {
  background-color: #f0f5f9;
  width: 500px;
  height: 700px;
  margin: 50px auto;
  display: flex;
  flex-direction: column;
  border-radius: 20px;
  justify-content: center;
}

.login img {
  width: 60px;
  margin: 0 auto;
}

.login p {
  color: #999;
  margin: 20px auto;
  text-align: center;
  width: 80%;
}

.login button {
  width: 400px;
  height: 50px;
  margin: 20px auto;
  border-radius: 8px;
  border: none;
  background: linear-gradient(to right, #A8FF78, #78FFD6);
  color: #333;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.login button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.login button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  text-align: center;
}
</style>