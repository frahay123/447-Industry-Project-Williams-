import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Image,
  Modal,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from './DeliveriesScreen.styles';
import { useDeliveries } from './DeliveriesScreen.logic';
import { EmptyState } from '../../components/EmptyState';

const previewStyles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
  },
  modalBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  closeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  modalImage: {
    flex: 1,
    width: '100%',
  },
  thumbWrap: {
    marginTop: 10,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
    maxHeight: 220,
  },
  thumb: {
    width: '100%',
    height: 200,
    backgroundColor: '#e2e8f0',
  },
  viewHint: {
    fontSize: 13,
    color: '#3b82f6',
    fontWeight: '600',
    marginTop: 8,
  },
});

export default function DeliveriesScreen() {
  const {
    slips,
    loading,
    error,
    canUpload,
    needsProject,
    uploadError,
    uploading,
    pickAndUpload,
    reload,
    getSlipImageSource,
  } = useDeliveries();

  const [previewId, setPreviewId] = useState(null);

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Packing slips</Text>

        {needsProject ? <EmptyState title="Pick a job" /> : null}

        {error ? <Text style={styles.msg}>{error}</Text> : null}
        {loading ? <ActivityIndicator style={{ marginVertical: 16 }} /> : null}

        {canUpload && !needsProject ? (
          <>
            <Text style={styles.formTitle}>Upload slip</Text>
            {uploadError ? <Text style={styles.msg}>{uploadError}</Text> : null}
            <Pressable
              style={[styles.uploadBtn, uploading && { opacity: 0.6 }]}
              onPress={pickAndUpload}
              disabled={uploading}
            >
              <Text style={styles.uploadBtnText}>
                {uploading ? 'Uploading…' : 'Choose photo'}
              </Text>
            </Pressable>
          </>
        ) : null}

        <Text style={styles.formTitle}>Uploaded (this job)</Text>
        {!needsProject && !loading && slips.length === 0 ? (
          <EmptyState title="None yet" />
        ) : null}

        {slips.map((s) => (
          <Pressable
            key={s.id}
            style={styles.card}
            onPress={() => setPreviewId(s.id)}
          >
            <Text style={styles.deliveryNumber}>{s.project_name}</Text>
            <View style={previewStyles.thumbWrap}>
              <Image
                source={getSlipImageSource(s.id)}
                style={previewStyles.thumb}
                resizeMode="cover"
              />
            </View>
            <Text style={previewStyles.viewHint}>Tap to view full size</Text>
            <Text style={styles.slipMeta}>
              By {s.uploaded_by} ·{' '}
              {s.created_at ? new Date(s.created_at).toLocaleString() : ''}
            </Text>
          </Pressable>
        ))}

        {error ? (
          <Pressable onPress={reload}>
            <Text style={{ color: '#3b82f6', marginTop: 12, fontWeight: '600' }}>
              Retry
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>

      <Modal
        visible={previewId != null}
        animationType="fade"
        transparent
        onRequestClose={() => setPreviewId(null)}
      >
        <SafeAreaView style={previewStyles.modalRoot} edges={['top', 'bottom']}>
          <View style={previewStyles.modalBar}>
            <Pressable onPress={() => setPreviewId(null)} hitSlop={12}>
              <Text style={previewStyles.closeText}>Close</Text>
            </Pressable>
          </View>
          {previewId != null ? (
            <Image
              source={getSlipImageSource(previewId)}
              style={previewStyles.modalImage}
              resizeMode="contain"
            />
          ) : null}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
