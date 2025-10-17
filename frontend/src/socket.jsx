import { createContext, useContext, useMemo } from 'react'
import { io } from 'socket.io-client'
import { server } from './constants/config'

const SocketContext = createContext(null)

export const SocketProvider = ({ children }) => {
  const socket = useMemo(() => io(server, { withCredentials: true, autoConnect: false }), [])
  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
}

export const useSocket = () => useContext(SocketContext)
