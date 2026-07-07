<template>
  <div class="home-page">
    <!-- 背景装饰 -->
    <div class="bg-decor">
      <div class="floating-icons">
        <span v-for="icon in floatingIcons" :key="icon.id" 
          class="floating-icon" 
          :style="icon.style">
          {{ icon.emoji }}
        </span>
      </div>
    </div>

    <!-- 主内容 -->
    <div class="home-content" v-if="!gameStore.hasCompletedSetup">
      <!-- 标题区 -->
      <div class="title-section anim-bounce">
        <div class="school-badge">育才中学</div>
        <h1 class="game-title chalk-text">叛逆校园</h1>
        <p class="subtitle chalk-text-blue">—— 8090班级互动小游戏 ——</p>
        <div class="tagline">
          <span class="tag tag-pink">📚 怀旧校园</span>
          <span class="tag tag-yellow">🎮 趣味答题</span>
          <span class="tag tag-green">💬 班级聊天</span>
        </div>
      </div>

      <!-- 黑板风格卡片 -->
      <div class="blackboard-card setup-card anim-slide-up">
        <div class="chalk-drawing">✏️ 新生报到</div>
        <div class="form-group">
          <label class="chalk-text">你的名字：</label>
          <input 
            v-model="inputName"
            type="text"
            class="name-input"
            placeholder="输入你的名字..."
            maxlength="10"
            @keyup.enter="startGame"
          />
        </div>
        <button class="btn btn-primary btn-lg btn-block mt-2" @click="startGame" :disabled="!inputName.trim()">
          🏫 进入校园
        </button>
        <p class="hint-text chalk-text mt-1">输入你的名字，开始校园生活！</p>
      </div>

      <!-- 特色介绍 -->
      <div class="features mt-2">
        <div class="feature-item" v-for="f in features" :key="f.title">
          <span class="feature-icon">{{ f.icon }}</span>
          <div class="feature-info">
            <div class="feature-title">{{ f.title }}</div>
            <div class="feature-desc">{{ f.desc }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 已设置，直接进入 -->
    <div class="home-content" v-else>
      <div class="title-section anim-bounce">
        <div class="school-badge">育才中学</div>
        <h1 class="game-title chalk-text">叛逆校园</h1>
        <div class="welcome-back chalk-text-yellow mt-1">
          欢迎回来，{{ gameStore.playerName }}同学！
        </div>
      </div>
      
      <div class="quick-actions mt-2">
        <button class="action-btn anim-slide-up" @click="$router.push('/classroom')" style="animation-delay: 0.1s">
          <span class="action-icon">🏫</span>
          <span class="action-label">进入教室</span>
          <span class="action-status">{{ statusText }}</span>
        </button>
        <button class="action-btn anim-slide-up" @click="$router.push('/schedule')" style="animation-delay: 0.2s">
          <span class="action-icon">📅</span>
          <span class="action-label">今日课表</span>
          <span class="action-status">{{ gameStore.currentPeriod?.name || '--' }}</span>
        </button>
        <button class="action-btn anim-slide-up" @click="$router.push('/quiz')" style="animation-delay: 0.3s">
          <span class="action-icon">✏️</span>
          <span class="action-label">课堂答题</span>
          <span class="action-status">{{ gameStore.playerScore }}分</span>
        </button>
        <button class="action-btn anim-slide-up" @click="$router.push('/chat')" style="animation-delay: 0.4s">
          <span class="action-icon">💬</span>
          <span class="action-label">班级群聊</span>
          <span class="action-status" :class="{ banned: gameStore.chatBanned }">
            {{ gameStore.chatBanned ? '🔇 上课中' : '🟢 可聊天' }}
          </span>
        </button>
        <button class="action-btn anim-slide-up" @click="$router.push('/ranking')" style="animation-delay: 0.5s">
          <span class="action-icon">🏆</span>
          <span class="action-label">排行榜</span>
          <span class="action-status">No.{{ gameStore.playerRank }}</span>
        </button>
        <button class="action-btn multiplayer-btn anim-slide-up" @click="showLobby = true" style="animation-delay: 0.6s">
          <span class="action-icon">🌐</span>
          <span class="action-label">多人联机</span>
          <span class="action-status" v-if="mp.connected">🟢 已连接</span>
          <span class="action-status" v-else>点击加入</span>
        </button>
      </div>

      <div class="connection-bar mt-1" v-if="mp.roomId">
        <ConnectionStatus />
      </div>

      <button class="btn btn-chalk btn-sm mt-2" @click="resetConfirm = true">
        🔄 重新开始
      </button>
    </div>

    <!-- 重置确认弹窗 -->
    <div class="modal-overlay" v-if="resetConfirm" @click.self="resetConfirm = false">
      <div class="modal-content blackboard-card">
        <p class="chalk-text text-center">确定要重新开始吗？</p>
        <p class="chalk-text text-center mt-1" style="font-size:12px;opacity:0.7">所有数据将被清除</p>
        <div class="flex gap-1 mt-2">
          <button class="btn btn-chalk btn-block" @click="resetConfirm = false">取消</button>
          <button class="btn btn-primary btn-block" @click="doReset">确认重置</button>
        </div>
      </div>
    </div>

    <!-- 多人联机弹窗 -->
    <RoomLobby 
      :visible="showLobby" 
      @close="showLobby = false"
      @roomCreated="onRoomCreated"
      @roomJoined="onRoomJoined"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/store/game'
import { useMultiplayerStore } from '@/store/multiplayer'
import { playBellStart } from '@/utils/sound'
import RoomLobby from '@/components/RoomLobby.vue'
import ConnectionStatus from '@/components/ConnectionStatus.vue'

const router = useRouter()
const gameStore = useGameStore()
const mp = useMultiplayerStore()

const inputName = ref('')
const resetConfirm = ref(false)
const showLobby = ref(false)

const floatingIcons = [
  { id: 1, emoji: '📚', style: 'top:10%;left:5%;animation-delay:0s' },
  { id: 2, emoji: '✏️', style: 'top:20%;right:8%;animation-delay:1s' },
  { id: 3, emoji: '🎒', style: 'top:60%;left:3%;animation-delay:2s' },
  { id: 4, emoji: '📐', style: 'top:70%;right:5%;animation-delay:0.5s' },
  { id: 5, emoji: '🏀', style: 'top:40%;left:90%;animation-delay:1.5s' },
  { id: 6, emoji: '🎵', style: 'top:80%;left:50%;animation-delay:2.5s' },
]

const features = [
  { icon: '🤖', title: '40名AI同学', desc: '8种性格人设，自动发言互动' },
  { icon: '📅', title: '每日课表', desc: '自动刷新课程，上课下课切换' },
  { icon: '✏️', title: '课堂答题', desc: '老师出题，全班PK积分排名' },
  { icon: '💬', title: '班级群聊', desc: '课间自由聊天，上课自动禁言' },
]

const statusText = computed(() => {
  const status = gameStore.classStatus
  if (status === 'in_class') return '📖 上课中'
  if (status === 'break') return '☕ 课间休息'
  return '🌙 已放学'
})

function startGame() {
  if (!inputName.value.trim()) return
  if (gameStore.soundEnabled) playBellStart()
  gameStore.setupPlayer(inputName.value.trim())
}

function doReset() {
  gameStore.resetGame()
  mp.disconnect()
  resetConfirm.value = false
  inputName.value = ''
}

function onRoomCreated(roomId) {
  showLobby.value = false
  router.push('/classroom')
}

function onRoomJoined(roomId) {
  showLobby.value = false
  router.push('/classroom')
}
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  padding: 20px 16px 40px;
  position: relative;
  overflow: hidden;
}

.bg-decor {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.floating-icons {
  position: relative;
  width: 100%;
  height: 100%;
}

.floating-icon {
  position: absolute;
  font-size: 28px;
  opacity: 0.15;
  animation: float 4s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(10deg); }
}

.home-content {
  position: relative;
  z-index: 1;
  max-width: 420px;
  margin: 0 auto;
}

.title-section {
  text-align: center;
  padding: 30px 0 20px;
}

.school-badge {
  display: inline-block;
  background: rgba(255,255,255,0.1);
  color: var(--chalk-yellow);
  padding: 4px 16px;
  border-radius: 20px;
  font-size: 13px;
  border: 1px solid rgba(255,255,255,0.2);
  margin-bottom: 12px;
}

.game-title {
  font-size: 42px;
  font-weight: 900;
  letter-spacing: 4px;
  margin-bottom: 4px;
}

.subtitle {
  font-size: 14px;
  opacity: 0.7;
  margin-bottom: 12px;
}

.tagline {
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
}

.setup-card {
  margin-top: 20px;
  text-align: center;
}

.chalk-drawing {
  font-size: 18px;
  color: var(--chalk-yellow);
  margin-bottom: 16px;
  font-family: 'STKaiti', 'KaiTi', serif;
}

.form-group {
  margin-bottom: 8px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 16px;
}

.name-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px dashed rgba(255,255,255,0.3);
  border-radius: var(--radius-md);
  background: rgba(0,0,0,0.3);
  color: var(--chalk-white);
  font-size: 18px;
  text-align: center;
  outline: none;
  transition: border-color 0.2s;
}

.name-input:focus {
  border-color: var(--chalk-yellow);
}

.name-input::placeholder {
  color: rgba(255,255,255,0.3);
}

.hint-text {
  font-size: 12px;
  opacity: 0.5;
}

.features {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: var(--radius-md);
  padding: 12px;
}

.feature-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.feature-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--chalk-white);
}

.feature-desc {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 2px;
}

.welcome-back {
  font-size: 18px;
  font-family: 'STKaiti', 'KaiTi', serif;
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  -webkit-tap-highlight-color: transparent;
}

.action-btn:active {
  background: rgba(255,255,255,0.15);
  transform: scale(0.98);
}

.action-icon {
  font-size: 28px;
  flex-shrink: 0;
}

.action-label {
  flex: 1;
  font-weight: 600;
}

.action-status {
  font-size: 12px;
  padding: 3px 10px;
  background: rgba(129,178,154,0.2);
  color: var(--chalk-green);
  border-radius: 12px;
}

.action-status.banned {
  background: rgba(224,122,95,0.2);
  color: var(--danger);
}

.multiplayer-btn {
  border: 2px dashed rgba(129,178,154,0.4);
  background: rgba(129,178,154,0.08);
}

.multiplayer-btn:active {
  background: rgba(129,178,154,0.2);
}

.connection-bar {
  display: flex;
  justify-content: center;
  position: relative;
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
