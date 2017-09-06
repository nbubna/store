// Type definitions for store2 v2.5.1
// Project: store2
// Definitions by: ahstro <http://ahst.ro>

export as namespace store2;

export = store2;

declare function store2(key: store2.Key, data: store2.Data): store2.Data
declare function store2(key: store2.Key): store2.Data
declare function store2<T extends store2.Data, U>(
  key: store2.Key,
  fn: (x: T) => U,
  alt?: T
): U
declare function store2(obj: store2.DataObject): store2.Data
declare function store2(): store2.DataObject
declare function store2(clearIfFalse: false): any

declare namespace store2 {
  export type Key = string;
  export type Data = any;
  export interface DataObject {
    [key: string]: Data;
  }

  export function set(key: Key, data: Data, overwrite?: boolean): store2.Data;
  export function setAll(data: DataObject, overwrite?: boolean): store2.Data;
  export function get(key: Key, alt?: Data): Data;
  export function getAll(): DataObject;
  export function transact<T extends Data, U>(
    key: Key,
    fn: (x: T) => U,
    alt?: T
  ): U;
  export function clear(): any;
  export function has(key: Key): boolean;
  export function remove(key: Key): Data;
  export function each(callback: (k: Key, d: Data) => false | any): any;
  export function keys(): Key[];
  export function size(): number;
  export function clearAll(): any;
}
