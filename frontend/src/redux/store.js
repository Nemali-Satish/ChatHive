import { configureStore } from '@reduxjs/toolkit'
import auth from './reducers/auth'
import misc from './reducers/misc'
import chat from './reducers/chat'

const store = configureStore({
  reducer: {
    [auth.name]: auth.reducer,
    [misc.name]: misc.reducer,
    [chat.name]: chat.reducer,
  },
})

export default store
