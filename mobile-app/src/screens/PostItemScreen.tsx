import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Switch,
  ActivityIndicator
} from 'react-native';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { ItemCategory, ListingType, PricingUnit, ItemCondition, AIVisionStatus, ItemAnalysisData } from '../types';
import { 
  Sparkles, 
  MapPin, 
  CheckCircle2, 
  DollarSign, 
  Clock, 
  RefreshCw, 
  Handshake, 
  Cpu, 
  Trash2, 
  Leaf,
  Info,
  AlertTriangle,
  Camera,
  Image as ImageIcon,
  Upload
} from 'lucide-react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { LISTING_TYPE_CONFIGS, LISTING_TYPES, getListingConfig, validateListing } from '../utils/listingConfig';
import { analyzeItemImageMobile } from '../services/aiVisionService';
import { uploadItemImage } from '../services/uploadService';

const CATEGORIES: ItemCategory[] = ['Books', 'Tools', 'Electronics', 'Furniture', 'Clothing', 'Others'];
const CONDITIONS: ItemCondition[] = ['New', 'Like New', 'Good', 'Fair'];

const SAMPLE_IMAGES: Record<ItemCategory, string[]> = {
  Books: [
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=80'
  ],
  Tools: [
    'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1581147036324-c17ac41dfa6c?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=600&auto=format&fit=crop&q=80'
  ],
  Electronics: [
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&auto=format&fit=crop&q=80'
  ],
  Furniture: [
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=600&auto=format&fit=crop&q=80'
  ],
  Clothing: [
    'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600&auto=format&fit=crop&q=80'
  ],
  Others: [
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&auto=format&fit=crop&q=80'
  ]
};

export const PostItemScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { postNewItem } = useApp();
  const { currentUser } = useAuth();

  const [listingType, setListingType] = useState<ListingType>('Borrow');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ItemCategory>('Books');
  const [imageUrl, setImageUrl] = useState(SAMPLE_IMAGES.Books[0]);
  const [location, setLocation] = useState('Central Community Hub');
  
  // Specific fields
  const [priceInput, setPriceInput] = useState('');
  const [pricingUnit, setPricingUnit] = useState<PricingUnit>('day');
  const [exchangeFor, setExchangeFor] = useState('');
  const [isNegotiable, setIsNegotiable] = useState(false);
  const [condition, setCondition] = useState<ItemCondition>('Like New');

  // AI Vision state
  const [aiStatus, setAiStatus] = useState<AIVisionStatus>('idle');
  const [aiData, setAiData] = useState<ItemAnalysisData | null>(null);
  const [aiSource, setAiSource] = useState<'gemini' | 'cache' | 'fallback'>('fallback');
  const [isAiFilled, setIsAiFilled] = useState(false);
  const [showReasoning, setShowReasoning] = useState(false);

  const [posting, setPosting] = useState(false);

  const currentConfig = getListingConfig(listingType);

  const triggerAIVision = async (sourceUrl: string, hint?: string) => {
    try {
      setAiStatus('analyzing');
      const response = await analyzeItemImageMobile(sourceUrl, hint || category);

      if (response.success && response.data) {
        setAiData(response.data);
        setAiSource(response.source);
        setTitle(response.data.title);
        setCategory(response.data.category);
        setCondition(response.data.condition);
        setDescription(response.data.description);
        setIsAiFilled(true);
        setAiStatus('success');

        Alert.alert(
          'AI Vision Auto-Fill Applied 🤖',
          `Detected: "${response.data.title}" (${Math.round(response.data.confidence * 100)}% confidence).\n\nYou can edit any field before posting.`
        );
      } else {
        setAiStatus('error');
      }
    } catch {
      setAiStatus('error');
    }
  };

  const handleSelectPreset = (img: string, cat: ItemCategory) => {
    setImageUrl(img);
    triggerAIVision(img, cat);
  };

  const handleTakePhoto = async () => {
    try {
      const result = await launchCamera({
        mediaType: 'photo',
        includeBase64: true,
        maxHeight: 1200,
        maxWidth: 1200,
        quality: 0.8,
      });

      if (result.didCancel) return;
      if (result.errorCode) {
        Alert.alert('Camera Notice', result.errorMessage || 'Camera is unavailable. You can use preset photos or gallery.');
        return;
      }

      if (result.assets && result.assets.length > 0 && result.assets[0].uri) {
        const asset = result.assets[0];
        const uri = asset.base64 ? `data:${asset.type || 'image/jpeg'};base64,${asset.base64}` : (asset.uri || '');
        setImageUrl(uri);
        triggerAIVision(uri, category);
      }
    } catch (err: any) {
      Alert.alert('Camera Error', err?.message || 'Could not open camera.');
    }
  };

  const handlePickGallery = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        includeBase64: true,
        maxHeight: 1200,
        maxWidth: 1200,
        quality: 0.8,
      });

      if (result.didCancel) return;
      if (result.errorCode) {
        Alert.alert('Gallery Notice', result.errorMessage || 'Photo gallery is unavailable.');
        return;
      }

      if (result.assets && result.assets.length > 0 && result.assets[0].uri) {
        const asset = result.assets[0];
        const uri = asset.base64 ? `data:${asset.type || 'image/jpeg'};base64,${asset.base64}` : (asset.uri || '');
        setImageUrl(uri);
        triggerAIVision(uri, category);
      }
    } catch (err: any) {
      Alert.alert('Gallery Error', err?.message || 'Could not open photo library.');
    }
  };

  const handleClearAI = () => {
    setIsAiFilled(false);
    setAiData(null);
    setAiStatus('idle');
    setTitle('');
    setDescription('');
    setCondition('Like New');
  };

  const handlePost = async () => {
    const parsedPrice = priceInput.trim() ? parseFloat(priceInput.trim()) : null;

    const validation = validateListing({
      title,
      description,
      listingType,
      price: parsedPrice,
      pricingUnit: listingType === 'Rent' ? pricingUnit : null,
      exchangeFor: listingType === 'Exchange' ? exchangeFor : null,
    });

    if (!validation.valid) {
      Alert.alert('Validation Error', validation.error || 'Please fill out all required fields.');
      return;
    }

    const calculatedPoints = aiData?.ecoPoints || (category === 'Electronics' ? 70 : category === 'Tools' ? 30 : 20);
    const calculatedCo2 = aiData?.co2Saved || (category === 'Electronics' ? 3.5 : category === 'Tools' ? 1.5 : 1.0);

    setPosting(true);
    try {
      let finalImageUrl = imageUrl;
      if (imageUrl && !imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
        try {
          finalImageUrl = await uploadItemImage(imageUrl, currentUser?.userId || 'anonymous');
        } catch (uploadErr) {
          console.warn('[PostItem] Image upload notice, proceeding with local URI:', uploadErr);
        }
      }

      await postNewItem({
        title: title.trim(),
        description: description.trim(),
        category,
        imageUrl: finalImageUrl,
        location: location.trim(),
        ownerId: currentUser?.userId || 'user-demo-101',
        ownerName: currentUser?.name || 'Community Member',
        ownerAvatar: currentUser?.avatarUrl,
        status: 'Available',
        listingType,
        price: parsedPrice,
        pricingUnit: listingType === 'Rent' ? pricingUnit : null,
        currency: '$',
        exchangeFor: listingType === 'Exchange' ? exchangeFor.trim() : null,
        isNegotiable,
        condition,
        aiGenerated: isAiFilled,
        aiConfidence: aiData?.confidence,
        aiSource,
        aiReasoning: aiData?.reasoning,
        ecoPoints: calculatedPoints,
        co2Saved: calculatedCo2,
        tags: aiData?.tags || [category.toLowerCase(), 'reuse']
      });

      Alert.alert(
        'Item Listed! 🌟',
        `Your item is now listed for ${currentConfig.label}.\nYou earned +${calculatedPoints} EcoPoints and helped prevent ~${calculatedCo2}kg CO₂ emissions!`,
        [
          {
            text: 'View in Feed',
            onPress: () => {
              setTitle('');
              setDescription('');
              setPriceInput('');
              setExchangeFor('');
              setIsAiFilled(false);
              setAiData(null);
              setAiStatus('idle');
              navigation.navigate('Home');
            }
          }
        ]
      );
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to post item');
    } finally {
      setPosting(false);
    }
  };

  const currentPoints = aiData?.ecoPoints || (category === 'Electronics' ? 70 : category === 'Tools' ? 30 : 20);
  const currentCo2 = aiData?.co2Saved || (category === 'Electronics' ? 3.5 : category === 'Tools' ? 1.5 : 1.0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      
      {/* Top Banner */}
      <View style={styles.banner}>
        <View style={styles.bannerLeft}>
          <Sparkles size={18} color="#d97706" />
          <Text style={styles.bannerTitle}>Earn +{currentPoints} EcoPoints (~{currentCo2}kg CO₂ saved)</Text>
        </View>
        <Text style={styles.bannerSubtitle}>
          AI-assisted listing: Auto-categorizes your item, calculates carbon savings, and awards community points.
        </Text>
      </View>

      {/* AI VISION AUTO-FILL CARD */}
      <View style={styles.aiCard}>
        <View style={styles.aiCardHeader}>
          <View style={styles.aiCardTitleGroup}>
            <View style={styles.aiIconWrapper}>
              <Cpu size={16} color="#ffffff" />
            </View>
            <View>
              <Text style={styles.aiCardTitle}>AI Vision Auto-Fill</Text>
              <Text style={styles.aiCardSubtitle}>Instant category & condition detection</Text>
            </View>
          </View>

          {aiStatus === 'analyzing' ? (
            <View style={styles.aiLoadingBadge}>
              <ActivityIndicator size="small" color="#4f46e5" />
              <Text style={styles.aiLoadingText}>Scanning...</Text>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
              <TouchableOpacity
                style={styles.aiTriggerBtn}
                onPress={() => triggerAIVision(imageUrl, category)}
              >
                <Sparkles size={13} color="#ffffff" />
                <Text style={styles.aiTriggerBtnText}>{isAiFilled ? 'Regenerate' : 'Scan AI'}</Text>
              </TouchableOpacity>
              {isAiFilled && (
                <TouchableOpacity onPress={handleClearAI} style={styles.aiClearBtn}>
                  <Trash2 size={15} color="#ef4444" />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {isAiFilled && aiData && (
          <View style={styles.aiResultContainer}>
            <View style={styles.aiConfidenceRow}>
              <View style={styles.confidencePill}>
                <View
                  style={[
                    styles.confidenceDot,
                    {
                      backgroundColor:
                        aiData.confidence >= 0.8
                          ? '#10b981'
                          : aiData.confidence >= 0.5
                          ? '#f59e0b'
                          : '#ef4444'
                    }
                  ]}
                />
                <Text style={styles.confidenceText}>
                  {Math.round(aiData.confidence * 100)}% Confidence
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setShowReasoning(!showReasoning)}
                style={styles.reasonToggle}
              >
                <Info size={13} color="#4f46e5" />
                <Text style={styles.reasonToggleText}>
                  {showReasoning ? 'Hide Why' : 'Why this?'}
                </Text>
              </TouchableOpacity>
            </View>

            {showReasoning && (
              <View style={styles.reasonBox}>
                <Text style={styles.reasonText}>💡 {aiData.reasoning}</Text>
              </View>
            )}

            {aiData.tags && aiData.tags.length > 0 && (
              <View style={styles.tagWrap}>
                {aiData.tags.map((tag, idx) => (
                  <View key={idx} style={styles.tagChip}>
                    <Text style={styles.tagText}>#{tag}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </View>

      {/* STEP 1: Listing Intent Segmented Control */}
      <Text style={styles.label}>1. What is this listing for? *</Text>
      <View style={styles.segmentedContainer}>
        {LISTING_TYPES.map((type) => {
          const config = LISTING_TYPE_CONFIGS[type];
          const isSelected = listingType === type;
          return (
            <TouchableOpacity
              key={type}
              style={[
                styles.segmentedButton,
                isSelected && { backgroundColor: config.color.primary, borderColor: config.color.primary }
              ]}
              onPress={() => setListingType(type)}
            >
              <Text style={[styles.segmentedButtonEmoji]}>{config.emoji}</Text>
              <Text
                style={[
                  styles.segmentedButtonText,
                  isSelected && { color: '#ffffff', fontWeight: '800' }
                ]}
              >
                {config.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Dynamic Context Fields based on listingType */}
      {listingType === 'Sell' && (
        <View style={[styles.contextBox, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
          <Text style={[styles.contextTitle, { color: '#166534' }]}>💰 Selling Details</Text>
          <Text style={styles.subLabel}>Set Selling Price ($ USD) *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 25.00"
            placeholderTextColor="#94a3b8"
            keyboardType="decimal-pad"
            value={priceInput}
            onChangeText={setPriceInput}
          />
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Price is Negotiable (OBO)</Text>
            <Switch
              value={isNegotiable}
              onValueChange={setIsNegotiable}
              trackColor={{ false: '#cbd5e1', true: '#86efac' }}
              thumbColor={isNegotiable ? '#16a34a' : '#f8fafc'}
            />
          </View>
        </View>
      )}

      {listingType === 'Rent' && (
        <View style={[styles.contextBox, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}>
          <Text style={[styles.contextTitle, { color: '#1e40af' }]}>⏳ Rental Details</Text>
          <Text style={styles.subLabel}>Rental Rate ($ USD) *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 5.00"
            placeholderTextColor="#94a3b8"
            keyboardType="decimal-pad"
            value={priceInput}
            onChangeText={setPriceInput}
          />
          <Text style={styles.subLabel}>Rental Period *</Text>
          <View style={styles.unitRow}>
            <TouchableOpacity
              style={[styles.unitBtn, pricingUnit === 'day' && styles.unitBtnActive]}
              onPress={() => setPricingUnit('day')}
            >
              <Text style={[styles.unitBtnText, pricingUnit === 'day' && styles.unitBtnTextActive]}>
                Per Day (/day)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.unitBtn, pricingUnit === 'week' && styles.unitBtnActive]}
              onPress={() => setPricingUnit('week')}
            >
              <Text style={[styles.unitBtnText, pricingUnit === 'week' && styles.unitBtnTextActive]}>
                Per Week (/wk)
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {listingType === 'Exchange' && (
        <View style={[styles.contextBox, { backgroundColor: '#faf5ff', borderColor: '#e9d5ff' }]}>
          <Text style={[styles.contextTitle, { color: '#6b21a8' }]}>🔄 Exchange Wishlist</Text>
          <Text style={styles.subLabel}>What would you like in trade? *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Seeking wood chisels, novel sets, or electronics..."
            placeholderTextColor="#94a3b8"
            value={exchangeFor}
            onChangeText={setExchangeFor}
          />
        </View>
      )}

      {listingType === 'Borrow' && (
        <View style={[styles.contextBox, { backgroundColor: '#f0fdfa', borderColor: '#99f6e4' }]}>
          <Text style={[styles.contextTitle, { color: '#115e59' }]}>🤝 Free Community Share</Text>
          <Text style={styles.contextHelpText}>
            Lending tools and books to neighbors builds community trust and earns +{currentPoints} EcoPoints.
          </Text>
        </View>
      )}

      {/* Category Picker */}
      <View style={styles.fieldHeaderRow}>
        <Text style={styles.label}>2. Select Category *</Text>
        {isAiFilled && (
          <Text style={styles.aiBadge}>AI Auto-Selected 🤖</Text>
        )}
      </View>
      <View style={styles.categoryRow}>
        {CATEGORIES.map((cat) => {
          const isSelected = category === cat;
          return (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryBtn, isSelected && styles.categoryBtnActive]}
              onPress={() => {
                setCategory(cat);
                setImageUrl(SAMPLE_IMAGES[cat][0]);
              }}
            >
              <Text style={[styles.categoryBtnText, isSelected && styles.categoryBtnTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Condition Selector */}
      <View style={styles.fieldHeaderRow}>
        <Text style={styles.label}>3. Item Condition *</Text>
        {isAiFilled && (
          <Text style={styles.aiBadge}>AI Estimated 🔍</Text>
        )}
      </View>
      <View style={styles.categoryRow}>
        {CONDITIONS.map((cond) => {
          const isSelected = condition === cond;
          return (
            <TouchableOpacity
              key={cond}
              style={[styles.categoryBtn, isSelected && styles.conditionBtnActive]}
              onPress={() => setCondition(cond)}
            >
              <Text style={[styles.categoryBtnText, isSelected && styles.conditionBtnTextActive]}>
                {cond}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Image Preview & Selection */}
      <View style={styles.fieldHeaderRow}>
        <Text style={styles.label}>4. Item Photo *</Text>
        <Text style={styles.aiBadge}>Tap photo to trigger AI scan 🤖</Text>
      </View>

      {/* Camera & Gallery Action Buttons */}
      <View style={styles.photoButtonsRow}>
        <TouchableOpacity style={styles.photoActionBtn} onPress={handleTakePhoto}>
          <Camera size={16} color="#059669" />
          <Text style={styles.photoActionBtnText}>Take Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.photoActionBtn} onPress={handlePickGallery}>
          <ImageIcon size={16} color="#4f46e5" />
          <Text style={styles.photoActionBtnText}>From Gallery</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.imagePreviewContainer}>
        <Image source={{ uri: imageUrl }} style={styles.imagePreview} />
      </View>

      <Text style={styles.subLabel}>Or Choose Preset Demonstration Photo</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetRow}>
        {SAMPLE_IMAGES[category].map((img, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={() => handleSelectPreset(img, category)}
            style={[styles.presetThumb, imageUrl === img && styles.presetThumbActive]}
          >
            <Image source={{ uri: img }} style={styles.presetImage} />
            {imageUrl === img && (
              <View style={styles.checkedIcon}>
                <CheckCircle2 size={16} color="#059669" />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Form Fields */}
      <View style={styles.fieldHeaderRow}>
        <Text style={styles.label}>Item Title *</Text>
        {isAiFilled && (
          <Text style={styles.aiBadge}>Editable ✏️</Text>
        )}
      </View>
      <TextInput
        style={styles.input}
        placeholder="e.g. Bosch Laser Measuring Tool"
        placeholderTextColor="#94a3b8"
        value={title}
        onChangeText={setTitle}
      />

      <View style={styles.fieldHeaderRow}>
        <Text style={styles.label}>Description & Guidelines *</Text>
        {isAiFilled && (
          <Text style={styles.aiBadge}>AI Drafted ✍️</Text>
        )}
      </View>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Condition, included accessories, or pickup suggestions..."
        placeholderTextColor="#94a3b8"
        multiline
        numberOfLines={3}
        value={description}
        onChangeText={setDescription}
      />

      <Text style={styles.label}>Location / Neighborhood</Text>
      <View style={styles.locationInputWrapper}>
        <MapPin size={16} color="#64748b" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.locationInput}
          placeholder="e.g. Downtown Library Area"
          placeholderTextColor="#94a3b8"
          value={location}
          onChangeText={setLocation}
        />
      </View>

      {/* Eco Impact Card */}
      <View style={styles.ecoCard}>
        <View style={styles.ecoLeft}>
          <Leaf size={18} color="#059669" />
          <View style={{ marginLeft: 8 }}>
            <Text style={styles.ecoTitle}>Eco Impact Calculation</Text>
            <Text style={styles.ecoSubtitle}>Diverting items prevents landfill emissions</Text>
          </View>
        </View>
        <View style={styles.ecoRight}>
          <Text style={styles.ecoPointsText}>+{currentPoints} Pts</Text>
          <Text style={styles.ecoCo2Text}>~{currentCo2}kg CO₂</Text>
        </View>
      </View>

      {/* Post Button */}
      <TouchableOpacity
        style={[styles.postButton, (posting || aiStatus === 'analyzing') && { opacity: 0.7 }]}
        disabled={posting || aiStatus === 'analyzing'}
        onPress={handlePost}
      >
        <Text style={styles.postButtonText}>
          {posting ? 'Publishing...' : `List Item for ${currentConfig.label}`}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  content: {
    padding: 16,
    paddingBottom: 40
  },
  banner: {
    backgroundColor: '#fef3c7',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#fde68a'
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4
  },
  bannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#b45309',
    marginLeft: 6
  },
  bannerSubtitle: {
    fontSize: 11,
    color: '#92400e',
    lineHeight: 15
  },
  aiCard: {
    backgroundColor: '#f5f3ff',
    borderRadius: 16,
    padding: 13,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd6fe'
  },
  aiCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  aiCardTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  aiIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
    justifyContent: 'center'
  },
  aiCardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1e1b4b'
  },
  aiCardSubtitle: {
    fontSize: 10,
    color: '#6b7280'
  },
  aiTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#4f46e5',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10
  },
  aiTriggerBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700'
  },
  aiClearBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#fee2e2'
  },
  aiLoadingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#e0e7ff',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8
  },
  aiLoadingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4338ca'
  },
  aiResultContainer: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#ede9fe'
  },
  aiConfidenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  confidencePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ffffff',
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  confidenceDot: {
    width: 6,
    height: 6,
    borderRadius: 3
  },
  confidenceText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#334155'
  },
  reasonToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3
  },
  reasonToggleText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4f46e5'
  },
  reasonBox: {
    marginTop: 6,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#e0e7ff'
  },
  reasonText: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 15
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 6
  },
  tagChip: {
    backgroundColor: '#ffffff',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569'
  },
  fieldHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  aiBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4f46e5',
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
    marginTop: 10
  },
  subLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 6
  },
  segmentedContainer: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12
  },
  segmentedButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0'
  },
  segmentedButtonEmoji: {
    fontSize: 16,
    marginBottom: 2
  },
  segmentedButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569'
  },
  contextBox: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12
  },
  contextTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8
  },
  contextHelpText: {
    fontSize: 12,
    color: '#0f766e',
    lineHeight: 16
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6
  },
  switchLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155'
  },
  unitRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4
  },
  unitBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center'
  },
  unitBtnActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb'
  },
  unitBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569'
  },
  unitBtnTextActive: {
    color: '#ffffff',
    fontWeight: '700'
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14
  },
  categoryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  categoryBtnActive: {
    backgroundColor: '#059669',
    borderColor: '#059669'
  },
  conditionBtnActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a'
  },
  categoryBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569'
  },
  categoryBtnTextActive: {
    color: '#ffffff',
    fontWeight: '700'
  },
  conditionBtnTextActive: {
    color: '#ffffff',
    fontWeight: '700'
  },
  photoButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12
  },
  photoActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  photoActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155'
  },
  imagePreviewContainer: {
    height: 170,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#e2e8f0',
    marginBottom: 12
  },
  imagePreview: {
    width: '100%',
    height: '100%'
  },
  presetRow: {
    flexDirection: 'row',
    marginBottom: 16
  },
  presetThumb: {
    width: 64,
    height: 64,
    borderRadius: 10,
    overflow: 'hidden',
    marginRight: 10,
    borderWidth: 2,
    borderColor: 'transparent'
  },
  presetThumbActive: {
    borderColor: '#059669'
  },
  presetImage: {
    width: '100%',
    height: '100%'
  },
  checkedIcon: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#ffffff',
    borderRadius: 8
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 11,
    fontSize: 14,
    color: '#0f172a',
    marginBottom: 8
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top'
  },
  locationInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 14
  },
  locationInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a'
  },
  ecoCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 14,
    padding: 12,
    marginBottom: 20
  },
  ecoLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  ecoTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#064e3b'
  },
  ecoSubtitle: {
    fontSize: 10,
    color: '#047857'
  },
  ecoRight: {
    alignItems: 'flex-end'
  },
  ecoPointsText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#065f46'
  },
  ecoCo2Text: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669'
  },
  postButton: {
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3
  },
  postButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700'
  }
});
