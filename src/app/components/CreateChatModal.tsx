import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import axios from '@/lib/axios'
import { Plus } from 'lucide-react'

enum RoomType {
  SINGLE = 'SINGLE',
  GROUP = 'GROUP'
}

interface MemberRequest {
  username: string;
}

interface CreateRoomDto {
  name?: string;
  type: RoomType;
  members: MemberRequest[];
}

interface User {
  username: string;
}



export default function CreateChatModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [roomType, setRoomType] = useState<RoomType>(RoomType.SINGLE)
  const [roomName, setRoomName] = useState('')
  const [selectedUsers, setSelectedUsers] = useState<MemberRequest[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [myUsername, setMyUsername] = useState('')

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const response = await axios.get('/auth-rest/users')
      setUsers(response.data)
      setError('')
    } catch (error) {
      console.error('Error fetching users:', error)
      setError('Error fetching users. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchMyUsername = async () => {
    try {
      const response = await axios.get('/auth-rest/my-profile')
      setMyUsername(response.data.username)
    } catch (error) {
      console.error('Error fetching my username:', error)
    }
  }

  const handleCreateChat = async () => {
    if (roomType === RoomType.GROUP && !roomName.trim()) {
      setError('Group name is required for group chats.')
      return
    }

    if (selectedUsers.length === 0) {
      setError('Please select at least one user.')
      return
    }

    if (roomType === RoomType.SINGLE && selectedUsers.length > 1) {
      setError('Single chats can only have one other user.')
      return
    }

    const createRoomDto: CreateRoomDto = {
      type: roomType,
      members: [{ username: myUsername }, ...selectedUsers], // Include current user
    }

    if (roomType === RoomType.GROUP) {
      createRoomDto.name = roomName.trim()
    }

    try {
      setIsLoading(true)
      console.log('createRoomDto', createRoomDto)
      await axios.post('/chat', createRoomDto)
      handleReset()
    } catch (error) {
      console.error('Error creating chat:', error)
      setError('Error creating chat. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setIsOpen(false)
    setRoomType(RoomType.SINGLE)
    setRoomName('')
    setSelectedUsers([])
    setError('')
  }

  const handleRoomTypeChange = (value: RoomType) => {
    setRoomType(value)
    setSelectedUsers([]) // Clear selected users when changing room type
    setError('')
  }

  const toggleUserSelection = (user: User) => {
    // Don't allow selecting yourself
    if (user.username === myUsername) return

    setSelectedUsers(prev => {
      const isSelected = prev.some(u => u.username === user.username)
      
      if (isSelected) {
        // If user is already selected, remove them
        return prev.filter(u => u.username !== user.username)
      } else {
        // If user is not selected
        if (roomType === RoomType.SINGLE) {
          // For single chat, replace any existing selection
          return [{ username: user.username }]
        } else {
          // For group chat, add to existing selections
          return [...prev, { username: user.username }]
        }
      }
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open)
      if (open) {
        fetchMyUsername()
        fetchUsers()
      } else {
        handleReset()
      }
    }}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full mb-4"
        >
          <Plus className="mr-2 h-4 w-4" /> New Chat
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Chat</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex gap-2">
            <Button
              variant={roomType === RoomType.SINGLE ? "default" : "outline"}
              onClick={() => handleRoomTypeChange(RoomType.SINGLE)}
            >
              Single Chat
            </Button>
            <Button
              variant={roomType === RoomType.GROUP ? "default" : "outline"}
              onClick={() => handleRoomTypeChange(RoomType.GROUP)}
            >
              Group Chat
            </Button>
          </div>

          {roomType === RoomType.GROUP && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input 
                id="name" 
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="col-span-3"
                placeholder="Enter group name"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>
              {roomType === RoomType.SINGLE ? 'Select User' : 'Select Users'}
            </Label>
            <ScrollArea className="h-[200px] w-full rounded-md border p-4">
              {isLoading ? (
                <p className="text-center text-muted-foreground">Loading users...</p>
              ) : users.length === 0 ? (
                <p className="text-center text-muted-foreground">No users found</p>
              ) : (
                <div className="space-y-2">
                  {users.map(user => (
                    <div key={user.username} className="flex items-center space-x-2 py-1">
                      <Checkbox 
                        id={`user-${user.username}`}
                        checked={selectedUsers.some(u => u.username === user.username)}
                        onCheckedChange={() => toggleUserSelection(user)}
                        disabled={user.username === myUsername} // Disable selecting yourself
                      />
                      <Label
                        htmlFor={`user-${user.username}`}
                        className="text-sm font-medium leading-none cursor-pointer"
                      >
                        {user.username}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        {error && (
          <p className="text-destructive text-sm mb-2">{error}</p>
        )}

        <Button 
          onClick={handleCreateChat} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Creating...' : 'Create Chat'}
        </Button>
      </DialogContent>
    </Dialog>
  )
}