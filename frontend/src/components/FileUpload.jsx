import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileAudio,
  FileVideo,
  X,
  Sparkles,
  AlertTriangle,
  Play,
  ShieldCheck,
  Zap,
  Lock,
  Music,
  Video,
  FileCheck,
} from 'lucide-react';

const SUPPORTED_AUDIO = ['.mp3', '.wav', '.m4a', '.flac', '.ogg'];
const SUPPORTED_VIDEO = ['.mp4', '.mkv', '.mov', '.webm'];
const ALL_SUPPORTED = [...SUPPORTED_AUDIO, ...SUPPORTED_VIDEO];

export default function FileUpload({
  onFileSelect,
  maxUploadSizeMb = 500,
  disabled = false,
  onDemoSelect,
}) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [validationError, setValidationError] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'audio' | 'video'
  const fileInputRef = useRef(null);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateAndSetFile = (file) => {
    setValidationError('');
    if (!file) return;

    const extension = '.' + file.name.split('.').pop().toLowerCase();
    if (!ALL_SUPPORTED.includes(extension)) {
      setValidationError(
        `Unsupported format (${extension}). Allowed formats: ${ALL_SUPPORTED.join(', ')}`
      );
      setSelectedFile(null);
      return;
    }

    const maxBytes = maxUploadSizeMb * 1024 * 1024;
    if (file.size > maxBytes) {
      setValidationError(
        `File is too large (${formatFileSize(file.size)}). Max allowed size is ${maxUploadSizeMb} MB.`
      );
      setSelectedFile(null);
      return;
    }

    if (file.size === 0) {
      setValidationError('The selected file is empty (0 bytes). Please choose a valid recording.');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleClear = (e) => {
    if (e) e.stopPropagation();
    setSelectedFile(null);
    setValidationError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadClick = () => {
    if (selectedFile && !disabled) {
      onFileSelect(selectedFile);
    }
  };

  // Generate a quick synthetic demo WAV audio so user can test in 1 click
  const handleGenerateSampleAudio = () => {
    // Generate a minimal valid 16kHz mono WAV beep/tone file
    const sampleRate = 16000;
    const durationSec = 3;
    const numSamples = sampleRate * durationSec;
    const headerByteLength = 44;
    const buffer = new ArrayBuffer(headerByteLength + numSamples * 2);
    const view = new DataView(buffer);

    // RIFF identifier
    view.setUint32(0, 0x52494646, false); // "RIFF"
    view.setUint32(4, 36 + numSamples * 2, true);
    view.setUint32(8, 0x57415645, false); // "WAVE"
    // "fmt " chunk
    view.setUint32(12, 0x666d7420, false);
    view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
    view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
    view.setUint16(22, 1, true); // NumChannels (1 = Mono)
    view.setUint32(24, sampleRate, true); // SampleRate
    view.setUint32(28, sampleRate * 2, true); // ByteRate
    view.setUint16(32, 2, true); // BlockAlign
    view.setUint16(34, 16, true); // BitsPerSample
    // "data" chunk
    view.setUint32(36, 0x64617461, false);
    view.setUint32(40, numSamples * 2, true);

    // Write sine wave samples
    const frequency = 440; // A4 tone
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const sample = Math.sin(2 * Math.PI * frequency * t) * 0.5;
      const int16Sample = Math.max(-32768, Math.min(32767, sample * 32767));
      view.setInt16(44 + i * 2, int16Sample, true);
    }

    const blob = new Blob([buffer], { type: 'audio/wav' });
    const demoFile = new File([blob], 'demo_team_meeting.wav', { type: 'audio/wav' });
    validateAndSetFile(demoFile);
  };

  const isVideo = selectedFile
    ? SUPPORTED_VIDEO.includes('.' + selectedFile.name.split('.').pop().toLowerCase())
    : false;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Hero Headline */}
      <div className="text-center space-y-3 pt-2 sm:pt-6">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold tracking-wide">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Next-Gen Audio Intelligence</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-display font-extrabold tracking-tight text-white max-w-2xl mx-auto leading-tight">
          Turn Meeting Recordings into{' '}
          <span className="text-gradient-vibrant">Timestamped Transcripts</span>
        </h1>

        <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
          Upload any audio or video meeting file. Powered by Faster-Whisper and FFmpeg, entirely on your machine.
        </p>

        {/* Feature badges */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2 text-xs text-slate-400">
          <div className="flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>100% Private & Local</span>
          </div>
          <span className="text-slate-700">•</span>
          <div className="flex items-center space-x-1.5">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>GPU/CPU Accelerated</span>
          </div>
          <span className="text-slate-700">•</span>
          <div className="flex items-center space-x-1.5">
            <Lock className="w-4 h-4 text-cyan-400" />
            <span>Zero Paid API Keys</span>
          </div>
        </div>
      </div>

      {/* Upload Box Card */}
      <div className="glass-panel-glow rounded-3xl p-6 sm:p-10 relative overflow-hidden">
        {/* Format category tab filter */}
        <div className="flex items-center justify-between flex-wrap gap-3 pb-6 mb-6 border-b border-slate-800/80">
          <div className="flex items-center space-x-1 p-1 bg-slate-900/80 rounded-xl border border-slate-800 text-xs font-medium">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'all'
                  ? 'bg-brand-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Formats
            </button>
            <button
              onClick={() => setActiveTab('audio')}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'audio'
                  ? 'bg-brand-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Music className="w-3.5 h-3.5" />
              <span>Audio</span>
            </button>
            <button
              onClick={() => setActiveTab('video')}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'video'
                  ? 'bg-brand-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>Video</span>
            </button>
          </div>

          {/* Quick Demo Sample Action */}
          <button
            onClick={handleGenerateSampleAudio}
            disabled={disabled}
            className="flex items-center space-x-1.5 text-xs text-brand-300 hover:text-brand-200 px-3 py-1.5 rounded-xl bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/20 transition-all font-medium"
          >
            <Play className="w-3 h-3 text-cyan-400 fill-cyan-400" />
            <span>Load Quick Demo Audio</span>
          </button>
        </div>

        {/* Drag & Drop Zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !selectedFile && !disabled && fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer ${
            dragActive
              ? 'border-brand-400 bg-brand-500/15 scale-[1.01]'
              : selectedFile
              ? 'border-emerald-500/50 bg-emerald-950/20'
              : 'border-slate-700/80 hover:border-brand-500/60 hover:bg-slate-900/50'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ALL_SUPPORTED.join(',')}
            onChange={handleChange}
            disabled={disabled}
            className="hidden"
          />

          {!selectedFile ? (
            <div className="flex flex-col items-center">
              {/* Floating icon with aura */}
              <div className="relative mb-5">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-brand-600/30 to-cyan-500/30 border border-brand-400/30 flex items-center justify-center shadow-2xl backdrop-blur-md">
                  <UploadCloud className="w-10 h-10 text-cyan-300 animate-bounce" />
                </div>
                <div className="absolute -inset-2 rounded-2xl bg-brand-500/20 blur-md -z-10" />
              </div>

              <h3 className="text-lg font-bold text-white tracking-tight">
                Drag and drop your meeting file
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                or <span className="text-brand-400 font-semibold underline underline-offset-4 hover:text-brand-300">browse from computer</span>
              </p>

              {/* Supported Extensions List */}
              <div className="mt-6 flex flex-wrap justify-center gap-1.5 max-w-md">
                {(activeTab === 'audio'
                  ? SUPPORTED_AUDIO
                  : activeTab === 'video'
                  ? SUPPORTED_VIDEO
                  : ALL_SUPPORTED
                ).map((ext) => (
                  <span
                    key={ext}
                    className="px-2 py-0.5 text-[11px] font-mono font-medium rounded-md bg-slate-800/80 text-slate-300 border border-slate-700/80"
                  >
                    {ext.toUpperCase().replace('.', '')}
                  </span>
                ))}
              </div>

              <span className="text-[11px] text-slate-400 mt-3">
                Max file size: {maxUploadSizeMb} MB
              </span>
            </div>
          ) : (
            /* Selected File Preview Card */
            <div className="flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
              <div className="relative mb-4">
                <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-emerald-600/20 to-cyan-600/20 border border-emerald-500/40 flex items-center justify-center shadow-lg">
                  {isVideo ? (
                    <FileVideo className="w-10 h-10 text-emerald-400" />
                  ) : (
                    <FileAudio className="w-10 h-10 text-emerald-400" />
                  )}
                </div>
              </div>

              <div className="text-center max-w-lg space-y-1">
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-base sm:text-lg font-bold text-white truncate max-w-xs sm:max-w-sm">
                    {selectedFile.name}
                  </span>
                  <button
                    onClick={handleClear}
                    disabled={disabled}
                    title="Remove file"
                    className="p-1 rounded-full text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-center space-x-3 text-xs text-slate-400">
                  <span className="font-mono">{formatFileSize(selectedFile.size)}</span>
                  <span>•</span>
                  <span className="uppercase font-mono text-emerald-400 font-semibold">
                    {selectedFile.name.split('.').pop()} ({isVideo ? 'Video Recording' : 'Audio Track'})
                  </span>
                </div>

                {/* Animated visualizer waveform mockup */}
                <div className="flex items-center justify-center space-x-1 py-3">
                  {[20, 45, 80, 60, 30, 90, 75, 40, 65, 85, 30, 50, 70, 95, 40, 20].map(
                    (height, i) => (
                      <span
                        key={i}
                        className="w-1 bg-gradient-to-t from-emerald-500 to-cyan-400 rounded-full"
                        style={{ height: `${height * 0.35}px` }}
                      />
                    )
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Validation Error Message */}
        {validationError && (
          <div className="mt-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2.5">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Transcribe Action Button */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleUploadClick}
            disabled={!selectedFile || disabled}
            className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center space-x-2.5 shadow-xl transition-all ${
              selectedFile && !disabled
                ? 'bg-gradient-to-r from-brand-600 via-indigo-600 to-cyan-500 hover:from-brand-500 hover:to-cyan-400 text-white shadow-brand-500/30 hover:shadow-cyan-500/40 active:scale-[0.98]'
                : 'bg-slate-800/80 text-slate-400 cursor-not-allowed border border-slate-700/50'
            }`}
          >
            <Sparkles className="w-4 h-4 text-cyan-200 animate-pulse" />
            <span>Start Fast Transcription</span>
          </button>
        </div>
      </div>
    </div>
  );
}
