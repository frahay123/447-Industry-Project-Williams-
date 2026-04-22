import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 20,
    paddingBottom: 120,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 10,
    marginTop: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#0f172a',
  },
  inputSmall: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
    flex: 1,
  },
  lineItemRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  lineItemDesc: {
    flex: 3,
  },
  lineItemQty: {
    flex: 1,
  },
  lineItemUnit: {
    flex: 1,
  },
  lineItemPrice: {
    flex: 1,
  },
  removeItemBtn: {
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  removeItemText: {
    color: '#dc2626',
    fontWeight: '700',
    fontSize: 16,
  },
  addItemBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
    marginBottom: 8,
  },
  addItemText: {
    color: '#475569',
    fontWeight: '600',
    fontSize: 14,
  },
  submit: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  submitText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  msg: {
    marginTop: 8,
    fontSize: 14,
    color: '#dc2626',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  poNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  vendorText: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
  },
  cardMeta: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  expandHint: {
    fontSize: 13,
    color: '#3b82f6',
    fontWeight: '600',
    marginTop: 8,
  },
  itemsList: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  itemDesc: {
    fontSize: 14,
    color: '#334155',
    flex: 1,
  },
  itemQty: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '600',
  },
  deleteBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  deleteBtnText: {
    color: '#dc2626',
    fontWeight: '700',
    fontSize: 13,
  },
});
