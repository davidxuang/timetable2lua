import CRT from './vendor/crt.js';
import WHRT from './vendor/whrt.js';

declare global {
  interface Array<T> {
    single(predicate?: (value: T, index: number, array: T[]) => boolean): T;
    trySingle(
      predicate?: (value: T, index: number, array: T[]) => boolean,
    ): T | T[];
  }
}

if (!Array.prototype.single) {
  Object.defineProperty(Array.prototype, 'single', {
    value: function <T>(
      this: T[],
      predicate?: (value: T, index: number, array: T[]) => boolean,
    ): T {
      const target = predicate ? this.filter(predicate) : this;

      if (target.length === 0) {
        throw new Error('Sequence contains no matching element');
      }
      if (target.length > 1) {
        throw new Error('Sequence contains more than one matching element');
      }

      return target[0];
    },
    enumerable: false,
    configurable: true,
    writable: true,
  });

  Object.defineProperty(Array.prototype, 'trySingle', {
    value: function <T>(
      this: T[],
      predicate?: (value: T, index: number, array: T[]) => boolean,
    ): T | T[] {
      const target = predicate ? this.filter(predicate) : this;

      if (target.length === 0 || target.length > 1) {
        return target;
      }

      return target[0];
    },
  });
}

switch (new URL(document.URL).hostname) {
  case 'www.cqmetro.cn':
    CRT.bootstrap();
    break;
  case 'www.wuhanrt.com':
    WHRT.bootstrap();
    break;
}
