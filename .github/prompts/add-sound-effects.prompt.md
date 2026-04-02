---
description: "Add or improve procedural sound effects using Web Audio API"
agent: "agent"
---
Implement the sound effects system in `js/sound.js` using the Web Audio API.

Create a `SoundEngine` class that generates all sounds procedurally (no audio files):
- **Row/match clear**: Shattering sound — white noise through bandpass filter sweeping from 4000Hz to 200Hz
- **Hard drop/slam**: Low-frequency impact thud (80Hz) with crumble noise
- **Element placement**: Quick snap/crack — short high-frequency noise burst
- **Max clear (4+ rows)**: Extended dramatic shatter — layered noise bursts with stagger
- **Rotation/action**: Quick crystalline click using oscillator
- **Game over**: Slow crumbling collapse — descending oscillator with long noise decay
- **Level up**: Ascending chime then crack

Follow the instructions in [sound.instructions.md](.github/instructions/sound.instructions.md).
Handle AudioContext autoplay policy — create context on first user interaction.
Add master volume and mute toggle (M key).
Support multiple sound themes for variety.
