<template>
  <div class="profile-page">
    <div class="page-header">
      <button class="back-btn" @click="$router.back()">← 返回</button>
      <h2 class="chalk-text">👤 个人中心</h2>
      <div></div>
    </div>

    <!-- 个人信息卡片 -->
    <div class="profile-card blackboard-card mt-1">
      <div class="profile-header">
        <div class="avatar-circle">
          {{ gameStore.playerPersonality?.emoji || '😎' }}
        </div>
        <div class="profile-info">
          <h3 class="chalk-text-yellow">{{ gameStore.playerName || '未设置' }}</h3>
          <div class="profile-tag" :style="{ color: gameStore.playerPersonality?.color }">
            {{ gameStore.playerPersonality?.name || '转学生' }}
          </div>
        </div>
      </div>
      
      <div class="stats-grid mt-2">
        <div class="stat-item">
          <div class="stat-value chalk-text-yellow">{{ gameStore.playerScore }}</div>
          <div class="stat-label">总积分</div>
        </div>
        <div class="stat-item">
          <div class="stat-value chalk-text">No.{{ gameStore.playerRank }}</div>
          <div class="stat-label">学霸排名</div>
        </div>
        <div class="stat-item">
          <div class="stat-value" style="color:#e07a5f">{{ gameStore.rebelScore }}</div>
          <div class="stat-label">叛逆值</div>
        </div>
        <div class="stat-item">
          <div class="stat-value chalk-text-blue">{{ gameStore.streakCount }}</div>
          <div class="stat-label">连击数</div>
        </div>
      </div>
    </div>

    <!-- 班级信息 -->
    <div class="class-info-card mt-2">
      <h4 class="chalk-text mb-1">🏫 班级信息</h4>
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">学校</span>
          <span class="info-value">{{ gameStore.currentClass?.school || '--' }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">班级</span>
          <span class="info-value">{{ gameStore.currentClass?.name || '--' }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">班级人数</span>
          <span class="info-value">40人</span>
        </div>
        <div class="info-item">
          <span class="info-label">当前课程</span>
          <span class="info-value">{{ gameStore.currentPeriod?.name || '--' }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">班级状态</span>
          <span class="info-value">{{ statusText }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">在线人数</span>
          <span class="info-value">{{ onlineCount }}/40</span>
        </div>
      </div>
    </div>

    <!-- 设置 -->
    <div class="settings-card mt-2">
      <h4 class="chalk-text mb-1">⚙️ 设置</h4>
      <div class="setting-item" @click="gameStore.toggleSound()">
        <span>🔊 音效</span>
        <span class="setting-value">{{ gameStore.soundEnabled ? '开' : '关' }}</span>
      </div>
      <div class="setting-item" @click="gameStore.toggleBgm()">
        <span>🎵 背景音乐</span>
        <span class="setting-value">{{ gameStore.bgmEnabled ? '开' : '关' }}</span>
      </div>
      <div class="setting-item" @click="showReset = true">
        <span>🔄 重置游戏</span>
        <span class="setting-value" style="color:#e07a5f">重置</span>
      </div>
    </div>

    <!-- 关于 -->
    <div class="about-card mt-2">
      <h4 class="chalk-text mb-1">📖 关于</h4>
      <p class="about-text">
        🏫 叛逆校园 v1.0<br>
        80后校园叛逆风班级互动小游戏<br>
        复刻8090后上学日常<br>
        全自动AI班级模拟 | 课堂答题 | 班级群聊<br>
        纯趣味互动，无不良内容
      </p>
    </div>

    <!-- 重置确认 -->
    <div class="modal-overlay" v-if="showReset" @click.self="showReset = false">
      <div class="modal-content blackboard-card">
        <p class="chalk-text text-center">确定要重置所有数据吗？</p>
        <p class="chalk-text text-center mt-1" style="font-size:12px;opacity:0.7">此操作不可恢复</p>
        <div class="flex gap-1 mt-2">
          <button class="btn btn-chalk btn-block" @click="showReset = false">取消</button>
          <button class="btn btn-primary btn-block" @click="doReset">确认重置</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/store/game'

const router = useRouter()
const gameStore = useGameStore()
const showReset = ref(false)

const statusText = computed(() => {
  const s = gameStore.classStatus
  if (s === 'in_class') return '📖 上课中'
  if (s === 'break') return '☕ 课间休息'
  return '🌙 已放学'
})

const onlineCount = computed(() => gameStore.allStudents.filter(s => s.isOnline).length)

function doReset() {
  gameStore.resetGame()
  showReset.value = false
  router.push('/')
}
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: var(--bg-dark);
  padding: 16px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.page-header h2 {
  font-size: 20px;
}

.back-btn {
  background: rgba(255,255,255,0.1);
  border: none;
  color: var(--text-primary);
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 13px;
  cursor: pointer;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 16px;
  text-align: left;
}

.avatar-circle {
  width: 64px;
  height: 64px;
  background: rgba(0,0,0,0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  border: 2px solid rgba(255,255,255,0.2);
}

.profile-info h3 {
  font-size: 22px;
  margin-bottom: 4px;
}

.profile-tag {
  font-size: 14px;
  font-weight: 600;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.stat-item {
  text-align: center;
  padding: 10px;
  background: rgba(0,0,0,0.2);
  border-radius: 8px;
}

.stat-value {
  font-size: 22px;
  font-weight: 900;
}

.stat-label {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 2px;
}

.class-info-card, .settings-card, .about-card {
  background: rgba(255,255,255,0.03);
  border-radius: 12px;
  padding: 14px;
  border: 1px solid rgba(255,255,255,0.08);
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.info-label {
  font-size: 11px;
  color: var(--text-muted);
}

.info-value {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  cursor: pointer;
  font-size: 14px;
  color: var(--text-primary);
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-value {
  color: var(--text-muted);
  font-size: 13px;
}

.about-text {
  color: var(--text-muted);
  font-size: 13px;
  line-height: 1.8;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 20px;
}

.modal-content {
  width: 100%;
  max-width: 320px;
}
</style>
