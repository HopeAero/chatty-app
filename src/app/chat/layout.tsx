import { SocketProvider } from '../context/SocketProvider'
import ChatPage from './page'

function App() {
  return (
    <SocketProvider>
      <ChatPage />
    </SocketProvider>
  )
}

export default App