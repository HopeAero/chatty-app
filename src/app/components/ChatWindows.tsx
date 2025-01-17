'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send } from 'lucide-react'
import { Room, Message, responseMessage } from '@/shared/types/room.interface'
import { useSocket } from '../context/SocketProvider'

interface ChatWindowProps {
  selectedRoom: Room | null;
  currentUserUsername: string;
}

export default function ChatWindow({ selectedRoom, currentUserUsername }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const { sendMessage, subscribeToMessages, unsubscribeFromMessages, isConnected } = useSocket()
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedRoom) {
      const member = selectedRoom.members.find(member => member.username === currentUserUsername)
      if (member) {
        setCurrentUserId(member.userId)
      }
      setMessages(selectedRoom.messages || [])
      // Scroll to bottom when entering a new chat
      setTimeout(scrollToBottom, 100)
    }
  }, [selectedRoom, currentUserUsername])

  useEffect(() => {
    if (selectedRoom && isConnected) {
      const handleNewMessage = (data: responseMessage) => {
        if (data.roomId === selectedRoom._id) {
          const formattedMessage = {
            ...data,
            createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
            updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
          }
          setMessages(prevMessages => [...prevMessages, formattedMessage])
          scrollToBottom()
        }
      }

      subscribeToMessages(handleNewMessage)

      return () => {
        unsubscribeFromMessages()
      }
    }
  }, [selectedRoom, isConnected, subscribeToMessages, unsubscribeFromMessages])

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollableArea = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollableArea) {
        const scroll = () => {
          scrollableArea.scrollTop = scrollableArea.scrollHeight;
        }
        scroll();
        setTimeout(scroll, 50);
      }
    }
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (newMessage.trim() && selectedRoom) {
      const message = { 
        roomId: selectedRoom._id,
        senderId: currentUserId,
        contents: newMessage,
      }
      sendMessage(message)
      setNewMessage('')
      scrollToBottom()
    }
  }

  const getRoomName = (room: Room) => {
    if (room.type === 'GROUP') {
      return `Grupo (${room.members.length} miembros)`
    } else {
      const otherMember = room.members.find(member => member.userId !== currentUserId)
      return otherMember ? otherMember.username : 'Chat'
    }
  }

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }

  if (!selectedRoom) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Selecciona un chat para comenzar</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-[#e5ddd5] h-screen">
      {/* Header */}
      <div className="bg-[#f0f2f5] px-4 py-2 flex items-center shadow-sm">
        <Avatar className="h-10 w-10">
          <AvatarImage src={`/avatar${selectedRoom._id}.png`} alt={getRoomName(selectedRoom)} />
          <AvatarFallback>{getRoomName(selectedRoom).charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="ml-3">
          <h2 className="font-semibold">{getRoomName(selectedRoom)}</h2>
          <p className="text-xs text-gray-500">
            {selectedRoom.type === 'GROUP' ? `${selectedRoom.members.length} miembros` : ''}
          </p>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 px-[10%] py-4" ref={scrollAreaRef}>
        <div className="space-y-1">
          {messages.map((message: Message, index: number) => {
            const isCurrentUser = message.senderId === currentUserId;
            const messageKey = message._id || `${message.senderId}-${index}-${message.createdAt?.getTime()}`;
            
            return (
              <div 
                key={messageKey}
                className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`
                    relative max-w-[65%] px-2 py-[6px] 
                    ${isCurrentUser 
                      ? 'bg-[#d1e7dd] rounded-lg rounded-tr-none' 
                      : 'bg-white rounded-lg rounded-tl-none'
                    }
                  `}
                >
                  {selectedRoom.type === 'GROUP' && !isCurrentUser && (
                    <div className="text-xs font-medium text-[#5e72e4] mb-[2px]">
                      {selectedRoom.members.find(m => m.userId === message.senderId)?.username}
                    </div>
                  )}
                  <div className="text-[13px] text-[#111b21] leading-[19px]">
                    {message.contents}
                  </div>
                  <div className="text-[11px] text-[#667781] float-right ml-2 mt-[2px]">
                    {formatTime(message.createdAt)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="px-4 py-3 bg-[#f0f2f5]">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input 
            type="text" 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="flex-1 bg-white border-0 focus-visible:ring-0 rounded-full text-sm py-5"
          />
          <Button 
            type="submit" 
            size="icon"
            disabled={!newMessage.trim()}
            className="rounded-full bg-[#00a884] hover:bg-[#00a884]/90 h-[40px] w-[40px] p-0"
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </div>
  )
}