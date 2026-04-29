<template>
  <div class="mini-player">
    <audio
      ref="audioPlayer"
      @timeupdate="onTimeUpdate"
      @loadedmetadata="onLoadedMetadata"
      @ended="playNext"
      @error="onAudioError"
    ></audio>

    <div class="mini-player-card">
      <!-- 黑胶唱片/专辑封面 -->
      <div class="vinyl-record" :class="{ spinning: isPlaying }">
        <div class="vinyl-disc">
          <div class="vinyl-label"></div>
        </div>
      </div>

      <!-- 歌曲信息 -->
      <div class="song-info">
        <div class="song-name">{{ currentSong?.name || '加载中...' }}</div>
        <div class="song-artist">周杰伦</div>
      </div>

      <!-- 播放控制 -->
      <div class="controls">
        <button class="control-btn" @click="playPrev" title="上一首">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="3" width="1.5" height="10" rx="0.75" fill="currentColor"/>
            <path d="M13 3L5 8L13 13V3Z" fill="currentColor"/>
          </svg>
        </button>
        <button 
          class="control-btn play-btn" 
          :class="{ playing: isPlaying }"
          @click="togglePlay" 
          :title="isPlaying ? '暂停' : '播放'"
        >
          <svg v-if="!isPlaying" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 3.5L14.5 9L5 14.5V3.5Z" fill="currentColor"/>
          </svg>
          <svg v-else width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="3" width="3" height="12" rx="1" fill="currentColor"/>
            <rect x="11" y="3" width="3" height="12" rx="1" fill="currentColor"/>
          </svg>
        </button>
        <button class="control-btn" @click="playNext" title="下一首">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 3L11 8L3 13V3Z" fill="currentColor"/>
            <rect x="12.5" y="3" width="1.5" height="10" rx="0.75" fill="currentColor"/>
          </svg>
        </button>
      </div>

      <!-- 进度条 -->
      <div class="progress-section">
        <div class="progress-bar" @click="onProgressClick">
          <div class="progress-fill" :style="{ width: `${progressPercent}%` }"></div>
        </div>
        <div class="time-display">
          <span>{{ currentTimeDisplay }}</span>
          <span>{{ totalTimeDisplay }}</span>
        </div>
      </div>
    </div>

    <!-- 错误提示 -->
    <div v-if="errorMessage" class="error-toast">
      <i class="fas fa-exclamation-circle"></i>
      <span>{{ errorMessage }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import musicPlaylist from '../../config/data/music.json'

const API_BASE = 'https://music-api.gdstudio.xyz/api.php'

// 使用导入的音乐清单
const jayzhouSongs = musicPlaylist

const audioPlayer = ref<HTMLAudioElement | null>(null)
const currentSong = ref<any>(null)
const isPlaying = ref(false)
const errorMessage = ref('')

const currentTimeDisplay = ref('0:00')
const totalTimeDisplay = ref('0:00')
const progressPercent = ref(0)

const playSong = async (song: any, autoPlay: boolean = true) => {
  errorMessage.value = ''
  currentSong.value = song

  try {
    // 第一步：搜索歌曲获取歌曲 ID
    const searchResponse = await fetch(
      `${API_BASE}?types=search&source=kuwo&name=${encodeURIComponent(song.keyword)}&count=1`
    )
    const searchData = await searchResponse.json()

    if (searchData && searchData.length > 0) {
      const songData = searchData[0]
      
      // 第二步：根据歌曲 ID 获取音频链接
      const urlResponse = await fetch(
        `${API_BASE}?types=url&source=${songData.source || 'kuwo'}&id=${songData.id}&br=320`
      )
      const urlData = await urlResponse.json()

      if (urlData && urlData.url && audioPlayer.value) {
        // 平滑切换：先暂停当前播放
        audioPlayer.value.pause()
        
        // 设置新的音频源
        audioPlayer.value.src = urlData.url
        audioPlayer.value.load()
        
        // 如果需要自动播放，则播放新歌曲
        if (autoPlay) {
          await audioPlayer.value.play()
          isPlaying.value = true
        }
      } else {
        throw new Error('未找到音频链接')
      }
    } else {
      throw new Error('未找到歌曲')
    }
  } catch (error: any) {
    console.error('播放失败:', error)
    errorMessage.value = error.message || '播放失败'
    isPlaying.value = false
  }
}

const togglePlay = () => {
  if (!audioPlayer.value) return

  if (isPlaying.value) {
    audioPlayer.value.pause()
    isPlaying.value = false
  } else {
    audioPlayer.value.play()
    isPlaying.value = true
  }
}

const playNext = async () => {
  let randomIndex = Math.floor(Math.random() * jayzhouSongs.length)
  // 避免连续播放同一首
  if (currentSong.value && jayzhouSongs[randomIndex].name === currentSong.value.name) {
    randomIndex = (randomIndex + 1) % jayzhouSongs.length
  }
  const song = jayzhouSongs[randomIndex]
  await playSong(song, true)
}

const playPrev = async () => {
  // 随机播放另一首
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

const onVolumeChange = () => {
  // 音量控制已移除
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

const closePlayer = () => {
  // 由于现在是常驻组件，不再需要关闭功能
  console.log('Close player called but ignored for inline component')
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
}

.mini-player-card {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 0.625rem 0.875rem;
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  width: 360px;
  max-width: 360px;
  position: relative;
}

/* 黑胶唱片效果 */
.vinyl-record {
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  position: relative;
}

.vinyl-disc {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%);
  box-shadow: 
    0 0 0 2px rgba(139, 92, 246, 0.3),
    0 2px 8px rgba(0, 0, 0, 0.2),
    inset 0 0 10px rgba(0, 0, 0, 0.5);
  position: relative;
  transition: transform 0.3s ease;
}

.vinyl-disc::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 70%;
  height: 70%;
  border-radius: 50%;
  background: repeating-radial-gradient(
    circle at center,
    transparent 0px,
    transparent 2px,
    rgba(255, 255, 255, 0.03) 2px,
    rgba(255, 255, 255, 0.03) 4px
  );
}

.vinyl-label {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 40%;
  height: 40%;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary), #9b7fe8);
  box-shadow: 0 0 4px rgba(139, 92, 246, 0.4);
}

.vinyl-label::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 20%;
  height: 20%;
  border-radius: 50%;
  background: #1a1a1a;
}

/* 旋转动画 */
.vinyl-record.spinning .vinyl-disc {
  animation: spin 3s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.song-info {
  flex: 1;
  min-width: 0;
  max-width: 180px;
}

.song-name {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text);
  line-height: 1.2;
  margin-bottom: 0.1875rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.song-artist {
  font-size: 0.6875rem;
  color: var(--color-text-secondary);
  line-height: 1;
}

.controls {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-shrink: 0;
  padding: 0;
}

.control-btn {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1.5px solid transparent;
  color: var(--color-text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 50%;
  position: relative;
  overflow: hidden;
}

.control-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: currentColor;
  opacity: 0;
  transition: opacity 0.25s ease;
}

.control-btn:hover {
  color: var(--color-primary);
  border-color: var(--color-primary);
  transform: scale(1.08);
}

.control-btn:hover::before {
  opacity: 0.08;
}

.control-btn:active {
  transform: scale(0.95);
}

.play-btn {
  width: 34px;
  height: 34px;
  background: linear-gradient(135deg, var(--color-primary), #9b7fe8);
  border: none;
  color: #fff;
  font-size: 12px;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
  animation: pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
}

.play-btn::before {
  display: none;
}

.play-btn:hover {
  background: linear-gradient(135deg, #9b7fe8, var(--color-primary));
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
  transform: scale(1.1);
}

.play-btn:active {
  transform: scale(1.05);
}

.play-btn.playing {
  animation: none;
}

@keyframes pulse-ring {
  0% {
    box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.4);
  }
  70% {
    box-shadow: 0 0 0 8px rgba(139, 92, 246, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(139, 92, 246, 0);
  }
}

.progress-section {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex-shrink: 0;
  width: 80px;
}

.progress-bar {
  height: 4px;
  background: linear-gradient(90deg, var(--color-border), rgba(139, 92, 246, 0.1));
  border-radius: 2px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.25s ease;
  position: relative;
}

.progress-bar::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3));
  opacity: 0;
  transition: opacity 0.25s ease;
}

.progress-bar:hover {
  height: 7px;
  box-shadow: 0 0 8px rgba(139, 92, 246, 0.2);
}

.progress-bar:hover::before {
  opacity: 1;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), #9b7fe8);
  border-radius: 3px;
  transition: width 0.1s linear;
  position: relative;
  box-shadow: 0 0 6px rgba(139, 92, 246, 0.3);
}

.progress-fill::after {
  content: '';
  position: absolute;
  right: -1px;
  top: 50%;
  transform: translateY(-50%);
  width: 10px;
  height: 10px;
  background: #fff;
  border: 2px solid var(--color-primary);
  border-radius: 50%;
  box-shadow: 0 0 4px rgba(139, 92, 246, 0.4);
  opacity: 0;
  transition: opacity 0.25s ease;
}

.progress-bar:hover .progress-fill::after {
  opacity: 1;
}

.time-display {
  display: flex;
  justify-content: space-between;
  font-size: 0.625rem;
  color: var(--color-text-secondary);
  gap: 0.25rem;
}

.close-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: var(--color-text-secondary);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 50%;
  flex-shrink: 0;
}

.close-btn:hover {
  color: var(--color-text);
  background: rgba(0, 0, 0, 0.05);
}

.error-toast {
  position: absolute;
  top: -36px;
  left: 50%;
  transform: translateX(-50%);
  background: #ff6b6b;
  color: #fff;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(255, 107, 107, 0.3);
}

/* 移动端适配 */
@media (max-width: 768px) {
  .mini-player {
    display: none;
  }
}
</style>
