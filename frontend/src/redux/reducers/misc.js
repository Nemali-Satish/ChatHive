import { createSlice } from '@reduxjs/toolkit'

const getInitialTheme = () => {
  if (typeof window === 'undefined') return 'light'
  const stored = localStorage.getItem('theme')
  if (stored === 'light' || stored === 'dark') return stored
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  return prefersDark ? 'dark' : 'light'
}

const applyThemeClass = (theme) => {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

const initialTheme = getInitialTheme()
applyThemeClass(initialTheme)

const misc = createSlice({
  name: 'misc',
  initialState: {
    theme: initialTheme,
    // UI flags
    isSearch: false,
    isNotification: false,
    isNewGroup: false,
    isMobileSidebarOpen: false,
  },
  reducers: {
    toggleTheme: (state) => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark'
      localStorage.setItem('theme', state.theme)
      applyThemeClass(state.theme)
    },
    setTheme: (state, { payload }) => {
      state.theme = payload === 'dark' ? 'dark' : 'light'
      localStorage.setItem('theme', state.theme)
      applyThemeClass(state.theme)
    },
    // UI controls
    setIsSearch: (state, { payload }) => {
      state.isSearch = Boolean(payload)
    },
    setIsNotification: (state, { payload }) => {
      state.isNotification = Boolean(payload)
    },
    setIsNewGroup: (state, { payload }) => {
      state.isNewGroup = Boolean(payload)
    },
    setMobileSidebarOpen: (state, { payload }) => {
      state.isMobileSidebarOpen = Boolean(payload)
    },
  },
})

export const { toggleTheme, setTheme, setIsSearch, setIsNotification, setIsNewGroup, setMobileSidebarOpen } = misc.actions
export default misc

