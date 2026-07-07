<template>
  <div class="classroom-page">
    <!-- 顶部状态栏 -->
    <div class="top-bar">
      <button class="back-btn" @click="$router.push('/')">← 退出</button>
      <div class="class-info">
        <span class="class-name">{{ gameStore.currentClass?.name || '加载中...' }}</span>
        <span class="school-name">{{ gameStore.currentClass?.school || '' }}</span>
      </div>
      <div class="top-actions">
        <button class="icon-btn" @click="gameStore.toggleSound()">
          {{ gameStore.soundEnabled ? '🔊' : '🔇' }}
        </button>
      </div>
    </div>

    <!-- 多人联机状态 -->
    <div class="connection-bar" v-if="mp.roomId">
      <ConnectionStatus />
    </div>

    <!-- 连接断开遮罩 -->
    <DisconnectOverlay 
      :visible="showDisconnect"
      :type="disconnectType"
      :message="disconnectMessage"
      @retry="handleRetry"
      @leave="handleLeaveRoom"
    />

    <!-- 教室场景 -->
    <div class="classroom-scene">
      <!-- 黑板 -->
      <div class="blackboard">
        <div class="board-content">
          <div class="board-title chalk-text">{{ currentSubject }}</div>
          <div class="board-info chalk-text">
            <span>{{ gameStore.currentPeriod?.name || '--' }}</span>
            <span class="board-time">{{ gameStore.currentPeriod?.time || '--' }}</span>
          </div>
          <div class="board-doodle chalk-text-blue">
            {{ boardMessage }}
          </div>
        </div>
        <!-- 粉笔槽 -->
        <div class="chalk-tray">
          <div class="chalk" v-for="c in chalks" :key="c" :style="{ background: c }"></div>
        </div>
      </div>

      <!-- 讲台 -->
      <div class="podium">
        <span class="teacher-emoji">👩‍🏫</span>
        <span class="teacher-label">{{ currentTeacher }}</span>
      </div>

      <!-- 课桌椅 -->
      <div class="desks-area">
        <div class="desk-row" v-for="row in 5" :key="row">
          <div 
            class="desk" 
            v-for="col in 8" 
            :key="col"
            :class="{ 
              'player-seat': isPlayerSeat(row-1, col-1),
              'real-player-seat': isRealPlayerSeat(row-1, col-1),
              'active-student': isActiveStudent(getStudent(row-1, col-1))
            }"
            @click="showStudentInfo(getStudent(row-1, col-1))"
          >
            <div class="desk-top"></div>
            <div class="student-emoji">
              {{ getRealPlayerEmoji(row-1, col-1) || getStudent(row-1, col-1)?.personality?.emoji || '🪑' }}
            </div>
            <div class="real-player-name" v-if="isRealPlayerSeat(row-1, col-1)">
              {{ getRealPlayerName(row-1, col-1) }}
            </div>
          </div>
        </div>
      </div>

      <!-- 底部状态 -->
      <div class="classroom-status">
        <div class="status-badge" :class="statusClass">
          {{ statusLabel }}
        </div>
        <div class="student-count">
          👥 {{ onlineCount }}/{{ totalCount }}人在线
        </div>
        <div class="student-count multiplayer" v-if="mp.roomId">
          🌐 {{ mp.roomPlayers.length }}人联机
        </div>
      </div>
    </div>

    <div class="bottom-actions safe-area-bottom">
      <button class="quick-btn" @click="$router.push('/schedule')">
        <span>📅</span> 课表
      </button>
      <button class="quick-btn" @click="$router.push('/quiz')">
        <span>✏️</span> 答题
      </button>
      <button class="quick-btn primary" @click="$router.push('/chat')">
        <span>💬</span> 群聊
      </button>
      <button class="quick-btn" @click="$router.push('/ranking')">
        <span>🏆</span> 排行
      </button>
      <button class="quick-btn" @click="$router.push('/profile')">
        <span>👤</span> 我
      </button>
    </div>

    <!-- 学生信息弹窗 -->
    <div class="modal-overlay" v-if="selectedStudent" @click.self="selectedStudent = null">
      <div class="student-modal notebook-card" v-if="selectedStudent">
        <div class="student-header">
          <span class="student-avatar-large">{{ selectedStudent.personality.emoji }}</span>
          <div>
            <div class="student-name">{{ selectedStudent.name }}</div>
            <div class="student-tag" :style="{ color: selectedStudent.personality.color }">
              {{ selectedStudent.personality.name }}
            </div>
          </div>
          <button class="close-btn" @click="selectedStudent = null">✕</button>
        </div>
        <div class="student-details">
          <div class="detail-row">
            <span>性格特征：</span>
            <span>{{ selectedStudent.personality.traits.join('、') }}</span>
          </div>
          <div class="detail-row">
            <span>活跃度：</span>
            <div class="activity-bar">
              <div class="activity-fill" :style="{ width: selectedStudent.personality.activityLevel * 100 + '%' }"></div>
            </div>
          </div>
          <div class="detail-row">
            <span>积分：</span>
            <span class="score">{{ selectedStudent.score }}分</span>
          </div>
          <div class="detail-row">
            <span>状态：</span>
            <span>{{ selectedStudent.isOnline ? '🟢 在线' : '⚫ 离线' }}</span>
          </div>
          <div class="detail-row">
            <span>座位：</span>
            <span>第{{ selectedStudent.seatRow + 1 }}排 第{{ selectedStudent.seatCol + 1 }}列</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useGameStore } from '@/store/game'
import { useMultiplayerStore } from '@/store/multiplayer'
import ConnectionStatus from '@/components/ConnectionStatus.vue'
import DisconnectOverlay from '@/components/DisconnectOverlay.vue'

const gameStore = useGameStore()
const mp = useMultiplayerStore()
const selectedStudent = ref(null)
const showDisconnect = ref(false)
const disconnectType = ref('disconnected')
const disconnectMessage = ref('')

const chalks = ['#f5f0e8', '#f7d44a', '#f2a7b3', '#8ecae6', '#95d5b2']

const currentSubject = computed(() => {
  return gameStore.currentPeriod?.name || '自习'
})

const currentTeacher = computed(() => {
  const map = {
    '语文': '李老师 👩‍🏫', '数学': '王老师 👨‍🏫', '英语': 'Miss Chen 👩‍🏫',
    '体育': '张老师 💪', '美术': '赵老师 🎨', '音乐': '音乐老师 🎵',
    '自习': '班主任 👀', '班会': '班主任 👀'
  }
  return map[gameStore.currentPeriod?.name] || '值班老师 👀'
})

const boardMessage = computed(() => {
  const period = gameStore.currentPeriod
  if (!period) return '欢迎来到育才中学！'
  if (period.type === 'class') return `请同学们翻开课本，准备上课`
  if (period.type === 'break') return '课间休息，自由活动~'
  if (period.type === 'after_school') return '放学了，明天见！'
  if (period.type === 'morning_reading') return '请大声朗读课文！'
  if (period.type === 'self_study') return '安静自习，不许说话！'
  return ''
})

const statusClass = computed(() => {
  const s = gameStore.classStatus
  if (s === 'in_class') return 'in-class'
  if (s === 'break') return 'on-break'
  return 'after-school'
})

const statusLabel = computed(() => {
  const s = gameStore.classStatus
  if (s === 'in_class') return '📖 上课中'
  if (s === 'break') return '☕ 课间休息'
  return '🌙 已放学'
})

const onlineCount = computed(() => {
  return gameStore.allStudents.filter(s => s.isOnline).length
})

const totalCount = computed(() => gameStore.allStudents.length)

function getStudent(row, col) {
  return gameStore.allStudents.find(s => s.seatRow === row && s.seatCol === col)
}

function isPlayerSeat(row, col) {
  // 单人模式：玩家固定在第3排第4列
  if (!mp.roomId) return row === 2 && col === 3
  // 多人模式：检查 seatMap
  const seat = mp.seatMap[`${row}-${col}`]
  return seat?.playerId === mp.playerId
}

function isRealPlayerSeat(row, col) {
  if (!mp.roomId) return false
  const seat = mp.seatMap[`${row}-${col}`]
  return seat?.isReal || false
}

function getRealPlayerEmoji(row, col) {
  if (!mp.roomId) return null
  const seat = mp.seatMap[`${row}-${col}`]
  return seat?.isReal ? (seat.emoji || '😎') : null
}

function getRealPlayerName(row, col) {
  if (!mp.roomId) return null
  const seat = mp.seatMap[`${row}-${col}`]
  return seat?.isReal ? (seat.playerName || '同学') : null
}

function isActiveStudent(student) {
  if (!student) return false
  return student.isOnline && student.personality.activityLevel > 0.5
}

function showStudentInfo(student) {
  if (student) selectedStudent.value = student
}

// 多人模式断线检测
watch(() => mp.connected, (val) => {
  if (mp.roomId && !val && mp.reconnectAttempt === 0) {
    showDisconnect.value = true
    disconnectType.value = 'disconnected'
  }
})

watch(() => mp.reconnectFailed, (val) => {
  if (val) {
    showDisconnect.value = true
    disconnectType.value = 'reconnect_failed'
    disconnectMessage.value = `已尝试重连 ${mp.maxReconnectAttempts} 次均失败`
  }
})

watch(() => mp.lastError, (val) => {
  if (val) {
    if (val.includes('房间已满')) {
      showDisconnect.value = true
      disconnectType.value = 'room_full'
      disconnectMessage.value = val
    } else if (val.includes('房间不存在')) {
      showDisconnect.value = true
      disconnectType.value = 'room_not_found'
      disconnectMessage.value = val
    }
  }
})

function handleRetry() {
  showDisconnect.value = false
  mp.connect()
}

function handleLeaveRoom() {
  showDisconnect.value = false
  mp.disconnect()
}
</script>

<style scoped>
.classroom-page {
  min-height: 100vh;
  background: #3d3226;
  display: flex;
  flex-direction: column;
}

.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: rgba(0,0,0,0.4);
  color: white;
  position: sticky;
  top: 0;
  z-index: 10;
}

.back-btn {
  background: none;
  border: none;
  color: var(--chalk-white);
  font-size: 14px;
  cursor: pointer;
  padding: 4px 8px;
}

.class-info {
  text-align: center;
}

.class-name {
  font-size: 16px;
  font-weight: 700;
  display: block;
}

.school-name {
  font-size: 11px;
  opacity: 0.6;
}

.icon-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 4px;
}

.classroom-scene {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
}

/* 黑板 */
.blackboard {
  background: linear-gradient(180deg, #2d5a27 0%, #1e3d1a 100%);
  border: 4px solid #8b7355;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: inset 0 0 20px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.4);
  position: relative;
}

.board-content {
  min-height: 80px;
}

.board-title {
  font-size: 28px;
  font-weight: 900;
  text-align: center;
  margin-bottom: 4px;
}

.board-info {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  opacity: 0.8;
  margin-bottom: 8px;
}

.board-doodle {
  font-size: 14px;
  opacity: 0.7;
  font-style: italic;
}

.chalk-tray {
  display: flex;
  gap: 4px;
  padding: 6px 0 0;
  border-top: 2px solid #8b7355;
  margin-top: 10px;
}

.chalk {
  width: 28px;
  height: 8px;
  border-radius: 4px;
  opacity: 0.9;
}

/* 讲台 */
.podium {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background: rgba(139,115,85,0.3);
  border-radius: 8px;
  margin-bottom: 16px;
  border: 1px solid rgba(139,115,85,0.5);
}

.teacher-emoji {
  font-size: 28px;
}

.teacher-label {
  font-size: 14px;
  color: var(--chalk-white);
}

/* 课桌椅区域 */
.desks-area {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px;
  background: rgba(0,0,0,0.2);
  border-radius: 12px;
}

.desk-row {
  display: flex;
  gap: 6px;
  justify-content: center;
}

.desk {
  width: 40px;
  height: 40px;
  background: #8b7355;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  border: 2px solid #6b5540;
}

.desk:active {
  transform: scale(0.9);
}

.desk.player-seat {
  border: 2px solid var(--chalk-yellow);
  box-shadow: 0 0 8px rgba(247,212,74,0.4);
}

.desk.real-player-seat {
  border: 2px solid #4ade80;
  box-shadow: 0 0 10px rgba(74,222,128,0.5);
  background: rgba(74,222,128,0.1);
}

.real-player-name {
  font-size: 8px;
  color: #4ade80;
  text-align: center;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 40px;
}

.desk.active-student {
  border-color: var(--chalk-green);
}

.connection-bar {
  padding: 4px 16px;
  display: flex;
  justify-content: center;
}

.student-count.multiplayer {
  color: #4ade80;
}

.desk-top {
  width: 30px;
  height: 3px;
  background: #a08868;
  border-radius: 1px;
  position: absolute;
  top: 4px;
}

.student-emoji {
  font-size: 16px;
  margin-top: 2px;
}

/* 状态栏 */
.classroom-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
  padding: 10px 14px;
  background: rgba(0,0,0,0.3);
  border-radius: 10px;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
}

.status-badge.in-class {
  background: rgba(224,122,95,0.3);
  color: #e07a5f;
}

.status-badge.on-break {
  background: rgba(129,178,154,0.3);
  color: #81b29a;
}

.status-badge.after-school {
  background: rgba(142,202,230,0.3);
  color: #8ecae6;
}

.student-count {
  font-size: 12px;
  color: var(--text-muted);
}

/* 底部导航 */
.bottom-actions {
  display: flex;
  gap: 4px;
  padding: 8px 12px;
  background: rgba(0,0,0,0.5);
  border-top: 1px solid rgba(255,255,255,0.1);
  position: sticky;
  bottom: 0;
}

.quick-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 4px;
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 11px;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s;
}

.quick-btn:active {
  background: rgba(255,255,255,0.1);
}

.quick-btn span {
  font-size: 22px;
}

.quick-btn.primary {
  color: var(--chalk-yellow);
}

/* 学生弹窗 */
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

.student-modal {
  width: 100%;
  max-width: 320px;
  background: #fdf5e6 !important;
  color: #3d3226 !important;
}

.student-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.student-avatar-large {
  font-size: 40px;
}

.student-name {
  font-size: 18px;
  font-weight: 700;
  color: #3d3226;
}

.student-tag {
  font-size: 13px;
  font-weight: 600;
  margin-top: 2px;
}

.close-btn {
  margin-left: auto;
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #999;
}

.student-details {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.detail-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #5d4e37;
}

.activity-bar {
  flex: 1;
  height: 6px;
  background: #e0d5c0;
  border-radius: 3px;
  overflow: hidden;
}

.activity-fill {
  height: 100%;
  background: #81b29a;
  border-radius: 3px;
  transition: width 0.3s;
}

.score {
  color: #e07a5f;
  font-weight: 700;
}
</style>
