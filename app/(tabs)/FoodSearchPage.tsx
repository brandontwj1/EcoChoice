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

export default function FoodSearchPage() {
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Color helper for Nutri and Eco Scores
  const scoreColor = (score) => {
    if (!score) return '#aaa';
    const c = score.toUpperCase();
    if (c === 'A') return '#4CAF50'; // Green
    if (c === 'B') return '#8BC34A'; // Light Green
    if (c === 'C') return '#FFC107'; // Amber
    if (c === 'D') return '#FF9800'; // Orange
    if (c === 'E') return '#F44336'; // Red
    return '#aaa';
  };

  const searchProducts = async () => {
    if (!query.trim()) return;
  
    setLoading(true);
    setProducts([]);

    try {
      const response = await fetch(url);
      const json = await response.json();
  
      if (json.products) {
        const filtered = json.products.filter(p =>
          p.product_name &&
          p.countries_tags?.includes('en:singapore') &&
          (p.ecoscore_grade || p.carbon_footprint_100g !== undefined)
        );
        setProducts(filtered);
      }
    }
    setLoading(false);
  };

  const renderItem = ({ item }) => {
    // Some items may lack these fields; provide defaults
    const nutriScore = item.nutrition_grades || null;
    const ecoScore = item.ecoscore_grade || null;
    const packaging = item.packaging || 'N/A';
    const productName = item.product_name || 'Unnamed product';
    const imageUrl = item.image_front_small_url || null;

    return (
      <TouchableOpacity
        onPress={() => router.push({ pathname: '/product-details', params: { code: item.code } })}
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
            <View style={styles.scoresRow}>
              <View style={[styles.scoreBadge, { backgroundColor: scoreColor(nutriScore) }]}>
                <Text style={styles.scoreText}>Nutri: {nutriScore ? nutriScore.toUpperCase() : '?'}</Text>
              </View>
              <View style={[styles.scoreBadge, { backgroundColor: scoreColor(ecoScore) }]}>
                <Text style={styles.scoreText}>Eco: {ecoScore ? ecoScore.toUpperCase() : '?'}</Text>
              </View>
            </View>
            <Text style={styles.packaging}>Packaging: {packaging}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
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
        <Button title="Search" onPress={searchProducts} />
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
    </View>
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
  productName: { fontSize: 16, fontWeight: 'bold', marginBottom: 6 },
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