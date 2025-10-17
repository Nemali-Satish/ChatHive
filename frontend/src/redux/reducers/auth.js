import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  user: null,
  loader: true,
}

const auth = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    userExists: (state, { payload }) => {
      state.user = payload
      state.loader = false
    },
    userNotExists: (state) => {
      state.user = null
      state.loader = false
    },
    logout: (state) => {
      state.user = null
    },
  },
})

export const { userExists, userNotExists, logout } = auth.actions
export default auth
