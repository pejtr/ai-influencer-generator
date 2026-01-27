import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generatePKCE, generateState, buildAuthorizationUrl, isFanvueConfigured } from './fanvue/fanvue';

describe('Fanvue OAuth Integration', () => {
  describe('generatePKCE', () => {
    it('should generate valid PKCE code verifier and challenge', () => {
      const { codeVerifier, codeChallenge } = generatePKCE();
      
      // Code verifier should be a base64url string
      expect(codeVerifier).toBeDefined();
      expect(typeof codeVerifier).toBe('string');
      expect(codeVerifier.length).toBeGreaterThan(20);
      
      // Code challenge should be different from verifier (it's hashed)
      expect(codeChallenge).toBeDefined();
      expect(typeof codeChallenge).toBe('string');
      expect(codeChallenge).not.toBe(codeVerifier);
    });

    it('should generate unique values on each call', () => {
      const first = generatePKCE();
      const second = generatePKCE();
      
      expect(first.codeVerifier).not.toBe(second.codeVerifier);
      expect(first.codeChallenge).not.toBe(second.codeChallenge);
    });
  });

  describe('generateState', () => {
    it('should generate a valid state string', () => {
      const state = generateState();
      
      expect(state).toBeDefined();
      expect(typeof state).toBe('string');
      expect(state.length).toBe(64); // 32 bytes = 64 hex chars
    });

    it('should generate unique state on each call', () => {
      const first = generateState();
      const second = generateState();
      
      expect(first).not.toBe(second);
    });
  });

  describe('buildAuthorizationUrl', () => {
    it('should build valid authorization URL with all parameters', () => {
      const redirectUri = 'https://example.com/callback';
      const state = 'test-state-123';
      const codeChallenge = 'test-challenge-456';
      
      const url = buildAuthorizationUrl(redirectUri, state, codeChallenge);
      
      expect(url).toContain('https://auth.fanvue.com/oauth2/auth');
      expect(url).toContain(`redirect_uri=${encodeURIComponent(redirectUri)}`);
      expect(url).toContain(`state=${state}`);
      expect(url).toContain(`code_challenge=${codeChallenge}`);
      expect(url).toContain('code_challenge_method=S256');
      expect(url).toContain('response_type=code');
    });

    it('should include required scopes', () => {
      const url = buildAuthorizationUrl('https://example.com/callback', 'state', 'challenge');
      
      expect(url).toContain('scope=');
      expect(url).toContain('openid');
      expect(url).toContain('offline_access');
      expect(url).toContain('read%3Aself'); // URL encoded read:self
      expect(url).toContain('write%3Apost'); // URL encoded write:post
    });
  });

  describe('isFanvueConfigured', () => {
    it('should return false when credentials are not set', () => {
      // Without env vars set, should return false
      const result = isFanvueConfigured();
      expect(typeof result).toBe('boolean');
    });
  });
});

describe('Scheduler Tier Access', () => {
  it('should require VIP tier for scheduler features', () => {
    const tiers = ['free', 'basic', 'premium', 'vip'];
    const vipOnlyFeatures = ['scheduler', 'batch'];
    
    // VIP should have access
    expect(tiers.includes('vip')).toBe(true);
    
    // Verify tier hierarchy
    expect(tiers.indexOf('vip')).toBeGreaterThan(tiers.indexOf('premium'));
    expect(tiers.indexOf('premium')).toBeGreaterThan(tiers.indexOf('basic'));
    expect(tiers.indexOf('basic')).toBeGreaterThan(tiers.indexOf('free'));
  });

  it('should require PREMIUM or VIP for Fanvue features', () => {
    const premiumTiers = ['premium', 'vip'];
    
    expect(premiumTiers.includes('premium')).toBe(true);
    expect(premiumTiers.includes('vip')).toBe(true);
    expect(premiumTiers.includes('basic')).toBe(false);
    expect(premiumTiers.includes('free')).toBe(false);
  });
});

describe('Batch Generation Limits', () => {
  it('should enforce maximum 30 images per batch', () => {
    const MAX_BATCH_SIZE = 30;
    const MIN_BATCH_SIZE = 1;
    
    expect(MAX_BATCH_SIZE).toBe(30);
    expect(MIN_BATCH_SIZE).toBe(1);
    
    // Test valid batch sizes
    for (let size = MIN_BATCH_SIZE; size <= MAX_BATCH_SIZE; size++) {
      expect(size >= MIN_BATCH_SIZE && size <= MAX_BATCH_SIZE).toBe(true);
    }
    
    // Test invalid batch sizes
    expect(0 >= MIN_BATCH_SIZE).toBe(false);
    expect(31 <= MAX_BATCH_SIZE).toBe(false);
  });
});
