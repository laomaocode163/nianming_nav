/**
 * 音乐播放列表加载（异步、惰性）
 * 与站点配置一致，Zod 与 JSON 经动态 import 进入独立 chunk，不进入首屏 entry bundle。
 */
import type { MusicTrack } from '../types'
import musicData from './data/music.json'

const doLoad = async (): Promise<MusicTrack[]> => {
  const { musicSchema } = await import('./schema')
  return musicSchema.parse(musicData) as MusicTrack[]
}

let cached: Promise<MusicTrack[]> | null = null

/** 加载并校验音乐播放列表；结果会被缓存，多次调用共享同一 Promise */
export const loadMusicPlaylist = (): Promise<MusicTrack[]> => {
  if (!cached) cached = doLoad()
  return cached
}
