import { StyleSheet, Text, View } from 'react-native';

type ScreenLayoutProps = {
  title: string;
  subtitle: string;
};

export const ScreenLayout = ({ title, subtitle }: ScreenLayoutProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 12,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 16,
    color: '#4b5563',
  },
});
