import Vue from "vue";
import VueRouter from "vue-router";
import store from "../store";

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    name: "studio",
    component: () => import("../views/Player.vue"),
  },
  {
    path: "/auth",
    name: "auth",
    component: () => import("../views/Auth.vue"),
  },
  {
    path: "/shout",
    name: "shoutout",
    component: () => import("../views/ShoutoutForm.vue"),
  },
  {
    path: "/dj",
    name: "dj",
    component: () => import("../views/DJPanel.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/blog",
    name: "blog",
    component: () => import("../views/Blog.vue"),
  },
  {
    path: "/legal",
    name: "legal",
    component: () => import("../views/Legal.vue"),
  },
  {
    path: "*",
    redirect: "/",
  }
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes,
});

router.beforeEach((to, from, next) => {
  const isAuthenticated = !!store.state.auth.token;
  if (to.meta.requiresAuth && !isAuthenticated) {
    next("/auth");
  } else if (to.path === "/auth" && isAuthenticated) {
    next("/");
  } else {
    next();
  }
});

export default router;
