/**
 * 简易音效系统 - 使用 Web Audio API 合成
 * 无需外部音频文件，纯代码合成校园音效
 */

let audioCtx = null

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  }
  return audioCtx
}

// 上课铃声 - "叮铃铃~~~"
export function playBellStart() {
  try {
    const ctx = getAudioContext()
    const now = ctx.currentTime
    
    for (let i = 0; i < 10; i++) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      
      osc.type = 'sine'
      osc.frequency.setValueAtTime(800 + i * 50, now + i * 0.15)
      gain.gain.setValueAtTime(0.3, now + i * 0.15)
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.15)
      
      osc.start(now + i * 0.15)
      osc.stop(now + i * 0.15 + 0.2)
    }
  } catch (e) {
    // 静默失败
  }
}

// 下课铃声 - 欢快的
export function playBellEnd() {
  try {
    const ctx = getAudioContext()
    const now = ctx.currentTime
    
    const notes = [523, 659, 784, 1047]
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, now + i * 0.2)
      gain.gain.setValueAtTime(0.3, now + i * 0.2)
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.2 + 0.3)
      
      osc.start(now + i * 0.2)
      osc.stop(now + i * 0.2 + 0.35)
    })
  } catch (e) {}
}

// 粉笔写字声
export function playChalkSound() {
  try {
    const ctx = getAudioContext()
    const now = ctx.currentTime
    
    const bufferSize = ctx.sampleRate * 0.1
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.05
    }
    
    const source = ctx.createBufferSource()
    const filter = ctx.createBiquadFilter()
    const gain = ctx.createGain()
    
    source.buffer = buffer
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(2000, now)
    filter.Q.setValueAtTime(5, now)
    gain.gain.setValueAtTime(0.1, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1)
    
    source.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)
    
    source.start(now)
    source.stop(now + 0.1)
  } catch (e) {}
}

// 答题正确音效
export function playCorrectSound() {
  try {
    const ctx = getAudioContext()
    const now = ctx.currentTime
    
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    
    osc.type = 'sine'
    osc.frequency.setValueAtTime(523, now)
    osc.frequency.setValueAtTime(659, now + 0.1)
    osc.frequency.setValueAtTime(784, now + 0.2)
    gain.gain.setValueAtTime(0.3, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4)
    
    osc.start(now)
    osc.stop(now + 0.4)
  } catch (e) {}
}

// 答题错误音效
export function playWrongSound() {
  try {
    const ctx = getAudioContext()
    const now = ctx.currentTime
    
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    
    osc.type = 'square'
    osc.frequency.setValueAtTime(200, now)
    osc.frequency.setValueAtTime(150, now + 0.15)
    gain.gain.setValueAtTime(0.2, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3)
    
    osc.start(now)
    osc.stop(now + 0.3)
  } catch (e) {}
}

// 消息提示音
export function playMessageSound() {
  try {
    const ctx = getAudioContext()
    const now = ctx.currentTime
    
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    
    osc.type = 'sine'
    osc.frequency.setValueAtTime(1200, now)
    gain.gain.setValueAtTime(0.15, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1)
    
    osc.start(now)
    osc.stop(now + 0.1)
  } catch (e) {}
}

// 连击音效
export function playStreakSound(streak) {
  try {
    const ctx = getAudioContext()
    const now = ctx.currentTime
    
    const baseFreq = 400 + streak * 50
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      
      osc.type = 'sine'
      osc.frequency.setValueAtTime(baseFreq + i * 100, now + i * 0.08)
      gain.gain.setValueAtTime(0.2, now + i * 0.08)
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.1)
      
      osc.start(now + i * 0.08)
      osc.stop(now + i * 0.08 + 0.15)
    }
  } catch (e) {}
}

// 老师脚步声
export function playFootstep() {
  try {
    const ctx = getAudioContext()
    const now = ctx.currentTime
    
    const bufferSize = ctx.sampleRate * 0.05
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.08 * Math.exp(-i / (bufferSize * 0.3))
    }
    
    const source = ctx.createBufferSource()
    const filter = ctx.createBiquadFilter()
    const gain = ctx.createGain()
    
    source.buffer = buffer
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(500, now)
    gain.gain.setValueAtTime(0.2, now)
    
    source.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)
    
    source.start(now)
    source.stop(now + 0.05)
  } catch (e) {}
}
