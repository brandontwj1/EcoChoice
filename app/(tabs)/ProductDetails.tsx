import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function ProductDetails() {
  const { code } = useLocalSearchParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!code) return;
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${code}.json`);
        const json = await res.json();
        setProduct(json.product);
      } catch (e) {
        setProduct(null);
      }
      setLoading(false);
    };
    fetchProduct();
  }, [code]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.centered}>
        <Text>Product not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {product.image_front_url ? (
        <Image source={{ uri: product.image_front_url }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <Text style={{ color: '#888' }}>No Image</Text>
        </View>
      )}
      <Text style={styles.name}>{product.product_name || 'Unnamed product'}</Text>
      <Text style={styles.detail}>Brand: {product.brands || 'N/A'}</Text>
      <Text style={styles.detail}>Quantity: {product.quantity || 'N/A'}</Text>
      <Text style={styles.detail}>Nutri-Score: {product.nutrition_grades || 'N/A'}</Text>
      <Text style={styles.detail}>Eco-Score: {product.ecoscore_grade || 'N/A'}</Text>
      <Text style={styles.detail}>Packaging: {product.packaging || 'N/A'}</Text>
      <Text style={styles.detail}>Categories: {product.categories || 'N/A'}</Text>
      <Text style={styles.detail}>Ingredients: {product.ingredients_text || 'N/A'}</Text>
      <Text style={styles.detail}>Countries Sold: {product.countries || 'N/A'}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', padding: 20, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  image: { width: 180, height: 180, borderRadius: 12, backgroundColor: '#eee', marginBottom: 16 },
  imagePlaceholder: { justifyContent: 'center', alignItems: 'center' },
  name: { fontSize: 22, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  detail: { fontSize: 16, marginBottom: 6, textAlign: 'center' },
});