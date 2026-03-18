import { useCallback, useEffect } from 'react'
import { useCanvasStore } from '@/components/workflow/canvas-provider'

const MAX_HISTORY = 50

interface HistoryState {
  past: Array<{ nodes: any[]; edges: any[] }>
  future: Array<{ nodes: any[]; edges: any[] }>
}

export function useHistory() {
  const { nodes, edges, setNodes, setEdges } = useCanvasStore()
  
  // Initialize history state in localStorage
  const getHistoryState = (): HistoryState => {
    try {
      const saved = localStorage.getItem('workflow-canvas-history')
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (error) {
      console.error('Failed to load history:', error)
    }
    
    return {
      past: [],
      future: [],
    }
  }

  const saveHistoryState = (state: HistoryState) => {
    try {
      localStorage.setItem('workflow-canvas-history', JSON.stringify(state))
    } catch (error) {
      console.error('Failed to save history:', error)
    }
  }

  // Push current state to history
  const pushToHistory = useCallback(() => {
    const history = getHistoryState()
    
    // Add current state to past
    const newPast = [
      ...history.past,
      { nodes: [...nodes], edges: [...edges] },
    ]
    
    // Limit history size
    if (newPast.length > MAX_HISTORY) {
      newPast.shift()
    }
    
    const newState: HistoryState = {
      past: newPast,
      future: [], // Clear future when new action is performed
    }
    
    saveHistoryState(newState)
  }, [nodes, edges])

  // Undo
  const undo = useCallback(() => {
    const history = getHistoryState()
    
    if (history.past.length === 0) {
      console.log('Nothing to undo')
      return false
    }

    // Get previous state
    const previous = history.past[history.past.length - 1]
    const newPast = history.past.slice(0, -1)
    
    // Add current state to future
    const newFuture = [
      ...history.future,
      { nodes: [...nodes], edges: [...edges] },
    ]
    
    // Restore previous state
    setNodes(previous.nodes)
    setEdges(previous.edges)
    
    // Save new history state
    saveHistoryState({
      past: newPast,
      future: newFuture,
    })
    
    return true
  }, [nodes, edges, setNodes, setEdges])

  // Redo
  const redo = useCallback(() => {
    const history = getHistoryState()
    
    if (history.future.length === 0) {
      console.log('Nothing to redo')
      return false
    }

    // Get next state
    const next = history.future[history.future.length - 1]
    const newFuture = history.future.slice(0, -1)
    
    // Add current state to past
    const newPast = [
      ...history.past,
      { nodes: [...nodes], edges: [...edges] },
    ]
    
    // Restore next state
    setNodes(next.nodes)
    setEdges(next.edges)
    
    // Save new history state
    saveHistoryState({
      past: newPast,
      future: newFuture,
    })
    
    return true
  }, [nodes, edges, setNodes, setEdges])

  // Check if can undo/redo
  const canUndo = useCallback(() => {
    const history = getHistoryState()
    return history.past.length > 0
  }, [])

  const canRedo = useCallback(() => {
    const history = getHistoryState()
    return history.future.length > 0
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if in input field
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return
      }

      // Ctrl/Cmd + Z = Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      }

      // Ctrl/Cmd + Shift + Z = Redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault()
        redo()
      }

      // Ctrl/Cmd + Y = Redo (alternative)
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault()
        redo()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo])

  return {
    pushToHistory,
    undo,
    redo,
    canUndo,
    canRedo,
  }
}
