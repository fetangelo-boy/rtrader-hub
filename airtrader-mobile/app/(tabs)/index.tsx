import { StyleSheet } from 'react-native';
import { Text, View } from '@/components/Themed';
import { marketCards } from '@/constants/mockData';

export default function TabOneScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>AirTrader Dashboard</Text>
      <Text style={styles.subtitle}>Quick market pulse for the club.</Text>
      {marketCards.map((card) => (
        <View key={card.id} style={styles.card}>
          <Text style={styles.cardTitle}>{card.title}</Text>
          <Text style={styles.cardValue}>{card.value}</Text>
          <Text style={styles.cardChange}>{card.change}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    marginTop: 12,
    paddingHorizontal: 24,
    textAlign: 'center',
    opacity: 0.8,
  },
  card: {
    width: '90%',
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  cardTitle: {
    fontSize: 14,
    opacity: 0.8,
  },
  cardValue: {
    marginTop: 6,
    fontSize: 22,
    fontWeight: '700',
  },
  cardChange: {
    marginTop: 6,
    fontSize: 13,
  },
});
