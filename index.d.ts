export as namespace store;

export = store;

interface store {
  set(key: any, data: any, overwrite?: boolean): any;
  setAll(data: Object, overwrite?: boolean): store.Data;
  get(key: any, alt?: any): any;
  getAll(): store.Data;
  transact(key: any, fn: (data: any) => any, alt?: any): store;
  clear(): store;
  has(key: any): boolean;
  remove(key: any): any;
  each(callback: (key: any, data: any) => false | any): store;
  keys(): string[];
  size(): number;
  clearAll(): store;
  isFake(): boolean;
  namespace(namespace: string, noSession?: true): store;
}
interface Storage {
  getItem(key: string): string;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  key(index: number): string;
  length: number;
  clear(): void;
}

declare function store(key: any, data: any): any
declare function store(key: any): any
declare function store(key: any, fn: (data: any) => any, alt?: any): store
declare function store(obj: Object): store.Data
declare function store(): store.Data
declare function store(clearIfFalsy: false | 0): store

declare namespace store {
  export interface Data {
    [key: string]: any;
  }
  export const session: store;
  export const local: store;
  export function area(id: string, area: Storage): store;
}
