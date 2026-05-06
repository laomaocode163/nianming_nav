<template>
  <div class="mini-player">
    <audio
      ref="audioPlayer"
      @timeupdate="onTimeUpdate"
      @loadedmetadata="onLoadedMetadata"
      @ended="playNext"
      @error="onAudioError"
    ></audio>

    <div class="mini-player-card" :class="{ playing: isPlaying }">
      <!-- 黑胶唱片 -->
      <div class="player-section">
        <div class="vinyl-record" :class="{ spinning: isPlaying }" @click="togglePlay">
          <div class="vinyl-disc">
            <div class="vinyl-label">
              <svg v-if="!isPlaying" class="vinyl-icon" width="12" height="12" viewBox="0 0 18 18" fill="none">
                <path d="M5 3.5L14.5 9L5 14.5V3.5Z" fill="currentColor"/>
              </svg>
              <svg v-else class="vinyl-icon" width="12" height="12" viewBox="0 0 18 18" fill="none">
                <rect x="4" y="3" width="3" height="12" rx="1" fill="currentColor"/>
                <rect x="11" y="3" width="3" height="12" rx="1" fill="currentColor"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- 控制区 -->
      <div class="player-controls">
        <button class="control-btn" @click.stop="playPrev" title="上一首">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="3" width="1.5" height="10" rx="0.75" fill="currentColor"/>
            <path d="M13 3L5 8L13 13V3Z" fill="currentColor"/>
          </svg>
        </button>
        <button class="control-btn" @click.stop="playNext" title="下一首">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M3 3L11 8L3 13V3Z" fill="currentColor"/>
            <rect x="12.5" y="3" width="1.5" height="10" rx="0.75" fill="currentColor"/>
          </svg>
        </button>
      </div>

      <!-- 进度区 -->
      <div class="progress-section" @click="onProgressClick">
        <div class="progress-track">
          <div class="progress-fill" :style="{ width: `${progressPercent}%` }"></div>
        </div>
        <div class="progress-info">
          <span class="time-current">{{ currentTimeDisplay }}</span>
          <span class="time-total">{{ totalTimeDisplay }}</span>
        </div>
      </div>
    </div>

    <!-- 错误提示 -->
    <Transition name="toast">
      <div v-if="errorMessage" class="error-toast">
        <span>{{ errorMessage }}</span>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import musicPlaylist from '../../config/data/music.json'

const API_BASE = 'https://music-api.gdstudio.xyz/api.php'
const SOURCES = ['kuwo', 'netease']

const jayzhouSongs = musicPlaylist

const audioPlayer = ref<HTMLAudioElement | null>(null)
const currentSong = ref<{ name: string; keyword: string } | null>(null)
const isPlaying = ref(false)
const errorMessage = ref('')

const currentTimeDisplay = ref('0:00')
const totalTimeDisplay = ref('0:00')
const progressPercent = ref(0)

interface SongInfo {
  name: string
  keyword: string
  kuwoId?: string
  neteaseId?: string
}

const fetchWithTimeout = async (url: string, ms = 10000): Promise<Response> => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  try {
    return await fetch(url, { signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

const getSongUrl = async (source: string, id: string): Promise<string | null> => {
  try {
    const res = await fetchWithTimeout(
      `${API_BASE}?types=url&source=${source}&id=${id}&br=320`
    )
    const data = await res.json()
    return data.url || null
  } catch (e) {
    // URL 获取失败
  }
  return null
}

const searchAndPlay = async (keyword: string): Promise<string | null> => {
  for (const source of SOURCES) {
    try {
      const res = await fetchWithTimeout(
        `${API_BASE}?types=search&source=${source}&name=${encodeURIComponent(keyword)}&count=5`
      )
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        const url = await getSongUrl(data[0].source || source, data[0].id)
        if (url) return url
      }
    } catch (e) {
      // 搜索失败
    }
  }
  return null
}

const playSong = async (song: SongInfo, autoPlay: boolean = true) => {
  errorMessage.value = ''
  currentSong.value = song

  try {
    let audioUrl: string | null = null

    // 优先使用预定义的 kuwo ID
    if (song.kuwoId) {
      audioUrl = await getSongUrl('kuwo', song.kuwoId)
    }
    // 其次使用预定义的 netease ID
    if (!audioUrl && song.neteaseId) {
      audioUrl = await getSongUrl('netease', song.neteaseId)
    }
    // 最后通过搜索
    if (!audioUrl) {
      audioUrl = await searchAndPlay(song.keyword)
    }

    if (!audioUrl) {
      throw new Error('未找到可用的音频链接')
    }

    if (!audioPlayer.value) return

    audioPlayer.value.pause()
    audioPlayer.value.src = audioUrl
    audioPlayer.value.load()

    if (autoPlay) {
      try {
        await audioPlayer.value.play()
        isPlaying.value = true
      } catch (playError) {
        // 自动播放被浏览器阻止
        isPlaying.value = false
      }
    }
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : '播放失败'
    isPlaying.value = false
  }
}

const togglePlay = async () => {
  if (!audioPlayer.value) return

  if (isPlaying.value) {
    audioPlayer.value.pause()
    isPlaying.value = false
  } else {
    try {
      await audioPlayer.value.play()
      isPlaying.value = true
    } catch {
      isPlaying.value = false
    }
  }
}

const playNext = async () => {
  let randomIndex = Math.floor(Math.random() * jayzhouSongs.length)
  if (currentSong.value && jayzhouSongs[randomIndex].name === currentSong.value.name) {
    randomIndex = (randomIndex + 1) % jayzhouSongs.length
  }
  await playSong(jayzhouSongs[randomIndex], true)
}

const playPrev = async () => {
  await playNext()
}

const onTimeUpdate = () => {
  if (!audioPlayer.value) return

  const current = audioPlayer.value.currentTime
  const duration = audioPlayer.value.duration

  if (duration) {
    progressPercent.value = (current / duration) * 100
    currentTimeDisplay.value = formatTime(current)
  }
}

const onLoadedMetadata = () => {
  if (!audioPlayer.value) return
  totalTimeDisplay.value = formatTime(audioPlayer.value.duration)
}

const onProgressClick = (event: MouseEvent) => {
  if (!audioPlayer.value) return

  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const clickX = event.clientX - rect.left
  const width = rect.width
  const percent = clickX / width

  if (audioPlayer.value.duration) {
    audioPlayer.value.currentTime = percent * audioPlayer.value.duration
  }
}

const onAudioError = () => {
  errorMessage.value = '音频加载失败'
  isPlaying.value = false
}

const formatTime = (seconds: number): string => {
  if (isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// 组件挂载时自动播放
onMounted(() => {
  const randomIndex = Math.floor(Math.random() * jayzhouSongs.length)
  const song = jayzhouSongs[randomIndex]
  playSong(song)
})

onUnmounted(() => {
  if (audioPlayer.value) {
    audioPlayer.value.pause()
    audioPlayer.value.src = ''
  }
})
</script>

<style scoped>
.mini-player {
  display: inline-flex;
  align-items: center;
  position: relative;
}

.mini-player-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0.875rem;
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
}

.mini-player-card:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.mini-player-card.playing {
  border-color: rgba(139, 92, 246, 0.3);
  box-shadow: 0 0 0 1px rgba(139, 92, 246, 0.1);
}

/* 播放区：唱片 + 控制按钮 */
.player-section {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* 黑胶唱片 */
.vinyl-record {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  cursor: pointer;
  position: relative;
  transition: transform 0.2s ease;
}

.vinyl-record:hover {
  transform: scale(1.08);
}

.vinyl-record:active {
  transform: scale(0.95);
}

.vinyl-disc {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
  position: relative;
  transition: box-shadow 0.3s ease;
}

.vinyl-disc::before {
  content: '';
  position: absolute;
  inset: 3px;
  border-radius: 50%;
  background: repeating-radial-gradient(
    circle at center,
    transparent 0px,
    transparent 1.5px,
    rgba(255, 255, 255, 0.04) 1.5px,
    rgba(255, 255, 255, 0.04) 3px
  );
}

.vinyl-label {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 44%;
  height: 44%;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary), #9b7fe8);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  z-index: 1;
}

.vinyl-icon {
  position: relative;
  z-index: 1;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
}

.vinyl-label::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.08);
}

.vinyl-record.spinning .vinyl-disc {
  animation: spin 4s linear infinite;
  box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.2), 0 2px 8px rgba(0, 0, 0, 0.2);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 控制按钮 */
.player-controls {
  display: flex;
  align-items: center;
  gap: 0.125rem;
  flex-shrink: 0;
}

.control-btn {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.control-btn:hover {
  color: var(--color-primary);
  background: rgba(139, 92, 246, 0.08);
}

.control-btn:active {
  transform: scale(0.9);
}

/* 进度区 */
.progress-section {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 100px;
  max-width: 140px;
  cursor: pointer;
  padding-left: 1rem;
  border-left: 1px solid var(--color-border);
}

.progress-track {
  width: 100%;
  height: 3px;
  background: var(--color-border);
  border-radius: 2px;
  overflow: hidden;
  transition: height 0.15s ease;
}

.progress-section:hover .progress-track {
  height: 5px;
}

.progress-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: 2px;
  transition: width 0.2s linear;
  min-width: 0;
}

.progress-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.time-current {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text);
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.time-total {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

/* 错误提示 */
.error-toast {
  position: absolute;
  top: -32px;
  left: 50%;
  transform: translateX(-50%);
  background: #ef4444;
  color: #fff;
  padding: 0.25rem 0.625rem;
  border-radius: 6px;
  font-size: 0.6875rem;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.25);
  pointer-events: none;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(4px);
}

/* 移动端隐藏 */
@media (max-width: 768px) {
  .mini-player {
    display: none;
  }
}
</style>
