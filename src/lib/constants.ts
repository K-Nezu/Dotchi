/** Duration of a post in milliseconds (5 minutes) */
export const POST_DURATION_MS = 5 * 60 * 1000;

/** Duration to keep expired posts on timeline in milliseconds (30 minutes) */
export const TIMELINE_RETENTION_MS = 30 * 60 * 1000;

/** Duration to keep posts in DB before deletion (24 hours) */
export const POST_TTL_MS = 24 * 60 * 60 * 1000;

/** Max question text length */
export const MAX_QUESTION_LENGTH = 60;

/** Max text length per option */
export const MAX_OPTION_TEXT_LENGTH = 50;

/** Max image file size in bytes (2MB) */
export const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

/** Accepted image MIME types */
export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];
