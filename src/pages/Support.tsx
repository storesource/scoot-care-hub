import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, ArrowLeft, AlertCircle, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import Header from "@/components/Header";

interface SupportTicket {
  id: string;
  summary: string;
  file_url?: string;
  status: string;
  created_at: string;
}

const Support = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newTicket, setNewTicket] = useState({ summary: "", file: null as File | null });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('support_queries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast({
        title: "Error",
        description: "Failed to load support tickets",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('chat-files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-files')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    }
  };

  const createTicket = async () => {
    if (!newTicket.summary.trim() || !user) return;

    try {
      let fileUrl = null;
      if (newTicket.file) {
        fileUrl = await uploadFile(newTicket.file);
      }

      const { error } = await supabase
        .from('support_queries')
        .insert({
          user_id: user.id,
          summary: newTicket.summary,
          file_url: fileUrl,
          status: 'open'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Support ticket created successfully"
      });

      setNewTicket({ summary: "", file: null });
      setIsCreating(false);
      fetchTickets();
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast({
        title: "Error",
        description: "Failed to create support ticket",
        variant: "destructive"
      });
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setNewTicket({ ...newTicket, file });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Support Tickets</h1>
              <p className="text-muted-foreground">Track and manage your support requests</p>
            </div>
          </div>
          <Button onClick={() => setIsCreating(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            New Ticket
          </Button>
        </div>

        {/* Create Ticket Form */}
        {isCreating && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Create Support Ticket</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Issue Summary</label>
                <Textarea
                  placeholder="Describe your issue or question..."
                  value={newTicket.summary}
                  onChange={(e) => setNewTicket({ ...newTicket, summary: e.target.value })}
                  rows={4}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Attachment (Optional)</label>
                <Input
                  type="file"
                  accept="image/*,audio/*,.pdf,.doc,.docx"
                  onChange={handleFileSelect}
                />
                {newTicket.file && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Selected: {newTicket.file.name}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Button onClick={createTicket} disabled={!newTicket.summary.trim()}>
                  Create Ticket
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsCreating(false);
                    setNewTicket({ summary: "", file: null });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tickets List */}
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <Card key={ticket.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                    <Badge variant={ticket.status === 'open' ? 'destructive' : 'default'}>
                      {ticket.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                <p className="text-sm mb-2">{ticket.summary}</p>
                
                {ticket.file_url && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <FileText className="w-3 h-3" />
                    <a 
                      href={ticket.file_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="underline hover:text-foreground"
                    >
                      View attachment
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          
          {tickets.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No support tickets yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first support ticket to get help from our team.
                </p>
                <Button onClick={() => setIsCreating(true)} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Ticket
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Support;