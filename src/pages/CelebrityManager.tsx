import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Trash2, Upload, ArrowLeft } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";

const sb = supabase as any;

interface Celebrity {
  id: string;
  name: string;
  image_url: string;
}

const CelebrityManager = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [user, setUser] = useState<any>(null);
  const [celebrities, setCelebrities] = useState<Celebrity[]>([]);
  const [newName, setNewName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      toast.error("Access denied: Admin only");
      navigate("/game");
    }
  }, [isAdmin, roleLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      loadCelebrities();
    }
  }, [isAdmin]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setUser(session.user);
  };

  const loadCelebrities = async () => {
    setLoading(true);
    const { data, error } = await sb
      .from("celebrities")
      .select("*")
      .order("name");

    if (error) {
      toast.error("Failed to load celebrities");
    } else {
      setCelebrities(data || []);
    }
    setLoading(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
        toast.error("Only JPG, PNG, and WEBP images are allowed");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!newName.trim()) {
      toast.error("Please enter a celebrity name");
      return;
    }
    if (!selectedFile) {
      toast.error("Please select an image");
      return;
    }

    setUploading(true);

    try {
      // Upload image to storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from('celebrity-images')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('celebrity-images')
        .getPublicUrl(filePath);

      // Insert celebrity record
      const { error: insertError } = await sb
        .from('celebrities')
        .insert({
          name: newName.trim(),
          image_url: publicUrl
        });

      if (insertError) throw insertError;

      toast.success("Celebrity added successfully!");
      setNewName("");
      setSelectedFile(null);
      loadCelebrities();
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload celebrity");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (celebrity: Celebrity) => {
    if (!confirm(`Delete ${celebrity.name}?`)) return;

    try {
      // Extract file path from URL
      const urlParts = celebrity.image_url.split('/celebrity-images/');
      if (urlParts.length === 2) {
        const filePath = urlParts[1];
        await supabase.storage
          .from('celebrity-images')
          .remove([filePath]);
      }

      // Delete from database
      const { error } = await sb
        .from('celebrities')
        .delete()
        .eq('id', celebrity.id);

      if (error) throw error;

      toast.success("Celebrity deleted successfully!");
      loadCelebrities();
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error("Failed to delete celebrity");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/20 flex items-center justify-center">
        <div className="text-2xl font-black text-foreground animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/20 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            onClick={() => navigate('/game')}
            variant="outline"
            className="comic-button"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Game
          </Button>
          <h1 className="text-3xl sm:text-5xl font-black text-foreground">
            Celebrity Manager 📸
          </h1>
        </div>

        {/* Upload Form */}
        <Card className="comic-border bg-card p-6">
          <h2 className="text-2xl font-black text-foreground mb-4">Add New Celebrity</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-foreground font-bold">Celebrity Name</Label>
              <Input
                id="name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter celebrity name..."
                className="comic-border"
              />
            </div>
            <div>
              <Label htmlFor="image" className="text-foreground font-bold">Celebrity Image</Label>
              <Input
                id="image"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleFileSelect}
                className="comic-border"
              />
              {selectedFile && (
                <p className="text-sm text-foreground/70 mt-2">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)}MB)
                </p>
              )}
            </div>
            <Button
              onClick={handleUpload}
              disabled={uploading}
              className="comic-button bg-success text-success-foreground font-black w-full"
            >
              <Upload className="mr-2 h-4 w-4" />
              {uploading ? "Uploading..." : "Add Celebrity"}
            </Button>
          </div>
        </Card>

        {/* Celebrity List */}
        <Card className="comic-border bg-card p-6">
          <h2 className="text-2xl font-black text-foreground mb-4">
            Celebrities ({celebrities.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {celebrities.map((celebrity) => (
              <Card key={celebrity.id} className="comic-border bg-muted p-4 space-y-2">
                <div className="aspect-square rounded-lg overflow-hidden bg-background">
                  <img
                    src={celebrity.image_url}
                    alt={celebrity.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-2">
                  <p className="font-black text-foreground text-center truncate">
                    {celebrity.name}
                  </p>
                  <Button
                    onClick={() => handleDelete(celebrity)}
                    variant="destructive"
                    className="w-full comic-button"
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
          {celebrities.length === 0 && (
            <p className="text-center text-foreground/70 py-8">
              No celebrities yet. Add your first one above! 🌟
            </p>
          )}
        </Card>
      </div>
    </div>
  );
};

export default CelebrityManager;
