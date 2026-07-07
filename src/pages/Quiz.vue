<template>
  <div class="quiz-page">
    <div class="page-header">
      <button class="back-btn" @click="$router.back()">← 返回</button>
      <h2 class="chalk-text">✏️ 课堂答题</h2>
      <div class="score-display">⭐ {{ gameStore.playerScore }}</div>
    </div>

    <!-- 无题目时 -->
    <div class="quiz-start blackboard-card mt-2" v-if="!gameStore.currentQuestion && !gameStore.lastQuizResult">
      <div class="quiz-intro">
        <div class="quiz-icon">✏️</div>
        <h3 class="chalk-text-yellow">准备答题！</h3>
        <p class="chalk-text mt-1">老师会随机出题，和全班40名同学一起PK！</p>
        <p class="chalk-text-blue mt-1" style="font-size:12px">
          答对加分，答错不扣分<br>
          连续答对触发连击加成 🔥
        </p>
      </div>
      <button class="btn btn-primary btn-lg btn-block mt-2" @click="gameStore.startQuiz()">
        📝 开始答题
      </button>

      <!-- 题目类型说明 -->
      <div class="quiz-types mt-2">
        <div class="type-tag">📚 中小学基础题</div>
        <div class="type-tag">🧠 趣味脑洞题</div>
        <div class="type-tag">🎭 怀旧校园梗</div>
      </div>
    </div>

    <!-- 答题结果 -->
    <div class="quiz-result blackboard-card mt-2 anim-bounce" v-if="gameStore.lastQuizResult && !gameStore.currentQuestion">
      <div class="result-icon">{{ gameStore.lastQuizResult.correct ? '🎉' : '😅' }}</div>
      <h3 class="chalk-text-yellow">
        {{ gameStore.lastQuizResult.correct ? '回答正确！' : '回答错误！' }}
      </h3>
      <div class="result-points chalk-text mt-1" v-if="gameStore.lastQuizResult.correct">
        +{{ gameStore.lastQuizResult.points }}分
        <span v-if="gameStore.lastQuizResult.streak > 1" class="streak-badge">
          🔥 {{ gameStore.lastQuizResult.streak }}连击！
        </span>
      </div>

      <!-- 全班答题统计 -->
      <div class="class-stats mt-2" v-if="gameStore.quizResults.length">
        <div class="stats-bar">
          <div class="stats-correct" :style="{ width: correctRate + '%' }">
            ✅ {{ correctCount }}人
          </div>
          <div class="stats-wrong" :style="{ width: (100 - correctRate) + '%' }">
            ❌ {{ wrongCount }}人
          </div>
        </div>
        <div class="stats-detail chalk-text mt-1">
          全班 {{ gameStore.quizResults.length }} 人参与，正确率 {{ correctRate }}%
        </div>
      </div>

      <button class="btn btn-green btn-block mt-2" @click="gameStore.getNextQuestion()">
        ▶️ 下一题
      </button>
    </div>

    <!-- 答题中 -->
    <div class="quiz-active blackboard-card mt-2 anim-slide-up" v-if="gameStore.currentQuestion && gameStore.quizActive">
      <!-- 出题老师 -->
      <div class="teacher-bar">
        <span>{{ teacherEmoji }}</span>
        <span class="chalk-text">{{ teacherName }}老师出题：</span>
      </div>

      <!-- 题目 -->
      <div class="question-card mt-1">
        <div class="question-subject tag" :class="subjectTagClass">{{ gameStore.currentQuestion.subject }}</div>
        <div class="question-text chalk-text mt-1">{{ gameStore.currentQuestion.question }}</div>
      </div>

      <!-- 选项 -->
      <div class="options-list mt-2">
        <button
          v-for="(option, idx) in gameStore.currentQuestion.options"
          :key="idx"
          class="option-btn chalk-text"
          :class="optionClass(idx)"
          @click="selectAnswer(idx)"
        >
          <span class="option-letter">{{ ['A','B','C','D'][idx] }}</span>
          <span class="option-text">{{ option }}</span>
        </button>
      </div>

      <!-- 倒计时 -->
      <div class="timer-bar mt-2">
        <div class="timer-fill" :style="{ width: timerPercent + '%' }"></div>
      </div>
      <div class="timer-text chalk-text">剩余 {{ timerSeconds }}秒</div>
    </div>

    <!-- 排行榜预览 -->
    <div class="ranking-preview mt-2" v-if="gameStore.topStudents.length">
      <h4 class="chalk-text mb-1">🏆 学霸榜 TOP5</h4>
      <div class="rank-item" v-for="(s, idx) in gameStore.topStudents.slice(0, 5)" :key="s.id">
        <span class="rank-num" :class="'rank-' + (idx+1)">{{ idx + 1 }}</span>
        <span class="rank-emoji">{{ s.personality.emoji }}</span>
        <span class="rank-name">{{ s.name }}</span>
        <span class="rank-tag" :style="{ color: s.personality.color }">{{ s.personality.name }}</span>
        <span class="rank-score">{{ s.score }}分</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useGameStore } from '@/store/game'
import { playCorrectSound, playWrongSound, playStreakSound } from '@/utils/sound'

const gameStore = useGameStore()

const timerSeconds = ref(15)
const timerPercent = ref(100)
let timerInterval = null

const teacherEmoji = computed(() => {
  const map = { '语文': '👩‍🏫', '数学': '👨‍🏫', '英语': '👩‍🏫', '趣味': '😄', '怀旧': '📻' }
  return map[gameStore.currentQuestion?.subject] || '👨‍🏫'
})

const teacherName = computed(() => {
  const map = { '语文': '李', '数学': '王', '英语': 'Miss Chen', '趣味': '神秘', '怀旧': '时光' }
  return map[gameStore.currentQuestion?.subject] || '值班'
})

const subjectTagClass = computed(() => {
  const s = gameStore.currentQuestion?.subject
  if (s === '语文' || s === '数学' || s === '英语') return 'tag-blue'
  if (s === '趣味') return 'tag-pink'
  return 'tag-orange'
})

const correctCount = computed(() => gameStore.quizResults.filter(r => r.correct).length)
const wrongCount = computed(() => gameStore.quizResults.filter(r => !r.correct).length)
const correctRate = computed(() => {
  if (!gameStore.quizResults.length) return 0
  return Math.round((correctCount.value / gameStore.quizResults.length) * 100)
})

function startTimer() {
  timerSeconds.value = 15
  timerPercent.value = 100
  clearInterval(timerInterval)
  timerInterval = setInterval(() => {
    timerSeconds.value--
    timerPercent.value = (timerSeconds.value / 15) * 100
    if (timerSeconds.value <= 0) {
      clearInterval(timerInterval)
      // 超时算错
      selectAnswer(-1)
    }
  }, 1000)
}

function selectAnswer(idx) {
  clearInterval(timerInterval)
  gameStore.submitAnswer(idx)
  
  if (gameStore.lastQuizResult?.correct) {
    if (gameStore.soundEnabled) {
      if (gameStore.lastQuizResult.streak > 3) {
        playStreakSound(gameStore.lastQuizResult.streak)
      } else {
        playCorrectSound()
      }
    }
  } else {
    if (gameStore.soundEnabled) playWrongSound()
  }
}

function optionClass(idx) {
  if (!gameStore.lastQuizResult) return ''
  const correctIdx = gameStore.currentQuestion?.answer
  if (idx === correctIdx) return 'correct'
  if (idx !== correctIdx && gameStore.lastQuizResult && !gameStore.lastQuizResult.correct) {
    // 不显示选错的那个
  }
  return ''
}

watch(() => gameStore.quizActive, (val) => {
  if (val) startTimer()
  else clearInterval(timerInterval)
})

watch(() => gameStore.currentQuestion, (val) => {
  if (val && gameStore.quizActive) startTimer()
})
</script>

<style scoped>
.quiz-page {
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

.score-display {
  color: var(--chalk-yellow);
  font-weight: 700;
  font-size: 16px;
}

.quiz-start {
  text-align: center;
}

.quiz-intro {
  padding: 20px 0;
}

.quiz-icon {
  font-size: 48px;
  margin-bottom: 8px;
}

.quiz-types {
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
}

.type-tag {
  padding: 4px 12px;
  background: rgba(255,255,255,0.1);
  border-radius: 20px;
  font-size: 12px;
  color: var(--text-secondary);
}

/* 答题结果 */
.quiz-result {
  text-align: center;
}

.result-icon {
  font-size: 48px;
}

.result-points {
  font-size: 24px;
  font-weight: 900;
  color: var(--chalk-yellow);
}

.streak-badge {
  display: inline-block;
  padding: 2px 10px;
  background: rgba(247,212,74,0.2);
  border-radius: 12px;
  font-size: 14px;
  margin-left: 8px;
}

.class-stats {
  text-align: left;
}

.stats-bar {
  display: flex;
  height: 28px;
  border-radius: 14px;
  overflow: hidden;
  font-size: 12px;
  line-height: 28px;
  text-align: center;
}

.stats-correct {
  background: rgba(129,178,154,0.4);
  min-width: 50px;
}

.stats-wrong {
  background: rgba(224,122,95,0.4);
  min-width: 50px;
}

.stats-detail {
  text-align: center;
  font-size: 12px;
  opacity: 0.7;
}

/* 答题中 */
.quiz-active {
  position: relative;
}

.teacher-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.question-card {
  padding: 12px;
  background: rgba(0,0,0,0.2);
  border-radius: 8px;
}

.question-text {
  font-size: 18px;
  font-weight: 600;
  line-height: 1.5;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.option-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: rgba(255,255,255,0.08);
  border: 2px solid rgba(255,255,255,0.15);
  border-radius: 12px;
  color: var(--chalk-white);
  font-size: 15px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  -webkit-tap-highlight-color: transparent;
}

.option-btn:active {
  background: rgba(255,255,255,0.15);
  transform: scale(0.98);
}

.option-btn.correct {
  border-color: #81b29a;
  background: rgba(129,178,154,0.2);
}

.option-letter {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: rgba(255,255,255,0.15);
  border-radius: 50%;
  font-weight: 700;
  font-size: 14px;
  flex-shrink: 0;
}

.option-text {
  flex: 1;
}

/* 计时器 */
.timer-bar {
  height: 4px;
  background: rgba(255,255,255,0.1);
  border-radius: 2px;
  overflow: hidden;
}

.timer-fill {
  height: 100%;
  background: linear-gradient(90deg, #81b29a, #e07a5f);
  border-radius: 2px;
  transition: width 1s linear;
}

.timer-text {
  text-align: center;
  font-size: 12px;
  opacity: 0.5;
  margin-top: 4px;
}

/* 排行榜预览 */
.ranking-preview {
  background: rgba(255,255,255,0.03);
  border-radius: 12px;
  padding: 12px;
}

.ranking-preview h4 {
  font-size: 15px;
  margin-bottom: 8px;
}

.rank-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}

.rank-num {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 700;
  background: rgba(255,255,255,0.1);
  color: var(--text-muted);
}

.rank-num.rank-1 { background: #f7d44a; color: #1a1a2e; }
.rank-num.rank-2 { background: #c0c0c0; color: #1a1a2e; }
.rank-num.rank-3 { background: #cd7f32; color: white; }

.rank-emoji { font-size: 16px; }
.rank-name { flex: 1; font-size: 14px; color: var(--text-primary); }
.rank-tag { font-size: 11px; }
.rank-score { font-size: 13px; color: var(--chalk-yellow); font-weight: 600; }
</style>
