/**
 * 音乐播放器逻辑 composable
 * 承载原本散落在 MiniPlayer.vue 中的网络请求、音频控制与状态，
 * 组件仅负责渲染与事件绑定。音频元素通过 audioRef 传入。
 */
import { ref, onUnmounted, type Ref } from 'vue'
import { musicPlaylist } from '../config/music'
import { fetchSongUrl, searchSongUrl } from '../services/musicApi'
import type { MusicTrack } from '../types'

export function useMusicPlayer(audioRef: Ref<HTMLAudioElement | null>) {
  const currentSong = ref<MusicTrack | null>(null)
  const isPlaying = ref(false)
  const errorMessage = ref('')
  const currentTimeDisplay = ref('0:00')
  const totalTimeDisplay = ref('0:00')
  const progressPercent = ref(0)

  const formatTime = (seconds: number): string => {
    if (Number.isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const playSong = async (song: MusicTrack, autoPlay = true): Promise<void> => {
    errorMessage.value = ''
    currentSong.value = song
    try {
      let audioUrl: string | null = null
      if (song.kuwoId) audioUrl = await fetchSongUrl('kuwo', song.kuwoId)
      if (!audioUrl && song.neteaseId) audioUrl = await fetchSongUrl('netease', song.neteaseId)
      if (!audioUrl) audioUrl = await searchSongUrl(song.keyword)
      if (!audioUrl) throw new Error('未找到可用的音频链接')

      const player = audioRef.value
      if (!player) return
      player.pause()
      player.src = audioUrl
      player.load()

      if (autoPlay) {
        try {
          await player.play()
          isPlaying.value = true
        } catch {
          // 自动播放被浏览器阻止
          isPlaying.value = false
        }
      }
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : '播放失败'
      isPlaying.value = false
    }
  }

  const currentIndex = (): number => {
    if (!currentSong.value) return -1
    return musicPlaylist.findIndex((s) => s.name === currentSong.value!.name)
  }

  const playNext = async (): Promise<void> => {
    if (musicPlaylist.length === 0) return
    let index = Math.floor(Math.random() * musicPlaylist.length)
    const cur = currentIndex()
    if (cur >= 0 && musicPlaylist[index].name === musicPlaylist[cur].name) {
      index = (index + 1) % musicPlaylist.length
    }
    await playSong(musicPlaylist[index], true)
  }

  const playPrev = async (): Promise<void> => {
    if (musicPlaylist.length === 0) return
    const cur = currentIndex()
    const index = cur <= 0 ? musicPlaylist.length - 1 : cur - 1
    await playSong(musicPlaylist[index], true)
  }

  const togglePlay = async (): Promise<void> => {
    const player = audioRef.value
    if (!player) return
    if (isPlaying.value) {
      player.pause()
      isPlaying.value = false
    } else {
      try {
        await player.play()
        isPlaying.value = true
      } catch {
        isPlaying.value = false
      }
    }
  }

  const onTimeUpdate = (): void => {
    const player = audioRef.value
    if (!player) return
    const { currentTime, duration } = player
    if (duration) {
      progressPercent.value = (currentTime / duration) * 100
      currentTimeDisplay.value = formatTime(currentTime)
    }
  }

  const onLoadedMetadata = (): void => {
    const player = audioRef.value
    if (player) totalTimeDisplay.value = formatTime(player.duration)
  }

  const onProgressClick = (event: MouseEvent): void => {
    const player = audioRef.value
    if (!player || !player.duration) return
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
    const percent = (event.clientX - rect.left) / rect.width
    player.currentTime = percent * player.duration
  }

  const onAudioError = (): void => {
    errorMessage.value = '音频加载失败'
    isPlaying.value = false
  }

  const init = (): void => {
    if (musicPlaylist.length === 0) return
    const index = Math.floor(Math.random() * musicPlaylist.length)
    void playSong(musicPlaylist[index], false)
  }

  const dispose = (): void => {
    const player = audioRef.value
    if (player) {
      player.pause()
      player.src = ''
    }
  }

  onUnmounted(dispose)

  return {
    currentSong,
    isPlaying,
    errorMessage,
    currentTimeDisplay,
    totalTimeDisplay,
    progressPercent,
    playSong,
    playNext,
    playPrev,
    togglePlay,
    onTimeUpdate,
    onLoadedMetadata,
    onProgressClick,
    onAudioError,
    init,
  }
}
