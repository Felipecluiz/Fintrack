import { describe, expect, it } from 'vitest';
import { createOriginMatcher } from '../../src/presentation/http/corsOrigins';

describe('createOriginMatcher', () => {
  const isAllowed = createOriginMatcher(
    'http://localhost:5173, https://fintrack-web-0ff.pages.dev, https://*.fintrack-web-0ff.pages.dev',
  );

  it.each([
    'http://localhost:5173',
    'https://fintrack-web-0ff.pages.dev',
    'https://main.fintrack-web-0ff.pages.dev',
    'https://a0fd57cc.fintrack-web-0ff.pages.dev',
  ])('allows %s', (origin) => {
    expect(isAllowed(origin)).toBe(true);
  });

  it.each([
    'https://evil.com',
    'https://fintrack-web-0ff.pages.dev.evil.com',
    'https://a.b.fintrack-web-0ff.pages.dev',
    'http://main.fintrack-web-0ff.pages.dev',
  ])('blocks %s', (origin) => {
    expect(isAllowed(origin)).toBe(false);
  });
});
