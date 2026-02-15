/**
 * Upload Manager — progress tracking, cancellation, and background uploads
 *
 * Uses XMLHttpRequest for real progress events (Axios does not support
 * upload progress in React Native), and expo-file-system for background
 * uploads that survive app-backgrounding.
 *
 * Flow:
 *  1. requestPresignedUrl()  → server validates type+size, returns token
 *  2. uploadWithProgress()   → sends file with real-time progress callback
 *  3. or backgroundUpload()  → queues the upload via expo-file-system
 */

import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system';
import { SERVER_BASE_URL } from './api';

// ── Shared error messages (must match backend constants/uploadErrors.ts) ──
export const UPLOAD_ERRORS = {
  FILE_TOO_LARGE: { code: 'FILE_TOO_LARGE', message: 'حجم الملف يتجاوز الحد المسموح' },
  INVALID_FILE_TYPE: { code: 'INVALID_FILE_TYPE', message: 'نوع الملف غير مدعوم' },
  NO_FILE_PROVIDED: { code: 'NO_FILE_PROVIDED', message: 'لم يتم تحديد ملف للرفع' },
  UPLOAD_TOKEN_EXPIRED: { code: 'UPLOAD_TOKEN_EXPIRED', message: 'انتهت صلاحية رابط الرفع. يرجى طلب رابط جديد' },
  UPLOAD_TOKEN_INVALID: { code: 'UPLOAD_TOKEN_INVALID', message: 'رابط الرفع غير صالح' },
  FILE_MISMATCH: { code: 'FILE_MISMATCH', message: 'الملف لا يطابق المواصفات المطلوبة' },
  NETWORK_TIMEOUT: { code: 'NETWORK_TIMEOUT', message: 'انتهت مهلة الاتصال. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى' },
  UPLOAD_FAILED: { code: 'UPLOAD_FAILED', message: 'فشل رفع الملف. يرجى المحاولة مرة أخرى' },
  UPLOAD_CANCELLED: { code: 'UPLOAD_CANCELLED', message: 'تم إلغاء الرفع' },
  SERVER_ERROR: { code: 'SERVER_ERROR', message: 'حدث خطأ في الخادم. يرجى المحاولة لاحقاً' },
} as const;

export type UploadErrorCode = keyof typeof UPLOAD_ERRORS;

// ── Types ───────────────────────────────────────────────────────────
export interface UploadProgress {
  loaded: number;
  total: number;
  percent: number; // 0-100
}

export interface PresignedResponse {
  uploadToken: string;
  uploadUrl: string;
  expiresIn: string;
  maxSize: number;
  allowedTypes: string[];
}

export interface UploadResult {
  file: {
    id: string;
    url: string;
    path: string;
  };
  message: string;
}

export interface UploadOptions {
  /** Called with progress updates */
  onProgress?: (progress: UploadProgress) => void;
  /** Timeout in milliseconds (default 120000 = 2 min) */
  timeout?: number;
}

// ── Helpers ─────────────────────────────────────────────────────────
async function getAuthToken(): Promise<string | null> {
  return SecureStore.getItemAsync('token');
}

function getApiUrl(path: string): string {
  return `${SERVER_BASE_URL}/api${path}`;
}

/**
 * Translate a server error response into a user-friendly Arabic string.
 * Falls back to a generic message if the code is unknown.
 */
function translateError(serverCode?: string, fallback?: string): string {
  if (serverCode && serverCode in UPLOAD_ERRORS) {
    return UPLOAD_ERRORS[serverCode as UploadErrorCode].message;
  }
  return fallback || UPLOAD_ERRORS.UPLOAD_FAILED.message;
}

// ── 1) Request presigned URL ────────────────────────────────────────
export async function requestPresignedUrl(
  category: string,
  fileName: string,
  fileSize: number,
  mimeType: string,
): Promise<PresignedResponse> {
  const token = await getAuthToken();
  if (!token) throw new Error('Unauthorized');

  const res = await fetch(getApiUrl('/uploads/presign'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ category, fileName, fileSize, mimeType }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(translateError(data.code, data.error));
  }
  return data as PresignedResponse;
}

// ── 2) Upload with real-time progress ───────────────────────────────
/**
 * Uploads a file using XMLHttpRequest for upload progress tracking.
 * Returns a cancel function and a promise for the result.
 */
export function uploadWithProgress(
  fileUri: string,
  fileName: string,
  mimeType: string,
  uploadToken: string,
  options: UploadOptions = {},
): { promise: Promise<UploadResult>; cancel: () => void } {
  const { onProgress, timeout = 120000 } = options;
  let cancelled = false;

  const xhr = new XMLHttpRequest();

  const cancel = () => {
    cancelled = true;
    xhr.abort();
  };

  const promise = new Promise<UploadResult>(async (resolve, reject) => {
    try {
      const authToken = await getAuthToken();
      if (!authToken) {
        reject(new Error('Unauthorized'));
        return;
      }

      if (cancelled) {
        reject(new Error(UPLOAD_ERRORS.UPLOAD_CANCELLED.message));
        return;
      }

      // Build form data
      const formData = new FormData();
      formData.append('uploadToken', uploadToken);
      formData.append('file', {
        uri: fileUri,
        type: mimeType,
        name: fileName,
      } as any);

      // Progress handler
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          onProgress({
            loaded: event.loaded,
            total: event.total,
            percent: Math.round((event.loaded / event.total) * 100),
          });
        }
      };

      // Completion handler
      xhr.onload = () => {
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(data as UploadResult);
          } else {
            reject(new Error(translateError(data.code, data.error)));
          }
        } catch {
          reject(new Error(UPLOAD_ERRORS.UPLOAD_FAILED.message));
        }
      };

      // Error handlers
      xhr.onerror = () => {
        reject(new Error(UPLOAD_ERRORS.NETWORK_TIMEOUT.message));
      };

      xhr.ontimeout = () => {
        reject(new Error(UPLOAD_ERRORS.NETWORK_TIMEOUT.message));
      };

      xhr.onabort = () => {
        reject(new Error(UPLOAD_ERRORS.UPLOAD_CANCELLED.message));
      };

      xhr.timeout = timeout;
      xhr.open('POST', getApiUrl('/uploads/complete'));
      xhr.setRequestHeader('Authorization', `Bearer ${authToken}`);
      xhr.send(formData);
    } catch (err: any) {
      reject(new Error(err.message || UPLOAD_ERRORS.UPLOAD_FAILED.message));
    }
  });

  return { promise, cancel };
}

// ── 3) Full flow: presign → upload (convenience wrapper) ────────────
/**
 * One-call convenience that requests the presigned token and then
 * uploads the file with progress tracking.
 */
export function uploadFile(
  fileUri: string,
  fileName: string,
  fileSize: number,
  mimeType: string,
  category: string,
  options: UploadOptions = {},
): { promise: Promise<UploadResult>; cancel: () => void } {
  let innerCancel: (() => void) | null = null;
  let outerCancelled = false;

  const cancel = () => {
    outerCancelled = true;
    innerCancel?.();
  };

  const promise = (async () => {
    // Step 1: Get presigned token (validates before upload begins)
    const presigned = await requestPresignedUrl(category, fileName, fileSize, mimeType);

    if (outerCancelled) {
      throw new Error(UPLOAD_ERRORS.UPLOAD_CANCELLED.message);
    }

    // Step 2: Upload with progress
    const upload = uploadWithProgress(fileUri, fileName, mimeType, presigned.uploadToken, options);
    innerCancel = upload.cancel;

    return upload.promise;
  })();

  return { promise, cancel };
}

// ── 4) Background upload (survives app being backgrounded) ──────────
/**
 * Uses expo-file-system's uploadAsync for true background uploads
 * (e.g. large archive documents). Does NOT provide real-time progress
 * but will complete even if the user switches apps.
 */
export async function backgroundUpload(
  fileUri: string,
  fileName: string,
  mimeType: string,
  category: string,
): Promise<UploadResult> {
  const token = await getAuthToken();
  if (!token) throw new Error('Unauthorized');

  // First get presigned token
  const presigned = await requestPresignedUrl(category, fileName, 0, mimeType);

  const result = await FileSystem.uploadAsync(getApiUrl('/uploads/complete'), fileUri, {
    httpMethod: 'POST',
    uploadType: FileSystem.FileSystemUploadType.MULTIPART,
    fieldName: 'file',
    parameters: { uploadToken: presigned.uploadToken },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (result.status >= 200 && result.status < 300) {
    return JSON.parse(result.body) as UploadResult;
  }

  try {
    const errorData = JSON.parse(result.body);
    throw new Error(translateError(errorData.code, errorData.error));
  } catch (e: any) {
    if (e.message && !e.message.startsWith('{')) throw e;
    throw new Error(UPLOAD_ERRORS.UPLOAD_FAILED.message);
  }
}

// ── 5) Direct upload (backward-compatible, no presigned step) ───────
export function directUpload(
  fileUri: string,
  fileName: string,
  mimeType: string,
  category: string,
  options: UploadOptions = {},
): { promise: Promise<UploadResult>; cancel: () => void } {
  const { onProgress, timeout = 120000 } = options;
  let cancelled = false;

  const xhr = new XMLHttpRequest();

  const cancel = () => {
    cancelled = true;
    xhr.abort();
  };

  const promise = new Promise<UploadResult>(async (resolve, reject) => {
    try {
      const authToken = await getAuthToken();
      if (!authToken) {
        reject(new Error('Unauthorized'));
        return;
      }

      if (cancelled) {
        reject(new Error(UPLOAD_ERRORS.UPLOAD_CANCELLED.message));
        return;
      }

      const formData = new FormData();
      formData.append('category', category);
      formData.append('file', {
        uri: fileUri,
        type: mimeType,
        name: fileName,
      } as any);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          onProgress({
            loaded: event.loaded,
            total: event.total,
            percent: Math.round((event.loaded / event.total) * 100),
          });
        }
      };

      xhr.onload = () => {
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(data as UploadResult);
          } else {
            reject(new Error(translateError(data.code, data.error)));
          }
        } catch {
          reject(new Error(UPLOAD_ERRORS.UPLOAD_FAILED.message));
        }
      };

      xhr.onerror = () => reject(new Error(UPLOAD_ERRORS.NETWORK_TIMEOUT.message));
      xhr.ontimeout = () => reject(new Error(UPLOAD_ERRORS.NETWORK_TIMEOUT.message));
      xhr.onabort = () => reject(new Error(UPLOAD_ERRORS.UPLOAD_CANCELLED.message));

      xhr.timeout = timeout;
      xhr.open('POST', getApiUrl('/uploads/direct'));
      xhr.setRequestHeader('Authorization', `Bearer ${authToken}`);
      xhr.send(formData);
    } catch (err: any) {
      reject(new Error(err.message || UPLOAD_ERRORS.UPLOAD_FAILED.message));
    }
  });

  return { promise, cancel };
}
