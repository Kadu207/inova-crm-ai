import { resolveJwtSecret } from './jwt-secret';

describe('resolveJwtSecret', () => {
  function mockConfig(env: Record<string, string | undefined>) {
    return {
      get<T = string>(key: string, defaultValue?: T): T | undefined {
        if (Object.prototype.hasOwnProperty.call(env, key)) {
          return env[key] as T | undefined;
        }
        return defaultValue;
      },
    };
  }

  it('fails in production when JWT_SECRET is missing', () => {
    expect(() => resolveJwtSecret(mockConfig({ NODE_ENV: 'production' }))).toThrow(
      /JWT_SECRET must be set in production/,
    );
  });

  it('fails in production when JWT_SECRET is a weak default', () => {
    expect(() =>
      resolveJwtSecret(mockConfig({ NODE_ENV: 'production', JWT_SECRET: 'dev-secret' })),
    ).toThrow(/JWT_SECRET must be set in production/);
  });

  it('fails in production when JWT_SECRET is shorter than 32 chars', () => {
    expect(() =>
      resolveJwtSecret(mockConfig({ NODE_ENV: 'production', JWT_SECRET: 'only-sixteen-chars' })),
    ).toThrow(/JWT_SECRET must be set in production/);
  });

  it('accepts a strong secret in production', () => {
    const secret = 'a'.repeat(32);
    expect(resolveJwtSecret(mockConfig({ NODE_ENV: 'production', JWT_SECRET: secret }))).toBe(
      secret,
    );
  });

  it('uses local fallback in development when unset', () => {
    const secret = resolveJwtSecret(mockConfig({ NODE_ENV: 'development' }));
    expect(secret.length).toBeGreaterThan(16);
    expect(secret).toContain('local-only');
  });

  it('uses provided non-weak secret in development', () => {
    expect(
      resolveJwtSecret(
        mockConfig({ NODE_ENV: 'development', JWT_SECRET: 'my-local-dev-secret-ok' }),
      ),
    ).toBe('my-local-dev-secret-ok');
  });
});
