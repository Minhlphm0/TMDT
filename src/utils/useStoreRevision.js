import { useSyncExternalStore } from 'react'
import { readStore, subscribeStore } from './store.js'

const getSnapshot = () => readStore().revision

export function useStoreRevision() {
  return useSyncExternalStore(subscribeStore, getSnapshot, getSnapshot)
}
