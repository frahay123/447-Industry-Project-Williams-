import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderLeftWidth: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemDescription: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  itemProject: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  quantity: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    marginLeft: 12,
  },
  locationBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  locationText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});
