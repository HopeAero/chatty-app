'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Room, Message } from '@/shared/types/room.interface'
import ChatWindow from '../components/ChatWindows'
import axios from '@/lib/axios'
import ChatList from '../components/ChatList'

export default function ChatPage() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [currentUserUsername, setCurrentUserName] = useState<string>('')
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    const username = localStorage.getItem('username')
    if (!token || !username) {
      router.push('/login')
      return
    }
    setCurrentUserName(username)
    fetchRooms()
  }, [router])

  const fetchRooms = async () => {
    try {
      const response = await axios.get('/chat/my-rooms')
      const roomsWithMessages = response.data.map((room: Room) => ({
        ...room,
        messages: room.messages || []
      }))
      setRooms(roomsWithMessages)
    } catch (error) {
      console.error('Error fetching rooms:', error)
    }
  }

  const handleNewMessage = (message: Message) => {
    // Actualizar la lista de rooms
    setRooms(prevRooms => {
      return prevRooms.map(room => {
        if (room._id === message._id) {
          return {
            ...room,
            messages: [...(room.messages || []), message],
            lastMessage: message
          }
        }
        return room
      })
    })

    // Actualizar el room seleccionado si corresponde
    if (selectedRoom && selectedRoom._id === message._id) {
      setSelectedRoom(prev => {
        if (!prev) return null
        return {
          ...prev,
          messages: [...(prev.messages || []), message]
        }
      })
    }
  }

  const handleSelectRoom = async (room: Room) => {
    try {
      const response = await axios.get(`/chat/room/${room._id}`)
      const fullRoom = response.data
      setSelectedRoom(fullRoom)
    } catch (error) {
      console.error('Error fetching room details:', error)
    }
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <ChatList rooms={rooms} onSelectRoom={handleSelectRoom} />
      <ChatWindow 
        selectedRoom={selectedRoom} 
        currentUserUsername={currentUserUsername}
      />
    </div>
  )
}