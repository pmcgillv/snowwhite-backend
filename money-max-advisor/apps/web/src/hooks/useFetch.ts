import { useEffect, useReducer, useCallback } from 'react'
import { api } from '../api/client'

interface State<T> {
  data: T | null
  loading: boolean
  error: string | null
}

type Action<T> =
  | { type: 'LOADING' }
  | { type: 'SUCCESS'; payload: T }
  | { type: 'ERROR'; payload: string }

function reducer<T>(state: State<T>, action: Action<T>): State<T> {
  switch (action.type) {
    case 'LOADING':
      return { ...state, loading: true, error: null }
    case 'SUCCESS':
      return { data: action.payload, loading: false, error: null }
    case 'ERROR':
      return { ...state, loading: false, error: action.payload }
    default: {
      const exhaustive: never = action
      void exhaustive
      return state
    }
  }
}

export function useFetch<T>(path: string) {
  const [state, dispatch] = useReducer(reducer<T>, {
    data: null,
    loading: true,
    error: null,
  })

  const load = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!opts?.silent) {
        dispatch({ type: 'LOADING' })
      }
      try {
        const data = await api.get<T>(path)
        dispatch({ type: 'SUCCESS', payload: data })
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        dispatch({ type: 'ERROR', payload: msg })
      }
    },
    [path],
  )

  useEffect(() => {
    void load()
  }, [load])

  const refetch = useCallback(() => load({ silent: true }), [load])

  return { ...state, refetch, reload: load }
}
