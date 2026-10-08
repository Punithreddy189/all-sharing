import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

/**
 * Uploads an image URI (from device photo library or camera) to Firebase Cloud Storage
 * and returns the public download URL.
 */
export const uploadImageToStorage = async (
  uri: string,
  userId: string,
  folder: string = 'avatars'
): Promise<string> => {
  if (!storage) {
    console.warn('[Storage] ⚠️ Storage instance not available. Using original URI as fallback.');
    return uri;
  }

  try {
    console.log(`[Storage] 📤 Starting image upload for user: ${userId}`);
    const filename = `${folder}/${userId}_${Date.now()}.jpg`;
    const storageRef = ref(storage, filename);

    // Fetch the file as a Blob from the local file URI
    const response = await fetch(uri);
    const blob = await response.blob();

    // Upload to Firebase Cloud Storage
    const snapshot = await uploadBytes(storageRef, blob, {
      contentType: 'image/jpeg'
    });

    console.log('[Storage] ✅ Upload completed. Bytes transferred:', snapshot.metadata.size);

    // Retrieve public download URL
    const downloadUrl = await getDownloadURL(storageRef);
    console.log('[Storage] 🔗 Download URL generated:', downloadUrl);

    return downloadUrl;
  } catch (error: any) {
    console.error('[Storage] ❌ Upload failed with error:', error);
    throw error;
  }
};
