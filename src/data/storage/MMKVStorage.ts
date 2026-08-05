import {createMMKV} from 'react-native-mmkv';
import type {KeyValueStorage} from '../../domain/repositories/KeyValueStorage';

export class MMKVStorage implements KeyValueStorage {
  private readonly storage;

  constructor(namespace: string) {
    this.storage = createMMKV({id: namespace});
  }

  getString(key: string) {
    return this.storage.getString(key);
  }

  setString(key: string, value: string) {
    this.storage.set(key, value);
  }

  remove(key: string) {
    this.storage.remove(key);
  }

  clear() {
    this.storage.clearAll();
  }
}
