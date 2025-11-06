import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, XCircle, Clock, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface BioMentionRequest {
  id: string;
  requester_id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  requester: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string | null;
  };
}

interface SentRequest {
  id: string;
  mentioned_user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  mentioned_user: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string | null;
  };
}

export const BioMentionRequests = () => {
  const { user } = useAuth();
  const [allowMentions, setAllowMentions] = useState(true);
  const [receivedRequests, setReceivedRequests] = useState<BioMentionRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<SentRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
  }, [user?.id]);

  const fetchData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Fetch current setting
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('allow_bio_mentions')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      setAllowMentions(profileData?.allow_bio_mentions ?? true);

      // Fetch received requests
      const { data: received, error: receivedError } = await supabase
        .from('bio_mention_requests')
        .select(`
          id,
          requester_id,
          status,
          created_at,
          requester:profiles!bio_mention_requests_requester_id_fkey(id, username, full_name, avatar_url)
        `)
        .eq('mentioned_user_id', user.id)
        .order('created_at', { ascending: false });

      if (receivedError) throw receivedError;
      setReceivedRequests((received || []) as BioMentionRequest[]);

      // Fetch sent requests
      const { data: sent, error: sentError } = await supabase
        .from('bio_mention_requests')
        .select(`
          id,
          mentioned_user_id,
          status,
          created_at,
          mentioned_user:profiles!bio_mention_requests_mentioned_user_id_fkey(id, username, full_name, avatar_url)
        `)
        .eq('requester_id', user.id)
        .order('created_at', { ascending: false });

      if (sentError) throw sentError;
      setSentRequests((sent || []) as SentRequest[]);
    } catch (error) {
      console.error('Error fetching bio mention requests:', error);
      toast.error('Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAllowMentions = async (value: boolean) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ allow_bio_mentions: value })
        .eq('id', user.id);

      if (error) throw error;

      setAllowMentions(value);
      toast.success(
        value
          ? 'Você agora pode ser mencionado em bios'
          : 'Você não pode mais ser mencionado em bios'
      );
    } catch (error) {
      console.error('Error updating bio mention setting:', error);
      toast.error('Erro ao atualizar configuração');
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('bio_mention_requests')
        .update({ status: 'approved', updated_at: new Date().toISOString() })
        .eq('id', requestId);

      if (error) throw error;

      toast.success('Pedido aprovado!');
      fetchData();
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('Erro ao aprovar pedido');
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('bio_mention_requests')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', requestId);

      if (error) throw error;

      toast.success('Pedido rejeitado');
      fetchData();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Erro ao rejeitar pedido');
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('bio_mention_requests')
        .delete()
        .eq('id', requestId);

      if (error) throw error;

      toast.success('Pedido cancelado');
      fetchData();
    } catch (error) {
      console.error('Error deleting request:', error);
      toast.error('Erro ao cancelar pedido');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Aprovado
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Rejeitado
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Pendente
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Settings */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="allow-mentions" className="font-semibold">
              Permitir menções na bio
            </Label>
            <p className="text-xs text-muted-foreground">
              Outros usuários podem te mencionar em suas bios (com sua aprovação)
            </p>
          </div>
          <Switch
            id="allow-mentions"
            checked={allowMentions}
            onCheckedChange={handleToggleAllowMentions}
          />
        </div>
      </Card>

      {/* Received Requests */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm">Pedidos Recebidos</h3>
        {receivedRequests.length === 0 ? (
          <Card className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Nenhum pedido recebido</p>
          </Card>
        ) : (
          receivedRequests.map((request) => (
            <Card key={request.id} className="p-4">
              <div className="flex items-start gap-3">
                <Avatar className="w-10 h-10">
                  {request.requester.avatar_url ? (
                    <img
                      src={request.requester.avatar_url}
                      alt={request.requester.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold">
                      {request.requester.full_name[0]?.toUpperCase()}
                    </div>
                  )}
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{request.requester.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    @{request.requester.username}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Quer te mencionar na bio
                  </p>
                  <div className="mt-2">{getStatusBadge(request.status)}</div>
                  {request.status === 'pending' && (
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(request.id)}
                        className="h-8"
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Aprovar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(request.id)}
                        className="h-8"
                      >
                        <XCircle className="w-3 h-3 mr-1" />
                        Rejeitar
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <Separator />

      {/* Sent Requests */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm">Pedidos Enviados</h3>
        {sentRequests.length === 0 ? (
          <Card className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Nenhum pedido enviado</p>
          </Card>
        ) : (
          sentRequests.map((request) => (
            <Card key={request.id} className="p-4">
              <div className="flex items-start gap-3">
                <Avatar className="w-10 h-10">
                  {request.mentioned_user.avatar_url ? (
                    <img
                      src={request.mentioned_user.avatar_url}
                      alt={request.mentioned_user.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold">
                      {request.mentioned_user.full_name[0]?.toUpperCase()}
                    </div>
                  )}
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{request.mentioned_user.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    @{request.mentioned_user.username}
                  </p>
                  <div className="mt-2">{getStatusBadge(request.status)}</div>
                  {request.status === 'pending' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteRequest(request.id)}
                      className="h-8 mt-2 text-destructive"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Cancelar pedido
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
