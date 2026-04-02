# Web Audio API Reference for Sound Effects

## Node Types Used

### OscillatorNode
- Generates tonal sounds (sine, square, sawtooth, triangle)
- Set `frequency.value` for pitch, use `frequency.linearRampToValueAtTime()` for sweeps
- One-shot: call `start()` and `stop()` — cannot be restarted, create new node each time

### AudioBufferSourceNode
- Plays pre-generated buffers (white noise)
- One-shot like Oscillator — create new source for each play
- Set `buffer` property to a pre-created `AudioBuffer`

### BiquadFilterNode
- `lowpass`: Cuts high frequencies (muffled sounds)
- `highpass`: Cuts low frequencies (thin, wispy sounds — avoid for glass)
- `bandpass`: Only passes frequencies near center (focused sounds — preferred for glass/shatter)
- Key params: `frequency`, `Q` (resonance)
- **For glass sounds**: Use bandpass at 3500–8000Hz with low Q (0.4–0.8). Highpass alone sounds thin and airy. Low Q sounds natural; high Q (>5) creates metallic resonance — avoid for realistic glass
- **For impacts**: Bandpass at 4000–5500Hz, Q=0.5–1.0, duration 20–25ms

### GainNode
- Controls volume
- `gain.setValueAtTime(value, time)` — set instant value
- `gain.exponentialRampToValueAtTime(value, time)` — smooth fade (value must be > 0)
- `gain.linearRampToValueAtTime(value, time)` — linear fade

### DelayNode
- Adds echo/delay effect
- `delayTime.value` in seconds
- Feed output back into input through a gain node for echo trails

## Common Patterns

### Envelope (Attack-Decay)
```javascript
const gain = ctx.createGain();
gain.gain.setValueAtTime(0.001, now);
gain.gain.linearRampToValueAtTime(0.8, now + 0.01);  // attack
gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);  // decay
```

### Frequency Sweep
```javascript
const osc = ctx.createOscillator();
osc.frequency.setValueAtTime(4000, now);
osc.frequency.exponentialRampToValueAtTime(200, now + 0.3);
```

## Browser Compatibility Notes
- Safari: Use `webkitAudioContext` as fallback
- All browsers: AudioContext must be created/resumed inside user gesture
- Chrome: Autoplay policy suspends AudioContext until user interaction
- Firefox: Generally permissive but respect the same patterns
