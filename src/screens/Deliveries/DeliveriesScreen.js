import { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Image,
  Modal,
  StyleSheet,
  Linking,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { styles } from './DeliveriesScreen.styles';
import { useDeliveries, groupSlipItemsByDescription } from './DeliveriesScreen.logic';
import { EmptyState } from '../../components/EmptyState';
import KeyboardSafeScroll from '../../components/KeyboardSafeScroll';

const previewStyles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
  },
  modalBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  closeBtn: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  closeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  imageArea: {
    flex: 1,
    justifyContent: 'center',
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

/** Keeps detail modals readable when system text size is large; avoids layout blowouts. */
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
    getPlacementsForDescription,
    loadSlipItems,
    // PO matching
    matchPromptSlipId,
    suggestedMatchPo,
    unmatchedPos,
    matchPromptMode,
    matching,
    confirmPoMatch,
    clearPoMatch,
    dismissMatchPrompt,
    showManualPicker,
  } = useDeliveries();

  const [previewId, setPreviewId] = useState(null);
  const [shortageDetail, setShortageDetail] = useState(null);
  const [slipDetailId, setSlipDetailId] = useState(null);

  const detailSlip = slipDetailId != null ? slips.find((x) => x.id === slipDetailId) : null;
  const detailSlipItems = slipDetailId != null ? (existingItems[slipDetailId] || []) : [];

  const groupedSlipDetailLines = useMemo(
    () => groupSlipItemsByDescription(detailSlipItems),
    [detailSlipItems],
  );

  const insets = useSafeAreaInsets();
  const detailModalHeaderStyle = [
    styles.detailModalHeader,
    { paddingTop: Math.max(insets.top, 14) },
  ];
  const detailModalScrollPad = { paddingBottom: Math.max(insets.bottom, 28) };

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <KeyboardSafeScroll contentContainerStyle={styles.content}>
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
              onPress={scanAndUpload}
              disabled={uploading}
            >
              <Text style={styles.uploadBtnText}>
                {uploading ? 'Working…' : 'Camera'}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.uploadBtn, { backgroundColor: '#7c3aed', marginTop: 10 }, uploading && { opacity: 0.6 }]}
              onPress={pickAndUploadPDF}
              disabled={uploading}
            >
              <Text style={styles.uploadBtnText}>
                {uploading ? 'Working…' : 'Upload PDF'}
              </Text>
            </Pressable>
          </>
        ) : null}

        {/* PO Match Prompt */}
        {matchPromptSlipId != null && matchPromptMode === 'auto' && suggestedMatchPo ? (
          <View style={matchStyles.card}>
            <Text style={matchStyles.title}>PO Match Found</Text>
            <Text style={matchStyles.body}>
              This delivery appears to match{' '}
              <Text style={matchStyles.bold}>PO #{suggestedMatchPo.po_number}</Text>
              {suggestedMatchPo.vendor ? ` (${suggestedMatchPo.vendor})` : ''}
              {' — '}{suggestedMatchPo.matchedItemCount} of {suggestedMatchPo.totalSlipItems} items match.
            </Text>
            <View style={matchStyles.btnRow}>
              <Pressable
                style={[matchStyles.btn, matchStyles.btnConfirm, matching && { opacity: 0.6 }]}
                onPress={() => confirmPoMatch(matchPromptSlipId, suggestedMatchPo.id)}
                disabled={matching}
              >
                <Text style={matchStyles.btnConfirmText}>
                  {matching ? 'Linking…' : 'Confirm Match'}
                </Text>
              </Pressable>
              <Pressable
                style={[matchStyles.btn, matchStyles.btnAlt]}
                onPress={showManualPicker}
              >
                <Text style={matchStyles.btnAltText}>Choose Different PO</Text>
              </Pressable>
              <Pressable
                style={[matchStyles.btn, matchStyles.btnSkip]}
                onPress={dismissMatchPrompt}
              >
                <Text style={matchStyles.btnSkipText}>Skip — record separately</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {matchPromptSlipId != null && matchPromptMode === 'manual' ? (
          <View style={matchStyles.card}>
            <Text style={matchStyles.title}>Link to a Purchase Order</Text>
            <Text style={matchStyles.body}>
              Select a PO with remaining undelivered items, or skip.
            </Text>
            {unmatchedPos.length === 0 ? (
              <Text style={[matchStyles.body, { fontStyle: 'italic' }]}>No open POs found for this project.</Text>
            ) : (
              unmatchedPos.map((po) => (
                <Pressable
                  key={po.id}
                  style={[matchStyles.poOption, matching && { opacity: 0.6 }]}
                  onPress={() => confirmPoMatch(matchPromptSlipId, po.id)}
                  disabled={matching}
                >
                  <Text style={matchStyles.poOptionNumber}>PO #{po.po_number}</Text>
                  <Text style={matchStyles.poOptionVendor}>{po.vendor || '—'}</Text>
                </Pressable>
              ))
            )}
            <Pressable
              style={[matchStyles.btn, matchStyles.btnSkip, { marginTop: 12 }]}
              onPress={dismissMatchPrompt}
            >
              <Text style={matchStyles.btnSkipText}>None — record separately</Text>
            </Pressable>
          </View>
        ) : null}

        {/* Shortage summary */}
        {!needsProject && shortages.length > 0 ? (
          <View style={styles.shortageSection}>
            <Text style={styles.shortageTitle}>PO vs Delivered</Text>
            {shortageLoading ? <ActivityIndicator /> : null}
            {shortages.map((s, i) => (
              <View key={i} style={styles.shortageRow}>
                <View style={styles.shortageRowMain}>
                  <Text style={styles.shortageDesc} numberOfLines={2} ellipsizeMode="tail">
                    {s.description}
                  </Text>
                  <Pressable onPress={() => setShortageDetail(s)} hitSlop={8}>
                    <Text style={styles.viewMoreLink}>View more</Text>
                  </Pressable>
                </View>
                <View style={styles.shortageRowSide}>
                  <View style={styles.shortageSummaryLine}>
                    <Text style={styles.shortageNums}>
                      {s.received}/{s.ordered}
                    </Text>
                    {s.short > 0 ? (
                      <Text style={styles.shortageAlert}>{s.short} short</Text>
                    ) : (
                      <Text style={styles.shortageOk}>OK</Text>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        <Text style={styles.formTitle}>Uploaded (this job)</Text>
        {!needsProject && !loading && slips.length === 0 ? (
          <EmptyState title="None yet" />
        ) : null}

        {slips.map((s) => {
          const slipItems = existingItems[s.id] || [];
          const isEditing = editingSlipId === s.id;

          return (
            <View key={s.id} style={styles.card}>
              {s.s3_key && s.s3_key.endsWith('.pdf') ? (
                <View style={{ marginBottom: 16 }}>
                  <Text style={styles.deliveryNumber}>{s.project_name}</Text>
                  <Pressable
                    style={{ backgroundColor: '#eff6ff', alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, marginTop: 8 }}
                    onPress={() => Linking.openURL(getSlipImageSource(s.id).uri)}
                  >
                    <Text style={{ color: '#2563eb', fontWeight: '600', fontSize: 15 }}>View PDF Document</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable onPress={() => setPreviewId(s.id)}>
                  <Text style={styles.deliveryNumber}>{s.project_name}</Text>
                  <View style={previewStyles.thumbWrap}>
                    <Image
                      source={getSlipImageSource(s.id)}
                      style={previewStyles.thumb}
                      resizeMode="cover"
                    />
                  </View>
                  <Text style={previewStyles.viewHint}>Tap to view full size</Text>
                </Pressable>
              )}

              {s.signed_by ? (
                <Text style={styles.signedBy}>Signed by {s.signed_by}</Text>
              ) : null}
              <View style={styles.slipMetaRow}>
                <Text style={styles.slipMeta}>
                  By {s.uploaded_by} ·{' '}
                  {s.created_at ? new Date(s.created_at).toLocaleString() : ''}
                </Text>
                {canUpload && !s.signed_by ? (
                  <Pressable onPress={() => confirmDeleteSlip(s.id)}>
                    <Text style={styles.deleteSlipText}>Delete</Text>
                  </Pressable>
                ) : null}
              </View>

              {/* Linked PO badge */}
              {s.matched_po_id ? (
                <View style={matchStyles.linkedBadge}>
                  <Text style={matchStyles.linkedText}>
                    Linked to PO #{s.matched_po_number || s.matched_po_id}
                    {s.matched_po_vendor ? ` (${s.matched_po_vendor})` : ''}
                  </Text>
                  <Pressable
                    onPress={() => clearPoMatch(s.id)}
                    hitSlop={8}
                  >
                    <Text style={matchStyles.unlinkText}>Unlink</Text>
                  </Pressable>
                </View>
              ) : null}

              <Pressable
                onPress={() => {
                  loadSlipItems(s.id);
                  setSlipDetailId(s.id);
                }}
                hitSlop={8}
                style={{ marginTop: 8, alignSelf: 'flex-start' }}
              >
                <Text style={styles.viewMoreLink}>View more — details & placement</Text>
              </Pressable>

              {/* Existing delivery line items */}
              {slipItems.length > 0 ? (
                <View style={{ marginTop: 8 }}>
                  <Text style={styles.label}>Received items:</Text>
                  {groupSlipItemsByDescription(slipItems).map((line) => (
                    <View key={line.rowKey} style={styles.existingItem}>
                      <Text style={styles.existingItemDesc}>{line.description}</Text>
                      <Text style={styles.existingItemQty}>x{line.receivedOnSlip}</Text>
                    </View>
                  ))}
                </View>
              ) : null}

              {canAddItems && !s.signed_by ? (
                <Pressable
                  style={styles.addItemsBtn}
                  onPress={() => toggleEditSlip(s.id)}
                >
                  <Text style={styles.addItemsText}>
                    {isEditing
                      ? 'Cancel'
                      : slipItems.length > 0
                        ? 'Edit items'
                        : 'Log received items'}
                  </Text>
                </Pressable>
              ) : null}

              {isEditing ? (
                <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#e2e8f0' }}>
                  {lineItems.map((item, i) => {
                    const locVal =
                      item.location && locationOptions.some((o) => o.id === item.location)
                        ? item.location
                        : locationOptions[0]?.id || '';
                    return (
                    <View key={i} style={styles.lineItemBlock}>
                      <View style={styles.lineItemRow}>
                        <View style={styles.lineItemDesc}>
                          <TextInput
                            style={styles.inputSmall}
                            value={item.description}
                            onChangeText={(v) => updateLineItem(i, 'description', v)}
                            placeholder="Item"
                          />
                        </View>
                        <View style={styles.lineItemQty}>
                          <TextInput
                            style={styles.inputSmall}
                            value={item.quantity_received}
                            onChangeText={(v) => updateLineItem(i, 'quantity_received', v)}
                            keyboardType="number-pad"
                            placeholder="Qty"
                          />
                        </View>
                        {lineItems.length > 1 ? (
                          <Pressable
                            style={styles.removeItemBtn}
                            onPress={() => removeLineItem(i)}
                          >
                            <Text style={styles.removeItemText}>X</Text>
                          </Pressable>
                        ) : null}
                      </View>
                      <View style={styles.itemLocationColumn}>
                        <Text style={styles.itemLocationLabel}>Location</Text>
                        <View style={styles.pickerShell}>
                          <Picker
                            selectedValue={locVal}
                            onValueChange={(v) => updateLineItem(i, 'location', v)}
                            style={Platform.OS === 'ios' ? { width: '100%', height: 150 } : styles.picker}
                          >
                            {locationOptions.map((opt) => (
                              <Picker.Item key={opt.id} label={opt.label} value={opt.id} />
                            ))}
                          </Picker>
                        </View>
                      </View>
                    </View>
                    );
                  })}
                  <Pressable style={styles.addItemsBtn} onPress={addLineItem}>
                    <Text style={styles.addItemsText}>+ Add row</Text>
                  </Pressable>

                  {lineItemError ? <Text style={styles.msg}>{lineItemError}</Text> : null}
                  <Pressable style={styles.submitItemsBtn} onPress={submitLineItems}>
                    <Text style={styles.submitItemsText}>Save items</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          );
        })}

        {error ? (
          <Pressable onPress={reload}>
            <Text style={{ color: '#3b82f6', marginTop: 12, fontWeight: '600' }}>
              Retry
            </Text>
          </Pressable>
        ) : null}
      </KeyboardSafeScroll>

      <Modal
        visible={shortageDetail != null}
        animationType="slide"
        onRequestClose={() => setShortageDetail(null)}
      >
        <View style={styles.detailModalRoot}>
          <View style={detailModalHeaderStyle}>
            <Text
              style={styles.detailModalTitle}
              maxFontSizeMultiplier={MODAL_TEXT_MAX}
              numberOfLines={2}
            >
              PO line detail
            </Text>
            <Pressable onPress={() => setShortageDetail(null)} hitSlop={12}>
              <Text style={styles.detailModalClose} maxFontSizeMultiplier={MODAL_TEXT_MAX}>
                Done
              </Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={[styles.detailModalScroll, detailModalScrollPad]}>
            {shortageDetail ? (
              <>
                <Text style={styles.detailSectionLabel} maxFontSizeMultiplier={MODAL_TEXT_MAX}>
                  Description
                </Text>
                <Text style={styles.detailBody} maxFontSizeMultiplier={MODAL_TEXT_MAX}>
                  {shortageDetail.description}
                </Text>
                <View style={styles.detailMetaRow}>
                  <Text style={styles.detailMetaItem} maxFontSizeMultiplier={MODAL_TEXT_MAX}>
                    Ordered{' '}
                    <Text style={styles.detailMetaStrong} maxFontSizeMultiplier={MODAL_TEXT_MAX}>
                      {shortageDetail.ordered}
                    </Text>
                  </Text>
                  <Text style={styles.detailMetaItem} maxFontSizeMultiplier={MODAL_TEXT_MAX}>
                    Received{' '}
                    <Text style={styles.detailMetaStrong} maxFontSizeMultiplier={MODAL_TEXT_MAX}>
                      {shortageDetail.received}
                    </Text>
                  </Text>
                  <Text style={styles.detailMetaItem} maxFontSizeMultiplier={MODAL_TEXT_MAX}>
                    Short{' '}
                    <Text
                      style={[
                        styles.detailMetaStrong,
                        shortageDetail.short > 0 ? { color: '#dc2626' } : { color: '#16a34a' },
                      ]}
                      maxFontSizeMultiplier={MODAL_TEXT_MAX}
                    >
                      {shortageDetail.short}
                    </Text>
                  </Text>
                </View>
                <Text style={styles.detailSectionLabel} maxFontSizeMultiplier={MODAL_TEXT_MAX}>
                  Job inventory by location
                </Text>
                <Text style={styles.detailSectionHint} maxFontSizeMultiplier={MODAL_TEXT_MAX}>
                  Totals are for this material on the whole job (other slips count too). They are not
                  tied to the received counts on this PO line only.
                </Text>
                {getPlacementsForDescription(shortageDetail.description).length === 0 ? (
                  <Text style={styles.detailEmptyPlacements} maxFontSizeMultiplier={MODAL_TEXT_MAX}>
                    No matching stock recorded for this line yet.
                  </Text>
                ) : (
                  getPlacementsForDescription(shortageDetail.description).map((p, idx) => (
                    <View key={idx} style={styles.placementRow}>
                      <Text style={styles.placementLoc} maxFontSizeMultiplier={MODAL_TEXT_MAX}>
                        {p.location}
                      </Text>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.placementQtyLabel} maxFontSizeMultiplier={MODAL_TEXT_MAX}>
                          Job total
                        </Text>
                        <Text style={styles.placementQty} maxFontSizeMultiplier={MODAL_TEXT_MAX}>
                          {p.quantity}
                        </Text>
                      </View>
                    </View>
                  ))
                )}
              </>
            ) : null}
          </ScrollView>
        </View>
      </Modal>

      <Modal
        visible={slipDetailId != null}
        animationType="slide"
        onRequestClose={() => setSlipDetailId(null)}
      >
        <View style={styles.detailModalRoot}>
          <View style={detailModalHeaderStyle}>
            <Text
              style={styles.detailModalTitle}
              numberOfLines={2}
              maxFontSizeMultiplier={MODAL_TEXT_MAX}
            >
              {detailSlip?.project_name || 'Packing slip'}
            </Text>
            <Pressable onPress={() => setSlipDetailId(null)} hitSlop={12}>
              <Text style={styles.detailModalClose} maxFontSizeMultiplier={MODAL_TEXT_MAX}>
                Done
              </Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={[styles.detailModalScroll, detailModalScrollPad]}>
            {detailSlipItems.length === 0 ? (
              <Text style={styles.detailBody} maxFontSizeMultiplier={MODAL_TEXT_MAX}>
                No received lines logged for this slip yet. Use “Log received items” on the card to
                add quantities.
              </Text>
            ) : (
              groupedSlipDetailLines.map((line) => {
                const placements = getPlacementsForDescription(line.description);
                return (
                  <View key={line.rowKey} style={styles.slipDetailLine}>
                    <Text style={styles.detailBody} maxFontSizeMultiplier={MODAL_TEXT_MAX}>
                      {line.description}
                    </Text>
                    <Text
                      style={[styles.detailMetaItem, { marginTop: 6 }]}
                      maxFontSizeMultiplier={MODAL_TEXT_MAX}
                    >
                      Received on this slip{' '}
                      <Text style={styles.detailMetaStrong} maxFontSizeMultiplier={MODAL_TEXT_MAX}>
                        {line.receivedOnSlip}
                      </Text>
                    </Text>
                    <Text style={styles.detailSectionLabel} maxFontSizeMultiplier={MODAL_TEXT_MAX}>
                      Job inventory by location
                    </Text>
                    <Text style={styles.detailSectionHint} maxFontSizeMultiplier={MODAL_TEXT_MAX}>
                      Job total is all stock for this material on the job, not only what this slip
                      added.
                    </Text>
                    {placements.length === 0 ? (
                      <Text style={styles.detailEmptyPlacements} maxFontSizeMultiplier={MODAL_TEXT_MAX}>
                        No matching stock recorded for this line yet.
                      </Text>
                    ) : (
                      placements.map((p, idx) => (
                        <View key={idx} style={styles.placementRow}>
                          <Text style={styles.placementLoc} maxFontSizeMultiplier={MODAL_TEXT_MAX}>
                            {p.location}
                          </Text>
                          <View style={{ alignItems: 'flex-end' }}>
                            <Text style={styles.placementQtyLabel} maxFontSizeMultiplier={MODAL_TEXT_MAX}>
                              Job total
                            </Text>
                            <Text style={styles.placementQty} maxFontSizeMultiplier={MODAL_TEXT_MAX}>
                              {p.quantity}
                            </Text>
                          </View>
                        </View>
                      ))
                    )}
                  </View>
                );
              })
            )}
            {detailSlip?.s3_key && detailSlip.s3_key.endsWith('.pdf') ? (
              <Pressable
                style={styles.slipDetailOpenPdf}
                onPress={() => Linking.openURL(getSlipImageSource(detailSlip.id).uri)}
              >
                <Text style={styles.slipDetailOpenPdfText} maxFontSizeMultiplier={MODAL_TEXT_MAX}>
                  Open PDF
                </Text>
              </Pressable>
            ) : null}
          </ScrollView>
        </View>
      </Modal>

      <Modal
        visible={previewId != null}
        animationType="fade"
        transparent
        onRequestClose={() => setPreviewId(null)}
      >
        <SafeAreaView style={previewStyles.modalRoot} edges={['top', 'bottom']}>
          <View style={previewStyles.modalBar}>
            <Pressable
              style={previewStyles.closeBtn}
              onPress={() => setPreviewId(null)}
              hitSlop={16}
            >
              <Text style={previewStyles.closeText}>✕  Close</Text>
            </Pressable>
          </View>
          <Pressable
            style={previewStyles.imageArea}
            onPress={() => setPreviewId(null)}
          >
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

const matchStyles = StyleSheet.create({
  card: {
    backgroundColor: '#eff6ff',
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1e40af',
    marginBottom: 6,
  },
  body: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 8,
  },
  bold: {
    fontWeight: '700',
    color: '#1e3a8a',
  },
  btnRow: {
    gap: 8,
    marginTop: 4,
  },
  btn: {
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  btnConfirm: {
    backgroundColor: '#2563eb',
  },
  btnConfirmText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  btnAlt: {
    backgroundColor: '#e0e7ff',
  },
  btnAltText: {
    color: '#3730a3',
    fontWeight: '600',
    fontSize: 14,
  },
  btnSkip: {
    backgroundColor: '#f1f5f9',
  },
  btnSkipText: {
    color: '#64748b',
    fontWeight: '600',
    fontSize: 14,
  },
  poOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  poOptionNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
  },
  poOptionVendor: {
    fontSize: 13,
    color: '#64748b',
  },
  linkedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#dcfce7',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 8,
  },
  linkedText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#166534',
    flex: 1,
  },
  unlinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#dc2626',
    marginLeft: 12,
  },
});
