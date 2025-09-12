import { AsyncLocalStorage } from 'node:async_hooks';
import { ILoggingFactory } from './logging.interfaces';

export const loggingFactoryAls = new AsyncLocalStorage<ILoggingFactory>();

export function setLoggingFactoryForCurrentAsyncChain(
  factory: ILoggingFactory,
) {
  loggingFactoryAls.enterWith(factory);
}

export function getLoggingFactoryFromAls(): ILoggingFactory | undefined {
  return loggingFactoryAls.getStore();
}
