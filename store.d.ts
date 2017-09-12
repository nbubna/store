declare module 'store' {

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

  function store(key: any, data: any): any
  function store(key: any): any
  function store(key: any, fn: (data: any) => any, alt?: any): store
  function store(obj: Object): store.Data
  function store(): store.Data
  function store(clearIfFalsy: false | 0): store

  namespace store {
    interface Data {
      [key: string]: any;
    }
    const session: store;
    const local: store;
    function area(id: string, area: Storage): store;
  }

  export = store;
}
