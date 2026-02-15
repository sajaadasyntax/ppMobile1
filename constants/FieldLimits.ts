/**
 * Field Length Limits — MUST match ppBackend/src/constants/fieldLimits.ts
 *
 * Use these as `maxLength` props on TextInput / AppTextInput to prevent
 * the user from entering text that the backend will reject.
 */

// User / Profile
export const USER_NAME_MAX          = 100;
export const USER_EMAIL_MAX         = 255;
export const USER_MOBILE_MAX        = 15;
export const USER_PASSWORD_MIN      = 6;
export const USER_PASSWORD_MAX      = 128;
export const NATIONAL_ID_MAX        = 30;
export const PROFILE_FIRST_NAME_MAX = 50;
export const PROFILE_LAST_NAME_MAX  = 50;

// Content
export const BULLETIN_TITLE_MAX     = 200;
export const BULLETIN_CONTENT_MAX   = 5000;

export const REPORT_TITLE_MAX      = 200;
export const REPORT_DESC_MAX       = 2000;
export const REPORT_COMMENT_MAX    = 1000;

export const SURVEY_TITLE_MAX      = 200;
export const SURVEY_DESC_MAX       = 1000;

export const VOTING_TITLE_MAX      = 200;
export const VOTING_DESC_MAX       = 1000;

// Chat
export const CHAT_MESSAGE_MAX      = 1000;

// Subscriptions
export const SUBSCRIPTION_PLAN_TITLE_MAX = 100;
export const SUBSCRIPTION_PLAN_DESC_MAX  = 500;
