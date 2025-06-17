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

  // Helper function to generate icon rating
  const renderIcons = (count, icon) => {
    if (count === null || count === undefined) return <Text style={styles.iconText}>N/A</Text>;
    return (
      <Text style={styles.iconText}>
        {icon.repeat(Math.round(count))}
        {'\u00A0'.repeat(5 - Math.round(count))} {/* Non-breaking spaces for alignment */}
      </Text>
    );
  };

  // Eco-Score icons (0-100 score to 1-5 leaves)
  const ecoScore = product.ecoscore_score;
  const ecoCount = ecoScore !== undefined ? ecoScore / 20 : null;
  const ecoDescription = ecoCount
    ? ecoScore >= 80
      ? `This product has a high Eco-Score, indicating a low environmental impact on land use, biodiversity, and climate. It's a sustainable choice!`
      : ecoScore >= 60
      ? `This product has a moderate Eco-Score, with a balanced impact on land use and biodiversity. Consider more sustainable options for a greater positive effect.`
      : `This product has a lower Eco-Score, suggesting a higher environmental impact, potentially affecting land use and biodiversity. Choosing alternatives with higher scores can help reduce harm.`
    : 'No data available.';

  // Carbon Footprint icons (lower CO2e/kg is better)
  const carbonFootprint = product.ecoscore_data?.agribalyse?.co2_total;
  let carbonCount = null;
  if (carbonFootprint !== undefined) {
    if (carbonFootprint < 1) carbonCount = 5;
    else if (carbonFootprint <= 3) carbonCount = 4;
    else if (carbonFootprint <= 5) carbonCount = 3;
    else if (carbonFootprint <= 10) carbonCount = 2;
    else carbonCount = 1;
  }
  const carbonDescription = carbonFootprint
    ? `Measures CO2 emissions from production. This product's ${carbonFootprint.toFixed(2)} kg CO2e/kg is like driving ${Math.round(carbonFootprint * 4)} km in a typical car, e.g., a round trip across a small city.`
    : 'No data available.';

  // Packaging Sustainability icons (0-100 score to 1-5 recycle symbols)
  const packagingScore = product.ecoscore_data?.adjustments?.packaging?.score;
  const packagingCount = packagingScore !== undefined ? packagingScore / 20 : null;
  const packagingDescription = packagingScore
    ? `Evaluates waste and resource use. A score of ${packagingScore.toFixed(1)} means ${packagingScore > 70 ? 'high recyclability' : 'significant landfill waste'}, impacting resource conservation.`
    : 'No data available.';

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
      <Text style={styles.detail}>Nutri-Score: {product.nutrition_grades?.toUpperCase() || 'N/A'}</Text>
      <View style={styles.scoresSection}>
        <Text style={styles.scoresTitle}>Scores (out of 5 icons)</Text>
        <View style={styles.iconSection}>
          <View style={styles.iconRow}>
            <Text style={styles.label}>Eco-Score:</Text>
            {renderIcons(ecoCount, '🍃')}
          </View>
          <Text style={styles.description}>{ecoDescription}</Text>
        </View>
        <View style={styles.iconSection}>
          <View style={styles.iconRow}>
            <Text style={styles.label}>Carbon Footprint:</Text>
            {renderIcons(carbonCount, '☁️')}
          </View>
          <Text style={styles.description}>{carbonDescription}</Text>
        </View>
        <View style={styles.iconSection}>
          <View style={styles.iconRow}>
            <Text style={styles.label}>Packaging Sustainability:</Text>
            {renderIcons(packagingCount, '♻️')}
          </View>
          <Text style={styles.description}>{packagingDescription}</Text>
        </View>
      </View>
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
  scoresSection: { width: '100%', marginBottom: 12 },
  scoresTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  iconSection: { width: '100%', marginBottom: 12 },
  iconRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, justifyContent: 'center' },
  label: { fontSize: 16, marginRight: 10, textAlign: 'right', flex: 1 },
  iconText: { fontSize: 16, flex: 1, textAlign: 'left' },
  description: { fontSize: 14, color: '#666', textAlign: 'center', paddingHorizontal: 10, marginBottom: 4 },
});