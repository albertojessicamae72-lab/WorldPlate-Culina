import * as React from "react"

const TOAST_LIMIT = 3

let count = 0
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

let listeners = []
let memoryState = { toasts: [] }

function emit(next) {
  memoryState = next
  listeners.forEach((listener) => listener(memoryState))
}

function subscribe(listener) {
  listeners = [...listeners, listener]
  return () => {
    listeners = listeners.filter((l) => l !== listener)
  }
}

function dismissToast(id) {
  emit({ toasts: memoryState.toasts.map((t) => (t.id === id ? { ...t, open: false } : t)) })
  setTimeout(() => {
    emit({ toasts: memoryState.toasts.filter((t) => t.id !== id) })
  }, 300)
}

function toast(props) {
  const id = props?.id || genId()
  const duration = props?.duration ?? 4000
  const newToast = {
    ...props,
    id,
    open: true,
    onOpenChange: (open) => {
      if (!open) dismissToast(id)
    },
  }
  emit({ toasts: [newToast, ...memoryState.toasts].slice(0, TOAST_LIMIT) })
  if (duration !== Infinity) {
    setTimeout(() => dismissToast(id), duration)
  }
  return {
    id,
    dismiss: () => dismissToast(id),
    update: (nextProps) => {
      emit({
        toasts: memoryState.toasts.map((t) => (t.id === id ? { ...t, ...nextProps } : t)),
      })
    },
  }
}

function useToast() {
  const state = React.useSyncExternalStore(subscribe, () => memoryState, () => memoryState)
  return {
    ...state,
    toast,
    dismiss: (id) => dismissToast(id),
  }
}

export { useToast, toast }
