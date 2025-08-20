// Audio utility for game sound effects

// Sound effect types
export type SoundEffect = 'bounce' | 'shock' | 'hit' | 'explosion' | 'powerup';

// Audio context and sound buffers
let audioContext: AudioContext | null = null;
const soundBuffers: Map<SoundEffect, AudioBuffer> = new Map();
let isSoundEnabled = true;

// Initialize audio context (must be called after user interaction)
export function initAudio(): void {
  if (typeof window === 'undefined') return; // Skip on server
  
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Resume audio context if it's suspended (needed for Chrome's autoplay policy)
      if (audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
          console.log('AudioContext resumed successfully');
          loadSounds();
        });
      } else {
        loadSounds();
      }
      
      // Add a click handler to the document to resume audio context
      // This helps with browsers that require user interaction
      document.addEventListener('click', function resumeAudio() {
        if (audioContext && audioContext.state === 'suspended') {
          audioContext.resume().then(() => {
            console.log('AudioContext resumed after user interaction');
          });
        }
        // Only need this once
        document.removeEventListener('click', resumeAudio);
      }, { once: true });
    }
  } catch (error) {
    console.error('Web Audio API not supported:', error);
  }
}

// Enable/disable sound
export function toggleSound(enabled: boolean): void {
  isSoundEnabled = enabled;
}

// Create oscillator-based sounds for different effects
function loadSounds(): void {
  if (!audioContext) return;
  
  // Bounce sound - short "boing" effect
  createBounceSound();
  
  // Shock sound - electric zap
  createShockSound();
  
  // Hit sound - impact
  createHitSound();
  
  // Explosion sound
  createExplosionSound();
  
  // Powerup sound
  createPowerupSound();
}

// Create a bounce sound effect
function createBounceSound(): void {
  if (!audioContext) return;
  
  const duration = 0.2; // slightly longer duration for more satisfying bounce
  const sampleRate = audioContext.sampleRate;
  const buffer = audioContext.createBuffer(1, sampleRate * duration, sampleRate);
  const data = buffer.getChannelData(0);
  
  // Create a more impactful bounce sound with richer harmonics
  const startFreq = 450; // Higher starting frequency
  const endFreq = 150; // Lower ending frequency for more depth
  
  for (let i = 0; i < buffer.length; i++) {
    // Time variable (0 to 1)
    const t = i / buffer.length;
    
    // Frequency drops over time with a non-linear curve for more natural sound
    const freqCurve = Math.pow(t, 0.7); // Non-linear curve for frequency drop
    const freq = startFreq - (startFreq - endFreq) * freqCurve;
    
    // Improved amplitude envelope with faster attack and longer decay
    const envelope = Math.exp(-6 * t) * (1 - Math.exp(-60 * t));
    
    // Generate main tone with harmonics for richer sound
    const mainTone = Math.sin(2 * Math.PI * freq * t * 12);
    const harmonic1 = Math.sin(2 * Math.PI * freq * 1.5 * t * 12) * 0.3;
    const harmonic2 = Math.sin(2 * Math.PI * freq * 2 * t * 12) * 0.15;
    
    // Mix the main tone with harmonics
    data[i] = (mainTone + harmonic1 + harmonic2) * envelope;
  }
  
  soundBuffers.set('bounce', buffer);
}

// Create a shock/electric sound effect
function createShockSound(): void {
  if (!audioContext) return;
  
  const duration = 0.3; // seconds
  const sampleRate = audioContext.sampleRate;
  const buffer = audioContext.createBuffer(1, sampleRate * duration, sampleRate);
  const data = buffer.getChannelData(0);
  
  // Create an electric zap sound
  const baseFreq = 800;
  
  for (let i = 0; i < buffer.length; i++) {
    // Time variable (0 to 1)
    const t = i / buffer.length;
    
    // Random frequency modulation for electric feel
    const freqMod = 1 + 0.3 * Math.random();
    
    // Amplitude envelope (quick attack, medium decay)
    const envelope = Math.exp(-5 * t);
    
    // Generate electric zap with noise and frequency modulation
    const noise = Math.random() * 2 - 1;
    const sine = Math.sin(2 * Math.PI * baseFreq * t * freqMod * 5);
    
    // Mix sine wave with noise for electric feel
    data[i] = (0.7 * sine + 0.3 * noise) * envelope;
  }
  
  soundBuffers.set('shock', buffer);
}

// Create a hit sound effect
function createHitSound(): void {
  if (!audioContext) return;
  
  const duration = 0.1; // seconds
  const sampleRate = audioContext.sampleRate;
  const buffer = audioContext.createBuffer(1, sampleRate * duration, sampleRate);
  const data = buffer.getChannelData(0);
  
  // Create a hit/impact sound
  for (let i = 0; i < buffer.length; i++) {
    // Time variable (0 to 1)
    const t = i / buffer.length;
    
    // Amplitude envelope (very quick attack, quick decay)
    const envelope = Math.exp(-20 * t);
    
    // Generate noise-based impact
    const noise = Math.random() * 2 - 1;
    
    data[i] = noise * envelope;
  }
  
  soundBuffers.set('hit', buffer);
}

// Create an explosion sound effect
function createExplosionSound(): void {
  if (!audioContext) return;
  
  const duration = 0.5; // seconds
  const sampleRate = audioContext.sampleRate;
  const buffer = audioContext.createBuffer(1, sampleRate * duration, sampleRate);
  const data = buffer.getChannelData(0);
  
  // Create an explosion sound
  for (let i = 0; i < buffer.length; i++) {
    // Time variable (0 to 1)
    const t = i / buffer.length;
    
    // Amplitude envelope (quick attack, long decay)
    const envelope = Math.exp(-6 * t);
    
    // Generate noise-based explosion with low frequency rumble
    const noise = Math.random() * 2 - 1;
    const rumble = Math.sin(2 * Math.PI * 60 * t) * 0.5;
    
    data[i] = (noise * 0.7 + rumble * 0.3) * envelope;
  }
  
  soundBuffers.set('explosion', buffer);
}

// Create a powerup sound effect
function createPowerupSound(): void {
  if (!audioContext) return;
  
  const duration = 0.4; // seconds
  const sampleRate = audioContext.sampleRate;
  const buffer = audioContext.createBuffer(1, sampleRate * duration, sampleRate);
  const data = buffer.getChannelData(0);
  
  // Create a powerup sound (ascending tones)
  const startFreq = 300;
  const endFreq = 900;
  
  for (let i = 0; i < buffer.length; i++) {
    // Time variable (0 to 1)
    const t = i / buffer.length;
    
    // Frequency rises over time
    const freq = startFreq + (endFreq - startFreq) * t;
    
    // Amplitude envelope
    const envelope = 0.8 - Math.abs(2 * t - 1) * 0.5;
    
    // Generate sine wave with rising frequency
    data[i] = Math.sin(2 * Math.PI * freq * t * 3) * envelope;
  }
  
  soundBuffers.set('powerup', buffer);
}

// Play a sound effect with optional parameters
export function playSound(sound: SoundEffect, options: { volume?: number; detune?: number } = {}): void {
  if (!audioContext || !isSoundEnabled) return;
  
  const buffer = soundBuffers.get(sound);
  if (!buffer) return;
  
  // Create source and connect to destination
  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  
  // Apply detune if specified (pitch variation)
  if (options.detune) {
    source.detune.value = options.detune;
  }
  
  // Apply volume if specified
  const gainNode = audioContext.createGain();
  gainNode.gain.value = options.volume ?? 1.0;
  
  // Connect nodes and play
  source.connect(gainNode);
  gainNode.connect(audioContext.destination);
  source.start();
}

// Play bounce sound with enhanced random pitch variation
export function playBounceSound(intensity: number = 1.0): void {
  // Intensity affects volume and pitch with improved scaling
  const volume = Math.min(0.8 * intensity, 1.0); // Slightly louder base volume
  
  // More dynamic pitch variation based on intensity
  // Higher intensity = higher pitch range
  const detuneRange = 300 + (intensity * 200); // 300-500 range based on intensity
  const detune = (Math.random() * detuneRange) - (detuneRange / 2);
  
  playSound('bounce', { volume, detune });
}

// Play shock sound
export function playShockSound(volume: number = 0.8): void {
  playSound('shock', { volume: volume });
}