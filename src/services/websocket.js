/**
 * WebSocket 连接管理
 * 支持自动重连、心跳检测、消息队列
 */

class GameWebSocket {
  constructor(url) {
    this.url = url
    this.ws = null
    this.handlers = new Map()
    this.messageQueue = []
    this.playerId = null
    this.roomId = null
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 10
    this.heartbeatInterval = null
    this.heartbeatTimeout = null
    this.isManualClose = false
    this._status = 'disconnected'
  }

  get status() {
    return this._status
  }

  connect(playerId, roomId = null) {
    this.playerId = playerId
    this.roomId = roomId
    this.isManualClose = false
    this._connect()
  }

  _connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return
    }

    this._status = 'connecting'
    console.log(`[WS] 连接中... ${this.url}`)

    try {
      this.ws = new WebSocket(this.url)
    } catch (e) {
      console.error('[WS] 创建连接失败:', e)
      this._scheduleReconnect()
      return
    }

    this.ws.onopen = () => {
      console.log('[WS] 连接成功')
      this._status = 'connected'
      this.reconnectAttempts = 0
      this._startHeartbeat()

      // 如果有 roomId，发送重连请求
      if (this.roomId) {
        this.send('room:reconnect', {
          playerId: this.playerId,
          roomId: this.roomId
        })
      }

      // 发送离线队列中的消息
      this._flushQueue()

      this._emit('connection', { status: 'connected' })
    }

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        this._handleMessage(msg)
      } catch (e) {
        console.error('[WS] 消息解析失败:', e)
      }
    }

    this.ws.onclose = (event) => {
      console.log(`[WS] 连接断开 code=${event.code}`)
      this._status = 'disconnected'
      this._stopHeartbeat()

      this._emit('connection', { status: 'disconnected', code: event.code })

      if (!this.isManualClose) {
        this._scheduleReconnect()
      }
    }

    this.ws.onerror = (err) => {
      console.error('[WS] 连接错误:', err)
      this._emit('error', { error: err })
    }
  }

  disconnect() {
    this.isManualClose = true
    this._stopHeartbeat()
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this._status = 'disconnected'
  }

  send(type, payload = {}) {
    const msg = JSON.stringify({
      type,
      payload: {
        ...payload,
        playerId: this.playerId,
        roomId: this.roomId
      },
      timestamp: Date.now()
    })

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(msg)
    } else {
      // 离线时加入队列
      this.messageQueue.push(msg)
      if (this.messageQueue.length > 100) {
        this.messageQueue = this.messageQueue.slice(-50)
      }
    }
  }

  on(type, handler) {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, [])
    }
    this.handlers.get(type).push(handler)
  }

  off(type, handler) {
    if (!this.handlers.has(type)) return
    const handlers = this.handlers.get(type)
    const idx = handlers.indexOf(handler)
    if (idx >= 0) handlers.splice(idx, 1)
  }

  _handleMessage(msg) {
    const { type, payload } = msg
    
    // 触发特定类型处理器
    this._emit(type, payload)
    
    // 触发通用消息处理器
    this._emit('message', msg)
  }

  _emit(type, data) {
    const handlers = this.handlers.get(type) || []
    handlers.forEach(h => {
      try {
        h(data)
      } catch (e) {
        console.error(`[WS] 处理消息 ${type} 出错:`, e)
      }
    })
  }

  _flushQueue() {
    while (this.messageQueue.length > 0 && this.ws.readyState === WebSocket.OPEN) {
      const msg = this.messageQueue.shift()
      this.ws.send(msg)
    }
  }

  _scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[WS] 达到最大重连次数，停止重连')
      this._emit('reconnect_failed', { attempts: this.reconnectAttempts })
      return
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000)
    this.reconnectAttempts++
    
    console.log(`[WS] ${delay}ms 后进行第 ${this.reconnectAttempts} 次重连`)
    this._status = 'reconnecting'
    this._emit('reconnecting', { attempt: this.reconnectAttempts, delay })

    setTimeout(() => {
      if (!this.isManualClose && this._status !== 'connected') {
        this._connect()
      }
    }, delay)
  }

  _startHeartbeat() {
    this._stopHeartbeat()
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }))
        
        // 设置 pong 超时
        this.heartbeatTimeout = setTimeout(() => {
          console.log('[WS] 心跳超时，断开重连')
          if (this.ws) {
            this.ws.close()
          }
        }, 10000)
      }
    }, 30000)
  }

  _stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout)
      this.heartbeatTimeout = null
    }
  }
}

// 处理 pong 响应
GameWebSocket.prototype.on('pong', function () {
  if (this.heartbeatTimeout) {
    clearTimeout(this.heartbeatTimeout)
    this.heartbeatTimeout = null
  }
})

export default GameWebSocket
