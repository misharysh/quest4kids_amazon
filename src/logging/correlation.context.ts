import { AsyncLocalStorage } from 'node:async_hooks';

export type CorrelationContext = {
  correlationId?: string;
  traceId?: string;
};

export const correlationAls = new AsyncLocalStorage<CorrelationContext>();

export function getCorrelation(): CorrelationContext {
  return correlationAls.getStore() ?? {};
}
