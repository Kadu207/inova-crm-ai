import { describe, expect, it } from 'vitest';
import { getApiBaseUrl } from './api';

describe('api client', () => {
  it('defaults API base URL', () => {
    expect(getApiBaseUrl()).toMatch(/9401/);
  });
});
