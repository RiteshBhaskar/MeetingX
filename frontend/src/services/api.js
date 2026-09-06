import axios from 'axios';

// Base API configuration (Vite proxy forwards /api to backend)
const api = axios.create({
  baseURL: '/api/v1',
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
      throw new Error('Cannot connect to backend server. Make sure FastAPI is running on http://127.0.0.1:8000');
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
