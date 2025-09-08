import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { getCorrelation } from 'src/logging/correlation.context';
import { ILoggingFactory, ILoggingService } from './logging.interfaces';

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

function getLogger(
  factory: ILoggingFactory,
  correlationId: string | undefined,
  traceId: string | undefined,
): ILoggingService {
  const logger = factory.create('axios');
  //logger.scope({ correlationId, traceId });
  return logger;
}

export function attachAxiosGlobalLogging() {
  if ((axios as any).__loggingAttached) return;
  (axios as any).__loggingAttached = true;

  axios.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const { correlationId, traceId, loggingFactory } = getCorrelation();
    const factory: ILoggingFactory | undefined = loggingFactory;

    config.headers = config.headers ?? {};
    if (correlationId && !(config.headers as any)['x-correlation-id']) {
      (config.headers as any)['x-correlation-id'] = correlationId;
    }
    if (traceId && !(config.headers as any)['x-trace-id']) {
      (config.headers as any)['x-trace-id'] = traceId;
    }

    config._metaStartTs = Date.now();

    if (factory) {
      const logger = factory.create('axios');
      logger.info('HTTP request', {
        method: (config.method || 'GET').toUpperCase(),
        url: config.baseURL
          ? `${config.baseURL}${config.url ?? ''}`
          : config.url,
        params: config.params,
        headers: maskHeaders(config.headers as any),
        bodySize: sizeOf(config.data),
        body: config.data,
        timeout: config.timeout,
      });
    }
    return config;
  });

  axios.interceptors.response.use(
    (res: AxiosResponse) => {
      const { loggingFactory } = getCorrelation();
      const factory: ILoggingFactory | undefined = loggingFactory;

      const started = res.config._metaStartTs;
      const durationMs = started ? Date.now() - started : undefined;

      const meta = {
        method: (res.config.method || 'GET').toUpperCase(),
        url: res.config.baseURL
          ? `${res.config.baseURL}${res.config.url ?? ''}`
          : res.config.url,
        status: res.status,
        durationMs,
        bodySize: sizeOf(res.data),
        body: res.data,
        headers: maskHeaders(res.headers as any),
      };

      if (factory) {
        const logger = factory.create('axios');
        if (res.status >= 500) logger.error('HTTP response 5xx', meta);
        else if (res.status >= 400) logger.warning('HTTP response 4xx', meta);
        else logger.info('HTTP response', meta);
      }

      return res;
    },
    (err: AxiosError) => {
      const { loggingFactory } = getCorrelation();
      const factory: ILoggingFactory | undefined = loggingFactory;

      const cfg = err.config || {};
      const started = (cfg as InternalAxiosRequestConfig)._metaStartTs;
      const durationMs = started ? Date.now() - started : undefined;

      if (factory) {
        const logger = factory.create('axios');
        logger.error('HTTP error', {
          method: (
            (cfg as InternalAxiosRequestConfig).method || 'GET'
          ).toUpperCase(),
          url: (cfg as InternalAxiosRequestConfig).baseURL
            ? `${(cfg as InternalAxiosRequestConfig).baseURL}${(cfg as InternalAxiosRequestConfig).url ?? ''}`
            : (cfg as InternalAxiosRequestConfig).url,
          durationMs,
          headers: maskHeaders(
            (cfg as InternalAxiosRequestConfig).headers as any,
          ),
          requestSize: sizeOf((cfg as InternalAxiosRequestConfig).data),
          status: err.response?.status,
          code: err.code,
          message: err.message,
          bodySize: sizeOf(err.response?.data),
          body: err.response?.data,
        });
      }

      return Promise.reject(err);
    },
  );
}
