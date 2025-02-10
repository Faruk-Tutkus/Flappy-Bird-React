// Sound effects from mixkit.co (free sound effects)
const SOUNDS = {
  JUMP: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
  SCORE: 'https://assets.mixkit.co/active_storage/sfx/1167/1167-preview.mp3',
  HIT: 'https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3',
  MUSIC: 'https://assets.mixkit.co/active_storage/sfx/1663/1663-preview.mp3'
};

class SoundManager {
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private musicPlaying = false;

  constructor() {
    // Pre-load all sounds
    Object.entries(SOUNDS).forEach(([key, url]) => {
      const audio = new Audio(url);
      
      // Configure audio settings
      if (key === 'MUSIC') {
        audio.loop = true;
        audio.volume = 0.4;
        // Preload music
        audio.preload = 'auto';
        // Load audio
        audio.load();
      } else {
        audio.volume = 0.6;
        audio.preload = 'auto';
        // Load audio
        audio.load();
      }
      
      this.sounds.set(key, audio);
    });

    // Enable audio context on first user interaction
    const enableAudio = () => {
      this.sounds.forEach(sound => {
        sound.load();
      });
    };

    document.addEventListener('click', enableAudio, { once: true });
    document.addEventListener('keydown', enableAudio, { once: true });
  }

  playSound(soundName: keyof typeof SOUNDS) {
    const sound = this.sounds.get(soundName);
    if (sound) {
      // Create a new audio element for overlapping sounds
      if (soundName !== 'MUSIC') {
        const newSound = sound.cloneNode() as HTMLAudioElement;
        newSound.volume = sound.volume;
        newSound.play().catch(() => {
          // Ignore autoplay errors
        });
      } else {
        sound.play().catch(() => {
          // Ignore autoplay errors
        });
      }
    }
  }

  startMusic() {
    if (!this.musicPlaying) {
      const music = this.sounds.get('MUSIC');
      if (music) {
        music.currentTime = 0;
        music.load(); // Ensure the audio is loaded
        const playPromise = music.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // Retry playing after user interaction
            const playOnInteraction = () => {
              music.play().catch(() => {
                // If it fails again, we'll stop trying
              });
            };
            document.addEventListener('click', playOnInteraction, { once: true });
            document.addEventListener('keydown', playOnInteraction, { once: true });
          });
        }
        this.musicPlaying = true;
      }
    }
  }

  stopMusic() {
    const music = this.sounds.get('MUSIC');
    if (music) {
      music.pause();
      music.currentTime = 0;
      this.musicPlaying = false;
    }
  }

  stopAll() {
    this.sounds.forEach(sound => {
      sound.pause();
      sound.currentTime = 0;
    });
    this.musicPlaying = false;
  }
}

export const soundManager = new SoundManager();