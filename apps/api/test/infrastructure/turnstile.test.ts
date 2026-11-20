import { describe, expect, it, vi } from 'vitest';
import { TurnstileVerifier } from '../../src/infrastructure/security/TurnstileVerifier';

const check = { token: 'tok', action: 'register', remoteIp: '203.0.113.7' };

function verifierReturning(body: unknown, status = 200) {
  const fetchMock = vi.fn(async (_url: unknown, _init?: RequestInit) =>
    new Response(JSON.stringify(body), { status }),
  );
  return { verifier: new TurnstileVerifier('secret', fetchMock as unknown as typeof fetch), fetchMock };
}

describe('TurnstileVerifier (BR-408)', () => {
  it('sends secret, token and IP to Siteverify and accepts a matching action', async () => {
    const { verifier, fetchMock } = verifierReturning({ success: true, action: 'register' });

    expect(await verifier.verify(check)).toBe(true);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toBe('https://challenges.cloudflare.com/turnstile/v0/siteverify');
    const form = init?.body as FormData;
    expect(form.get('secret')).toBe('secret');
    expect(form.get('response')).toBe('tok');
    expect(form.get('remoteip')).toBe('203.0.113.7');
  });

  it('rejects a token issued for another action', async () => {
    const { verifier } = verifierReturning({ success: true, action: 'login' });
    expect(await verifier.verify(check)).toBe(false);
  });

  it('rejects when Siteverify says no or answers with an error status', async () => {
    expect(await verifierReturning({ success: false }).verifier.verify(check)).toBe(false);
    expect(await verifierReturning({}, 500).verifier.verify(check)).toBe(false);
  });

  it('fails closed on network errors', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const failing = vi.fn(async () => {
      throw new TypeError('network down');
    });
    const verifier = new TurnstileVerifier('secret', failing as unknown as typeof fetch);
    expect(await verifier.verify(check)).toBe(false);
  });

  it('rejects empty or oversized tokens without calling Siteverify', async () => {
    const { verifier, fetchMock } = verifierReturning({ success: true });

    expect(await verifier.verify({ ...check, token: '' })).toBe(false);
    expect(await verifier.verify({ ...check, token: 'x'.repeat(2049) })).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
