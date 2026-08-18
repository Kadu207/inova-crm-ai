/**
 * Resolve JWT signing/verification secret.
 * Production: fail-fast if missing, short, or a known weak placeholder.
 * Development/test: allow a local-only fallback when unset.
 */
const WEAK_JWT_SECRETS = new Set([
  'dev-secret',
  'change_me_jwt_secret_min_32_chars',
  'change-me-in-production-use-long-random-string',
  'secret',
  'jwt_secret',
]);

const PROD_MIN_LENGTH = 32;
const LOCAL_FALLBACK = 'dev-secret-local-only-do-not-use-in-prod';

export type JwtSecretEnvSource = {
  get<T = string>(key: string, defaultValue?: T): T | undefined;
};

export function resolveJwtSecret(config: JwtSecretEnvSource): string {
  const nodeEnv = (config.get<string>('NODE_ENV', 'development') ?? 'development').trim();
  const raw = config.get<string>('JWT_SECRET');
  const secret = typeof raw === 'string' ? raw.trim() : '';

  if (nodeEnv === 'production') {
    if (!secret || secret.length < PROD_MIN_LENGTH || WEAK_JWT_SECRETS.has(secret)) {
      throw new Error(
        'JWT_SECRET must be set in production to a strong random value (min 32 characters, not a known weak default)',
      );
    }
    return secret;
  }

  if (secret && !WEAK_JWT_SECRETS.has(secret)) {
    return secret;
  }

  if (secret) {
    return secret;
  }

  return LOCAL_FALLBACK;
}
