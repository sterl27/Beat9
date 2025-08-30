import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, Pause, Square, RotateCcw, Sun, Moon, 
  Sliders, Activity, Waves
} from "lucide-react";

// Enhanced interfaces
interface TrackState {
  id: string;
  name: string;
  pattern: boolean[];
  volume: number;
  pan: number;
  muted: boolean;
  soloed: boolean;
  color: string;
  instrument: string;
  sample?: AudioBuffer;
  effects: {
    reverb: number;
    delay: number;
    filter: number;
    distortion: number;
    chorus: number;
    compressor: number;
  };
}

interface PatternVariation {
  id: string;
  name: string;
  type: 'fill' | 'break' | 'buildup' | 'drop';
  tracks: Record<string, boolean[]>;
  duration: number;
  color: string;
}


interface BeatState {
  tracks: TrackState[];
  currentStep: number;
  isPlaying: boolean;
  bpm: number;
  swing: number;
  masterVolume: number;
  patternLength: number;
  currentPattern: string;
  variations: PatternVariation[];
  chainMode: boolean;
  patternChain: string[];
  liveMode: boolean;
}




const TRACK_COLORS = [
  'from-red-500 to-pink-600',
  'from-blue-500 to-cyan-600',
  'from-green-500 to-emerald-600',
  'from-purple-500 to-violet-600',
  'from-orange-500 to-amber-600',
  'from-indigo-500 to-blue-600',
  'from-teal-500 to-cyan-600',
  'from-rose-500 to-pink-600'
];

const INSTRUMENTS = {
  kick: { name: 'Kick', emoji: '🥾', freq: 60, type: 'sine' },
  snare: { name: 'Snare', emoji: '🥁', freq: 200, type: 'square' },
  hihat: { name: 'Hi-Hat', emoji: '🔸', freq: 8000, type: 'square' },
  bass: { name: 'Bass', emoji: '🎸', freq: 80, type: 'sawtooth' },
  melody: { name: 'Melody', emoji: '🎹', freq: 440, type: 'triangle' },
  vocal: { name: 'Vocal', emoji: '🎤', freq: 300, type: 'sine' },
  perc: { name: 'Perc', emoji: '🪘', freq: 1000, type: 'square' },
  fx: { name: 'FX', emoji: '✨', freq: 2000, type: 'sawtooth' }
};

const PATTERN_VARIATIONS: PatternVariation[] = [
  { id: 'fill_1', name: 'Snare Fill', type: 'fill', tracks: {}, duration: 4, color: 'from-yellow-500 to-orange-500' },
  { id: 'break_1', name: 'Drop Out', type: 'break', tracks: {}, duration: 8, color: 'from-red-500 to-pink-500' },
  { id: 'buildup_1', name: 'Hi-Hat Build', type: 'buildup', tracks: {}, duration: 16, color: 'from-purple-500 to-blue-500' },
  { id: 'drop_1', name: 'Bass Drop', type: 'drop', tracks: {}, duration: 4, color: 'from-green-500 to-teal-500' }
];

export default function UltimateBeatStudioPro() {
  // Core state
  const [beatState, setBeatState] = useState<BeatState>({
    tracks: [
      {
        id: 'kick',
        name: 'Kick',
        pattern: Array(16).fill(false),
        volume: 0.8,
        pan: 0,
        muted: false,
        soloed: false,
        color: TRACK_COLORS[0],
        instrument: 'kick',
        effects: { reverb: 0, delay: 0, filter: 0.5, distortion: 0, chorus: 0, compressor: 0.3 }
      },
      {
        id: 'snare',
        name: 'Snare',
        pattern: Array(16).fill(false),
        volume: 0.7,
        pan: 0.1,
        muted: false,
        soloed: false,
        color: TRACK_COLORS[1],
        instrument: 'snare',
        effects: { reverb: 0.2, delay: 0, filter: 0.7, distortion: 0.1, chorus: 0, compressor: 0.4 }
      },
      {
        id: 'hihat',
        name: 'Hi-Hat',
        pattern: Array(16).fill(false),
        volume: 0.5,
        pan: -0.1,
        muted: false,
        soloed: false,
        color: TRACK_COLORS[2],
        instrument: 'hihat',
        effects: { reverb: 0.1, delay: 0.3, filter: 0.8, distortion: 0, chorus: 0.2, compressor: 0.2 }
      },
      {
        id: 'bass',
        name: 'Bass',
        pattern: Array(16).fill(false),
        volume: 0.6,
        pan: 0,
        muted: false,
        soloed: false,
        color: TRACK_COLORS[3],
        instrument: 'bass',
        effects: { reverb: 0, delay: 0, filter: 0.3, distortion: 0.2, chorus: 0, compressor: 0.5 }
      },
      {
        id: 'melody',
        name: 'Melody',
        pattern: Array(16).fill(false),
        volume: 0.4,
        pan: 0.2,
        muted: false,
        soloed: false,
        color: TRACK_COLORS[4],
        instrument: 'melody',
        effects: { reverb: 0.4, delay: 0.2, filter: 0.6, distortion: 0, chorus: 0.3, compressor: 0.3 }
      },
      {
        id: 'perc',
        name: 'Percussion',
        pattern: Array(16).fill(false),
        volume: 0.5,
        pan: -0.2,
        muted: false,
        soloed: false,
        color: TRACK_COLORS[5],
        instrument: 'perc',
        effects: { reverb: 0.3, delay: 0.1, filter: 0.5, distortion: 0.1, chorus: 0.1, compressor: 0.3 }
      }
    ],
    currentStep: 0,
    isPlaying: false,
    bpm: 128,
    swing: 0,
    masterVolume: 0.8,
    patternLength: 16,
    currentPattern: 'main',
    variations: PATTERN_VARIATIONS,
    chainMode: false,
    patternChain: ['main'],
    liveMode: false
  });

  const [appState, setAppState] = useState({
    theme: 'dark',
    currentGenre: 'hip-hop',
    connected: false,
    activeTab: 'sequencer',
    selectedTrack: 'kick',
    showEffects: true,
    showMixer: false,
    showPatterns: false,
    showVisualizer: true,
    isRecording: false,
    exportFormat: 'wav'
  });

  // Audio refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const beatIntervalRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const spectrumCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const waveformCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  // Initialize audio context with enhanced setup
  const initializeAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.connect(audioContextRef.current.destination);
      analyserRef.current.fftSize = 2048;
      analyserRef.current.smoothingTimeConstant = 0.8;
    }
  }, []);

  // Enhanced sound synthesis with effects
  const playTrackSound = useCallback((track: TrackState, velocity: number = 1) => {
    if (!audioContextRef.current) return;

    const ctx = audioContextRef.current;
    const instrument = INSTRUMENTS[track.instrument as keyof typeof INSTRUMENTS];

    // Create audio nodes
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    // Configure oscillator
    oscillator.type = instrument.type as OscillatorType;
    oscillator.frequency.setValueAtTime(instrument.freq, ctx.currentTime);

    // Configure filter
    filter.type = 'lowpass';
    filter.frequency.value = 200 + (track.effects.filter * 8000);
    filter.Q.value = 10;

    // Audio routing
    oscillator.connect(filter);
    filter.connect(gain);

    if (analyserRef.current) {
      gain.connect(analyserRef.current);
    }

    // Configure gain envelope based on instrument
    const baseVolume = track.volume * velocity * beatState.masterVolume;
    gain.gain.setValueAtTime(baseVolume, ctx.currentTime);

    if (track.instrument === 'kick') {
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    } else if (track.instrument === 'snare') {
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    } else if (track.instrument === 'hihat') {
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    } else {
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    }

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 1.0);
  }, [beatState.masterVolume]);

  // Enhanced step toggle
  const toggleStep = (trackId: string, stepIndex: number) => {
    setBeatState(prev => ({
      ...prev,
      tracks: prev.tracks.map(track =>
        track.id === trackId
          ? { ...track, pattern: track.pattern.map((step, i) => i === stepIndex ? !step : step) }
          : track
      )
    }));
  };

  // Enhanced playback
  const togglePlayback = useCallback(() => {
    if (beatState.isPlaying) {
      if (beatIntervalRef.current) {
        clearInterval(beatIntervalRef.current);
        beatIntervalRef.current = null;
      }
      setBeatState(prev => ({ ...prev, isPlaying: false, currentStep: 0 }));
    } else {
      initializeAudio();
      const stepDuration = (60 / beatState.bpm / 4) * 1000;

      setBeatState(prev => ({ ...prev, isPlaying: true }));

      beatIntervalRef.current = setInterval(() => {
        setBeatState(prev => {
          const newStep = (prev.currentStep + 1) % prev.patternLength;

          // Play sounds for active tracks
          prev.tracks.forEach(track => {
            if (track.pattern[prev.currentStep] && !track.muted) {
              playTrackSound(track);
            }
          });

          return { ...prev, currentStep: newStep };
        });
      }, stepDuration);
    }
  }, [beatState.isPlaying, beatState.bpm, initializeAudio, playTrackSound]);

  // Initialize on mount
  useEffect(() => {
    initializeAudio();
  }, [initializeAudio]);

  // Clean up
  useEffect(() => {
    return () => {
      if (beatIntervalRef.current) clearInterval(beatIntervalRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <div className={`min-h-screen ${appState.theme === 'dark' ? 'dark' : ''} transition-all duration-500`}>
      <div className="flex flex-col h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white overflow-hidden">

        {/* Ultimate Header */}
        <motion.div 
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          className="bg-slate-900/95 backdrop-blur-xl border-b border-slate-700/50 px-6 py-3 shadow-2xl relative overflow-hidden"
        >
          {/* Animated background gradient */}
          <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-cyan-500/20"
            animate={{ 
              background: [
                "linear-gradient(90deg, rgba(168,85,247,0.2) 0%, rgba(236,72,153,0.2) 50%, rgba(6,182,212,0.2) 100%)",
                "linear-gradient(90deg, rgba(6,182,212,0.2) 0%, rgba(168,85,247,0.2) 50%, rgba(236,72,153,0.2) 100%)",
                "linear-gradient(90deg, rgba(236,72,153,0.2) 0%, rgba(6,182,212,0.2) 50%, rgba(168,85,247,0.2) 100%)"
              ]
            }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-6">
              <motion.h1 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent"
              >
                🚀 Ultimate Beat Studio Pro
              </motion.h1>
              
              {/* Status indicators */}
              <div className="flex items-center gap-3">
                <motion.div 
                  animate={{ 
                    scale: beatState.isPlaying ? [1, 1.1, 1] : 1,
                    boxShadow: beatState.isPlaying 
                      ? ["0 0 0 0 rgba(34,197,94,0.4)", "0 0 0 8px rgba(34,197,94,0)", "0 0 0 0 rgba(34,197,94,0)"]
                      : "0 0 0 0 rgba(239,68,68,0.4)"
                  }}
                  transition={{ repeat: beatState.isPlaying ? Infinity : 0, duration: 0.6 }}
                  className={`px-4 py-2 rounded-full border text-sm font-semibold ${
                    beatState.isPlaying 
                      ? 'bg-green-500/20 border-green-500/50 text-green-400' 
                      : 'bg-red-500/20 border-red-500/50 text-red-400'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${beatState.isPlaying ? 'bg-green-400' : 'bg-red-400'}`} />
                    {beatState.isPlaying ? 'LIVE' : 'OFFLINE'}
                  </div>
                </motion.div>

                <div className="px-3 py-1 bg-slate-800/50 rounded-lg border border-slate-600/30">
                  <span className="text-sm text-slate-300">BPM: {beatState.bpm}</span>
                </div>

                <div className="px-3 py-1 bg-slate-800/50 rounded-lg border border-slate-600/30">
                  <span className="text-sm text-slate-300">Step: {beatState.currentStep + 1}/16</span>
                </div>
              </div>
            </div>

            {/* Right side controls */}
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setAppState(prev => ({ ...prev, showVisualizer: !prev.showVisualizer }))}
                className={`p-2 rounded-lg transition-all ${
                  appState.showVisualizer 
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                    : 'bg-slate-700/50 text-slate-400 border border-slate-600/30'
                }`}
              >
                <Waves className="w-5 h-5" />
              </button>

              <button 
                onClick={() => setAppState(prev => ({ ...prev, showEffects: !prev.showEffects }))}
                className={`p-2 rounded-lg transition-all ${
                  appState.showEffects 
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                    : 'bg-slate-700/50 text-slate-400 border border-slate-600/30'
                }`}
              >
                <Sliders className="w-5 h-5" />
              </button>

              <button 
                onClick={() => setAppState(prev => ({ ...prev, theme: prev.theme === 'dark' ? 'light' : 'dark' }))}
                className="p-2 rounded-lg bg-slate-700/50 text-slate-400 border border-slate-600/30 hover:bg-slate-600/50 transition-all"
              >
                {appState.theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Sequencer Section */}
          <motion.div 
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex-1 flex flex-col p-6 space-y-4"
          >
            
            {/* Transport Controls */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={togglePlayback}
                    className={`p-4 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                      beatState.isPlaying
                        ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25'
                        : 'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/25'
                    }`}
                  >
                    {beatState.isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    {beatState.isPlaying ? 'Pause' : 'Play'}
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setBeatState(prev => ({ ...prev, currentStep: 0, isPlaying: false }))}
                    className="p-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 transition-all"
                  >
                    <Square className="w-5 h-5" />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 transition-all"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </motion.button>
                </div>

                {/* BPM Control */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-slate-400">BPM:</label>
                    <input
                      type="range"
                      min="60"
                      max="200"
                      value={beatState.bpm}
                      onChange={(e) => setBeatState(prev => ({ ...prev, bpm: parseInt(e.target.value) }))}
                      className="w-24 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <span className="text-sm font-mono text-slate-300 min-w-[3ch]">{beatState.bpm}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-sm text-slate-400">Volume:</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={beatState.masterVolume}
                      onChange={(e) => setBeatState(prev => ({ ...prev, masterVolume: parseFloat(e.target.value) }))}
                      className="w-24 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <span className="text-sm font-mono text-slate-300 min-w-[3ch]">{Math.round(beatState.masterVolume * 100)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Track Sequencer */}
            <div className="flex-1 bg-slate-800/30 backdrop-blur-sm rounded-xl p-6 border border-slate-700/30 overflow-y-auto">
              <div className="space-y-4">
                {beatState.tracks.map((track, trackIndex) => (
                  <motion.div
                    key={track.id}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: trackIndex * 0.05 }}
                    className={`bg-gradient-to-r ${track.color} p-1 rounded-xl`}
                  >
                    <div className="bg-slate-900/90 rounded-lg p-4">
                      <div className="flex items-center gap-4">
                        
                        {/* Track Info */}
                        <div className="w-24 flex items-center gap-2">
                          <span className="text-2xl">{INSTRUMENTS[track.instrument as keyof typeof INSTRUMENTS].emoji}</span>
                          <div>
                            <div className="text-sm font-semibold text-white">{track.name}</div>
                            <div className="text-xs text-slate-400">{INSTRUMENTS[track.instrument as keyof typeof INSTRUMENTS].name}</div>
                          </div>
                        </div>

                        {/* Track Controls */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setBeatState(prev => ({
                              ...prev,
                              tracks: prev.tracks.map(t => 
                                t.id === track.id ? { ...t, muted: !t.muted } : t
                              )
                            }))}
                            className={`w-8 h-8 rounded text-xs font-bold transition-all ${
                              track.muted 
                                ? 'bg-red-500 text-white' 
                                : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                            }`}
                          >
                            M
                          </button>
                          
                          <button
                            onClick={() => setBeatState(prev => ({
                              ...prev,
                              tracks: prev.tracks.map(t => 
                                t.id === track.id ? { ...t, soloed: !t.soloed } : t
                              )
                            }))}
                            className={`w-8 h-8 rounded text-xs font-bold transition-all ${
                              track.soloed 
                                ? 'bg-yellow-500 text-black' 
                                : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                            }`}
                          >
                            S
                          </button>
                        </div>

                        {/* Step Grid */}
                        <div className="flex-1 grid gap-1" style={{ gridTemplateColumns: 'repeat(16, 1fr)' }}>
                          {track.pattern.map((active, stepIndex) => (
                            <motion.button
                              key={stepIndex}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => toggleStep(track.id, stepIndex)}
                              className={`w-8 h-8 rounded transition-all relative ${
                                active
                                  ? `bg-gradient-to-br ${track.color} shadow-lg`
                                  : 'bg-slate-700/50 hover:bg-slate-600/50'
                              } ${
                                beatState.currentStep === stepIndex && beatState.isPlaying
                                  ? 'ring-2 ring-white animate-pulse'
                                  : ''
                              }`}
                            >
                              {stepIndex % 4 === 0 && (
                                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs text-slate-500">
                                  {stepIndex + 1}
                                </div>
                              )}
                            </motion.button>
                          ))}
                        </div>

                        {/* Volume Control */}
                        <div className="w-20">
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={track.volume}
                            onChange={(e) => setBeatState(prev => ({
                              ...prev,
                              tracks: prev.tracks.map(t => 
                                t.id === track.id ? { ...t, volume: parseFloat(e.target.value) } : t
                              )
                            }))}
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
                          />
                          <div className="text-xs text-center text-slate-400 mt-1">
                            {Math.round(track.volume * 100)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Visualizer Panel */}
          <AnimatePresence>
            {appState.showVisualizer && (
              <motion.div
                initial={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 300, opacity: 0 }}
                className="w-80 bg-slate-900/50 backdrop-blur-sm border-l border-slate-700/30 p-4 space-y-4"
              >
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Visualizer
                </h3>

                {/* Spectrum Analyzer */}
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <h4 className="text-sm text-slate-400 mb-2">Spectrum</h4>
                  <canvas
                    ref={spectrumCanvasRef}
                    width={280}
                    height={120}
                    className="w-full bg-slate-900/50 rounded"
                  />
                </div>

                {/* Waveform */}
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <h4 className="text-sm text-slate-400 mb-2">Waveform</h4>
                  <canvas
                    ref={waveformCanvasRef}
                    width={280}
                    height={80}
                    className="w-full bg-slate-900/50 rounded"
                  />
                </div>

                {/* Particle Canvas */}
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <h4 className="text-sm text-slate-400 mb-2">Particles</h4>
                  <canvas
                    ref={canvasRef}
                    width={280}
                    height={150}
                    className="w-full bg-slate-900/50 rounded"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}