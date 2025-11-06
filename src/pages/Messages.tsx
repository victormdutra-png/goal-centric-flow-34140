import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Send, Search } from 'lucide-react';

export default function Messages() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedUserId = searchParams.get('user');
  const { users, currentUserId, followers } = useAppStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<Array<{
    id: string;
    senderId: string;
    text: string;
    timestamp: Date;
  }>>([]);
  
  // Check if two users are mutual followers
  const areMutualFollowers = (userId: string) => {
    const userFollowers = followers.get(userId) || [];
    const currentFollowers = followers.get(currentUserId) || [];
    return userFollowers.includes(currentUserId) && currentFollowers.includes(userId);
  };

  const otherUsers = users.filter((u) => u.id !== currentUserId);
  // Filter to show only mutual followers
  const mutualUsers = otherUsers.filter((u) => areMutualFollowers(u.id));
  const filteredUsers = mutualUsers.filter((u) =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedUser = selectedUserId ? users.find((u) => u.id === selectedUserId) : null;
  const canChat = selectedUser ? areMutualFollowers(selectedUser.id) : false;

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedUserId) return;

    const newMessage = {
      id: `msg${Date.now()}`,
      senderId: currentUserId,
      text: messageText,
      timestamp: new Date(),
    };

    setMessages([...messages, newMessage]);
    setMessageText('');
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-[420px] mx-auto">
        <Header />
        
        {/* Subheader */}
        <div className="px-4 py-3 border-b border-border bg-background/95 backdrop-blur-sm sticky top-[73px] z-30">
          <div className="flex items-center gap-3">
            {selectedUser && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/messages')} 
                className="h-8 w-8 p-0"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <h2 className="text-lg font-bold text-foreground">
              {selectedUser ? selectedUser.name : 'Mensagens'}
            </h2>
          </div>
        </div>

        {/* Content */}
        {!selectedUser ? (
          <div className="px-4 py-4 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar usuário..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* User List */}
            <div className="space-y-2">
              {filteredUsers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhum usuário encontrado</p>
              ) : (
                filteredUsers.map((user) => (
                  <Card
                    key={user.id}
                    className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => navigate(`/messages?user=${user.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{user.avatar}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-card-foreground truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.bio}</p>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        ) : !canChat ? (
          <div className="px-4 py-8 text-center">
            <div className="text-4xl mb-3">{selectedUser.avatar}</div>
            <p className="text-card-foreground font-semibold mb-2">{selectedUser.name}</p>
            <p className="text-sm text-muted-foreground">
              Você e {selectedUser.name} precisam se seguir mutuamente para iniciar uma conversa.
            </p>
          </div>
        ) : (
          <div className="flex flex-col h-[calc(100vh-153px)]">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">{selectedUser.avatar}</div>
                  <p className="text-muted-foreground text-sm">
                    Inicie uma conversa com {selectedUser.name}
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isOwnMessage = msg.senderId === currentUserId;
                  const sender = users.find((u) => u.id === msg.senderId);

                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-2 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      <div className="text-lg flex-shrink-0">{sender?.avatar}</div>
                      <div
                        className={`max-w-[70%] rounded-lg px-3 py-2 ${
                          isOwnMessage
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-card-foreground'
                        }`}
                      >
                        <p className="text-sm">{msg.text}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {msg.timestamp.toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Message Input */}
            <div className="border-t border-border p-4 bg-background">
              <div className="flex gap-2">
                <Input
                  placeholder="Digite sua mensagem..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1"
                />
                <Button size="sm" onClick={handleSendMessage} disabled={!messageText.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
