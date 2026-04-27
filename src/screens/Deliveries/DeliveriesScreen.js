import { useState, useMemo } from 'react';
import {
  View,
  Text,

  Pressable,
  ActivityIndicator,
  Image,
  Modal,
  StyleSheet,
  Linking,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from './DeliveriesScreen.styles';
import { useDeliveries, groupSlipItemsByDescription } from './DeliveriesScreen.logic';
import { EmptyState } from '../../components/EmptyState';
import KeyboardSafeScroll from '../../components/KeyboardSafeScroll';

// New modular components
import DeliveryCard from './components/DeliveryCard';
import ItemEditorModal from './components/ItemEditorModal';
import ShortagesAccordion from './components/ShortagesAccordion';
import ActivityLogPanel from './components/ActivityLogPanel';

const previewStyles = StyleSheet.create({
  modalRoot: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)' },
  modalBar: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  closeBtn: { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 20, paddingHorizontal: 18, paddingVertical: 8 },
  closeText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  imageArea: { flex: 1, justifyContent: 'center' },
  modalImage: { flex: 1, width: '100%' },
});

const MODAL_TEXT_MAX = 1.35;

export default function DeliveriesScreen() {
  const {
    slips,
    loading,
    error,
    canUpload,
    canAddItems,
    needsProject,
    uploadError,
    uploading,
    scanAndUpload,
    pickAndUploadPDF,
    confirmDeleteSlip,
    reload,
    getSlipImageSource,
    shortages,
    shortageLoading,
    editingSlipId,
    toggleEditSlip,
    lineItems,
    addLineItem,
    updateLineItem,
    removeLineItem,
    locationOptions,
    lineItemError,
    submitLineItems,
    existingItems,
    poItems,
    getPlacementsForDescription,
    loadSlipItems,
    matching,
    promptRejectSlip,
    isWarehouse,
    canDeleteSlip,
    linkPoPickerPoId,
    availableSlipsForPo,
    showSlipPickerForPo,
    dismissSlipPicker,
    confirmSlipToPo,
    activities,
    completeSlip,
  } = useDeliveries();

  const [previewId, setPreviewId] = useState(null);
  const [shortageDetail, setShortageDetail] = useState(null);
  const [slipDetailId, setSlipDetailId] = useState(null);
  const [saving, setSaving] = useState(false);

  const editorSlip = editingSlipId != null ? slips.find(s => s.id === editingSlipId) : null;

  const detailSlip = slipDetailId != null ? slips.find(x => x.id === slipDetailId) : null;
  const detailSlipItems = slipDetailId != null ? (existingItems[slipDetailId] || []) : [];
  const groupedSlipDetailLines = useMemo(
    () => groupSlipItemsByDescription(detailSlipItems),
    [detailSlipItems],
  );

  const insets = useSafeAreaInsets();
  const detailModalHeaderStyle = [styles.detailModalHeader, { paddingTop: Math.max(insets.top, 14) }];
  const detailModalScrollPad = { paddingBottom: Math.max(insets.bottom, 28) };

  // Handle item editor save
  const handleEditorSave = async () => {
    setSaving(true);
    try {
      await submitLineItems();
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <KeyboardSafeScroll contentContainerStyle={styles.content}>
        <Text style={styles.title}>Deliveries</Text>

        {needsProject ? <EmptyState title="Pick a job" /> : null}
        {error ? <Text style={styles.msg}>{error}</Text> : null}
        {loading ? <ActivityIndicator style={{ marginVertical: 16 }} /> : null}

        {/* Upload Section */}
        {canUpload && !needsProject ? (
          <View style={uploadStyles.section}>
            <Text style={styles.formTitle}>Upload Slip</Text>
            {uploadError ? <Text style={styles.msg}>{uploadError}</Text> : null}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable
                style={[uploadStyles.btn, uploading && { opacity: 0.6 }]}
                onPress={scanAndUpload}
                disabled={uploading}
              >
                <Text style={uploadStyles.btnText}>{uploading ? 'Working…' : 'Camera'}</Text>
              </Pressable>
              <Pressable
                style={[uploadStyles.btn, { backgroundColor: '#7c3aed' }, uploading && { opacity: 0.6 }]}
                onPress={pickAndUploadPDF}
                disabled={uploading}
              >
                <Text style={uploadStyles.btnText}>{uploading ? 'Working…' : 'PDF'}</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {/* Shortages Accordion */}
        {!needsProject ? (
          <ShortagesAccordion
            shortages={shortages}
            shortageLoading={shortageLoading}
            onViewDetail={setShortageDetail}
            onLinkSlip={showSlipPickerForPo}
          />
        ) : null}

        {/* Activity Log - Moved to bottom */}


        {/* Uploaded Slips */}
        {!needsProject && !loading && slips.length === 0 ? (
          <EmptyState title="No packing slips yet" />
        ) : null}

        {slips.map((s) => (
          <DeliveryCard
            key={s.id}
            slip={s}
            existingItems={existingItems[s.id] || []}
            onLogItems={(id) => toggleEditSlip(id)}
            onReject={(id) => promptRejectSlip(id)}
            onDelete={(id) => confirmDeleteSlip(id)}
            onPreview={(id) => setPreviewId(id)}
            onComplete={(id) => completeSlip(id)}
            canDelete={canDeleteSlip}
            canAddItems={canAddItems}
            getSlipImageSource={getSlipImageSource}
          />
        ))}

        {/* Activity Log - Bottom placement */}
        {!needsProject && activities.length > 0 ? (
          <ActivityLogPanel activities={activities} />
        ) : null}

        {!needsProject && !loading ? (
          <Pressable
            style={styles.uploadBtn}
            onPress={() => { /* ... handled by header usually ... */ }}
          >
            <Text style={styles.uploadBtnText}>Total Slips: {slips.length}</Text>
          </Pressable>
        ) : null}

        {error ? (
          <Pressable onPress={reload}>
            <Text style={{ color: '#3b82f6', marginTop: 12, fontWeight: '600' }}>Retry</Text>
          </Pressable>
        ) : null}
      </KeyboardSafeScroll>

      {/* ═══ Item Editor Modal ═══ */}
      <ItemEditorModal
        visible={editingSlipId != null}
        slip={editorSlip}
        lineItems={lineItems}
        poItems={poItems}
        locationOptions={locationOptions}
        error={lineItemError}
        saving={saving}
        onUpdate={updateLineItem}
        onAdd={addLineItem}
        onRemove={removeLineItem}
        onSave={handleEditorSave}
        onCancel={() => toggleEditSlip(editingSlipId)}
      />

      {/* ═══ Shortage Detail Modal ═══ */}
      <Modal
        visible={shortageDetail != null}
        animationType="slide"
        onRequestClose={() => setShortageDetail(null)}
      >
        <View style={styles.detailModalRoot}>
          <View style={detailModalHeaderStyle}>
            <Text style={styles.detailModalTitle} maxFontSizeMultiplier={MODAL_TEXT_MAX} numberOfLines={2}>
              PO line detail
            </Text>
            <Pressable onPress={() => setShortageDetail(null)} hitSlop={12}>
              <Text style={styles.detailModalClose} maxFontSizeMultiplier={MODAL_TEXT_MAX}>Done</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={[styles.detailModalScroll, detailModalScrollPad]}>
            {shortageDetail ? (
              <>
                <Text style={styles.detailSectionLabel} maxFontSizeMultiplier={MODAL_TEXT_MAX}>Description</Text>
                <Text style={styles.detailBody} maxFontSizeMultiplier={MODAL_TEXT_MAX}>{shortageDetail.description}</Text>
                <View style={styles.detailMetaRow}>
                  <Text style={styles.detailMetaItem} maxFontSizeMultiplier={MODAL_TEXT_MAX}>
                    Ordered <Text style={styles.detailMetaStrong}>{shortageDetail.ordered}</Text>
                  </Text>
                  <Text style={styles.detailMetaItem} maxFontSizeMultiplier={MODAL_TEXT_MAX}>
                    Received <Text style={styles.detailMetaStrong}>{shortageDetail.received}</Text>
                  </Text>
                  <Text style={styles.detailMetaItem} maxFontSizeMultiplier={MODAL_TEXT_MAX}>
                    Short{' '}
                    <Text style={[styles.detailMetaStrong, shortageDetail.short > 0 ? { color: '#dc2626' } : { color: '#16a34a' }]}>
                      {shortageDetail.short}
                    </Text>
                  </Text>
                </View>
                <Text style={styles.detailSectionLabel} maxFontSizeMultiplier={MODAL_TEXT_MAX}>Job inventory by location</Text>
                <Text style={styles.detailSectionHint} maxFontSizeMultiplier={MODAL_TEXT_MAX}>
                  Totals are for this material on the whole job (other slips count too).
                </Text>
                {getPlacementsForDescription(shortageDetail.description).length === 0 ? (
                  <Text style={styles.detailEmptyPlacements} maxFontSizeMultiplier={MODAL_TEXT_MAX}>
                    No matching stock recorded for this line yet.
                  </Text>
                ) : (
                  getPlacementsForDescription(shortageDetail.description).map((p, idx) => (
                    <View key={idx} style={styles.placementRow}>
                      <Text style={styles.placementLoc} maxFontSizeMultiplier={MODAL_TEXT_MAX}>{p.location}</Text>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.placementQtyLabel} maxFontSizeMultiplier={MODAL_TEXT_MAX}>Job total</Text>
                        <Text style={styles.placementQty} maxFontSizeMultiplier={MODAL_TEXT_MAX}>{p.quantity}</Text>
                      </View>
                    </View>
                  ))
                )}
              </>
            ) : null}
          </ScrollView>
        </View>
      </Modal>

      {/* ═══ Slip Detail Modal ═══ */}
      <Modal
        visible={slipDetailId != null}
        animationType="slide"
        onRequestClose={() => setSlipDetailId(null)}
      >
        <View style={styles.detailModalRoot}>
          <View style={detailModalHeaderStyle}>
            <Text style={styles.detailModalTitle} numberOfLines={2} maxFontSizeMultiplier={MODAL_TEXT_MAX}>
              {detailSlip?.project_name || 'Packing slip'}
            </Text>
            <Pressable onPress={() => setSlipDetailId(null)} hitSlop={12}>
              <Text style={styles.detailModalClose} maxFontSizeMultiplier={MODAL_TEXT_MAX}>Done</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={[styles.detailModalScroll, detailModalScrollPad]}>
            {detailSlipItems.length === 0 ? (
              <Text style={styles.detailBody} maxFontSizeMultiplier={MODAL_TEXT_MAX}>
                No received lines logged for this slip yet.
              </Text>
            ) : (
              groupedSlipDetailLines.map((line) => {
                const placements = getPlacementsForDescription(line.description);
                return (
                  <View key={line.rowKey} style={styles.slipDetailLine}>
                    <Text style={styles.detailBody} maxFontSizeMultiplier={MODAL_TEXT_MAX}>{line.description}</Text>
                    <Text style={[styles.detailMetaItem, { marginTop: 6 }]} maxFontSizeMultiplier={MODAL_TEXT_MAX}>
                      Received on this slip <Text style={styles.detailMetaStrong}>{line.receivedOnSlip}</Text>
                    </Text>
                    <Text style={styles.detailSectionLabel} maxFontSizeMultiplier={MODAL_TEXT_MAX}>Job inventory by location</Text>
                    {placements.length === 0 ? (
                      <Text style={styles.detailEmptyPlacements} maxFontSizeMultiplier={MODAL_TEXT_MAX}>
                        No matching stock recorded for this line yet.
                      </Text>
                    ) : (
                      placements.map((p, idx) => (
                        <View key={idx} style={styles.placementRow}>
                          <Text style={styles.placementLoc} maxFontSizeMultiplier={MODAL_TEXT_MAX}>{p.location}</Text>
                          <View style={{ alignItems: 'flex-end' }}>
                            <Text style={styles.placementQtyLabel} maxFontSizeMultiplier={MODAL_TEXT_MAX}>Job total</Text>
                            <Text style={styles.placementQty} maxFontSizeMultiplier={MODAL_TEXT_MAX}>{p.quantity}</Text>
                          </View>
                        </View>
                      ))
                    )}
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      </Modal>


      {/* ═══ Slip picker modal (link a slip to a PO from shortage) ═══ */}
      <Modal
        visible={linkPoPickerPoId != null}
        animationType="slide"
        transparent
        onRequestClose={dismissSlipPicker}
      >
        <SafeAreaView style={previewStyles.modalRoot} edges={['top', 'bottom']}>
          <View style={{ flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, marginTop: 80 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
              <Text style={{ fontSize: 18, fontWeight: '700' }}>Link Delivery Slip to PO</Text>
              <Pressable onPress={dismissSlipPicker}>
                <Text style={{ fontSize: 15, color: '#3b82f6', fontWeight: '600' }}>Cancel</Text>
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={{ padding: 16 }}>
              {availableSlipsForPo.length === 0 ? (
                <Text style={{ fontSize: 14, color: '#6b7280', fontStyle: 'italic', textAlign: 'center', marginTop: 24 }}>
                  No packing slips uploaded for this project yet.
                </Text>
              ) : null}
              {availableSlipsForPo.map((slip) => (
                <Pressable
                  key={slip.id}
                  style={{ padding: 14, backgroundColor: '#f0f9ff', borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#bfdbfe' }}
                  onPress={() => confirmSlipToPo(slip.id)}
                  disabled={matching}
                >
                  <Text style={{ fontSize: 15, fontWeight: '600', color: '#1e3a5f' }}>
                    Slip #{slip.slip_seq} — {slip.uploaded_by}
                  </Text>
                  <Text style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>
                    {slip.created_at ? new Date(slip.created_at).toLocaleDateString() : ''}
                    {slip.linked_pos?.length > 0 ? ` · Already linked to ${slip.linked_pos.length} PO(s)` : ''}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>

      {/* ═══ Image Preview Modal ═══ */}
      <Modal
        visible={previewId != null}
        animationType="fade"
        transparent
        onRequestClose={() => setPreviewId(null)}
      >
        <SafeAreaView style={previewStyles.modalRoot} edges={['top', 'bottom']}>
          <View style={previewStyles.modalBar}>
            <Pressable style={previewStyles.closeBtn} onPress={() => setPreviewId(null)} hitSlop={16}>
              <Text style={previewStyles.closeText}>✕  Close</Text>
            </Pressable>
          </View>
          <Pressable style={previewStyles.imageArea} onPress={() => setPreviewId(null)}>
            {previewId != null ? (
              <Image
                source={getSlipImageSource(previewId)}
                style={previewStyles.modalImage}
                resizeMode="contain"
              />
            ) : null}
          </Pressable>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const uploadStyles = StyleSheet.create({
  section: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  btn: {
    flex: 1,
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});

