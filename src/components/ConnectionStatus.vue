<template>
  <div class="connection-status" :class="statusClass" @click="toggleDetail">
    <span class="status-dot"></span>
    <span class="status-text">{{ statusText }}</span>
    <span class="room-info" v-if="mp.roomId">
      {{ mp.roomId }} · {{ mp.roomPlayers.length }}人在线
    </span>
    <span class="detail-arrow" v-if="mp.roomId">▾</span>
  </div>

  <!-- 展开详情 -->
  <div class="status-detail" v-if="showDetail && mp.roomId">
    <div class="detail-row">
      <span class="label">房间号</span>
      <span class="value">{{ mp.roomId }}</span>
    </div>
    <div class="detail-row">
      <span class="label">在线玩家</span>
      <span class="value">{{ mp.roomPlayers.length }} / {{ mp.maxPlayers || 8 }}</span>
    </div>
    <div class="detail-row" v-if="mp.roomPlayers.length > 0">
      <span class="label">玩家列表</span>
      <span class="value player-list">
        <span v-for="p in mp.roomPlayers" :key="p.playerId" class="player-chip">
          {{ p.emoji }} {{ p.playerName }}
        </span>
      </span>
    </div>
    <div class="detail-row" v-if="!mp.connected && mp.reconnectAttempt > 0">
      <span class="label">重连进度</span>
      <span class="value warning">{{ mp.reconnectAttempt }}/{{ mp.maxReconnectAttempts || 10 }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useMultiplayerStore } from '@/store/multiplayer'

const mp = useMultiplayerStore()
const showDetail = ref(false)

const statusClass = computed(() => {
  if (mp.connected) return 'connected'
  if (mp.reconnectAttempt > 0 && !mp.reconnectFailed) return 'reconnecting'
  return 'disconnected'
})

const statusText = computed(() => {
  if (mp.connected) return '联机中'
  if (mp.reconnectAttempt > 0 && !mp.reconnectFailed) 
    return `重连中 (${mp.reconnectAttempt}/${mp.maxReconnectAttempts || 10})`
  if (mp.reconnectFailed) return '连接失败'
  return '未连接'
})

function toggleDetail() {
  showDetail.value = !showDetail.value
}
</script>

<style scoped>
.connection-status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  background: rgba(0,0,0,0.35);
  cursor: pointer;
  user-select: none;
  transition: background 0.2s;
}

.connection-status:hover {
  background: rgba(0,0,0,0.5);
}

.connected {
  color: #4ade80;
}

.reconnecting {
  color: #fbbf24;
  animation: pulse 1s ease-in-out infinite;
}

.disconnected {
  color: #f87171;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.connected .status-dot {
  background: #4ade80;
  box-shadow: 0 0 6px #4ade80;
}

.reconnecting .status-dot {
  background: #fbbf24;
  box-shadow: 0 0 6px #fbbf24;
}

.disconnected .status-dot {
  background: #f87171;
}

.status-text {
  white-space: nowrap;
  font-weight: 500;
}

.room-info {
  color: var(--text-muted);
  margin-left: 2px;
  font-size: 11px;
}

.detail-arrow {
  font-size: 10px;
  color: var(--text-muted);
  transition: transform 0.2s;
}

/* 展开详情面板 */
.status-detail {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  background: #1a1a2e;
  border: 2px solid rgba(255,255,255,0.15);
  border-radius: 12px;
  padding: 12px 16px;
  min-width: 220px;
  z-index: 100;
  box-shadow: 0 8px 32px rgba(0,0,0,0.5);
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 4px 0;
  font-size: 12px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}

.detail-row:last-child {
  border-bottom: none;
}

.label {
  color: var(--text-muted);
  flex-shrink: 0;
  margin-right: 12px;
}

.value {
  color: var(--text-primary);
  text-align: right;
}

.value.warning {
  color: #fbbf24;
  font-weight: 600;
}

.player-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: flex-end;
}

.player-chip {
  background: rgba(255,255,255,0.08);
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  white-space: nowrap;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
