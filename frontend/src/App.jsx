import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import FileUpload from './components/FileUpload';
import UploadProgress from './components/UploadProgress';
import TranscriptViewer from './components/TranscriptViewer';
import { checkHealth, uploadMeeting } from './services/api';
import {
  AlertCircle,
  RotateCcw,
  ShieldAlert,
  CheckCircle2,
  Sparkles,
  Terminal,
} from 'lucide-react';

export default function App() {
  const [healthData, setHealthData] = useState(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [healthError, setHealthError] = useState('');

  // Flow states: 'idle' | 'uploading' | 'processing' | 'success' | 'error'
  const [status, setStatus] = useState('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStage, setProcessingStage] = useState('media'); // 'media' | 'transcribing' | 'done'
  const [uploadedFile, setUploadedFile] = useState(null);
  const [transcriptData, setTranscriptData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Toast Notification state
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Fetch backend health status
  const fetchHealth = useCallback(async () => {
    setIsCheckingHealth(true);
    setHealthError('');
    try {
      const data = await checkHealth();
      setHealthData(data);
    } catch (err) {
      setHealthError(err.message || 'Failed to connect to backend server');
      setHealthData(null);
    } finally {
      setIsCheckingHealth(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  // Handle meeting file upload
  const handleFileUpload = async (file) => {
    setStatus('uploading');
    setUploadProgress(0);
    setProcessingStage('media');
    setUploadedFile(file);
    setErrorMessage('');
    setTranscriptData(null);

    try {
      const progressCallback = (percent) => {
        setUploadProgress(percent);
        if (percent >= 100) {
          setStatus('processing');
          setTimeout(() => setProcessingStage('transcribing'), 1200);
        }
      };

      const result = await uploadMeeting(file, progressCallback);
      setProcessingStage('done');
      setTranscriptData(result);
      setStatus('success');
      showToast('Transcription completed successfully!');
    } catch (err) {
      console.error('Transcription error:', err);
      setErrorMessage(
        err.message ||
          'Failed to transcribe meeting. Please verify the backend is running and the media format is supported.'
      );
      setStatus('error');
    }
  };

  const handleReset = () => {
    setStatus('idle');
    setUploadProgress(0);
    setProcessingStage('media');
    setUploadedFile(null);
    setTranscriptData(null);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-mesh-dark bg-grid-pattern flex flex-col justify-between text-slate-100 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div className="glass-panel-glow px-4 py-3 rounded-2xl flex items-center space-x-2.5 text-xs font-semibold text-white border border-brand-500/40 shadow-2xl">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      <div>
        {/* Navigation Header */}
        <Navbar
          healthData={healthData}
          isCheckingHealth={isCheckingHealth}
          onRefreshHealth={fetchHealth}
          healthError={healthError}
        />

        {/* FFmpeg Missing Notice Banner */}
        {healthData && !healthData.ffmpeg_available && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-5 animate-fade-in">
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs sm:text-sm flex items-start space-x-3.5 shadow-xl backdrop-blur-xl">
              <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <strong className="font-bold text-amber-300">FFmpeg Not Detected on Server</strong>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                    Action Recommended
                  </span>
                </div>
                <p className="text-amber-200/90 leading-relaxed text-xs">
                  FFmpeg is required to extract audio from video recordings (.mp4, .mkv, .mov, .webm) and process non-WAV audio.
                  Install FFmpeg on your host machine:
                </p>
                <div className="pt-1.5 flex flex-wrap gap-2 text-xs font-mono">
                  <span className="px-2.5 py-1 rounded-lg bg-black/40 text-amber-300 border border-amber-500/30">
                    macOS: brew install ffmpeg
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-black/40 text-amber-300 border border-amber-500/30">
                    Linux: sudo apt install ffmpeg
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-black/40 text-amber-300 border border-amber-500/30">
                    Windows: winget install Gyan.FFmpeg
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content View */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Error Banner */}
          {status === 'error' && (
            <div className="w-full max-w-3xl mx-auto mb-8 p-6 rounded-3xl bg-rose-500/10 border border-rose-500/30 shadow-2xl backdrop-blur-xl animate-fade-in">
              <div className="flex items-start space-x-3.5">
                <AlertCircle className="w-6 h-6 text-rose-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <h4 className="text-base font-bold text-rose-300">Transcription Processing Failed</h4>
                  <p className="text-xs sm:text-sm text-rose-200/90 leading-relaxed">{errorMessage}</p>
                  <div className="pt-2">
                    <button
                      onClick={handleReset}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 flex items-center space-x-2 transition-all shadow-md active:scale-95"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Try Another File</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Idle / Upload View */}
          {status === 'idle' && (
            <FileUpload
              onFileSelect={handleFileUpload}
              maxUploadSizeMb={healthData?.max_upload_size_mb || 500}
              disabled={Boolean(healthError)}
            />
          )}

          {/* Uploading / Processing View */}
          {(status === 'uploading' || status === 'processing') && (
            <UploadProgress
              uploadProgress={uploadProgress}
              processingStage={processingStage}
              fileName={uploadedFile?.name}
            />
          )}

          {/* Success / Transcript View */}
          {status === 'success' && transcriptData && (
            <TranscriptViewer
              transcriptData={transcriptData}
              mediaFile={uploadedFile}
              onReset={handleReset}
              onShowToast={showToast}
            />
          )}
        </main>
      </div>

      {/* Modern Footer */}
      <footer className="border-t border-slate-900/80 bg-slate-950/80 backdrop-blur-md py-6 mt-12 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-300">Meeting Intelligence Platform</span>
            <span className="text-slate-600">·</span>
            <span>Phase 1 (Speech-to-Text)</span>
          </div>
          <div className="flex items-center space-x-3 text-slate-400 font-mono">
            <span>Faster-Whisper</span>
            <span>•</span>
            <span>FFmpeg</span>
            <span>•</span>
            <span>FastAPI</span>
            <span>•</span>
            <span>React</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
