export function store(key: any, fn: (data: any) => any, alt?: any): StoreAPI
export function store(key: any, data: any): any
export function store(clearIfFalsy: false | 0): StoreAPI
export function store(key: any): any
export function store(obj: Object): StoredData
export function store(): StoredData

// if anyone knows a way to avoid duplicating the StoreAPI interface here that'd be great
export namespace store {
  const local: StoreAPI;
  const session: StoreAPI;
  function area(id: string, area: Storage): StoreAPI;
  function set(key: any, data: any, overwrite?: boolean): any;
  function setAll(data: Object, overwrite?: boolean): StoredData;
  function get(key: any, alt?: any): any;
  function getAll(): StoredData;
  function transact(key: any, fn: (data: any) => any, alt?: any): StoreAPI;
  function clear(): StoreAPI;
  function has(key: any): boolean;
  function remove(key: any): any;
  function each(callback: (key: any, data: any) => false | any): StoreAPI;
  function keys(): string[];
  function size(): number;
  function clearAll(): StoreAPI;
  function isFake(): boolean;
  function namespace(namespace: string, noSession?: true): StoreAPI;
}

export interface StoreAPI {
  set(key: any, data: any, overwrite?: boolean): any;
  setAll(data: Object, overwrite?: boolean): StoredData;
  get(key: any, alt?: any): any;
  getAll(): StoredData;
  transact(key: any, fn: (data: any) => any, alt?: any): StoreAPI;
  clear(): StoreAPI;
  has(key: any): boolean;
  remove(key: any): any;
  each(callback: (key: any, data: any) => false | any): StoreAPI;
  keys(): string[];
  size(): number;
  clearAll(): StoreAPI;
  isFake(): boolean;
  namespace(namespace: string, noSession?: true): StoreAPI;
}

export interface StoredData {
  [key: string]: any;
}

export interface Storage {
  getItem(key: string): string;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  key(index: number): string;
  length: number;
  clear(): void;
}

export default store;
