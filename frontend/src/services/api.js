import axios from 'axios';

// Base API configuration: Uses VITE_API_URL (or VITE_API_BASE_URL) if defined; falls back to Vite proxy /api/v1 for local dev
const rawUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '/api/v1';
const baseURL = rawUrl.endsWith('/api/v1') 
  ? rawUrl 
  : rawUrl === '/api/v1' 
  ? '/api/v1' 
  : `${rawUrl.replace(/\/+$/, '')}/api/v1`;

const api = axios.create({
  baseURL: baseURL,
  timeout: 600000, // 10 minutes timeout for transcribing long recordings
});

/**
 * Check backend health status and Whisper configuration.
 */
export async function checkHealth() {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data?.detail || `Health check failed (${error.response.status})`);
    } else if (error.request) {
      throw new Error('Cannot connect to backend server. Please verify the backend is running and accessible.');
    } else {
      throw new Error(error.message || 'Unknown network error occurred');
    }
  }
}

/**
 * Upload an audio or video meeting file and receive the structured transcription.
 * 
 * @param {File} file - The audio or video file object
 * @param {Function} onProgress - Callback for upload percentage (0 - 100)
 */
export async function uploadMeeting(file, onProgress) {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await api.post('/meetings/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          if (onProgress) {
            onProgress(percentCompleted);
          }
        }
      },
    });

    return response.data;
  } catch (error) {
    if (error.response) {
      const detail = error.response.data?.detail;
      const message = typeof detail === 'string' ? detail : JSON.stringify(detail) || 'Upload processing failed.';
      const err = new Error(message);
      err.status = error.response.status;
      throw err;
    } else if (error.request) {
      const err = new Error('Network error: Unable to reach the backend server. Please verify the backend is running.');
      err.status = 0;
      throw err;
    } else {
      throw new Error(error.message || 'An unexpected error occurred during upload.');
    }
  }
}

export default api;
