/**
 * Client-side validation rules — must mirror Backend constraints exactly.
 * If a rule changes in ppBackend, it MUST be updated here too.
 *
 * Source of truth: ppBackend/src/utils/mobileNormalization.ts,
 *                  ppBackend/src/controllers/userController.ts,
 *                  ppBackend/src/utils/fileValidation.ts
 */

// ─── Mobile number ──────────────────────────────────────────────────
// Backend: +249 followed by exactly 9 digits  (E.164)
const SUDAN_MOBILE_REGEX = /^[0-9]{9}$/;

export function validateMobileNumber(raw: string): { valid: boolean; error?: string } {
  const cleaned = raw.replace(/\s/g, '');
  if (!cleaned) {
    return { valid: false, error: 'الرجاء إدخال رقم الجوال' };
  }
  if (!SUDAN_MOBILE_REGEX.test(cleaned)) {
    return { valid: false, error: 'رقم الجوال يجب أن يكون 9 أرقام (مثال: 912345678)' };
  }
  return { valid: true };
}

export function formatMobileE164(raw: string): string {
  return `+249${raw.replace(/\s/g, '')}`;
}

// ─── Password ───────────────────────────────────────────────────────
// Backend: minimum 6 characters (userController.ts:687)
export const PASSWORD_MIN_LENGTH = 6;

export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password) {
    return { valid: false, error: 'الرجاء إدخال كلمة المرور' };
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return { valid: false, error: `كلمة المرور يجب أن تكون ${PASSWORD_MIN_LENGTH} أحرف على الأقل` };
  }
  return { valid: true };
}

// ─── Email ──────────────────────────────────────────────────────────
// Backend: required, basic format check
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): { valid: boolean; error?: string } {
  const trimmed = email.trim();
  if (!trimmed) {
    return { valid: false, error: 'الرجاء إدخال البريد الإلكتروني' };
  }
  if (!EMAIL_REGEX.test(trimmed)) {
    return { valid: false, error: 'صيغة البريد الإلكتروني غير صحيحة' };
  }
  return { valid: true };
}

// ─── National ID ────────────────────────────────────────────────────
// Backend: required, no specific format yet
export function validateNationalId(nationalId: string): { valid: boolean; error?: string } {
  const trimmed = nationalId.trim();
  if (!trimmed) {
    return { valid: false, error: 'الرجاء إدخال الرقم الوطني' };
  }
  return { valid: true };
}

// ─── Full name ──────────────────────────────────────────────────────
export function validateFullName(name: string): { valid: boolean; error?: string } {
  const trimmed = name.trim();
  if (!trimmed) {
    return { valid: false, error: 'الرجاء إدخال الاسم الكامل' };
  }
  if (trimmed.length < 3) {
    return { valid: false, error: 'الاسم يجب أن يكون 3 أحرف على الأقل' };
  }
  return { valid: true };
}

// ─── File upload pre-validation ─────────────────────────────────────
// Must match ppBackend/src/utils/fileValidation.ts UPLOAD_CATEGORIES
export const UPLOAD_LIMITS = {
  bulletin: {
    maxSizeBytes: 5 * 1024 * 1024, // 5 MB
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    label: 'صورة النشرة',
  },
  archive: {
    maxSizeBytes: 50 * 1024 * 1024, // 50 MB
    allowedExtensions: [], // any
    allowedMimeTypes: [],  // any
    label: 'ملف الأرشيف',
  },
  report: {
    maxSizeBytes: 10 * 1024 * 1024, // 10 MB
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx', '.xls', '.xlsx'],
    allowedMimeTypes: [
      'image/jpeg', 'image/png', 'image/gif',
      'application/pdf',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
    label: 'مرفق التقرير',
  },
  voice: {
    maxSizeBytes: 10 * 1024 * 1024, // 10 MB
    allowedExtensions: ['.mp3', '.m4a', '.wav', '.webm', '.ogg', '.aac'],
    allowedMimeTypes: [
      'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/webm', 'audio/ogg', 'audio/aac',
    ],
    label: 'رسالة صوتية',
  },
  receipt: {
    maxSizeBytes: 5 * 1024 * 1024, // 5 MB
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    label: 'إيصال الدفع',
  },
} as const;

export type UploadCategory = keyof typeof UPLOAD_LIMITS;

/**
 * Validate a file before uploading — prevents "silent failures"
 * where the backend rejects a file the mobile should have caught earlier.
 */
export function validateFileBeforeUpload(
  category: UploadCategory,
  file: { size: number; mimeType?: string; name?: string },
): { valid: boolean; error?: string } {
  const rules = UPLOAD_LIMITS[category];

  // Empty file check
  if (!file.size || file.size <= 0) {
    return {
      valid: false,
      error: 'الملف فارغ (0 بايت). يرجى اختيار ملف صالح.',
    };
  }

  // Size check
  if (file.size > rules.maxSizeBytes) {
    const maxMB = (rules.maxSizeBytes / (1024 * 1024)).toFixed(0);
    const actualMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `حجم الملف (${actualMB} ميجا) يتجاوز الحد المسموح (${maxMB} ميجا) لـ${rules.label}`,
    };
  }

  // MIME type check (skip if category allows any type)
  if (rules.allowedMimeTypes.length > 0 && file.mimeType) {
    if (!rules.allowedMimeTypes.includes(file.mimeType)) {
      return {
        valid: false,
        error: `نوع الملف "${file.mimeType}" غير مسموح لـ${rules.label}`,
      };
    }
  }

  // Extension check (skip if category allows any extension)
  if (rules.allowedExtensions.length > 0 && file.name) {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!rules.allowedExtensions.includes(ext)) {
      return {
        valid: false,
        error: `صيغة الملف "${ext}" غير مسموحة لـ${rules.label}. الصيغ المسموحة: ${rules.allowedExtensions.join(', ')}`,
      };
    }
  }

  return { valid: true };
}
