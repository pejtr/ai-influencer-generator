import { useState } from "react";
import { trpc } from "../lib/trpc";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Switch } from "../components/ui/switch";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Copy, Eye, Heart, Sparkles } from "lucide-react";
import { useLocation } from "wouter";

export default function MyModels() {
  // Using sonner toast
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  
  const { data: models, isLoading } = trpc.aiModels.list.useQuery();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isPublic: false,
  });
  
  const createMutation = trpc.aiModels.create.useMutation({
    onSuccess: () => {
      utils.aiModels.list.invalidate();
      setIsCreateDialogOpen(false);
      setFormData({ name: "", description: "", isPublic: false });
      toast({ title: "Model created successfully!" });
    },
  });
  
  const updateMutation = trpc.aiModels.update.useMutation({
    onSuccess: () => {
      utils.aiModels.list.invalidate();
      setIsEditDialogOpen(false);
      setSelectedModel(null);
      toast({ title: "Model updated successfully!" });
    },
  });
  
  const deleteMutation = trpc.aiModels.delete.useMutation({
    onSuccess: () => {
      utils.aiModels.list.invalidate();
      toast({ title: "Model deleted successfully!" });
    },
  });
  
  const duplicateMutation = trpc.aiModels.duplicate.useMutation({
    onSuccess: () => {
      utils.aiModels.list.invalidate();
      toast({ title: "Model duplicated successfully!" });
    },
  });
  
  const handleCreate = () => {
    // Get current character settings from Studio (localStorage)
    const savedSettings = localStorage.getItem("characterSettings");
    const characterSettings = savedSettings ? JSON.parse(savedSettings) : {};
    
    createMutation.mutate({
      ...formData,
      characterSettings,
      previewImageUrl: localStorage.getItem("lastGeneratedImage") || undefined,
    });
  };
  
  const handleEdit = () => {
    if (!selectedModel) return;
    updateMutation.mutate({
      modelId: selectedModel.id,
      ...formData,
    });
  };
  
  const handleDelete = (modelId: number) => {
    if (confirm("Are you sure you want to delete this model?")) {
      deleteMutation.mutate({ modelId });
    }
  };
  
  const handleDuplicate = (modelId: number) => {
    duplicateMutation.mutate({ modelId });
  };
  
  const handleLoadModel = (model: any) => {
    // Load character settings into Studio
    localStorage.setItem("characterSettings", JSON.stringify(model.characterSettings));
    toast({ title: "Model loaded into Studio!" });
    setLocation("/studio");
  };
  
  const openEditDialog = (model: any) => {
    setSelectedModel(model);
    setFormData({
      name: model.name,
      description: model.description || "",
      isPublic: model.isPublic,
    });
    setIsEditDialogOpen(true);
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading your models...</div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">My AI Models</h1>
          <p className="text-muted-foreground">
            Manage your AI influencer models and character presets
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} size="lg">
          <Plus className="w-5 h-5 mr-2" />
          Create Model
        </Button>
      </div>
      
      {!models || models.length === 0 ? (
        <Card className="p-12 text-center">
          <Sparkles className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-2xl font-semibold mb-2">No models yet</h3>
          <p className="text-muted-foreground mb-6">
            Create your first AI model to save character presets and reuse them anytime
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-5 h-5 mr-2" />
            Create Your First Model
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {models.map((model: any) => (
            <Card key={model.id} className="overflow-hidden group hover:shadow-lg transition-shadow">
              {/* Preview Image */}
              <div className="relative aspect-[3/4] bg-muted">
                {model.previewImageUrl ? (
                  <img
                    src={model.previewImageUrl}
                    alt={model.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Sparkles className="w-16 h-16 text-muted-foreground" />
                  </div>
                )}
                
                {/* Overlay with actions */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleLoadModel(model)}
                  >
                    Load
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => openEditDialog(model)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleDuplicate(model.id)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(model.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                
                {/* Public badge */}
                {model.isPublic && (
                  <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 rounded-md text-xs font-semibold">
                    PUBLIC
                  </div>
                )}
              </div>
              
              {/* Model Info */}
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-1 truncate">{model.name}</h3>
                {model.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {model.description}
                  </p>
                )}
                
                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    <span>{model.timesUsed}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Sparkles className="w-4 h-4" />
                    <span>{model.imagesGenerated}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      
      {/* Create Model Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Model</DialogTitle>
            <DialogDescription>
              Save your current character settings as a reusable model
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">Model Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Fitness Influencer"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe this model..."
                rows={3}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="isPublic">Make Public</Label>
                <p className="text-sm text-muted-foreground">
                  Allow others to discover and use this model
                </p>
              </div>
              <Switch
                id="isPublic"
                checked={formData.isPublic}
                onCheckedChange={(checked) => setFormData({ ...formData, isPublic: checked })}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!formData.name || createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Model"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Model Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Model</DialogTitle>
            <DialogDescription>
              Update model information and settings
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-name">Model Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="edit-isPublic">Make Public</Label>
                <p className="text-sm text-muted-foreground">
                  Allow others to discover and use this model
                </p>
              </div>
              <Switch
                id="edit-isPublic"
                checked={formData.isPublic}
                onCheckedChange={(checked) => setFormData({ ...formData, isPublic: checked })}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={!formData.name || updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
