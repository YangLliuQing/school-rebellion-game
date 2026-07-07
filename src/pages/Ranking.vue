<template>
  <div class="ranking-page">
    <div class="page-header">
      <button class="back-btn" @click="$router.back()">← 返回</button>
      <h2 class="chalk-text">🏆 排行榜</h2>
      <div class="tab-switch">
        <button 
          :class="{ active: activeTab === 'study' }" 
          @click="activeTab = 'study'"
        >学霸榜</button>
        <button 
          :class="{ active: activeTab === 'rebel' }" 
          @click="activeTab = 'rebel'"
        >摸鱼榜</button>
      </div>
    </div>

    <!-- 我的排名 -->
    <div class="my-rank blackboard-card mt-1">
      <div class="my-rank-content">
        <span class="my-rank-icon">{{ gameStore.playerPersonality?.emoji || '😎' }}</span>
        <div>
          <div class="my-rank-name chalk-text">{{ gameStore.playerName || '我' }}</div>
          <div class="my-rank-tag" :style="{ color: gameStore.playerPersonality?.color }">
            {{ gameStore.playerPersonality?.name || '转学生' }}
          </div>
        </div>
        <div class="my-rank-stats">
          <div class="my-rank-score">⭐ {{ gameStore.playerScore }}</div>
          <div class="my-rank-position">
            {{ activeTab === 'study' ? `No.${gameStore.playerRank}` : `叛逆值 ${gameStore.rebelScore}` }}
          </div>
        </div>
      </div>
    </div>

    <!-- 学霸榜 -->
    <div class="ranking-list mt-2" v-if="activeTab === 'study'">
      <div class="list-header chalk-text">
        <span>📚 学霸排行榜</span>
        <span class="list-subtitle">积分越高越靠前</span>
      </div>
      
      <div 
        class="rank-card" 
        v-for="(student, idx) in displayRanking" 
        :key="student.id || 'player'"
        :class="{ 'is-player': student.isPlayer, 'is-real': student.isReal, ['top-' + (idx + 1)]: idx < 3 && !student.isPlayer }"
      >
        <div class="rank-badge">
          <span v-if="idx === 0 && !student.isPlayer">🥇</span>
          <span v-else-if="idx === 1 && !student.isPlayer">🥈</span>
          <span v-else-if="idx === 2 && !student.isPlayer">🥉</span>
          <span v-else class="rank-number">{{ idx + 1 }}</span>
        </div>
        <div class="rank-avatar">{{ student.avatar || student.personality?.emoji || '😎' }}</div>
        <div class="rank-info">
          <div class="rank-name">{{ student.name }}</div>
          <div class="rank-tag" :style="{ color: student.personality?.color }">
            {{ student.personality?.name || '玩家' }}
          </div>
        </div>
        <div class="rank-score">
          <span class="score-value">{{ student.score }}</span>
          <span class="score-unit">分</span>
        </div>
      </div>
    </div>

    <!-- 摸鱼叛逆榜 -->
    <div class="ranking-list mt-2" v-if="activeTab === 'rebel'">
      <div class="list-header chalk-text">
        <span>😈 叛逆摸鱼榜</span>
        <span class="list-subtitle">越摸鱼越叛逆</span>
      </div>
      
      <div 
        class="rank-card" 
        v-for="(student, idx) in rebelDisplay" 
        :key="student.id"
        :class="{ 'is-player': false, ['top-' + (idx + 1)]: idx < 3 }"
      >
        <div class="rank-badge">
          <span v-if="idx === 0">😈</span>
          <span v-else-if="idx === 1">😏</span>
          <span v-else-if="idx === 2">😴</span>
          <span v-else class="rank-number">{{ idx + 1 }}</span>
        </div>
        <div class="rank-avatar">{{ student.personality?.emoji }}</div>
        <div class="rank-info">
          <div class="rank-name">{{ student.name }}</div>
          <div class="rank-tag" :style="{ color: student.personality?.color }">
            {{ student.personality?.name }}
          </div>
        </div>
        <div class="rank-score rebel">
          <span class="score-value">{{ 100 - (student.score % 100) }}</span>
          <span class="score-unit">叛逆值</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useGameStore } from '@/store/game'
import { useMultiplayerStore } from '@/store/multiplayer'

const gameStore = useGameStore()
const mp = useMultiplayerStore()
const activeTab = ref('study')

const displayRanking = computed(() => {
  // 多人模式：合并真人玩家和 AI 学生
  if (mp.roomId) {
    const list = []
    mp.roomPlayers.forEach(p => {
      list.push({
        id: p.playerId,
        name: p.playerName,
        score: p.score,
        isPlayer: true,
        isReal: true,
        avatar: p.emoji || '😎',
        personality: { name: '联机玩家', color: '#4ade80' }
      })
    })
    // 按分数排序
    list.sort((a, b) => b.score - a.score)
    return list
  }
  
  // 单人模式：AI 学生 + 玩家
  const list = gameStore.sortedByScore.slice(0, 20).map(s => ({
    ...s,
    isPlayer: false,
    avatar: s.personality?.emoji
  }))
  
  // 插入玩家
  const playerEntry = {
    id: 'player',
    name: gameStore.playerName || '我',
    score: gameStore.playerScore,
    isPlayer: true,
    avatar: gameStore.playerPersonality?.emoji || '😎',
    personality: gameStore.playerPersonality || { name: '转学生', color: '#f7d44a' }
  }
  
  // 按分数插入
  const all = [...list, playerEntry].sort((a, b) => b.score - a.score)
  return all.slice(0, 20)
})

const rebelDisplay = computed(() => {
  return [...gameStore.allStudents]
    .sort((a, b) => (100 - (b.score % 100)) - (100 - (a.score % 100)))
    .slice(0, 20)
})
</script>

<style scoped>
.ranking-page {
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

.tab-switch {
  display: flex;
  background: rgba(255,255,255,0.05);
  border-radius: 20px;
  overflow: hidden;
}

.tab-switch button {
  padding: 6px 14px;
  border: none;
  background: none;
  color: var(--text-muted);
  font-size: 13px;
  cursor: pointer;
  border-radius: 20px;
  transition: all 0.2s;
}

.tab-switch button.active {
  background: rgba(255,255,255,0.15);
  color: var(--text-primary);
  font-weight: 600;
}

/* 我的排名 */
.my-rank {
  margin-bottom: 8px;
}

.my-rank-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.my-rank-icon {
  font-size: 32px;
}

.my-rank-name {
  font-size: 16px;
  font-weight: 700;
}

.my-rank-tag {
  font-size: 12px;
  margin-top: 2px;
}

.my-rank-stats {
  margin-left: auto;
  text-align: right;
}

.my-rank-score {
  font-size: 18px;
  font-weight: 700;
  color: var(--chalk-yellow);
}

.my-rank-position {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 2px;
}

/* 排行榜列表 */
.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 4px;
  font-size: 15px;
  font-weight: 600;
}

.list-subtitle {
  font-size: 11px;
  opacity: 0.5;
  font-weight: 400;
}

.rank-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: rgba(255,255,255,0.03);
  border-radius: 10px;
  margin-bottom: 6px;
  border: 1px solid transparent;
  transition: all 0.2s;
}

.rank-card.is-player {
  background: rgba(247,212,74,0.1);
  border-color: rgba(247,212,74,0.3);
}

.rank-card.is-real {
  background: rgba(74,222,128,0.1);
  border-color: rgba(74,222,128,0.3);
}

.rank-card.top-1 { background: rgba(247,212,74,0.08); }
.rank-card.top-2 { background: rgba(192,192,192,0.06); }
.rank-card.top-3 { background: rgba(205,127,50,0.06); }

.rank-badge {
  width: 30px;
  text-align: center;
  font-size: 18px;
}

.rank-number {
  font-size: 14px;
  color: var(--text-muted);
  font-weight: 700;
}

.rank-avatar {
  font-size: 24px;
}

.rank-info {
  flex: 1;
}

.rank-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.rank-tag {
  font-size: 11px;
}

.rank-score {
  text-align: right;
}

.score-value {
  font-size: 16px;
  font-weight: 700;
  color: var(--chalk-yellow);
}

.score-unit {
  font-size: 11px;
  color: var(--text-muted);
  margin-left: 2px;
}

.rank-score.rebel .score-value {
  color: #e07a5f;
}
</style>
