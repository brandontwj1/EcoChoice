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
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.centered}>
        <Text style={styles.notFound}>Product not found.</Text>
      </View>
    );
  }

  // Helper function to generate icon rating
  const renderIcons = (count, icon) => {
    if (!Number.isFinite(count) || count <= 0) return <Text style={styles.iconTextLarge}>N/A</Text>;
    const rounded = Math.max(0, Math.min(5, Math.round(count)));
    return (
      <Text style={styles.iconTextLarge}>
        {icon.repeat(rounded)}
        {'\u00A0'.repeat(5 - rounded)}
      </Text>
    );
  };

  // Eco-Score icons (0-100 score to 1-5 leaves)
  const ecoScore = product.ecoscore_score;
  const ecoCount = ecoScore !== undefined ? ecoScore / 20 : null;
  const ecoDescription = ecoCount
    ? ecoScore >= 80
      ? `🌱 Excellent Eco-Score! This product has a low environmental impact.`
      : ecoScore >= 60
      ? `🌿 Good Eco-Score. This product is fairly sustainable.`
      : `🍂 Low Eco-Score. Consider more sustainable alternatives.`
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
    ? carbonFootprint < 1
      ? `🌍 Excellent! With CO₂ emissions of ${carbonFootprint.toFixed(2)} kg CO₂e/kg, this product has a very low carbon footprint.`
      : carbonFootprint <= 3
      ? `🌱 Good! With CO₂ emissions of ${carbonFootprint.toFixed(2)} kg CO₂e/kg, this product is relatively low in CO₂ emissions.`
      : carbonFootprint <= 5
      ? `🍃 Moderate CO₂ emissions. Consider alternatives with lower impact!`
      : carbonFootprint <= 10
      ? `🌿 High CO₂ emissions. Look for greener options.`
      : `🌍 Very high CO₂ emissions. Avoid if possible.`
    : 'No data available.';

  // Packaging Sustainability icons (0-100 score to 1-5 recycle symbols)
  const packagingScore = product.ecoscore_data?.adjustments?.packaging?.score;
  const packagingCount = packagingScore !== undefined ? packagingScore / 20 : null;
  let packagingDescription = 'No data available.';
  if (typeof packagingScore === 'number') {
    if (packagingScore >= 90) {
      packagingDescription = "♻️ Excellent! Packaging is highly recyclable and eco-friendly.";
    } else if (packagingScore >= 70) {
      packagingDescription = "✅ Good! Packaging is mostly recyclable with minimal waste.";
    } else if (packagingScore >= 50) {
      packagingDescription = "♻️ Moderate. Packaging is partially recyclable, but could be improved.";
    } else if (packagingScore >= 30) {
      packagingDescription = "⚠️ Low. Packaging is mostly non-recyclable and generates waste.";
    } else {
      packagingDescription = "🗑️ Poor. Packaging is not recyclable and has a high environmental impact.";
    }
  }

  const ecoScoreValue = typeof ecoScore === 'number' ? ecoScore : null;
  const carbonScoreValue = typeof carbonFootprint === 'number'
    ? Math.max(0, Math.min(100, 100 - (carbonFootprint * 10))) // Lower CO2 is better, scale: 0kg = 100, 10kg = 0
    : null;
  const packagingScoreValue = typeof packagingScore === 'number' ? packagingScore : null;

  // Only include available scores in the average
  const scoreValues = [ecoScoreValue, carbonScoreValue, packagingScoreValue].filter(v => typeof v === 'number');
  const overallScore = scoreValues.length > 0
    ? Math.round(scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length)
    : null;

  // Helper for ring color
  const getRingColor = (score) => {
    if (score === null) return '#ccc';
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#8BC34A';
    if (score >= 40) return '#FFC107';
    if (score >= 20) return '#FF9800';
    return '#F44336';
  };

  // Helper for overall description
  const getOverallDescription = (score) => {
    if (score === null) return "No overall sustainability data available.";
    if (score >= 90) return "🌟 Outstanding sustainability!";
    if (score >= 75) return "✅ Very good sustainability.";
    if (score >= 60) return "👍 Good sustainability.";
    if (score >= 40) return "⚠️ Moderate sustainability. Could be improved.";
    if (score >= 20) return "❗ Low sustainability. Consider alternatives.";
    return "🚫 Very low sustainability. Avoid if possible.";
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.productRow}>
        {product.image_front_url ? (
          <Image source={{ uri: product.image_front_url }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Text style={{ color: '#888' }}>No Image</Text>
          </View>
        )}
        <View style={styles.productInfoEven}>
          <Text style={styles.name} numberOfLines={2} ellipsizeMode="tail">
            {product.product_name || 'Unnamed product'}
          </Text>
          <Text style={styles.brand} numberOfLines={1} ellipsizeMode="tail">
            {product.brands || 'Unknown brand'}
          </Text>
          <View style={styles.quantityRow}>
            <Text style={styles.quantityLabel}>Quantity:</Text>
            <Text style={styles.quantityValue}>{product.quantity || 'N/A'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.overallSection}>
        <Text style={styles.overallTitle}>Overall Sustainability Rating</Text>
        <View style={styles.overallRingContainer}>
          <View style={[
            styles.ring,
            { borderColor: getRingColor(overallScore) }
          ]}>
            <Text style={styles.ringText}>
              {overallScore !== null ? `${overallScore}` : 'N/A'}
            </Text>
          </View>
        </View>
        <Text style={styles.overallDescription}>{getOverallDescription(overallScore)}</Text>
      </View>

      <View style={styles.scoresSection}>
        <Text style={styles.scoresTitle}>Sustainability Scores</Text>
        <View style={styles.scoreCard}>
          <View style={styles.iconRow}>
            <Text style={styles.labelLarge}>Eco Score</Text>
            {renderIcons(ecoCount, '🍃')}
          </View>
          <Text style={styles.description}>{ecoDescription}</Text>
        </View>
        <View style={styles.scoreCard}>
          <View style={styles.iconRow}>
            <Text style={styles.labelLarge}>Carbon Score</Text>
            {renderIcons(carbonCount, '🌎')}
          </View>
          <Text style={styles.description}>{carbonDescription}</Text>
        </View>
        <View style={styles.scoreCard}>
          <View style={styles.iconRow}>
            <Text style={styles.labelLarge}>Packaging</Text>
            {renderIcons(packagingCount, '♻️')}
          </View>
          <Text style={styles.description}>{packagingDescription}</Text>
        </View>
      </View>

    
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8faf7',
    minHeight: '100%',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8faf7',
  },
  notFound: {
    fontSize: 18,
    color: '#c00',
    fontWeight: 'bold',
  },
  productRow: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  image: {
    width: 110,
    height: 110,
    borderRadius: 12,
    backgroundColor: '#eee',
    marginRight: 18,
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfoEven: {
    flex: 1,
    justifyContent: 'space-between',
    paddingLeft: 6,
    height: 110, // Match image height for even vertical spacing
  },
  name: {
    fontSize: 23,
    fontWeight: 'bold',
    color: '#222',
    textAlign: 'left',
    flexWrap: 'wrap',
    letterSpacing: 0.3,
  },
  brand: {
    fontSize: 17,
    color: '#388e3c',
    fontWeight: '600',
    textAlign: 'left',
    flexWrap: 'wrap',
    letterSpacing: 0.2,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  quantityLabel: {
    fontSize: 15,
    color: 'black',
    fontWeight: '600',
    marginRight: 8,
  },
  quantityValue: {
    fontSize: 15,
    color: '#222',
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    marginTop: 2,
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
    marginRight: 6,
  },
  infoValue: {
    fontSize: 16,
    color: '#222',
    fontWeight: '600',
  },
  scoresSection: {
    width: '100%',
    marginTop: 8,
    marginBottom: 0,
  },
  scoresTitle: {
    fontSize: 21,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 18,
    color: '#388e3c',
    letterSpacing: 0.5,
  },
  scoreCard: {
    backgroundColor: '#f0f7f4',
    borderRadius: 12,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    textAlign: 'right',
    marginBottom: 6,
    justifyContent: 'space-between',
  },
  labelLarge: {
    fontSize: 18,
    color: '#222',
    fontWeight: '700',
    flex: 2,
    letterSpacing: 0.2,
    textAlign: 'left',
  },
  iconTextLarge: {
    fontSize: 22,
    flex: 3,
    textAlign: 'right',
    letterSpacing: 3,
  },
  description: {
    fontSize: 15,
    color: '#666',
    textAlign: 'left',
    paddingHorizontal: 2,
    marginTop: 2,
    lineHeight: 20,
  },
  overallSection: {
  width: '100%',
  alignItems: 'center',
  marginTop: 0,
  marginBottom: 10,
  paddingVertical: 12,
  },  
  overallTitle: {
    fontSize: 21,
    fontWeight: 'bold',
    color: '#388e3c',
    marginBottom: 10,
    textAlign: 'center',
  },
  overallRingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    marginTop: 2,
  },
  ring: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 7,
    borderColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8faf7',
    marginBottom: 2,
  },
  ringText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#222',
    textAlign: 'center',
    lineHeight: 38,
  },
  ringSubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: -4,
  },
  overallDescription: {
    fontSize: 15,
    color: '#444',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
});