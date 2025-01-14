'use client'

import { responseMessage } from '@/shared/types/room.interface';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { io, Socket } from 'socket.io-client'

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinRoom: (roomId: string) => void;
  sendMessage: (message: { roomId: string; senderId: string; contents: string }) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  subscribeToMessages: (callback: (data: responseMessage) => void) => void;
  unsubscribeFromMessages: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token') || ''
    console.log('Initializing socket connection')
    const socketInstance = io('http://localhost:3001', {
      path: '/ws',
      transports: ['websocket'],
      auth: {
        token: `Bearer ${token}`,
      }
    })

    socketInstance.on('connect', () => {
      console.log('Connected to server')
      setIsConnected(true)
    })

    socketInstance.on('connect_error', (error) => {
      console.error('Connection error:', error)
    })

    socketInstance.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason)
      setIsConnected(false)
    })

    setSocket(socketInstance)

    return () => {
      console.log('Cleaning up socket connection')
      socketInstance.disconnect()
    }
  }, [])

  const joinRoom = (roomId: string) => {
    if (socket) {
      socket.emit('join-room', { roomId })
    }
  }

  const sendMessage = (message: { roomId: string; senderId: string; contents: string }) => {
    if (socket) {
      console.log('Emitting send-message event:', message)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      socket.emit('send-message', message, (error: any) => {
        if (error) {
          console.error('Error sending message:', error)
        } else {
          console.log('Message sent successfully')
        }
      })
    } else {
      console.error('Socket is not connected')
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subscribeToMessages = (callback: (data: responseMessage) => void) => {
    if (socket) {
      console.log('Subscribing to messages')
      socket.on('message', (data: responseMessage) => {
        console.log('Received message:', data)
        callback(data)
      })
    }
  }

  const unsubscribeFromMessages = () => {
    if (socket) {
      socket.off('message')
    }
  }

  return (
    <SocketContext.Provider 
      value={{
        socket,
        isConnected,
        joinRoom,
        sendMessage,
        subscribeToMessages,
        unsubscribeFromMessages
      }}
    >
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  const context = useContext(SocketContext)
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}