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
  pickerBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerBtnText: {
    fontSize: 16,
    color: '#0f172a',
    flex: 1,
  },
  pickerBtnPlaceholder: {
    fontSize: 16,
    color: '#94a3b8',
    flex: 1,
  },
  pickerChevron: {
    fontSize: 16,
    color: '#94a3b8',
    marginLeft: 8,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chipActive: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  chipTextActive: {
    color: '#1e40af',
  },
  chipSub: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  chipSubActive: {
    color: '#3b82f6',
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
  rowTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  rowMeta: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
  },
  directionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    flexWrap: 'wrap',
  },
  directionFrom: {
    fontSize: 14,
    fontWeight: '600',
    color: '#dc2626',
  },
  directionArrow: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
  },
  directionTo: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16a34a',
  },
  statusTrack: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 4,
  },
  statusStep: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e2e8f0',
  },
  statusStepActive: {
    backgroundColor: '#3b82f6',
  },
  statusStepDone: {
    backgroundColor: '#22c55e',
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginTop: 6,
    textTransform: 'capitalize',
  },
  statusStepLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#94a3b8',
    flex: 1,
    textAlign: 'center',
  },
  statusStepLabelActive: {
    color: '#3b82f6',
    fontWeight: '800',
  },
  statusStepLabelDone: {
    color: '#22c55e',
  },
  signedInfo: {
    fontSize: 13,
    color: '#16a34a',
    fontWeight: '600',
    marginTop: 6,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#3b82f6',
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
});
