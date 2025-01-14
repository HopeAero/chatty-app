import { useState, useMemo } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Room } from '@/shared/types/room.interface';

interface ChatListProps {
  rooms: Room[];
  onSelectRoom: (room: Room) => void;
}

export default function ChatList({ rooms, onSelectRoom }: ChatListProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredRooms = useMemo(() => {
    return rooms.filter(room => 
      room.members.some(member => 
        member.username.toLowerCase().includes(searchTerm.toLowerCase())
      ) ||
      (room.type === 'GROUP' && (room.name ?? '').toLowerCase().includes(searchTerm.toLowerCase()))
    )
  }, [rooms, searchTerm])

  const getRoomName = (room: Room) => {
    if (room.type === 'GROUP') {
      return room.name || `Grupo (${room.members.length} miembros)`
    } else {
      return room.members[0].username // Asumiendo que el primer miembro es el otro usuario en un chat individual
    }
  }

  const getLastMessage = (room: Room) => {
    const lastMessage = room.lastMessage
    return lastMessage ? lastMessage.contents : 'No hay mensajes'
  }

  return (
    <div className="w-1/3 bg-white border-r">
      <div className="p-4">
        <Input 
          type="text" 
          placeholder="Buscar chat..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-4"
        />
      </div>
      <ScrollArea className="h-[calc(100vh-80px)]">
        {filteredRooms.map(room => (
          <div 
            key={room._id} 
            className="flex items-center p-4 hover:bg-gray-100 cursor-pointer"
            onClick={() => onSelectRoom(room)}
          >
            <Avatar className="h-12 w-12">
              <AvatarImage src={`/avatar${room._id}.png`} alt={getRoomName(room)} />
              <AvatarFallback>{getRoomName(room).charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="ml-4">
              <h3 className="font-semibold">{getRoomName(room)}</h3>
              <p className="text-sm text-gray-500">{getLastMessage(room)}</p>
            </div>
          </div>
        ))}
      </ScrollArea>
    </div>
  )
}