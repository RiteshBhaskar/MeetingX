import React, { useState } from 'react';
import {
  Layers,
  Cpu,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  X,
  AudioWaveform,
  Zap,
  HardDrive,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export default function Navbar({ healthData, isCheckingHealth, onRefreshHealth, healthError }) {
  const [showInfoModal, setShowInfoModal] = useState(false);

  return (
    <>
      <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-2xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between">
          {/* Brand Logo & Title */}
          <div className="flex items-center space-x-3.5">
            <div className="relative group">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-brand-500/25 ring-1 ring-white/20 transition-transform group-hover:scale-105">
                <AudioWaveform className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              {/* Soft decorative glow */}
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-brand-600 to-cyan-500 opacity-30 blur-sm -z-10 group-hover:opacity-50 transition-opacity" />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="font-display font-extrabold text-lg sm:text-xl tracking-tight text-white">
                  MEETING INTELLIGENCE
                </span>
                <span className="hidden sm:inline-flex text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r from-brand-500/20 to-cyan-500/20 text-brand-300 border border-brand-500/30">
                  Phase 1
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium hidden sm:block">
                On-Device Speech-to-Text & Transcript Pipeline
              </p>
            </div>
          </div>

          {/* Backend Status & Quick Actions */}
          <div className="flex items-center space-x-2.5 sm:space-x-3">
            {healthData ? (
              <div className="flex items-center space-x-2 sm:space-x-3 text-xs glass-pill px-3 py-1.5 rounded-full">
                {/* Status Dot */}
                <div className="flex items-center space-x-1.5 text-emerald-400">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span className="font-semibold hidden md:inline">Online</span>
                </div>

                <span className="text-slate-600 hidden md:inline">|</span>

                {/* Model & Device */}
                <div className="hidden sm:flex items-center space-x-1 text-slate-300">
                  <Cpu className="w-3.5 h-3.5 text-brand-400" />
                  <span className="font-mono text-white font-medium">
                    {healthData.whisper_model}
                  </span>
                  <span className="text-slate-400">({healthData.whisper_device})</span>
                </div>

                {/* FFmpeg Badge */}
                <div className="flex items-center space-x-1 pl-1">
                  {healthData.ffmpeg_available ? (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      FFmpeg ✓
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      No FFmpeg ⚠
                    </span>
                  )}
                </div>
              </div>
            ) : healthError ? (
              <div className="flex items-center space-x-2 text-xs bg-rose-500/10 border border-rose-500/30 text-rose-300 px-3 py-1.5 rounded-full">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                <span className="font-medium">Backend Offline</span>
              </div>
            ) : (
              <div className="text-xs text-slate-400 flex items-center space-x-1.5 glass-pill px-3 py-1.5 rounded-full">
                <RefreshCw className="w-3 h-3 animate-spin text-brand-400" />
                <span>Connecting...</span>
              </div>
            )}

            {/* Info modal trigger */}
            <button
              onClick={() => setShowInfoModal(true)}
              title="Architecture & Pipeline Information"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all"
            >
              <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Health check refresh */}
            <button
              onClick={onRefreshHealth}
              disabled={isCheckingHealth}
              title="Refresh System Health"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${isCheckingHealth ? 'animate-spin text-brand-400' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Info & Architecture Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="glass-panel-glow max-w-xl w-full rounded-2xl p-6 sm:p-8 relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white">System Pipeline Architecture</h3>
              </div>
              <button
                onClick={() => setShowInfoModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-slate-300">
              <p className="text-slate-300">
                Phase 1 delivers a self-hosted, offline-ready transcription pipeline with zero dependency on cloud APIs.
              </p>

              <div className="space-y-2.5 py-2">
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start space-x-3">
                  <span className="w-6 h-6 rounded-full bg-brand-500/20 text-brand-400 font-bold flex items-center justify-center flex-shrink-0 text-xs">
                    1
                  </span>
                  <div>
                    <strong className="text-white font-semibold">Streaming Ingestion & Sanitization</strong>
                    <p className="text-xs text-slate-400 mt-0.5">
                      FastAPI streams uploaded audio/video with maximum upload limit enforcement and path traversal protection.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start space-x-3">
                  <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center flex-shrink-0 text-xs">
                    2
                  </span>
                  <div>
                    <strong className="text-white font-semibold">FFmpeg Stream Extraction</strong>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Extracts and normalizes multi-format media to 16kHz mono PCM WAV via secure subprocess execution.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start space-x-3">
                  <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center flex-shrink-0 text-xs">
                    3
                  </span>
                  <div>
                    <strong className="text-white font-semibold">Faster-Whisper Neural Inference</strong>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Runs CTranslate2-accelerated speech-to-text inference on CPU/GPU, producing structured timestamped segments.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center space-x-2.5 text-xs text-emerald-300">
                <Lock className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                <span>100% Private: No audio data or transcripts leave your local machine.</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowInfoModal(false)}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
