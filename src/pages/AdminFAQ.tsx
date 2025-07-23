import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  created_at: string;
}

const AdminFAQ = () => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newFAQ, setNewFAQ] = useState({ question: '', answer: '' });
  const [editData, setEditData] = useState({ question: '', answer: '' });
  const [isAddingNew, setIsAddingNew] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAccess();
    loadFAQs();
  }, [user]);

  const checkAdminAccess = async () => {
    if (!user) {
      navigate('/');
      return;
    }

    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error || userData?.role !== 'admin') {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access this page.",
          variant: "destructive"
        });
        navigate('/');
      }
    } catch (error) {
      navigate('/');
    }
  };

  const loadFAQs = async () => {
    try {
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFaqs(data || []);
    } catch (error) {
      console.error('Error loading FAQs:', error);
      toast({
        title: "Error",
        description: "Failed to load FAQs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddFAQ = async () => {
    if (!newFAQ.question.trim() || !newFAQ.answer.trim()) {
      toast({
        title: "Error",
        description: "Please fill in both question and answer",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('faqs')
        .insert({
          question: newFAQ.question,
          answer: newFAQ.answer,
          created_by: user?.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "FAQ added successfully"
      });

      setNewFAQ({ question: '', answer: '' });
      setIsAddingNew(false);
      loadFAQs();
    } catch (error) {
      console.error('Error adding FAQ:', error);
      toast({
        title: "Error",
        description: "Failed to add FAQ",
        variant: "destructive"
      });
    }
  };

  const handleEditFAQ = async (id: string) => {
    if (!editData.question.trim() || !editData.answer.trim()) {
      toast({
        title: "Error",
        description: "Please fill in both question and answer",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('faqs')
        .update({
          question: editData.question,
          answer: editData.answer
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "FAQ updated successfully"
      });

      setEditingId(null);
      loadFAQs();
    } catch (error) {
      console.error('Error updating FAQ:', error);
      toast({
        title: "Error",
        description: "Failed to update FAQ",
        variant: "destructive"
      });
    }
  };

  const handleDeleteFAQ = async (id: string) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return;

    try {
      const { error } = await supabase
        .from('faqs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "FAQ deleted successfully"
      });

      loadFAQs();
    } catch (error) {
      console.error('Error deleting FAQ:', error);
      toast({
        title: "Error",
        description: "Failed to delete FAQ",
        variant: "destructive"
      });
    }
  };

  const startEdit = (faq: FAQ) => {
    setEditingId(faq.id);
    setEditData({ question: faq.question, answer: faq.answer });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({ question: '', answer: '' });
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
          <div>
            <h1 className="text-3xl font-bold">Admin FAQ Manager</h1>
            <p className="text-muted-foreground">Manage frequently asked questions</p>
          </div>
          <Badge variant="secondary">Admin Panel</Badge>
        </div>

        {/* Add New FAQ */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add New FAQ
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!isAddingNew ? (
              <Button onClick={() => setIsAddingNew(true)} variant="electric">
                Add FAQ
              </Button>
            ) : (
              <div className="space-y-4">
                <Input
                  placeholder="Question..."
                  value={newFAQ.question}
                  onChange={(e) => setNewFAQ({ ...newFAQ, question: e.target.value })}
                />
                <Textarea
                  placeholder="Answer..."
                  value={newFAQ.answer}
                  onChange={(e) => setNewFAQ({ ...newFAQ, answer: e.target.value })}
                  rows={4}
                />
                <div className="flex gap-2">
                  <Button onClick={handleAddFAQ} variant="electric">
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                  <Button 
                    onClick={() => {
                      setIsAddingNew(false);
                      setNewFAQ({ question: '', answer: '' });
                    }} 
                    variant="outline"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* FAQ List */}
        <div className="space-y-4">
          {faqs.map((faq) => (
            <Card key={faq.id}>
              <CardContent className="pt-6">
                {editingId === faq.id ? (
                  <div className="space-y-4">
                    <Input
                      value={editData.question}
                      onChange={(e) => setEditData({ ...editData, question: e.target.value })}
                    />
                    <Textarea
                      value={editData.answer}
                      onChange={(e) => setEditData({ ...editData, answer: e.target.value })}
                      rows={4}
                    />
                    <div className="flex gap-2">
                      <Button onClick={() => handleEditFAQ(faq.id)} variant="electric" size="sm">
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                      <Button onClick={cancelEdit} variant="outline" size="sm">
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-lg">{faq.question}</h3>
                      <div className="flex gap-2">
                        <Button onClick={() => startEdit(faq)} variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          onClick={() => handleDeleteFAQ(faq.id)} 
                          variant="ghost" 
                          size="sm"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-muted-foreground">{faq.answer}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Created: {new Date(faq.created_at).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {faqs.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <h3 className="text-xl font-semibold mb-2">No FAQs yet</h3>
              <p className="text-muted-foreground">Add your first FAQ to get started.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminFAQ;