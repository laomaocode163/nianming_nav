/**
 * 音乐播放列表聚合
 * 从 music.json 加载并经 Zod Schema 校验，供播放器 composable 使用。
 */
import type { MusicTrack } from '../types'
import { musicSchema } from './schema'
import musicData from './data/music.json'

export const musicPlaylist = musicSchema.parse(musicData) as MusicTrack[]
