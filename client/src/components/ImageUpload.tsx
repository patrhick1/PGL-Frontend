import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { UploadCloud, CheckCircle, AlertTriangle, X, Image } from 'lucide-react';

type UploadContext = 'media_kit_headshot' | 'media_kit_logo' | 'profile_picture';

interface ImageUploadProps {
  uploadContext: UploadContext;
  onUploadComplete: (finalUrl: string) => void;
  currentImageUrl?: string | null;
  campaignId?: string; // Optional, but required for media kit uploads
}

export function ImageUpload({ uploadContext, onUploadComplete, currentImageUrl, campaignId }: ImageUploadProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const saveUrlMutation = useMutation<any, Error, { finalUrl: string }>({
    mutationFn: async ({ finalUrl }) => {
      let endpoint = '';
      let payload: any = {};

      if (uploadContext === 'profile_picture') {
        endpoint = '/users/me/profile-image';
        payload = { profile_image_url: finalUrl };
      } else if (uploadContext === 'media_kit_headshot' || uploadContext === 'media_kit_logo') {
        if (!campaignId) throw new Error("Campaign ID is required for media kit uploads.");
        // Corrected endpoint and payload for media kit images
        endpoint = `/campaigns/${campaignId}/media-kit/images`;
        payload = { image_url: finalUrl, image_type: uploadContext.replace('media_kit_', '') }; // Send 'headshot' or 'logo'
      } else {
        throw new Error("Invalid upload context");
      }
      
      const response = await apiRequest(uploadContext === 'profile_picture' ? 'PATCH' : 'POST', endpoint, payload);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Failed to save URL." }));
        throw new Error(errorData.detail);
      }
      return response.json();
    },
    onSuccess: async () => {
        console.log('💾 Image URL saved to backend, invalidating queries...');
        if (uploadContext === 'profile_picture') {
            // Force a complete refetch by removing from cache and invalidating
            queryClient.removeQueries({ queryKey: ["/auth/me"] });
            await queryClient.invalidateQueries({ queryKey: ["/auth/me"] });
            // Force an immediate refetch
            await queryClient.refetchQueries({ queryKey: ["/auth/me"] });
            console.log('🔄 Auth query invalidated and refetched');
        } else {
            await queryClient.invalidateQueries({ queryKey: ["mediaKitData", campaignId] });
        }
        toast({ title: "Image Saved", description: "Your image has been successfully saved." });
    },
    onError: (error) => {
        toast({ title: "Save Error", description: `Failed to save image URL: ${error.message}`, variant: "destructive" });
    }
  });

  const generateUploadUrlMutation = useMutation<any, Error, { fileName: string; uploadContext: string }>({
    mutationFn: async (variables) => {
      const response = await apiRequest('POST', '/storage/generate-upload-url', variables);
      return response.json();
    },
    onSuccess: async (data) => {
      console.log('✅ Upload URL received:', data);

      if (!file) {
        console.log('❌ No file selected');
        return;
      }

      const { uploadUrl, objectKey, finalUrl } = data;
      console.log('🔗 Upload URL:', uploadUrl);
      console.log('🔑 Object Key:', objectKey);
      console.log('📁 File details:', { name: file.name, type: file.type, size: file.size });

      if (typeof uploadUrl !== 'string' || !uploadUrl) {
        setStatus('error');
        setError("Invalid upload URL received");
        return;
      }

      setStatus('uploading');
      setError(null);
      setUploadProgress(30);

      try {
        console.log('🚀 Starting S3 upload...');

        const s3Response = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': file.type,
          },
          body: file,
          mode: 'cors', // Explicitly set CORS mode
        });

        console.log('📊 S3 Response Status:', s3Response.status);
        console.log('📊 S3 Response Headers:', Object.fromEntries(s3Response.headers.entries()));

        if (s3Response.ok) {
          console.log('✅ S3 upload successful!');
          setUploadProgress(60);
          
          // Now notify the backend that upload is complete
          console.log('📮 Notifying backend of upload completion...');
          const completePayload: any = {
            objectKey,
            uploadContext
          };
          
          // Only include campaignId if it's provided and not for profile pictures
          if (campaignId && uploadContext !== 'profile_picture') {
            completePayload.campaignId = campaignId;
          }
          
          const completeResponse = await apiRequest('POST', '/storage/upload-complete', completePayload);
          
          if (completeResponse.ok) {
            const completeData = await completeResponse.json();
            console.log('✅ Backend notified successfully:', completeData);
            setUploadProgress(80);
            
            // Use the fileUrl from upload-complete response
            const fileUrl = completeData.fileUrl || finalUrl;
            
            setStatus('success');
            setUploadProgress(100);
            onUploadComplete(fileUrl);
            saveUrlMutation.mutate({ finalUrl: fileUrl });
          } else {
            const errorData = await completeResponse.json().catch(() => ({ detail: "Failed to complete upload" }));
            throw new Error(errorData.detail || "Failed to complete upload");
          }
        } else {
          console.error('❌ S3 upload failed');
          const errorText = await s3Response.text();
          console.error('S3 Error Response:', errorText);

          setStatus('error');
          setError(`S3 upload failed: ${s3Response.status} ${s3Response.statusText}. ${errorText}`);
          toast({
            title: "S3 Upload Failed",
            description: `Status: ${s3Response.status}. Check console for details.`,
            variant: "destructive"
          });
        }
      } catch (networkError) {
        console.error('❌ Network error during upload:', networkError);
        setStatus('error');
        const errorMessage = networkError instanceof Error ? networkError.message : 'Unknown network error';
        setError(`Upload error: ${errorMessage}`);
        toast({
          title: "Upload Error",
          description: errorMessage,
          variant: "destructive"
        });
      }
    },
    onError: (error) => {
      setStatus('error');
      setError(error.message);
      toast({ title: "Error", description: `Could not prepare upload: ${error.message}`, variant: "destructive" });
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setStatus('idle');
      setUploadProgress(0);
    }
  };

  const handleUpload = () => {
    if (!file) {
      toast({ title: "No File Selected", description: "Please choose a file to upload.", variant: "destructive" });
      return;
    }
    
    if ((uploadContext === 'media_kit_headshot' || uploadContext === 'media_kit_logo') && !campaignId) {
      toast({ title: "Missing Campaign", description: "Campaign ID is required for media kit uploads.", variant: "destructive" });
      return;
    }
    
    // The backend now expects camelCase, so this is correct.
    generateUploadUrlMutation.mutate({ fileName: file.name, uploadContext });
  };
  
  const handleRemoveImage = () => {
      setFile(null);
      setStatus('idle');
      setUploadProgress(0);
      onUploadComplete(""); // Notify parent to clear the URL
  };

  // Show current image with option to change
  if (currentImageUrl && !file) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3 p-3 border rounded-md bg-gray-50">
            <img src={currentImageUrl} alt="Current image" className="w-16 h-16 object-cover rounded-md"/>
            <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">Current image</p>
                <p className="text-xs text-gray-500">Click "Choose File" below to select a new image</p>
            </div>
        </div>
        <div className="flex gap-3 items-center">
          <Input
            type="file"
            onChange={handleFileChange}
            className="flex-1"
            disabled={status === 'uploading'}
            accept="image/png, image/jpeg, image/webp"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* File selected preview */}
      {file && status === 'idle' && (
        <div className="flex items-center gap-3 p-3 border rounded-md bg-blue-50">
          <Image className="h-8 w-8 text-blue-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700">{file.name}</p>
            <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
          <Button size="sm" variant="ghost" onClick={() => setFile(null)} className="text-gray-500 hover:text-gray-700">
            <X className="h-4 w-4"/>
          </Button>
        </div>
      )}

      <div className="flex gap-3 items-center">
        <Input
          type="file"
          onChange={handleFileChange}
          className="flex-1"
          disabled={status === 'uploading'}
          accept="image/png, image/jpeg, image/webp"
        />
        <Button
          onClick={handleUpload}
          disabled={!file || status === 'uploading' || status === 'success'}
        >
          {status === 'uploading' && <UploadCloud className="h-4 w-4 mr-2 animate-pulse" />}
          {status === 'success' ? 'Uploaded' : 'Upload'}
        </Button>
      </div>

      {status === 'uploading' && <Progress value={uploadProgress} className="w-full" />}
      
      {status === 'success' && (
        <div className="flex items-center text-green-600 text-sm">
          <CheckCircle className="h-4 w-4 mr-2" />
          <span>Upload complete! Your new image has been saved.</span>
        </div>
      )}

      {status === 'error' && (
        <div className="flex items-center text-red-600 text-sm">
          <AlertTriangle className="h-4 w-4 mr-2" />
          <span>{error || 'An unknown error occurred.'}</span>
        </div>
      )}
    </div>
  );
}