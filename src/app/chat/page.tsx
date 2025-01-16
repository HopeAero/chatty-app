'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Room, responseMessage } from '@/shared/types/room.interface'
import ChatWindow from '../components/ChatWindows'
import axios from '@/lib/axios'
import ChatList from '../components/ChatList'
import { useSocket } from '../context/SocketProvider'

export default function ChatPage() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [currentUserUsername, setCurrentUserName] = useState<string>('')
  const { subscribeToMessages, unsubscribeFromMessages, isConnected } = useSocket()
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

  useEffect(() => {
    if (isConnected) {
      const handleNewMessage = (data: responseMessage) => {
        const formattedMessage = {
          ...data,
          createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
          updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
        };

        setRooms(prevRooms => {
          return prevRooms.map(room => {
            if (room._id === formattedMessage.roomId) {
              return {
                ...room,
                messages: [...(room.messages || []), formattedMessage],
                lastMessage: formattedMessage
              };
            }
            return room;
          });
        });

        if (selectedRoom && selectedRoom._id === formattedMessage.roomId) {
          setSelectedRoom(prev => {
            if (!prev) return null;
            return {
              ...prev,
              messages: [...(prev.messages || []), formattedMessage],
              lastMessage: formattedMessage
            };
          });
        }
      };

      subscribeToMessages(handleNewMessage);

      return () => {
        unsubscribeFromMessages();
      };
    }
  }, [isConnected, selectedRoom, subscribeToMessages, unsubscribeFromMessages]);

  const handleSelectRoom = async (room: Room) => {
    try {
      const response = await axios.get(`/chat/room/${room._id}`);
      const fullRoom = response.data;
      setSelectedRoom(fullRoom);
    } catch (error) {
      console.error('Error fetching room details:', error);
    }
  };

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