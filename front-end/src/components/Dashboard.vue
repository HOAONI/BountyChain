<script setup>
</script>

<template>
  <div class="main">
    <nav class="dashboard flex flex-col">
      <img src="/public/images/logo.png" alt="logo" id="logo"/>
      <router-link
          to="/dashboard/home"
          active-class="active"
          class="w-[150px] h-[40px] mx-auto my-[10px] text-[18px]
        text-white rounded-[10px] leading-[40px] pl-[10px] transition-all duration-100
        hover:border-l-[3px] hover:border-[#7effdb] hover:bg-[#667EEA]/10
        [&.active]:border-l-[3px] [&.active]:border-[#7effdb]
        "
      >首页
      </router-link>
      <router-link
          to="/dashboard/submit-task"
          active-class="active"

          class="w-[150px] h-[40px] mx-auto my-[10px] text-[18px] text-white
        rounded-[10px] leading-[40px] pl-[10px] transition-all duration-100
        hover:border-l-[3px] hover:border-[#7effdb] hover:bg-[#667EEA]/10
        [&.active]:border-l-[3px] [&.active]:border-[#7effdb]"
      >任务提交
      </router-link>
      <router-link
          to="/dashboard/apply-task"
          active-class="active"

          class="w-[150px] h-[40px] mx-auto my-[10px] text-[18px] text-white
        rounded-[10px] leading-[40px] pl-[10px] transition-all duration-100
        hover:border-l-[3px] hover:border-[#7effdb] hover:bg-[#667EEA]/10
        [&.active]:border-l-[3px] [&.active]:border-[#7effdb]"
      >接取悬赏
      </router-link>
      <router-link
          to="/dashboard/post-task"
          active-class="active"

          class="w-[150px] h-[40px] mx-auto my-[10px] text-[18px] text-white
         rounded-[10px] leading-[40px] pl-[10px] transition-all duration-100
          hover:border-l-[3px] hover:border-[#7effdb] hover:bg-[#667EEA]/10
          [&.active]:border-l-[3px] [&.active]:border-[#7effdb]"
      >发布悬赏
      </router-link>
      <router-link
          to="/dashboard/my-tasks"
          active-class="active"

          class="w-[150px] h-[40px] mx-auto my-[10px] text-[18px] text-white
         rounded-[10px] leading-[40px] pl-[10px] transition-all duration-100
          hover:border-l-[3px] hover:border-[#7effdb] hover:bg-[#667EEA]/10
          [&.active]:border-l-[3px] [&.active]:border-[#7effdb]"
      >任务管理
      </router-link>
    </nav>
    <div class="pages">
      <router-view></router-view>
    </div>
  </div>
</template>

<style scoped>
.main {
  display: grid;
  grid-template-columns: 1fr 4fr;
  width: 1000px;
  height: 750px;
  background-color: #f0f2f5;
  margin: 30px auto;
  border-radius: 14px;
}

.main .dashboard {
  background-color: #444f5a;
  border-top-left-radius: 14px;
  border-bottom-left-radius: 14px;
}

#logo {
  display: block;
  width: 100px;
  margin: 30px auto;
}

.main .dashboard .active {
  border-left: 3px solid #7effdb;
  background: rgba(102, 126, 234, 0.1);
  color: aquamarine;
}
</style>
