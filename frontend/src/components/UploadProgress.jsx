import React, { useState, useEffect } from 'react';
import {
  Loader2,
  Upload,
  Disc,
  Radio,
  CheckCircle2,
  Cpu,
  Clock,
  Sparkles,
} from 'lucide-react';

const TIPS = [
  '⚡ Faster-Whisper uses CTranslate2 acceleration for up to 4x faster execution.',
  '🔒 All speech recognition takes place entirely on your device with 0 cloud calls.',
  '🎧 FFmpeg automatically normalizes audio streams to 16kHz mono 16-bit PCM for optimal acoustic clarity.',
  '⏱️ Timestamps are calculated at sub-second precision for exact meeting phrase alignment.',
];

export default function UploadProgress({ uploadProgress, processingStage, fileName }) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);

  // Timer counter
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Tip ticker
  useEffect(() => {
    const tipInterval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % TIPS.length);
    }, 4000);
    return () => clearInterval(tipInterval);
  }, []);

  const isUploadComplete = uploadProgress >= 100;

  const stages = [
    {
      id: 'upload',
      label: 'Streaming Ingestion',
      detail: uploadProgress < 100 ? `${uploadProgress}% uploaded` : 'Stream completed',
      icon: Upload,
      active: uploadProgress < 100,
      completed: uploadProgress >= 100,
    },
    {
      id: 'media',
      label: 'FFmpeg Audio Normalization',
      detail: 'Extracting 16kHz mono audio stream',
      icon: Disc,
      active: isUploadComplete && processingStage === 'media',
      completed: isUploadComplete && (processingStage === 'transcribing' || processingStage === 'done'),
    },
    {
      id: 'transcribe',
      label: 'Whisper Neural Inference',
      detail: 'Detecting speech & generating timestamps',
      icon: Radio,
      active: isUploadComplete && processingStage === 'transcribing',
      completed: processingStage === 'done',
    },
  ];

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="w-full max-w-3xl mx-auto my-6 sm:my-10 animate-fade-in">
      <div className="glass-panel-glow rounded-3xl p-6 sm:p-10 border border-brand-500/20 shadow-2xl relative overflow-hidden">
        {/* Top Header with Elapsed Timer */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-6 mb-6">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600/20 to-cyan-500/20 border border-brand-400/30 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
            </div>
            <div>
              <h3 className="text-xl font-display font-bold text-white tracking-tight">
                Transcribing Meeting Audio
              </h3>
              <p className="text-xs text-slate-400 truncate max-w-xs sm:max-w-md mt-0.5">
                {fileName || 'Processing meeting recording...'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs font-mono font-semibold px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700/80 text-cyan-400">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatTimer(elapsedSeconds)}</span>
          </div>
        </div>

        {/* Upload Progress Bar */}
        <div className="space-y-2 mb-8">
          <div className="flex justify-between text-xs font-semibold text-slate-300">
            <span className="flex items-center space-x-1.5">
              <Upload className="w-3.5 h-3.5 text-brand-400" />
              <span>Upload Transfer</span>
            </span>
            <span className="font-mono text-cyan-400 font-bold">{uploadProgress}%</span>
          </div>
          <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-brand-600 via-indigo-500 to-cyan-400 transition-all duration-300 rounded-full"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>

        {/* Jumping Audio Waveform Animation during transcription */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-center space-x-1.5 mb-8">
          {[
            'h-3', 'h-6', 'h-10', 'h-7', 'h-4', 'h-8', 'h-12', 'h-9',
            'h-5', 'h-11', 'h-8', 'h-4', 'h-10', 'h-6', 'h-12', 'h-7',
            'h-4', 'h-9', 'h-11', 'h-5', 'h-8', 'h-6', 'h-3'
          ].map((hClass, idx) => (
            <span
              key={idx}
              className={`w-1.5 rounded-full bg-gradient-to-t from-brand-500 to-cyan-400 animate-pulse`}
              style={{
                height: `${((idx * 7) % 24) + 8}px`,
                animationDuration: `${0.6 + (idx % 4) * 0.2}s`,
                animationDelay: `${(idx % 5) * 0.1}s`,
              }}
            />
          ))}
        </div>

        {/* Multi-Stage Pipeline Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {stages.map((stage) => {
            const Icon = stage.icon;
            return (
              <div
                key={stage.id}
                className={`p-4 rounded-2xl border transition-all ${
                  stage.active
                    ? 'bg-gradient-to-b from-brand-500/15 to-slate-900/60 border-brand-500/40 shadow-lg shadow-brand-500/10 scale-[1.02]'
                    : stage.completed
                    ? 'bg-emerald-950/20 border-emerald-500/30'
                    : 'bg-slate-900/40 border-slate-800/60 opacity-50'
                }`}
              >
                <div className="flex items-center space-x-2.5 mb-1.5">
                  {stage.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  ) : stage.active ? (
                    <Loader2 className="w-4 h-4 text-cyan-400 animate-spin flex-shrink-0" />
                  ) : (
                    <Icon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  )}
                  <span
                    className={`text-xs font-bold ${
                      stage.active
                        ? 'text-white'
                        : stage.completed
                        ? 'text-emerald-300'
                        : 'text-slate-400'
                    }`}
                  >
                    {stage.label}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 pl-6.5 leading-snug">
                  {stage.detail}
                </p>
              </div>
            );
          })}
        </div>

        {/* Rotating Informational Tips Ticker */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 flex items-center space-x-3 text-xs text-slate-400">
          <Sparkles className="w-4 h-4 text-brand-400 flex-shrink-0" />
          <p className="truncate transition-opacity duration-500 text-slate-300">
            {TIPS[tipIndex]}
          </p>
        </div>
      </div>
    </div>
  );
}
