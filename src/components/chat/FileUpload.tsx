import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { FileText, Image, X, Upload, File } from 'lucide-react';
import { FileAttachment } from '@/contexts/ChatContext';

interface FileUploadProps {
  onFilesAdded: (files: FileAttachment[]) => void;
  maxFiles?: number;
  maxSize?: number; // in bytes
}

export const FileUpload: React.FC<FileUploadProps> = ({ 
  onFilesAdded, 
  maxFiles = 5, 
  maxSize = 10 * 1024 * 1024 // 10MB
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<FileAttachment[]>([]);
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (uploadedFiles.length + acceptedFiles.length > maxFiles) {
      toast({
        title: "Too many files",
        description: `Maximum ${maxFiles} files allowed`,
        variant: "destructive"
      });
      return;
    }

    const newFiles: FileAttachment[] = acceptedFiles.map(file => {
      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds 10MB limit`,
          variant: "destructive"
        });
        return null;
      }

      return {
        id: Date.now().toString() + Math.random(),
        name: file.name,
        type: file.type,
        size: file.size,
        url: URL.createObjectURL(file)
      };
    }).filter(Boolean) as FileAttachment[];

    const updatedFiles = [...uploadedFiles, ...newFiles];
    setUploadedFiles(updatedFiles);
    onFilesAdded(updatedFiles);
  }, [uploadedFiles, maxFiles, maxSize, onFilesAdded, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'application/pdf': ['.pdf'],
      'text/*': ['.txt'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    multiple: true
  });

  const removeFile = (fileId: string) => {
    const updatedFiles = uploadedFiles.filter(file => file.id !== fileId);
    setUploadedFiles(updatedFiles);
    onFilesAdded(updatedFiles);
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="w-4 h-4" />;
    if (fileType === 'application/pdf') return <FileText className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive 
            ? 'border-primary bg-primary/5' 
            : 'border-muted-foreground/25 hover:border-primary/50'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {isDragActive
            ? "Drop files here..."
            : "Drag & drop files here, or click to select"}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          PDF, Images, Documents (max 10MB each)
        </p>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Attached Files:</p>
          {uploadedFiles.map((file) => (
            <div key={file.id} className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
              {getFileIcon(file.type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFile(file.id)}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};