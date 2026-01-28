/**
 * Session type extensions for Express
 */

declare module 'express-session' {
  interface SessionData {
    upvotedComplaints?: string[];
  }
}

export {};