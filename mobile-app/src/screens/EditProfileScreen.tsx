import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { launchImageLibrary, launchCamera, ImagePickerResponse } from 'react-native-image-picker';
import { useAuth } from '../context/AuthContext';
import { uploadImageToStorage } from '../services/uploadService';
import { User, Camera, Image as ImageIcon, Sparkles, Check, Mail, CheckCircle2 } from 'lucide-react-native';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://api.dicebear.com/7.x/bottts/png?seed=ecobot1',
  'https://api.dicebear.com/7.x/bottts/png?seed=ecobot2'
];

export const EditProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { currentUser, updateUserProfile } = useAuth();
  const [name, setName] = useState(currentUser?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleImagePickerResult = async (response: ImagePickerResponse) => {
    if (response.didCancel) return;
    if (response.errorCode) {
      Alert.alert('Image Picker Error', response.errorMessage || 'Could not access media.');
      return;
    }

    const asset = response.assets?.[0];
    if (!asset?.uri || !currentUser?.userId) return;

    try {
      setUploading(true);
      setUploadSuccess(false);
      const downloadUrl = await uploadImageToStorage(asset.uri, currentUser.userId, 'avatars');
      setAvatarUrl(downloadUrl);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (error: any) {
      console.error('[EditProfile] Upload error:', error);
      Alert.alert('Upload Failed', error?.message || 'Could not upload photo to cloud storage.');
    } finally {
      setUploading(false);
    }
  };

  const pickFromGallery = async () => {
    await launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 600,
        maxHeight: 600
      },
      handleImagePickerResult
    );
  };

  const takeWithCamera = async () => {
    await launchCamera(
      {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 600,
        maxHeight: 600
      },
      handleImagePickerResult
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter your name.');
      return;
    }

    try {
      setSaving(true);
      await updateUserProfile(name.trim(), avatarUrl.trim());
      Alert.alert('Profile Saved 🎉', 'Your profile and avatar have been updated across EcoShare Cloud.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      console.error('[EditProfile] Save error:', error);
      Alert.alert('Update Failed', error?.message || 'Could not update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Avatar Preview */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>{name?.[0] || 'U'}</Text>
              </View>
            )}

            {uploading && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator color="#ffffff" size="small" />
              </View>
            )}
          </View>

          {uploadSuccess && (
            <View style={styles.uploadedBadge}>
              <CheckCircle2 size={14} color="#059669" />
              <Text style={styles.uploadedBadgeText}>Photo uploaded to Cloud Storage!</Text>
            </View>
          )}

          {/* Quick Upload Buttons */}
          <View style={styles.uploadButtonRow}>
            <TouchableOpacity
              style={styles.pickButton}
              onPress={pickFromGallery}
              disabled={uploading}
            >
              <ImageIcon size={16} color="#059669" />
              <Text style={styles.pickButtonText}>Choose from Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.pickButton}
              onPress={takeWithCamera}
              disabled={uploading}
            >
              <Camera size={16} color="#059669" />
              <Text style={styles.pickButtonText}>Take Photo</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Preset Avatars */}
        <Text style={styles.sectionLabel}>Or Pick a Preset Avatar</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetScroll}>
          {PRESET_AVATARS.map((url, index) => {
            const isSelected = avatarUrl === url;
            return (
              <TouchableOpacity
                key={index}
                style={[styles.presetItem, isSelected && styles.presetItemSelected]}
                onPress={() => setAvatarUrl(url)}
              >
                <Image source={{ uri: url }} style={styles.presetImage} />
                {isSelected && (
                  <View style={styles.presetCheck}>
                    <Check size={12} color="#ffffff" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Form Fields */}
        <View style={styles.card}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputWrapper}>
              <User size={18} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Your Full Name"
                placeholderTextColor="#94a3b8"
                value={name}
                onChangeText={setName}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address (Verified)</Text>
            <View style={[styles.inputWrapper, styles.inputDisabled]}>
              <Mail size={18} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: '#64748b' }]}
                value={currentUser?.email || ''}
                editable={false}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Avatar Image URL</Text>
            <View style={styles.inputWrapper}>
              <Sparkles size={18} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="https://..."
                placeholderTextColor="#94a3b8"
                value={avatarUrl}
                onChangeText={setAvatarUrl}
                autoCapitalize="none"
              />
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity
          style={[styles.saveButton, (saving || uploading) && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={saving || uploading}
        >
          {saving ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={saving || uploading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40
  },
  avatarSection: {
    alignItems: 'center',
    marginVertical: 12
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 10
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#e2e8f0'
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarInitial: {
    fontSize: 38,
    fontWeight: '700',
    color: '#ffffff'
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center'
  },
  uploadedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 10
  },
  uploadedBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#065f46'
  },
  uploadButtonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4
  },
  pickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ecfdf5',
    borderWidth: 1.5,
    borderColor: '#a7f3d0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9
  },
  pickButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669'
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 10,
    marginTop: 10
  },
  presetScroll: {
    marginBottom: 18
  },
  presetItem: {
    position: 'relative',
    marginRight: 12,
    padding: 3,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'transparent'
  },
  presetItemSelected: {
    borderColor: '#059669'
  },
  presetImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e2e8f0'
  },
  presetCheck: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#059669',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center'
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20
  },
  inputGroup: {
    marginBottom: 16
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12
  },
  inputDisabled: {
    backgroundColor: '#f1f5f9'
  },
  inputIcon: {
    marginRight: 10
  },
  input: {
    flex: 1,
    height: 46,
    fontSize: 14,
    color: '#0f172a'
  },
  saveButton: {
    backgroundColor: '#059669',
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 12
  },
  buttonDisabled: {
    opacity: 0.7
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff'
  },
  cancelButton: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b'
  }
});
