import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Button,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function FoodSearchPage() {
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const scoreColor = (score) => {
    if (!score) return '#aaa';
    const c = score.toUpperCase();
    if (c === 'A') return '#4CAF50';
    if (c === 'B') return '#8BC34A';
    if (c === 'C') return '#FFC107';
    if (c === 'D') return '#FF9800';
    if (c === 'E') return '#F44336';
    return '#aaa';
  };

  // Function to normalize product names for comparison
  const normalizeProductName = (name) => {
    if (!name) return '';
    return name
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\b(original|classic|traditional|regular)\b/g, '') // Remove common variants
      .replace(/\b\d+\s*(g|kg|ml|l|oz|lb)\b/g, '') // Remove weights/volumes
      .replace(/\b(pack|jar|bottle|can|box)\b/g, '') // Remove packaging words
      .trim();
  };

  // Function to calculate similarity between two strings
  const calculateSimilarity = (str1, str2) => {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    const editDistance = getEditDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  };

  // Levenshtein distance calculation
  const getEditDistance = (str1, str2) => {
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[str2.length][str1.length];
  };

  // Method 1: Simple name-based deduplication
  const deduplicateByName = (products) => {
    const seen = new Set();
    return products.filter(product => {
      const normalized = normalizeProductName(product.product_name);
      if (seen.has(normalized)) {
        return false;
      }
      seen.add(normalized);
      return true;
    });
  };


  // Helper function to score product quality (for choosing best duplicate)
  const getProductQualityScore = (product) => {
    let score = 0;
    
    // Prefer products with images
    if (product.image_front_small_url) score += 2;
    
    // Prefer products with eco score
    if (product.ecoscore_grade) score += 2;
    
    // Prefer products with nutrition grade
    if (product.nutrition_grades) score += 2;
    
    // Prefer products with carbon footprint data
    if (product.carbon_footprint_100g !== undefined) score += 1;
    
    // Prefer products with more complete names (less likely to be partial/broken)
    if (product.product_name && product.product_name.length > 10) score += 1;
    
    // Prefer products with brand information
    if (product.brands) score += 1;
    
    return score;
  };

  const searchProducts = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setProducts([]);

    try {
      const url = `https://world.openfoodfacts.org/cgi/search.pl?` +
        `search_terms=${encodeURIComponent(query)}` +
        `&search_simple=1` +
        `&action=process` +
        `&json=1` +
        `&fields=product_name,ecoscore_grade,ecoscore_score,carbon_footprint_100g,image_front_small_url,countries_tags,code,brands,nutrition_grades,packaging` +
        `&countries_tags=singapore` +
        `&lang=en` +
        `&page_size=50`; // Increased to get more results before filtering

      const response = await fetch(url);
      const json = await response.json();

      if (json.products) {
        let filtered = json.products.filter(p =>
          p.product_name &&
          p.countries_tags?.includes('en:singapore') &&
          (typeof p.ecoscore_score === 'number' || typeof p.carbon_footprint_100g === 'number')
        );
        
        // Apply deduplication - Simple name-based 
       filtered = deduplicateByName(filtered);

        // Sort by quality score to show best products first
        filtered.sort((a, b) => getProductQualityScore(b) - getProductQualityScore(a));
        
        // Limit final results
        setProducts(filtered.slice(0, 15));
      }
    } catch (error) {
      console.error('Search error:', error);
    }

    setLoading(false);
  };

  const renderItem = ({ item }) => {
    const nutriScore = item.nutrition_grades || null;
    const ecoScore = item.ecoscore_grade || null;
    const packaging = item.packaging || 'N/A';
    const productName = item.product_name || 'Unnamed product';
    const imageUrl = item.image_front_small_url || null;
    const brand = item.brands?.split(',')[0]?.trim() || '';

    return (
      <TouchableOpacity
        onPress={() => router.push({ pathname: '/ProductDetails', params: { code: item.code } })}
        activeOpacity={0.7}
      >
        <View style={styles.card}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.image} />
          ) : (
            <View style={[styles.image, styles.imagePlaceholder]}>
              <Text style={{ color: '#888' }}>No Image</Text>
            </View>
          )}
          <View style={styles.info}>
            <Text style={styles.productName}>{productName}</Text>
            {brand && <Text style={styles.brand}>{brand}</Text>}
            <View style={styles.scoresRow}>
            <View style={[styles.scoreBadge, { backgroundColor: scoreColor(ecoScore) }]}>
              <Text style={styles.scoreText}>Eco: {ecoScore ? ecoScore.toUpperCase() : '?'}</Text>
              </View>
            </View>
            <Text style={styles.packaging}>
              Carbon: {item.carbon_footprint_100g !== undefined ? `${item.carbon_footprint_100g}g CO₂/100g` : 'N/A'}
              </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Sustainable Food Search</Text>
      <View style={styles.searchRow}>
        <TextInput
          placeholder="Search a food product"
          value={query}
          onChangeText={setQuery}
          style={styles.searchInput}
          onSubmitEditing={searchProducts}
          returnKeyType="search"
        />
        <Button title="Search" onPress={searchProducts} color="#388e3c" />
      </View>

      {loading && <ActivityIndicator size="large" style={{ marginTop: 20 }} />}

      {!loading && products.length === 0 && (
        <Text style={{ marginTop: 20, color: '#666' }}>No products found. Try searching!</Text>
      )}

      {!loading && products.length > 0 && (
        <FlatList
          data={products}
          keyExtractor={(item) => item.code}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  searchRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'center' },
  searchInput: {
    flex: 1,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    fontSize: 16,
  },
  card: {
    flexDirection: 'row',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#fafafa',
    elevation: 1,
  },
  image: { width: 80, height: 80, borderRadius: 8, backgroundColor: '#eee' },
  imagePlaceholder: { justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1, paddingLeft: 12, justifyContent: 'center' },
  productName: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  brand: { fontSize: 14, color: '#666', marginBottom: 6, fontStyle: 'italic' },
  scoresRow: { flexDirection: 'row', marginBottom: 6 },
  scoreBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginRight: 8,
  },
  scoreText: { color: '#fff', fontWeight: '600' },
  packaging: { fontStyle: 'italic', color: '#555' },
});