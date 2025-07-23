import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, MessageSquare, FileText, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface KnowledgebaseEntry {
  id: string;
  question: string;
  type: 'qna' | 'function';
  resolution: string;
  metadata: any;
  created_at: string;
}

interface SupportQuery {
  id: string;
  user_id: string;
  session_id: string | null;
  summary: string;
  file_url?: string;
  status: string;
  created_at: string;
}

export const AdminDashboard = () => {
  const [knowledgebase, setKnowledgebase] = useState<KnowledgebaseEntry[]>([]);
  const [supportQueries, setSupportQueries] = useState<SupportQuery[]>([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [newResolution, setNewResolution] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchKnowledgebase();
    fetchSupportQueries();
  }, []);

  const fetchKnowledgebase = async () => {
    const { data, error } = await supabase
      .from('knowledgebase')
      .select('*')
      .order('created_at');
    
    if (error) {
      toast({ title: "Error", description: "Failed to fetch knowledgebase", variant: "destructive" });
    } else {
      setKnowledgebase((data || []) as KnowledgebaseEntry[]);
    }
  };

  const fetchSupportQueries = async () => {
    console.log('Fetching support queries...');
    
    // First check user role
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No authenticated user found');
      toast({ title: "Error", description: "Authentication required", variant: "destructive" });
      return;
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabase
      .rpc('get_user_role', { user_id: user.id });
    
    if (roleError) {
      console.error('Error checking user role:', roleError);
      toast({ title: "Error", description: "Failed to verify admin permissions", variant: "destructive" });
      return;
    }

    console.log('User role:', roleData);
    if (roleData !== 'admin') {
      console.error('User is not admin, role:', roleData);
      toast({ title: "Error", description: "Admin access required", variant: "destructive" });
      return;
    }

    const { data, error } = await supabase
      .from('support_queries')
      .select('*')
      .order('created_at', { ascending: false });
    
    console.log('Support queries fetch result:', { data, error });
    
    if (error) {
      console.error('Support queries fetch error:', error);
      toast({ title: "Error", description: `Failed to fetch support queries: ${error.message}`, variant: "destructive" });
    } else {
      console.log('Successfully fetched support queries:', data?.length || 0, 'items');
      setSupportQueries(data || []);
    }
  };

  const addKnowledgebaseEntry = async () => {
    if (!newQuestion.trim() || !newResolution.trim()) return;
    
    const { error } = await supabase
      .from('knowledgebase')
      .insert([{ 
        question: newQuestion, 
        type: 'qna',
        resolution: newResolution,
        metadata: {}
      }]);
    
    if (error) {
      toast({ title: "Error", description: "Failed to add knowledge entry", variant: "destructive" });
    } else {
      setNewQuestion("");
      setNewResolution("");
      fetchKnowledgebase();
      toast({ title: "Success", description: "Knowledge entry added" });
    }
  };

  const deleteKnowledgebaseEntry = async (id: string) => {
    const { error } = await supabase
      .from('knowledgebase')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast({ title: "Error", description: "Failed to delete entry", variant: "destructive" });
    } else {
      fetchKnowledgebase();
      toast({ title: "Success", description: "Entry deleted" });
    }
  };

  const updateSupportQueryStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('support_queries')
      .update({ status })
      .eq('id', id);
    
    if (error) {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    } else {
      fetchSupportQueries();
      toast({ title: "Success", description: "Status updated" });
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-electric rounded-full flex items-center justify-center">
              <span className="text-white font-bold">S</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">ScootCare</h1>
              <p className="text-sm text-muted-foreground -mt-1">Admin Portal</p>
            </div>
          </div>
        </div>
        
        <Tabs defaultValue="knowledgebase" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="knowledgebase" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Knowledge Base
            </TabsTrigger>
            <TabsTrigger value="support" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Support Queries
            </TabsTrigger>
          </TabsList>

          <TabsContent value="knowledgebase">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 text-blue-600">Manage Chat Knowledge Base</h2>
              
              <div className="space-y-3 mb-6">
                <div>
                  <Label htmlFor="question">Question</Label>
                  <Input
                    id="question"
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    placeholder="Enter question"
                  />
                </div>
                
                <div>
                  <Label htmlFor="resolution">Answer</Label>
                  <Textarea
                    id="resolution"
                    value={newResolution}
                    onChange={(e) => setNewResolution(e.target.value)}
                    placeholder="Enter answer"
                    rows={3}
                  />
                </div>
                
                <Button onClick={addKnowledgebaseEntry} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Knowledge Entry
                </Button>
              </div>
              
              <div className="space-y-3">
                {knowledgebase.map((entry) => (
                  <div key={entry.id} className="p-4 bg-secondary rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-medium text-sm">{entry.question}</p>
                          <Badge variant="default">Q&A</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{entry.resolution}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteKnowledgebaseEntry(entry.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="support">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 text-blue-600">Support Queries</h2>
              
              <div className="space-y-4">
                {supportQueries.map((query) => (
                  <div key={query.id} className="p-4 bg-secondary rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                        <Badge variant={query.status === 'open' ? 'destructive' : 'default'}>
                          {query.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(query.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        {query.status === 'open' && (
                          <Button
                            size="sm"
                            onClick={() => updateSupportQueryStatus(query.id, 'resolved')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Mark Resolved
                          </Button>
                        )}
                        {query.status === 'resolved' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateSupportQueryStatus(query.id, 'open')}
                          >
                            Reopen
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm mb-2">{query.summary}</p>
                    {query.file_url && (
                      <a 
                        href={query.file_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline"
                      >
                        View attachment
                      </a>
                    )}
                  </div>
                ))}
                
                {supportQueries.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No support queries yet
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};