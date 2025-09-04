import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { ILoggingService } from './logging.interfaces';
import { getCorrelation } from 'src/logging/correlation.context';

declare module 'axios' {
  export interface InternalAxiosRequestConfig {
    _metaStartTs?: number;
  }
}

function maskHeaders(headers?: Record<string, any>) {
  if (!headers) return headers;
  const clone = { ...headers };
  for (const k of Object.keys(clone)) {
    if (
      ['authorization', 'cookie', 'set-cookie', 'x-api-key'].includes(
        k.toLowerCase(),
      )
    ) {
      clone[k] = '***';
    }
  }
  return clone;
}

function sizeOf(body: any): number {
  try {
    if (body == null) return 0;
    return typeof body === 'string' ? body.length : JSON.stringify(body).length;
  } catch {
    return 0;
  }
}

export function attachAxiosGlobalLogging(resolveLogger: () => ILoggingService) {
  if ((axios as any).__loggingAttached) return;
  (axios as any).__loggingAttached = true;

  axios.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const logger = resolveLogger();
    const { correlationId, traceId } = getCorrelation();

    config.headers = config.headers ?? {};
    if (correlationId && !(config.headers as any)['x-correlation-id']) {
      (config.headers as any)['x-correlation-id'] = correlationId;
    }
    if (traceId && !(config.headers as any)['x-trace-id']) {
      (config.headers as any)['x-trace-id'] = traceId;
    }

    config._metaStartTs = Date.now();

    logger.info('HTTP request', {
      method: (config.method || 'GET').toUpperCase(),
      url: config.baseURL ? `${config.baseURL}${config.url ?? ''}` : config.url,
      params: config.params,
      headers: maskHeaders(config.headers as any),
      bodySize: sizeOf(config.data),
      body: config.data,
      timeout: config.timeout,
    });
    return config;
  });

  axios.interceptors.response.use(
    (res: AxiosResponse) => {
      const logger = resolveLogger();
      const started = res.config._metaStartTs;
      const durationMs = started ? Date.now() - started : undefined;

      const meta = {
        method: (res.config.method || 'GET').toUpperCase(),
        url: res.config.baseURL
          ? `${res.config.baseURL}${res.config.url ?? ''}`
          : res.config.url,
        status: res.status,
        durationMs,
        responseSize: sizeOf(res.data),
        responseData: String(res.data),
        responseHeaders: maskHeaders(res.headers as any),
      };

      if (res.status >= 500) logger.error('HTTP response 5xx', meta);
      else if (res.status >= 400) logger.warning('HTTP response 4xx', meta);
      else logger.info('HTTP response', meta);

      return res;
    },
    (err: AxiosError) => {
      const logger = resolveLogger();
      const cfg = err.config || {};
      const started = (cfg as InternalAxiosRequestConfig)._metaStartTs;
      const durationMs = started ? Date.now() - started : undefined;

      logger.error('HTTP error', {
        method: (
          (cfg as InternalAxiosRequestConfig).method || 'GET'
        ).toUpperCase(),
        url: (cfg as InternalAxiosRequestConfig).baseURL
          ? `${(cfg as InternalAxiosRequestConfig).baseURL}${(cfg as InternalAxiosRequestConfig).url ?? ''}`
          : (cfg as InternalAxiosRequestConfig).url,
        durationMs,
        requestHeaders: maskHeaders(
          (cfg as InternalAxiosRequestConfig).headers as any,
        ),
        requestSize: sizeOf((cfg as InternalAxiosRequestConfig).data),
        status: err.response?.status,
        code: err.code,
        message: err.message,
        responseSize: sizeOf(err.response?.data),
        responseData: err.response?.data,
      });

      return Promise.reject(err);
    },
  );
}
