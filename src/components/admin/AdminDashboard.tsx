import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StarterQuestion {
  id: string;
  question: string;
  order_hint: number;
}

interface KnowledgebaseEntry {
  id: string;
  question: string;
  answer: string;
}

export const AdminDashboard = () => {
  const [starterQuestions, setStarterQuestions] = useState<StarterQuestion[]>([]);
  const [knowledgebase, setKnowledgebase] = useState<KnowledgebaseEntry[]>([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [newKbQuestion, setNewKbQuestion] = useState("");
  const [newKbAnswer, setNewKbAnswer] = useState("");
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);
  const [editingKb, setEditingKb] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchStarterQuestions();
    fetchKnowledgebase();
  }, []);

  const fetchStarterQuestions = async () => {
    const { data, error } = await supabase
      .from('starter_questions')
      .select('*')
      .order('order_hint');
    
    if (error) {
      toast({ title: "Error", description: "Failed to fetch starter questions", variant: "destructive" });
    } else {
      setStarterQuestions(data || []);
    }
  };

  const fetchKnowledgebase = async () => {
    const { data, error } = await supabase
      .from('chat_knowledgebase')
      .select('*')
      .order('created_at');
    
    if (error) {
      toast({ title: "Error", description: "Failed to fetch knowledgebase", variant: "destructive" });
    } else {
      setKnowledgebase(data || []);
    }
  };

  const addStarterQuestion = async () => {
    if (!newQuestion.trim()) return;
    
    const { error } = await supabase
      .from('starter_questions')
      .insert([{ question: newQuestion, order_hint: starterQuestions.length }]);
    
    if (error) {
      toast({ title: "Error", description: "Failed to add question", variant: "destructive" });
    } else {
      setNewQuestion("");
      fetchStarterQuestions();
      toast({ title: "Success", description: "Question added successfully" });
    }
  };

  const deleteStarterQuestion = async (id: string) => {
    const { error } = await supabase
      .from('starter_questions')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast({ title: "Error", description: "Failed to delete question", variant: "destructive" });
    } else {
      fetchStarterQuestions();
      toast({ title: "Success", description: "Question deleted" });
    }
  };

  const addKnowledgebaseEntry = async () => {
    if (!newKbQuestion.trim() || !newKbAnswer.trim()) return;
    
    const { error } = await supabase
      .from('chat_knowledgebase')
      .insert([{ question: newKbQuestion, answer: newKbAnswer }]);
    
    if (error) {
      toast({ title: "Error", description: "Failed to add knowledge entry", variant: "destructive" });
    } else {
      setNewKbQuestion("");
      setNewKbAnswer("");
      fetchKnowledgebase();
      toast({ title: "Success", description: "Knowledge entry added" });
    }
  };

  const deleteKnowledgebaseEntry = async (id: string) => {
    const { error } = await supabase
      .from('chat_knowledgebase')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast({ title: "Error", description: "Failed to delete entry", variant: "destructive" });
    } else {
      fetchKnowledgebase();
      toast({ title: "Success", description: "Entry deleted" });
    }
  };

  return (
    <div className="min-h-screen bg-background p-4" style={{ accentColor: 'hsl(217, 91%, 60%)' }}>
      <div className="max-w-4xl mx-auto space-y-6">
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
        
        {/* Starter Questions Section */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-600">Manage Starter Questions</h2>
          
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Add new starter question..."
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              className="flex-1"
            />
            <Button onClick={addStarterQuestion} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-2">
            {starterQuestions.map((question) => (
              <div key={question.id} className="flex items-center gap-2 p-3 bg-secondary rounded-lg">
                <span className="flex-1">{question.question}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteStarterQuestion(question.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </Card>

        {/* Knowledge Base Section */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-600">Manage Chat Knowledge Base</h2>
          
          <div className="space-y-3 mb-4">
            <Input
              placeholder="Question pattern..."
              value={newKbQuestion}
              onChange={(e) => setNewKbQuestion(e.target.value)}
            />
            <Textarea
              placeholder="Answer..."
              value={newKbAnswer}
              onChange={(e) => setNewKbAnswer(e.target.value)}
              rows={3}
            />
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
                    <p className="font-medium text-sm">{entry.question}</p>
                    <p className="text-sm text-muted-foreground mt-1">{entry.answer}</p>
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
      </div>
    </div>
  );
};