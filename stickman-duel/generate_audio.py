import math
import struct
import wave
import os

OUTPUT_DIR = r"D:\Generating videos\stickman-duel\assets"
SAMPLE_RATE = 44100

def write_wav(filename, samples_left, samples_right=None):
    if samples_right is None:
        samples_right = samples_left
    path = os.path.join(OUTPUT_DIR, filename)
    with wave.open(path, 'w') as wav:
        wav.setnchannels(2)
        wav.setsampwidth(2)
        wav.setframerate(SAMPLE_RATE)
        
        # Clip and pack
        frames = bytearray()
        for l, r in zip(samples_left, samples_right):
            # clamp to -1.0 .. 1.0
            cl_l = max(-1.0, min(1.0, l))
            cl_r = max(-1.0, min(1.0, r))
            val_l = int(cl_l * 32767.0)
            val_r = int(cl_r * 32767.0)
            frames.extend(struct.pack('<hh', val_l, val_r))
        wav.writeframes(frames)
    print(f"Generated {filename} ({len(samples_left)/SAMPLE_RATE:.2f}s)")

# Noise generator
import random
rng = random.Random(42)

def gen_noise(duration):
    return [rng.uniform(-1.0, 1.0) for _ in range(int(duration * SAMPLE_RATE))]

def gen_whoosh(duration=0.35, freq_start=150, freq_peak=800, freq_end=100):
    n_samples = int(duration * SAMPLE_RATE)
    out = []
    phase = 0.0
    for i in range(n_samples):
        t = i / n_samples
        # envelope
        env = math.sin(t * math.pi) ** 1.5
        # frequency sweep
        if t < 0.5:
            f = freq_start + (freq_peak - freq_start) * (t / 0.5)
        else:
            f = freq_peak - (freq_peak - freq_end) * ((t - 0.5) / 0.5)
        
        phase += 2.0 * math.pi * f / SAMPLE_RATE
        noise = rng.uniform(-1.0, 1.0) * 0.3
        val = (math.sin(phase) * 0.7 + noise) * env
        out.append(val * 0.8)
    return out

def gen_punch(duration=0.3):
    n_samples = int(duration * SAMPLE_RATE)
    out = []
    phase = 0.0
    for i in range(n_samples):
        t = i / SAMPLE_RATE
        env = math.exp(-t * 22.0)
        # pitch drop: 220Hz down to 45Hz
        f = 45.0 + 180.0 * math.exp(-t * 35.0)
        phase += 2.0 * math.pi * f / SAMPLE_RATE
        # click / noise transient
        noise_env = math.exp(-t * 80.0)
        noise = rng.uniform(-1.0, 1.0) * noise_env * 0.9
        body = math.sin(phase) + 0.3 * math.sin(phase * 2.0)
        val = (body * env + noise) * 0.9
        out.append(val)
    return out

def gen_block(duration=0.25):
    n_samples = int(duration * SAMPLE_RATE)
    out = []
    phase = 0.0
    for i in range(n_samples):
        t = i / SAMPLE_RATE
        env = math.exp(-t * 28.0)
        f = 400.0 + 300.0 * math.exp(-t * 40.0)
        phase += 2.0 * math.pi * f / SAMPLE_RATE
        noise = rng.uniform(-1.0, 1.0) * math.exp(-t * 90.0) * 0.5
        val = (math.sin(phase) * 0.6 + noise) * env
        out.append(val * 0.8)
    return out

def gen_sword_clash(duration=0.6):
    n_samples = int(duration * SAMPLE_RATE)
    out = []
    p1, p2, p3 = 0.0, 0.0, 0.0
    f1, f2, f3 = 1850.0, 2450.0, 3920.0
    for i in range(n_samples):
        t = i / SAMPLE_RATE
        env = math.exp(-t * 8.0)
        p1 += 2.0 * math.pi * f1 / SAMPLE_RATE
        p2 += 2.0 * math.pi * f2 / SAMPLE_RATE
        p3 += 2.0 * math.pi * f3 / SAMPLE_RATE
        noise = rng.uniform(-1.0, 1.0) * math.exp(-t * 90.0) * 0.7
        val = (math.sin(p1) * 0.4 + math.sin(p2) * 0.35 + math.sin(p3) * 0.25) * env + noise
        out.append(val * 0.75)
    return out

def gen_charge(duration=2.5):
    n_samples = int(duration * SAMPLE_RATE)
    out = []
    p1, p2 = 0.0, 0.0
    for i in range(n_samples):
        t = i / n_samples
        env = (t ** 1.8) * 0.85
        # frequency rise
        f1 = 80.0 + 800.0 * (t ** 2.2)
        f2 = 160.0 + 1600.0 * (t ** 2.2)
        # vibrato/wobble
        wobble = 1.0 + 0.08 * math.sin(2.0 * math.pi * 18.0 * (i / SAMPLE_RATE))
        p1 += 2.0 * math.pi * (f1 * wobble) / SAMPLE_RATE
        p2 += 2.0 * math.pi * (f2 * wobble) / SAMPLE_RATE
        val = (math.sin(p1) * 0.5 + math.sin(p2) * 0.3) * env
        out.append(val)
    return out

def gen_explosion(duration=2.2):
    n_samples = int(duration * SAMPLE_RATE)
    out = []
    phase = 0.0
    for i in range(n_samples):
        t = i / SAMPLE_RATE
        env = math.exp(-t * 2.2)
        f = 70.0 * math.exp(-t * 3.0) + 25.0
        phase += 2.0 * math.pi * f / SAMPLE_RATE
        # filtered noise approximation
        noise = rng.uniform(-1.0, 1.0) * math.exp(-t * 4.0) * 0.8
        sub = math.sin(phase) * math.exp(-t * 1.5)
        val = (sub * 0.6 + noise * 0.7) * env
        out.append(val * 0.95)
    return out

def gen_record_scratch(duration=0.5):
    n_samples = int(duration * SAMPLE_RATE)
    out = []
    phase = 0.0
    for i in range(n_samples):
        t = i / n_samples
        env = math.sin(t * math.pi)
        f = 1200.0 * (1.0 - t * 0.7) + rng.uniform(-150, 150)
        phase += 2.0 * math.pi * f / SAMPLE_RATE
        val = math.sin(phase) * env * 0.6
        out.append(val)
    return out

def gen_sparkle(duration=1.2):
    n_samples = int(duration * SAMPLE_RATE)
    out = []
    freqs = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98]
    phases = [0.0] * len(freqs)
    for i in range(n_samples):
        t = i / SAMPLE_RATE
        val = 0.0
        for idx, f in enumerate(freqs):
            delay = idx * 0.08
            if t >= delay:
                dt = t - delay
                env = math.exp(-dt * 6.0)
                phases[idx] += 2.0 * math.pi * f / SAMPLE_RATE
                val += math.sin(phases[idx]) * env * 0.2
        out.append(val)
    return out

# Generate SFX files
write_wav("whoosh.wav", gen_whoosh())
write_wav("punch.wav", gen_punch())
write_wav("block.wav", gen_block())
write_wav("sword_clash.wav", gen_sword_clash())
write_wav("charge.wav", gen_charge())
write_wav("explosion.wav", gen_explosion())
write_wav("record_scratch.wav", gen_record_scratch())
write_wav("sparkle.wav", gen_sparkle())

# Now generate full soundtrack (31.0 seconds)
TOTAL_DURATION = 31.0
total_samples = int(TOTAL_DURATION * SAMPLE_RATE)
music_l = [0.0] * total_samples
music_r = [0.0] * total_samples

def add_tone(track, start_time, duration, freq, volume=0.3, wave_type='sine', decay=3.0):
    start_idx = int(start_time * SAMPLE_RATE)
    n_samples = int(duration * SAMPLE_RATE)
    phase = 0.0
    for i in range(n_samples):
        idx = start_idx + i
        if idx >= len(track):
            break
        t = i / SAMPLE_RATE
        env = math.exp(-t * decay) if decay > 0 else 1.0
        phase += 2.0 * math.pi * freq / SAMPLE_RATE
        if wave_type == 'sine':
            val = math.sin(phase)
        elif wave_type == 'saw':
            val = 2.0 * (phase / (2.0 * math.pi) - math.floor(0.5 + phase / (2.0 * math.pi)))
        elif wave_type == 'square':
            val = 1.0 if math.sin(phase) > 0 else -1.0
        elif wave_type == 'triangle':
            val = 2.0 * abs(2.0 * (phase / (2.0 * math.pi) - math.floor(0.5 + phase / (2.0 * math.pi)))) - 1.0
        track[idx] += val * env * volume

# Part 1: Romantic Intro (0.0s to 5.0s)
# Sweet harp / music box melody: C, E, G, B, C, A, F, G
melody_intro = [
    (0.2, 0.6, 523.25),  # C5
    (0.8, 0.6, 659.25),  # E5
    (1.4, 0.6, 783.99),  # G5
    (2.0, 0.6, 987.77),  # B5
    (2.6, 0.8, 1046.50), # C6
    (3.4, 0.5, 880.00),  # A5
    (4.0, 0.8, 783.99),  # G5
]
for st, dur, f in melody_intro:
    add_tone(music_l, st, dur, f, volume=0.22, wave_type='triangle', decay=2.5)
    add_tone(music_r, st + 0.02, dur, f, volume=0.22, wave_type='triangle', decay=2.5)

# Part 2: Dramatic Staredown (5.0s to 9.0s)
# Heavy bass drone + accelerating heartbeat/taiko drums
for i in range(int(4.0 * SAMPLE_RATE)):
    idx = int(5.0 * SAMPLE_RATE) + i
    if idx < len(music_l):
        t = i / SAMPLE_RATE
        # 55Hz bass drone (A1)
        drone = math.sin(2.0 * math.pi * 55.0 * t) * 0.35 * min(1.0, t * 1.5)
        music_l[idx] += drone
        music_r[idx] += drone

# Taiko / Heartbeat hits at 5.5, 6.3, 7.0, 7.5, 7.9, 8.2, 8.5, 8.7, 8.9
taiko_times = [5.5, 6.3, 7.0, 7.5, 7.9, 8.2, 8.5, 8.7, 8.9]
for tt in taiko_times:
    add_tone(music_l, tt, 0.3, 65.0, volume=0.45, wave_type='sine', decay=15.0)
    add_tone(music_r, tt, 0.3, 65.0, volume=0.45, wave_type='sine', decay=15.0)

# Part 3: Epic Battle (9.0s to 25.0s) - Tempo: 135 BPM (beat = 60/135 = 0.444s)
BPM = 135.0
BEAT = 60.0 / BPM
battle_start = 9.0
battle_end = 24.5

# Bassline & Drums
t_cur = battle_start
while t_cur < battle_end:
    # Kick drum on beats 1 and 3
    add_tone(music_l, t_cur, 0.2, 60.0, volume=0.5, wave_type='sine', decay=20.0)
    add_tone(music_r, t_cur, 0.2, 60.0, volume=0.5, wave_type='sine', decay=20.0)
    
    # Snare / clap on beats 2 and 4
    snare_t = t_cur + BEAT * 0.5
    if snare_t < battle_end:
        snare_idx = int(snare_t * SAMPLE_RATE)
        for i in range(int(0.15 * SAMPLE_RATE)):
            idx = snare_idx + i
            if idx < len(music_l):
                noise = rng.uniform(-1.0, 1.0) * math.exp(-(i/SAMPLE_RATE) * 30.0) * 0.35
                music_l[idx] += noise
                music_r[idx] += noise
    
    # Driving Synth Bass (16th notes: 4 per beat)
    # Bass progression: Amin, Fmaj, Cmaj, Gmaj
    bar = int((t_cur - battle_start) / (4.0 * BEAT)) % 4
    root = [110.0, 87.31, 130.81, 98.0][bar] # A2, F2, C3, G2
    for step in range(4):
        step_t = t_cur + step * (BEAT * 0.25)
        if step_t < battle_end:
            add_tone(music_l, step_t, 0.12, root, volume=0.25, wave_type='saw', decay=12.0)
            add_tone(music_r, step_t, 0.12, root * 1.005, volume=0.25, wave_type='saw', decay=12.0)
            
    t_cur += BEAT

# High-energy Arpeggios & Lead melody during battle
lead_notes = [
    # Bar 1 (Amin): A4, C5, E5, A5
    440.0, 523.25, 659.25, 880.0,
    # Bar 2 (Fmaj): F4, A4, C5, F5
    349.23, 440.0, 523.25, 698.46,
    # Bar 3 (Cmaj): G4, C5, E5, G5
    392.0, 523.25, 659.25, 783.99,
    # Bar 4 (Gmaj): G4, B4, D5, G5
    392.0, 493.88, 587.33, 783.99
]

t_arp = battle_start
note_idx = 0
while t_arp < battle_end:
    f = lead_notes[note_idx % len(lead_notes)]
    add_tone(music_l, t_arp, 0.15, f, volume=0.18, wave_type='square', decay=10.0)
    add_tone(music_r, t_arp, 0.15, f * 1.002, volume=0.18, wave_type='square', decay=10.0)
    note_idx += 1
    t_arp += BEAT * 0.25

# Climax riser & mega explosion tail at 24.5 - 25.5s
# Explosion already generated, so music drops out abruptly at 24.8s!

# Part 4: Comedy Twist Outro (25.5s to 31.0s)
# Happy, carefree ukulele / whistling bounce (C major bouncy chords & whistle)
outro_start = 25.5
chords = [
    # C major: C4, E4, G4
    [261.63, 329.63, 392.00],
    # F major: F4, A4, C5
    [349.23, 440.00, 523.25],
    # G major: G4, B4, D5
    [392.00, 493.88, 587.33],
    # C major final
    [261.63, 329.63, 523.25]
]
t_outro = outro_start
for chord in chords:
    for f in chord:
        add_tone(music_l, t_outro, 0.4, f, volume=0.12, wave_type='triangle', decay=4.0)
        add_tone(music_r, t_outro + 0.01, 0.4, f, volume=0.12, wave_type='triangle', decay=4.0)
    # Whistle note on top
    whistle_f = chord[-1] * 2.0
    add_tone(music_l, t_outro, 0.6, whistle_f, volume=0.20, wave_type='sine', decay=2.5)
    add_tone(music_r, t_outro, 0.6, whistle_f, volume=0.20, wave_type='sine', decay=2.5)
    t_outro += 1.2

write_wav("soundtrack.wav", music_l, music_r)
print("All audio files generated successfully!")
