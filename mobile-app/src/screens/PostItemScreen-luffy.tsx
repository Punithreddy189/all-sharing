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
  Switch
} from 'react-native';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { ItemCategory, ListingType, PricingUnit, ItemCondition } from '../types';
import { Sparkles, MapPin, CheckCircle2, DollarSign, Clock, RefreshCw, Handshake } from 'lucide-react-native';
import { LISTING_TYPE_CONFIGS, LISTING_TYPES, getListingConfig, validateListing } from '../utils/listingConfig';

const CATEGORIES: ItemCategory[] = ['Books', 'Tools', 'Electronics', 'Others'];
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

  const [posting, setPosting] = useState(false);

  const currentConfig = getListingConfig(listingType);

  const handleSelectCategory = (cat: ItemCategory) => {
    setCategory(cat);
    setImageUrl(SAMPLE_IMAGES[cat][0]);
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

    setPosting(true);
    try {
      await postNewItem({
        title: title.trim(),
        description: description.trim(),
        category,
        imageUrl,
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
        condition
      });

      Alert.alert(
        'Item Listed! 🌟',
        `Your item is now listed for ${currentConfig.label} in the EcoShare community. You earned +50 EcoPoints!`,
        [
          {
            text: 'View in Feed',
            onPress: () => {
              setTitle('');
              setDescription('');
              setPriceInput('');
              setExchangeFor('');
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Banner */}
      <View style={styles.banner}>
        <View style={styles.bannerLeft}>
          <Sparkles size={20} color="#d97706" />
          <Text style={styles.bannerTitle}>Earn +50 EcoPoints</Text>
        </View>
        <Text style={styles.bannerSubtitle}>
          List items for Borrowing, Selling, Renting, or Exchanging to reduce landfill waste.
        </Text>
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
      {/* Sell Context */}
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

      {/* Rent Context */}
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

      {/* Exchange Context */}
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

      {/* Borrow Context */}
      {listingType === 'Borrow' && (
        <View style={[styles.contextBox, { backgroundColor: '#f0fdfa', borderColor: '#99f6e4' }]}>
          <Text style={[styles.contextTitle, { color: '#115e59' }]}>🤝 Free Community Share</Text>
          <Text style={styles.contextHelpText}>
            Lending tools and books to neighbors builds community trust and earns +50 EcoPoints.
          </Text>
        </View>
      )}

      {/* Category Picker */}
      <Text style={styles.label}>2. Select Category *</Text>
      <View style={styles.categoryRow}>
        {CATEGORIES.map((cat) => {
          const isSelected = category === cat;
          return (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryBtn, isSelected && styles.categoryBtnActive]}
              onPress={() => handleSelectCategory(cat)}
            >
              <Text style={[styles.categoryBtnText, isSelected && styles.categoryBtnTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Condition Selector */}
      <Text style={styles.label}>3. Item Condition *</Text>
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
      <Text style={styles.label}>4. Photo Preview</Text>
      <View style={styles.imagePreviewContainer}>
        <Image source={{ uri: imageUrl }} style={styles.imagePreview} />
      </View>

      <Text style={styles.subLabel}>Choose Preset Image</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetRow}>
        {SAMPLE_IMAGES[category].map((img, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={() => setImageUrl(img)}
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
      <Text style={styles.label}>Item Title *</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Bosch Laser Measuring Tool"
        placeholderTextColor="#94a3b8"
        value={title}
        onChangeText={setTitle}
      />

      <Text style={styles.label}>Description & Guidelines *</Text>
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

      {/* Post Button */}
      <TouchableOpacity
        style={[styles.postButton, posting && { opacity: 0.7 }]}
        disabled={posting}
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
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#fde68a'
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#b45309',
    marginLeft: 6
  },
  bannerSubtitle: {
    fontSize: 12,
    color: '#92400e',
    lineHeight: 16
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
    marginBottom: 20
  },
  locationInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a'
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

