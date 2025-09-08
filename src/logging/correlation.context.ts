import { AsyncLocalStorage } from 'node:async_hooks';
import { ILoggingFactory } from './logging.interfaces';

export type CorrelationContext = {
  correlationId?: string;
  traceId?: string;
  loggingFactory?: ILoggingFactory;
};

export const correlationAls = new AsyncLocalStorage<CorrelationContext>();

export function getCorrelation(): CorrelationContext {
  return correlationAls.getStore() ?? {};
}
