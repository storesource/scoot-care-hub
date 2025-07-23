import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAdmin, QAPair } from '@/contexts/AdminContext';
import { Plus, Edit, Trash2, LogOut, MessageSquare, Database } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const AdminPanel = () => {
  const { qaPairs, addQAPair, updateQAPair, deleteQAPair, logoutAdmin } = useAdmin();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    keywords: ''
  });

  const handleSave = () => {
    if (!formData.question.trim() || !formData.answer.trim()) return;

    const keywords = formData.keywords.split(',').map(k => k.trim()).filter(k => k);
    
    if (editingId) {
      updateQAPair(editingId, {
        question: formData.question,
        answer: formData.answer,
        keywords
      });
      setEditingId(null);
    } else {
      addQAPair({
        question: formData.question,
        answer: formData.answer,
        keywords
      });
      setShowAddForm(false);
    }
    
    setFormData({ question: '', answer: '', keywords: '' });
  };

  const handleEdit = (qa: QAPair) => {
    setFormData({
      question: qa.question,
      answer: qa.answer,
      keywords: qa.keywords.join(', ')
    });
    setEditingId(qa.id);
    setShowAddForm(false);
  };

  const handleCancel = () => {
    setEditingId(null);
    setShowAddForm(false);
    setFormData({ question: '', answer: '', keywords: '' });
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this Q&A pair?')) {
      deleteQAPair(id);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Database className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">ScootCare Admin Panel</h1>
              <p className="text-muted-foreground">Manage chatbot Q&A database</p>
            </div>
          </div>
          <Button onClick={logoutAdmin} variant="outline" className="gap-2">
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{qaPairs.length}</p>
                  <p className="text-sm text-muted-foreground">Total Q&A Pairs</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Plus className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">
                    {qaPairs.filter(qa => new Date(qa.createdAt).toDateString() === new Date().toDateString()).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Added Today</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Edit className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">
                    {qaPairs.reduce((acc, qa) => acc + qa.keywords.length, 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Keywords</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add/Edit Form */}
        {(showAddForm || editingId) && (
          <Card>
            <CardHeader>
              <CardTitle>{editingId ? 'Edit Q&A Pair' : 'Add New Q&A Pair'}</CardTitle>
              <CardDescription>
                Create or modify questions and answers for the chatbot
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="question">Question/Topic</Label>
                <Input
                  id="question"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  placeholder="e.g., Battery not charging"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="answer">Answer</Label>
                <Textarea
                  id="answer"
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  placeholder="Provide a helpful response to the customer..."
                  className="min-h-[100px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="keywords">Keywords (comma-separated)</Label>
                <Input
                  id="keywords"
                  value={formData.keywords}
                  onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                  placeholder="battery, charge, charging, power"
                />
                <p className="text-xs text-muted-foreground">
                  These keywords help the chatbot match user questions to this answer
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave} variant="electric">
                  {editingId ? 'Update' : 'Add'} Q&A Pair
                </Button>
                <Button onClick={handleCancel} variant="outline">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Q&A List */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Q&A Database</CardTitle>
                <CardDescription>Manage all chatbot responses</CardDescription>
              </div>
              {!showAddForm && !editingId && (
                <Button onClick={() => setShowAddForm(true)} variant="electric" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Q&A Pair
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {qaPairs.map((qa) => (
                <Card key={qa.id} className="border-l-4 border-l-primary">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 space-y-2">
                        <h3 className="font-semibold text-lg">{qa.question}</h3>
                        <p className="text-muted-foreground">{qa.answer}</p>
                        <div className="flex flex-wrap gap-1">
                          {qa.keywords.map((keyword, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Updated: {qa.updatedAt.toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(qa)}
                          className="gap-1"
                        >
                          <Edit className="w-3 h-3" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(qa.id)}
                          className="gap-1 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};