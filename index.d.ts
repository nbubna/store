declare namespace store {
  const local : StoreAPI;
  const session : StoreAPI;

  function area (id : string, area : Storage) : StoreAPI;
  function set (key : any, data : any, overwrite? : boolean) : any;
  function setAll (data : Object, overwrite? : boolean) : StoredData;
  function get (key : any, alt? : any) : any;
  function getAll () : StoredData;
  function transact (key : any, fn : (data : any) => any, alt? : any) : StoreAPI;
  function clear () : StoreAPI;
  function has (key : any) : boolean;
  function remove (key : any) : any;
  function each (callback : (key : any, data : any) => false | any) : StoreAPI;
  function keys () : string[];
  function size () : number;
  function clearAll () : StoreAPI;
  function isFake () : boolean;
  function namespace (namespace : string, noSession? : true) : StoreAPI;

  export interface StoreAPI {
    clear() : StoreAPI;
    clearAll() : StoreAPI;
    each(callback : (key : any, data : any) => false | any) : StoreAPI;
    get(key : any, alt? : any) : any;
    getAll() : StoredData;
    has(key : any) : boolean;
    isFake() : boolean;
    keys() : string[];
    namespace(namespace : string, noSession? : true) : StoreAPI;
    remove(key : any) : any;
    set(key : any, data : any, overwrite? : boolean) : any;
    setAll(data : Object, overwrite? : boolean) : StoredData;
    size() : number;
    transact(key : any, fn : (data : any) => any, alt? : any) : StoreAPI;
  }

  export interface StoredData {
    [key : string] : any;
  }

  export interface Storage {
    length : number;
    clear() : void;
    getItem(key : string) : string;
    key(index : number) : string;
    removeItem(key : string) : void;
    setItem(key : string, value : string) : void;
  }
}

declare function store (key : any, fn : (data : any) => any, alt? : any) : store.StoreAPI
declare function store (key : any, data : any) : any
declare function store (clearIfFalsy : false | 0) : store.StoreAPI
declare function store (key : any) : any
declare function store (obj : Object) : store.StoredData
declare function store () : store.StoredData

export = store;
