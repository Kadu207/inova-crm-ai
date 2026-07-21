import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  const filter = new HttpExceptionFilter();

  function mockHost(url = '/api/v1/test') {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const response = { status };
    const request = { url, headers: {}, correlationId: 'corr-1' };
    return {
      host: {
        switchToHttp: () => ({
          getResponse: () => response,
          getRequest: () => request,
        }),
      } as never,
      json,
      status,
    };
  }

  it('does not include stack for generic Error when NODE_ENV=production', () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const { host, json, status } = mockHost();

    filter.catch(new Error('secret boom'), host);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        message: 'Internal server error',
        correlationId: 'corr-1',
      }),
    );
    expect(json.mock.calls[0][0].stack).toBeUndefined();
    process.env.NODE_ENV = prev;
  });

  it('includes stack for generic Error when not production', () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    const { host, json } = mockHost();

    filter.catch(new Error('dev boom'), host);

    expect(json.mock.calls[0][0].stack).toBeDefined();
    expect(json.mock.calls[0][0].message).toBe('dev boom');
    process.env.NODE_ENV = prev;
  });
});
