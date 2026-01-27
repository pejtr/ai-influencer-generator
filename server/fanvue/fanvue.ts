/**
 * Fanvue API Integration
 * OAuth 2.0 with PKCE + Auto-publish functionality
 * 
 * PREMIUM/VIP feature only
 */

import { randomBytes, createHash } from 'crypto';

// Fanvue API Configuration
const FANVUE_AUTH_URL = 'https://auth.fanvue.com/oauth2/auth';
const FANVUE_TOKEN_URL = 'https://auth.fanvue.com/oauth2/token';
const FANVUE_API_URL = 'https://api.fanvue.com';
const FANVUE_API_VERSION = '2025-06-26';

// Environment variables (to be set by user)
const FANVUE_CLIENT_ID = process.env.FANVUE_CLIENT_ID || '';
const FANVUE_CLIENT_SECRET = process.env.FANVUE_CLIENT_SECRET || '';

// Required scopes for our integration
const FANVUE_SCOPES = [
  'openid',
  'offline_access',
  'offline',
  'read:self',
  'write:post',
  'write:media'
].join(' ');

/**
 * Generate PKCE code verifier and challenge
 */
export function generatePKCE(): { codeVerifier: string; codeChallenge: string } {
  const codeVerifier = randomBytes(32).toString('base64url');
  const codeChallenge = createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');
  
  return { codeVerifier, codeChallenge };
}

/**
 * Generate state parameter for CSRF protection
 */
export function generateState(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Build Fanvue OAuth authorization URL
 */
export function buildAuthorizationUrl(
  redirectUri: string,
  state: string,
  codeChallenge: string
): string {
  const url = new URL(FANVUE_AUTH_URL);
  url.searchParams.set('client_id', FANVUE_CLIENT_ID);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', FANVUE_SCOPES);
  url.searchParams.set('state', state);
  url.searchParams.set('code_challenge', codeChallenge);
  url.searchParams.set('code_challenge_method', 'S256');
  
  return url.toString();
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string,
  codeVerifier: string
): Promise<FanvueTokens> {
  const response = await fetch(FANVUE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: FANVUE_CLIENT_ID,
      client_secret: FANVUE_CLIENT_SECRET,
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  const tokens = await response.json();
  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresIn: tokens.expires_in,
    tokenType: tokens.token_type,
  };
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<FanvueTokens> {
  const response = await fetch(FANVUE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: FANVUE_CLIENT_ID,
      client_secret: FANVUE_CLIENT_SECRET,
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token refresh failed: ${error}`);
  }

  const tokens = await response.json();
  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token || refreshToken,
    expiresIn: tokens.expires_in,
    tokenType: tokens.token_type,
  };
}

/**
 * Make authenticated API request to Fanvue
 */
async function fanvueApiRequest<T>(
  accessToken: string,
  method: string,
  endpoint: string,
  body?: object
): Promise<T> {
  const response = await fetch(`${FANVUE_API_URL}${endpoint}`, {
    method,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'X-Fanvue-API-Version': FANVUE_API_VERSION,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Fanvue API error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Get current Fanvue user profile
 */
export async function getFanvueUser(accessToken: string): Promise<FanvueUser> {
  return fanvueApiRequest<FanvueUser>(accessToken, 'GET', '/users/me');
}

/**
 * Create multipart upload session for media
 */
export async function createUploadSession(
  accessToken: string,
  filename: string,
  contentType: string,
  fileSize: number
): Promise<FanvueUploadSession> {
  return fanvueApiRequest<FanvueUploadSession>(
    accessToken,
    'POST',
    '/media/upload-session',
    {
      filename,
      contentType,
      fileSize,
    }
  );
}

/**
 * Get signed URL for uploading a part
 */
export async function getUploadPartUrl(
  accessToken: string,
  sessionId: string,
  partNumber: number
): Promise<{ signedUrl: string }> {
  return fanvueApiRequest<{ signedUrl: string }>(
    accessToken,
    'GET',
    `/media/upload-session/${sessionId}/part?partNumber=${partNumber}`
  );
}

/**
 * Complete upload session
 */
export async function completeUploadSession(
  accessToken: string,
  sessionId: string,
  parts: { partNumber: number; etag: string }[]
): Promise<FanvueMedia> {
  return fanvueApiRequest<FanvueMedia>(
    accessToken,
    'PATCH',
    `/media/upload-session/${sessionId}`,
    { parts }
  );
}

/**
 * Upload image to Fanvue and return media UUID
 * Handles the full multipart upload flow
 */
export async function uploadImageToFanvue(
  accessToken: string,
  imageUrl: string,
  filename: string
): Promise<string> {
  // Fetch the image
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error('Failed to fetch image for upload');
  }
  
  const imageBuffer = await imageResponse.arrayBuffer();
  const contentType = imageResponse.headers.get('content-type') || 'image/png';
  const fileSize = imageBuffer.byteLength;

  // Create upload session
  const session = await createUploadSession(
    accessToken,
    filename,
    contentType,
    fileSize
  );

  // For small files, upload in single part
  const { signedUrl } = await getUploadPartUrl(accessToken, session.id, 1);
  
  const uploadResponse = await fetch(signedUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: imageBuffer,
  });

  if (!uploadResponse.ok) {
    throw new Error('Failed to upload image to Fanvue');
  }

  const etag = uploadResponse.headers.get('etag') || '';

  // Complete upload session
  const media = await completeUploadSession(accessToken, session.id, [
    { partNumber: 1, etag }
  ]);

  return media.uuid;
}

/**
 * Create a post on Fanvue
 */
export async function createFanvuePost(
  accessToken: string,
  options: CreatePostOptions
): Promise<FanvuePost> {
  const body: Record<string, unknown> = {
    audience: options.audience || 'subscribers',
  };

  if (options.text) body.text = options.text;
  if (options.mediaUuids?.length) body.mediaUuids = options.mediaUuids;
  if (options.price) body.price = options.price;
  if (options.publishAt) body.publishAt = options.publishAt;
  if (options.expiresAt) body.expiresAt = options.expiresAt;

  return fanvueApiRequest<FanvuePost>(accessToken, 'POST', '/posts', body);
}

/**
 * Publish generated AI influencer image to Fanvue
 * Complete flow: upload image -> create post
 */
export async function publishToFanvue(
  accessToken: string,
  imageUrl: string,
  caption: string,
  options?: {
    audience?: 'subscribers' | 'followers-and-subscribers';
    price?: number;
    publishAt?: string;
    hashtags?: string;
  }
): Promise<FanvuePost> {
  // Generate filename
  const filename = `ai-influencer-${Date.now()}.png`;
  
  // Upload image
  const mediaUuid = await uploadImageToFanvue(accessToken, imageUrl, filename);
  
  // Build caption with hashtags
  let fullCaption = caption;
  if (options?.hashtags) {
    fullCaption += `\n\n${options.hashtags}`;
  }

  // Create post
  return createFanvuePost(accessToken, {
    text: fullCaption,
    mediaUuids: [mediaUuid],
    audience: options?.audience || 'subscribers',
    price: options?.price,
    publishAt: options?.publishAt,
  });
}

/**
 * Check if Fanvue credentials are configured
 */
export function isFanvueConfigured(): boolean {
  return !!(FANVUE_CLIENT_ID && FANVUE_CLIENT_SECRET);
}

// Type definitions
export interface FanvueTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface FanvueUser {
  uuid: string;
  email: string;
  handle: string;
  bio: string;
  displayName: string;
  isCreator: boolean;
  createdAt: string;
  updatedAt: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  likesCount: number | null;
  fanCounts: {
    followersCount: number;
    subscribersCount: number;
  } | null;
  contentCounts: {
    imageCount: number;
    videoCount: number;
    audioCount: number;
    postCount: number;
    payToViewPostCount: number;
  } | null;
}

export interface FanvueUploadSession {
  id: string;
  status: string;
}

export interface FanvueMedia {
  uuid: string;
  url: string;
  type: string;
}

export interface CreatePostOptions {
  text?: string;
  mediaUuids?: string[];
  audience?: 'subscribers' | 'followers-and-subscribers';
  price?: number;
  publishAt?: string;
  expiresAt?: string;
}

export interface FanvuePost {
  uuid: string;
  createdAt: string;
  text: string | null;
  price: number | null;
  audience: string;
  publishAt: string | null;
  publishedAt: string | null;
  expiresAt: string | null;
}
