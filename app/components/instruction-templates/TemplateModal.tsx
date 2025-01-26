import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import { useState, useEffect } from "react";

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  template?: {
    id: number;
    name: string;
    objective: string;
    style: string;
    rules: string;
  } | null;
  mode: 'view' | 'edit';
  onSave?: (data: any) => void;
  isSubmitting?: boolean;
}

export function TemplateModal({ isOpen, onClose, template, mode, onSave, isSubmitting }: TemplateModalProps) {
  const [formData, setFormData] = useState(template || {
    name: '',
    objective: '',
    style: '',
    rules: ''
  });

  useEffect(() => {
    if (template) {
      setFormData(template);
    } else {
      setFormData({
        name: '',
        objective: '',
        style: '',
        rules: ''
      });
    }
  }, [template]);

  const isEditing = mode === 'edit';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name?.trim()) {
      alert('Template name is required');
      return;
    }
    
    onSave?.(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? (template ? 'Edit Template' : 'Create Template') : template?.name}
          </DialogTitle>
        </DialogHeader>

        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="objective">Objective</Label>
              <Textarea
                id="objective"
                value={formData.objective}
                onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                className="mt-1.5 h-20"
                placeholder="Describe the main purpose of this template..."
              />
            </div>

            <div>
              <Label htmlFor="style">Communication Style</Label>
              <Textarea
                id="style"
                value={formData.style}
                onChange={(e) => setFormData({ ...formData, style: e.target.value })}
                className="mt-1.5 h-20"
                placeholder="Define the tone and style of communication..."
              />
            </div>

            <div>
              <Label htmlFor="rules">Rules & Guidelines</Label>
              <Textarea
                id="rules"
                value={formData.rules}
                onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                className="mt-1.5 h-24"
                placeholder="List the rules and guidelines..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-blue-600 text-white hover:bg-blue-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-sm text-gray-500 dark:text-gray-400">Objective</h3>
              <p className="mt-1 text-sm">{template?.objective}</p>
            </div>

            <div>
              <h3 className="font-medium text-sm text-gray-500 dark:text-gray-400">Communication Style</h3>
              <p className="mt-1 text-sm">{template?.style}</p>
            </div>

            <div>
              <h3 className="font-medium text-sm text-gray-500 dark:text-gray-400">Rules & Guidelines</h3>
              <p className="mt-1 text-sm whitespace-pre-line">{template?.rules}</p>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 