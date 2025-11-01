import { useEffect, useState } from "react";
import { uploadCelebrityToDatabase } from "@/utils/uploadCelebrity";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const QuickUpload = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const uploadImage = async () => {
      setUploading(true);
      try {
        // Fetch the image from assets
        const response = await fetch('/src/assets/temp_upload.jpg');
        const blob = await response.blob();
        const file = new File([blob], 'another_1.jpg', { type: 'image/jpeg' });

        // Upload to database
        await uploadCelebrityToDatabase('Person', file);

        toast({
          title: "Success!",
          description: "Celebrity added to database",
        });

        // Navigate to celebrity manager after 2 seconds
        setTimeout(() => {
          navigate('/celebrity-manager');
        }, 2000);
      } catch (error) {
        console.error('Upload error:', error);
        toast({
          title: "Upload failed",
          description: error instanceof Error ? error.message : "Failed to upload",
          variant: "destructive",
        });
      } finally {
        setUploading(false);
      }
    };

    uploadImage();
  }, [toast, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
      <div className="text-center space-y-4">
        <div className="text-2xl font-bold">
          {uploading ? "Uploading..." : "Upload Complete!"}
        </div>
        <Button onClick={() => navigate('/celebrity-manager')} disabled={uploading}>
          Go to Celebrity Manager
        </Button>
      </div>
    </div>
  );
};

export default QuickUpload;
