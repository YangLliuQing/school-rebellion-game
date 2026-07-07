<template>
  <div class="schedule-page">
    <div class="page-header">
      <button class="back-btn" @click="$router.back()">← 返回</button>
      <h2 class="chalk-text">📅 今日课表</h2>
      <button class="refresh-btn" @click="gameStore.refreshSchedule()">🔄 刷新</button>
    </div>

    <!-- 当前状态卡片 -->
    <div class="current-card blackboard-card mt-1">
      <div class="current-status">
        <span class="current-icon">{{ gameStore.currentPeriod?.icon || '📚' }}</span>
        <div>
          <div class="current-period-name chalk-text-yellow">{{ gameStore.currentPeriod?.name || '--' }}</div>
          <div class="current-time chalk-text">{{ gameStore.currentPeriod?.time || '--' }}</div>
        </div>
        <div class="current-badge" :class="statusClass">{{ statusText }}</div>
      </div>
    </div>

    <!-- 课表列表 -->
    <div class="schedule-list mt-2">
      <div 
        class="schedule-item" 
        v-for="(period, idx) in gameStore.schedule" 
        :key="idx"
        :class="{ 
          'is-active': isCurrentPeriod(period),
          'is-class': period.type === 'class' || period.type === 'morning_reading' || period.type === 'self_study',
          'is-break': period.type === 'break_exercise' || period.type === 'lunch_break',
          'is-done': period.type === 'after_school'
        }"
      >
        <div class="period-time">{{ period.time }}</div>
        <div class="period-divider">
          <div class="period-dot" :class="{ active: isCurrentPeriod(period) }"></div>
          <div class="period-line" v-if="idx < gameStore.schedule.length - 1"></div>
        </div>
        <div class="period-info">
          <div class="period-icon">{{ period.icon }}</div>
          <div class="period-detail">
            <div class="period-name">{{ period.name }}</div>
            <div class="period-type">{{ getTypeLabel(period.type) }}</div>
          </div>
          <div class="period-status" v-if="isCurrentPeriod(period)">▶ 进行中</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useGameStore } from '@/store/game'

const gameStore = useGameStore()

const statusClass = computed(() => {
  const s = gameStore.classStatus
  if (s === 'in_class') return 'in-class'
  if (s === 'break') return 'on-break'
  return 'after-school'
})

const statusText = computed(() => {
  const s = gameStore.classStatus
  if (s === 'in_class') return '📖 上课中'
  if (s === 'break') return '☕ 课间'
  return '🌙 放学'
})

function isCurrentPeriod(period) {
  const cp = gameStore.currentPeriod
  if (!cp) return false
  return cp.time === period.time && cp.name === period.name
}

function getTypeLabel(type) {
  const map = {
    'morning_reading': '早读',
    'class': '正课',
    'break_exercise': '课间活动',
    'lunch_break': '休息',
    'self_study': '自习',
    'after_school': '放学'
  }
  return map[type] || type
}
</script>

<style scoped>
.schedule-page {
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

.back-btn, .refresh-btn {
  background: rgba(255,255,255,0.1);
  border: none;
  color: var(--text-primary);
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 13px;
  cursor: pointer;
}

.current-card {
  margin-bottom: 8px;
}

.current-status {
  display: flex;
  align-items: center;
  gap: 12px;
}

.current-icon {
  font-size: 36px;
}

.current-period-name {
  font-size: 20px;
  font-weight: 700;
}

.current-time {
  font-size: 13px;
  opacity: 0.8;
  margin-top: 2px;
}

.current-badge {
  margin-left: auto;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.current-badge.in-class { background: rgba(224,122,95,0.3); color: #e07a5f; }
.current-badge.on-break { background: rgba(129,178,154,0.3); color: #81b29a; }
.current-badge.after-school { background: rgba(142,202,230,0.3); color: #8ecae6; }

.schedule-list {
  display: flex;
  flex-direction: column;
}

.schedule-item {
  display: flex;
  align-items: stretch;
  gap: 0;
  min-height: 50px;
}

.schedule-item.is-active .period-name {
  color: var(--chalk-yellow);
  font-weight: 700;
}

.period-time {
  width: 90px;
  font-size: 12px;
  color: var(--text-muted);
  padding: 8px 0;
  text-align: right;
  padding-right: 12px;
  flex-shrink: 0;
}

.period-divider {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 20px;
  flex-shrink: 0;
}

.period-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--border-color);
  margin-top: 12px;
  flex-shrink: 0;
}

.period-dot.active {
  background: var(--chalk-yellow);
  box-shadow: 0 0 8px rgba(247,212,74,0.5);
}

.period-line {
  width: 2px;
  flex: 1;
  background: var(--border-color);
  margin: 4px 0;
}

.period-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  margin: 4px 0;
  background: rgba(255,255,255,0.05);
  border-radius: 8px;
}

.is-class .period-info { background: rgba(142,202,230,0.08); }
.is-break .period-info { background: rgba(129,178,154,0.08); }
.is-done .period-info { background: rgba(255,255,255,0.03); opacity: 0.6; }

.period-icon {
  font-size: 22px;
}

.period-detail {
  flex: 1;
}

.period-name {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
}

.period-type {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 2px;
}

.period-status {
  font-size: 11px;
  color: var(--chalk-yellow);
  font-weight: 600;
  animation: pulse 1.5s ease-in-out infinite;
}
</style>
