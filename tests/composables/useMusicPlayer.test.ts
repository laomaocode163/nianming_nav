import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { useMusicPlayer } from '../../src/composables/useMusicPlayer';

vi.mock('../../src/services/musicApi', () => ({
  fetchSongUrl: vi.fn().mockResolvedValue('https://audio.test/x.mp3'),
  searchSongUrl: vi.fn().mockResolvedValue('https://audio.test/x.mp3'),
}));

const createAudio = () => {
  const audio = {
    src: '',
    currentTime: 0,
    duration: 100,
    play: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn(),
    load: vi.fn(),
  };
  return audio as unknown as HTMLAudioElement;
};

describe('useMusicPlayer', () => {
  let audio: HTMLAudioElement;
  let audioRef: ReturnType<typeof ref<HTMLAudioElement | null>>;

  beforeEach(() => {
    audio = createAudio();
    audioRef = ref(audio);
  });

  it('init selects a current song from the playlist', async () => {
    const player = useMusicPlayer(audioRef);
    await player.init();
    expect(player.currentSong.value).not.toBeNull();
  });

  it('playNext loads and plays a song', async () => {
    const player = useMusicPlayer(audioRef);
    await player.init();
    await player.playNext();
    expect(player.currentSong.value).not.toBeNull();
    expect(player.isPlaying.value).toBe(true);
    expect(audio.play).toHaveBeenCalled();
  });

  it('togglePlay pauses when already playing', async () => {
    const player = useMusicPlayer(audioRef);
    await player.init();
    await player.playNext();
    expect(player.isPlaying.value).toBe(true);
    await player.togglePlay();
    expect(player.isPlaying.value).toBe(false);
    expect(audio.pause).toHaveBeenCalled();
  });

  it('togglePlay resumes when paused and a song is loaded', async () => {
    const player = useMusicPlayer(audioRef);
    await player.init();
    await player.playNext();
    await player.togglePlay();
    expect(player.isPlaying.value).toBe(false);
    await player.togglePlay();
    expect(player.isPlaying.value).toBe(true);
  });

  it('playNext skips to the correct track when the playlist has duplicate names', async () => {
    const player = useMusicPlayer(audioRef);
    await player.init();
    player.playlist.value = [
      { name: 'Same', keyword: 'a' },
      { name: 'Same', keyword: 'b' },
      { name: 'Other', keyword: 'c' },
    ];
    // 当前曲目为第二个「Same」（同名），应以对象引用定位而非首个同名项
    player.currentSong.value = player.playlist.value[1];
    await player.playNext();
    expect(player.currentSong.value).toBe(player.playlist.value[2]);
  });
});
