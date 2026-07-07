import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/pages/Home.vue'),
    meta: { title: '叛逆校园', transition: 'fade' }
  },
  {
    path: '/classroom',
    name: 'classroom',
    component: () => import('@/pages/Classroom.vue'),
    meta: { title: '教室', transition: 'slide' }
  },
  {
    path: '/schedule',
    name: 'schedule',
    component: () => import('@/pages/Schedule.vue'),
    meta: { title: '今日课表', transition: 'slide' }
  },
  {
    path: '/quiz',
    name: 'quiz',
    component: () => import('@/pages/Quiz.vue'),
    meta: { title: '课堂答题', transition: 'slide' }
  },
  {
    path: '/chat',
    name: 'chat',
    component: () => import('@/pages/Chat.vue'),
    meta: { title: '班级群聊', transition: 'slide' }
  },
  {
    path: '/ranking',
    name: 'ranking',
    component: () => import('@/pages/Ranking.vue'),
    meta: { title: '排行榜', transition: 'slide' }
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('@/pages/Profile.vue'),
    meta: { title: '个人中心', transition: 'slide' }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  document.title = to.meta.title || '叛逆校园'
  next()
})

export default router
