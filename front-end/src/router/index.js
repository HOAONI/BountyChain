import { createRouter, createWebHistory } from "vue-router";
import Login from "../components/Login.vue";
import Dashboard from "../components/Dashboard.vue";

import Home from "../components/Home.vue";
import SubmitTask from "../components/SubmitTask.vue";
import ApplyTask from "../components/ApplyTask.vue";
import PostTask from "../components/PostTask.vue";
import MyTasks from "../components/MyTasks.vue";

const routes = [
  {
    path: "/",
    redirect: "/login",
  },
  {
    path: "/login",
    name: "Login",
    component: Login,
  },
  {
    path: "/dashboard",
    name: "Dashboard",
    component: Dashboard,
    children: [
      {
        path: "",
        redirect: "/dashboard/home",
      },
      {
        path: "home",
        name: "DashboardHome",
        component: Home,
      },
      {
        path: "submit-task",
        name: "SubmitTask",
        component: SubmitTask,
      },
      {
        path: "apply-task",
        name: "ApplyTask",
        component: ApplyTask,
      },
      {
        path: "post-task",
        name: "PostTask",
        component: PostTask,
      },
      {
        path: "my-tasks",
        name: "MyTasks",
        component: MyTasks,
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
