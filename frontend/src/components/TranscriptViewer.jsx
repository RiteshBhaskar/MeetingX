import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  FileText,
  Clock,
  Globe,
  Layers,
  Search,
  Copy,
  Check,
  Download,
  RotateCcw,
  Sparkles,
  FileCode,
  FileDown,
  Play,
  Pause,
  RotateCcw as SeekBack,
  RotateCw as SeekForward,
  Volume2,
  VolumeX,
  AlignLeft,
  List,
  Code,
  Filter,
  BarChart2,
  BookOpen,
  ArrowUpRight,
  ChevronDown,
} from 'lucide-react';

export default function TranscriptViewer({ transcriptData, mediaFile, onReset, onShowToast }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [confidenceFilter, setConfidenceFilter] = useState('all'); // 'all' | 'high' | 'low'
  const [viewMode, setViewMode] = useState('timeline'); // 'timeline' | 'reader' | 'json'
  const [copiedId, setCopiedId] = useState(null);
  const [fullCopied, setFullCopied] = useState(false);

  // Audio Playback State
  const audioRef = useRef(null);
  const [mediaUrl, setMediaUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [audioDuration, setAudioDuration] = useState(transcriptData?.duration || 0);

  // Generate local audio URL from File object if provided
  useEffect(() => {
    if (mediaFile && mediaFile instanceof File) {
      const url = URL.createObjectURL(mediaFile);
      setMediaUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [mediaFile]);

  // Audio player listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);
    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setAudioDuration(audio.duration);
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [mediaUrl]);

  // Seek audio to specific second
  const handleSeek = (seconds) => {
    if (audioRef.current) {
      audioRef.current.currentTime = seconds;
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
  };

  const seekRelative = (delta) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, Math.min(audioDuration, audioRef.current.currentTime + delta));
  };

  const handleSpeedChange = () => {
    const speeds = [1, 1.25, 1.5, 2];
    const nextSpeed = speeds[(speeds.indexOf(playbackRate) + 1) % speeds.length];
    setPlaybackRate(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  // Compute text statistics
  const stats = useMemo(() => {
    const text = transcriptData?.full_text || '';
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const durationMin = (transcriptData?.duration || 1) / 60;
    const wpm = Math.round(words / durationMin);
    const readTimeMin = Math.max(1, Math.ceil(words / 200)); // Average reading speed ~200 WPM

    return { words, wpm, readTimeMin };
  }, [transcriptData]);

  // Filter segments based on search & confidence
  const filteredSegments = useMemo(() => {
    if (!transcriptData?.segments) return [];

    return transcriptData.segments.filter((seg) => {
      // Search filter
      const matchesSearch =
        !searchQuery.trim() || seg.text.toLowerCase().includes(searchQuery.toLowerCase());

      // Confidence filter
      let matchesConfidence = true;
      if (confidenceFilter === 'high') {
        matchesConfidence = seg.confidence === null || seg.confidence >= 0.85;
      } else if (confidenceFilter === 'low') {
        matchesConfidence = seg.confidence !== null && seg.confidence < 0.85;
      }

      return matchesSearch && matchesConfidence;
    });
  }, [transcriptData, searchQuery, confidenceFilter]);

  // Copy helper
  const handleCopy = (text, id, message = 'Copied to clipboard!') => {
    navigator.clipboard.writeText(text);
    if (onShowToast) onShowToast(message);

    if (id === 'full') {
      setFullCopied(true);
      setTimeout(() => setFullCopied(false), 2000);
    } else {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    }
  };

  // Download export helpers
  const downloadFile = (content, filename, type) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    if (onShowToast) onShowToast(`Downloaded ${filename}`);
  };

  const handleExportTxt = () => {
    const baseName = transcriptData.filename.replace(/\.[^/.]+$/, '');
    const header = `Meeting Transcript: ${transcriptData.filename}\nDuration: ${transcriptData.duration_formatted}\nLanguage: ${transcriptData.language}\nTotal Words: ${stats.words}\n\n=========================================\n\n`;
    const body = transcriptData.segments
      .map((s) => `[${s.start_formatted}] ${s.text}`)
      .join('\n\n');
    downloadFile(header + body, `${baseName}_transcript.txt`, 'text/plain;charset=utf-8');
  };

  const handleExportJson = () => {
    const baseName = transcriptData.filename.replace(/\.[^/.]+$/, '');
    const content = JSON.stringify(transcriptData, null, 2);
    downloadFile(content, `${baseName}_transcript.json`, 'application/json');
  };

  const handleExportSrt = () => {
    const baseName = transcriptData.filename.replace(/\.[^/.]+$/, '');
    const formatSrtTime = (seconds) => {
      const totalMs = Math.round(seconds * 1000);
      const hrs = Math.floor(totalMs / 3600000);
      const mins = Math.floor((totalMs % 3600000) / 60000);
      const secs = Math.floor((totalMs % 60000) / 1000);
      const ms = totalMs % 1000;
      return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
    };

    const srtContent = transcriptData.segments
      .map((s, idx) => `${idx + 1}\n${formatSrtTime(s.start)} --> ${formatSrtTime(s.end)}\n${s.text}\n`)
      .join('\n');

    downloadFile(srtContent, `${baseName}_subtitles.srt`, 'text/plain;charset=utf-8');
  };

  const handleExportCsv = () => {
    const baseName = transcriptData.filename.replace(/\.[^/.]+$/, '');
    const rows = [
      ['ID', 'Start Seconds', 'End Seconds', 'Start Time', 'End Time', 'Text', 'Confidence'],
      ...transcriptData.segments.map((s) => [
        s.id,
        s.start,
        s.end,
        `"${s.start_formatted}"`,
        `"${s.end_formatted}"`,
        `"${s.text.replace(/"/g, '""')}"`,
        s.confidence !== null ? s.confidence : '',
      ]),
    ];
    const csvContent = rows.map((r) => r.join(',')).join('\n');
    downloadFile(csvContent, `${baseName}_transcript.csv`, 'text/csv;charset=utf-8');
  };

  // Highlight search matches
  const highlightText = (text, query) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-brand-500/35 text-cyan-200 px-1 py-0.5 rounded font-medium border border-brand-400/40">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Hidden audio tag if media is available */}
      {mediaUrl && <audio ref={audioRef} src={mediaUrl} preload="metadata" />}

      {/* Top Meeting Metadata Card */}
      <div className="glass-panel-glow rounded-3xl p-6 sm:p-8 relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6 mb-6">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Meeting Transcribed Successfully</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-display font-extrabold text-white tracking-tight break-all">
              {transcriptData.filename}
            </h2>
          </div>

          <button
            onClick={onReset}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 hover:border-slate-600 transition-all self-start sm:self-auto shadow-lg"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Transcribe Another</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
            <div className="flex items-center space-x-1.5 text-xs text-slate-400 mb-1">
              <Clock className="w-3.5 h-3.5 text-brand-400" />
              <span>Duration</span>
            </div>
            <span className="text-base sm:text-lg font-bold font-mono text-white">
              {transcriptData.duration_formatted}
            </span>
          </div>

          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
            <div className="flex items-center space-x-1.5 text-xs text-slate-400 mb-1">
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              <span>Language</span>
            </div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-base sm:text-lg font-bold uppercase font-mono text-white">
                {transcriptData.language}
              </span>
              {transcriptData.language_probability && (
                <span className="text-[11px] text-slate-400">
                  ({Math.round(transcriptData.language_probability * 100)}%)
                </span>
              )}
            </div>
          </div>

          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
            <div className="flex items-center space-x-1.5 text-xs text-slate-400 mb-1">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Segments</span>
            </div>
            <span className="text-base sm:text-lg font-bold font-mono text-white">
              {transcriptData.segment_count}
            </span>
          </div>

          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
            <div className="flex items-center space-x-1.5 text-xs text-slate-400 mb-1">
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>Words</span>
            </div>
            <span className="text-base sm:text-lg font-bold font-mono text-white">
              {stats.words.toLocaleString()}
            </span>
          </div>

          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
            <div className="flex items-center space-x-1.5 text-xs text-slate-400 mb-1">
              <BarChart2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Speed</span>
            </div>
            <span className="text-base sm:text-lg font-bold font-mono text-white">
              {stats.wpm} <span className="text-[10px] font-normal text-slate-400">WPM</span>
            </span>
          </div>

          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
            <div className="flex items-center space-x-1.5 text-xs text-slate-400 mb-1">
              <BookOpen className="w-3.5 h-3.5 text-purple-400" />
              <span>Read Time</span>
            </div>
            <span className="text-base sm:text-lg font-bold font-mono text-white">
              ~{stats.readTimeMin} min
            </span>
          </div>
        </div>

        {/* Synced Audio Player Bar (when media file is available) */}
        {mediaUrl && (
          <div className="mt-6 pt-6 border-t border-slate-800/80">
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-brand-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-3 w-full sm:w-auto">
                <button
                  onClick={togglePlay}
                  className="w-10 h-10 rounded-xl bg-gradient-to-r from-brand-600 to-cyan-500 hover:from-brand-500 hover:to-cyan-400 flex items-center justify-center text-white shadow-md shadow-brand-500/20 transition-transform active:scale-95"
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
                </button>

                <button
                  onClick={() => seekRelative(-5)}
                  title="Seek back 5 seconds"
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <SeekBack className="w-4 h-4" />
                </button>

                <button
                  onClick={() => seekRelative(5)}
                  title="Seek forward 5 seconds"
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <SeekForward className="w-4 h-4" />
                </button>

                <div className="text-xs font-mono text-slate-300">
                  <span className="text-cyan-400 font-bold">{Math.floor(currentTime / 60)}:{String(Math.floor(currentTime % 60)).padStart(2, '0')}</span>
                  <span className="text-slate-500"> / </span>
                  <span>{transcriptData.duration_formatted}</span>
                </div>
              </div>

              {/* Progress seeker */}
              <div className="w-full sm:flex-1 mx-0 sm:mx-4">
                <input
                  type="range"
                  min="0"
                  max={transcriptData.duration || 100}
                  step="0.1"
                  value={currentTime}
                  onChange={(e) => handleSeek(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              {/* Playback speed toggle */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSpeedChange}
                  className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                >
                  {playbackRate}x
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toolbar: Search, View Mode Tabs, Filter, and Export */}
      <div className="glass-panel rounded-3xl p-4 sm:p-6 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search transcript keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-24 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all"
            />
            {searchQuery && (
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-cyan-400 font-mono">
                {filteredSegments.length} match{filteredSegments.length === 1 ? '' : 'es'}
              </span>
            )}
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center space-x-1 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs font-medium self-start lg:self-auto">
            <button
              onClick={() => setViewMode('timeline')}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'timeline'
                  ? 'bg-brand-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Timeline</span>
            </button>

            <button
              onClick={() => setViewMode('reader')}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'reader'
                  ? 'bg-brand-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <AlignLeft className="w-3.5 h-3.5" />
              <span>Reader</span>
            </button>

            <button
              onClick={() => setViewMode('json')}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'json'
                  ? 'bg-brand-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>JSON</span>
            </button>
          </div>

          {/* Export & Copy Menu */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleCopy(transcriptData.full_text, 'full', 'Full transcript copied!')}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white flex items-center space-x-1.5 shadow-md shadow-brand-500/25 transition-all active:scale-95"
            >
              {fullCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{fullCopied ? 'Copied!' : 'Copy Transcript'}</span>
            </button>

            <div className="flex items-center space-x-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
              <button
                onClick={handleExportTxt}
                title="Download formatted text file"
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                TXT
              </button>
              <button
                onClick={handleExportJson}
                title="Download JSON structured segments"
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                JSON
              </button>
              <button
                onClick={handleExportSrt}
                title="Download SRT subtitle format"
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                SRT
              </button>
              <button
                onClick={handleExportCsv}
                title="Download CSV table"
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area based on View Mode */}
      <div className="glass-panel-glow rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl">
        {/* Header line */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
          <h3 className="text-base font-bold text-white tracking-tight flex items-center space-x-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            <span>
              {viewMode === 'timeline'
                ? 'Timestamped Speech Segments'
                : viewMode === 'reader'
                ? 'Continuous Reading View'
                : 'Raw Structured JSON Tree'}
            </span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {filteredSegments.length} of {transcriptData.segments.length} segments
          </span>
        </div>

        {/* View 1: Timeline Mode */}
        {viewMode === 'timeline' && (
          <div className="space-y-3 max-h-[650px] overflow-y-auto pr-2">
            {filteredSegments.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Search className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                <p className="text-sm">No segments match your search criteria.</p>
              </div>
            ) : (
              filteredSegments.map((segment) => {
                const isItemCopied = copiedId === segment.id;
                const isSegmentActive =
                  currentTime >= segment.start && currentTime <= segment.end;

                return (
                  <div
                    key={segment.id}
                    className={`group relative p-4.5 rounded-2xl border transition-all ${
                      isSegmentActive
                        ? 'bg-gradient-to-r from-brand-500/15 via-indigo-500/10 to-slate-900/80 border-brand-500/50 shadow-lg shadow-brand-500/10'
                        : 'bg-slate-900/50 hover:bg-slate-850 border-slate-800/80 hover:border-brand-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center space-x-2">
                        {/* Interactive Click-to-Seek Timestamp */}
                        <button
                          onClick={() => handleSeek(segment.start)}
                          title="Click to jump playback to this timestamp"
                          className="px-2.5 py-1 rounded-lg font-mono text-xs font-bold bg-brand-500/15 hover:bg-brand-500/30 text-cyan-300 border border-brand-500/30 hover:border-brand-400 flex items-center space-x-1.5 transition-all cursor-pointer"
                        >
                          <Play className="w-2.5 h-2.5 fill-cyan-300" />
                          <span>[{segment.start_formatted}]</span>
                        </button>
                        <span className="text-xs text-slate-400 font-mono">
                          → [{segment.end_formatted}]
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        {segment.confidence !== null && (
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                              segment.confidence >= 0.9
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : segment.confidence >= 0.7
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            }`}
                          >
                            {Math.round(segment.confidence * 100)}% conf
                          </span>
                        )}

                        <button
                          onClick={() =>
                            handleCopy(`[${segment.start_formatted}] ${segment.text}`, segment.id)
                          }
                          title="Copy segment with timestamp"
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                        >
                          {isItemCopied ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <p className="text-sm text-slate-200 leading-relaxed pl-1 font-normal">
                      {highlightText(segment.text, searchQuery)}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* View 2: Reader Mode */}
        {viewMode === 'reader' && (
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 max-h-[650px] overflow-y-auto leading-loose text-base text-slate-200 space-y-4 font-normal">
            <p>
              {filteredSegments.map((segment) => (
                <span key={segment.id} className="inline mr-2 group">
                  <button
                    onClick={() => handleSeek(segment.start)}
                    className="inline-flex items-center space-x-0.5 px-1.5 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-800 text-cyan-300 hover:bg-brand-600 hover:text-white mr-1.5 align-middle border border-slate-700"
                    title={`Jump to ${segment.start_formatted}`}
                  >
                    <span>{segment.start_formatted}</span>
                  </button>
                  <span className="hover:text-white transition-colors">
                    {highlightText(segment.text, searchQuery)}{' '}
                  </span>
                </span>
              ))}
            </p>
          </div>
        )}

        {/* View 3: JSON Mode */}
        {viewMode === 'json' && (
          <div className="relative">
            <pre className="p-5 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs text-cyan-300 overflow-x-auto max-h-[600px] leading-relaxed">
              {JSON.stringify(transcriptData, null, 2)}
            </pre>
            <button
              onClick={() => handleCopy(JSON.stringify(transcriptData, null, 2), 'json')}
              className="absolute top-3 right-3 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 flex items-center space-x-1.5 shadow"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy JSON</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
