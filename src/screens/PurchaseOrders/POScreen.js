import { useState } from 'react';
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
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from './POScreen.styles';
import { usePurchaseOrders } from './POScreen.logic';
import { EmptyState } from '../../components/EmptyState';
import KeyboardSafeScroll from '../../components/KeyboardSafeScroll';

const imgStyles = StyleSheet.create({
  modalRoot: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)' },
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
  closeText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  imageArea: { flex: 1, justifyContent: 'center' },
  modalImage: { flex: 1, width: '100%' },
  thumbWrap: {
    marginTop: 10,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
    maxHeight: 220,
  },
  thumb: { width: '100%', height: 200, backgroundColor: '#e2e8f0' },
  viewHint: { fontSize: 13, color: '#3b82f6', fontWeight: '600', marginTop: 8 },
  attachRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  attachBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
  },
  attachText: { color: '#475569', fontWeight: '600', fontSize: 14 },
  attachPreview: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  clearBtn: { paddingVertical: 8, paddingHorizontal: 8 },
  clearText: { color: '#dc2626', fontWeight: '700', fontSize: 14 },
  deleteImageBtn: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  deleteImageText: { color: '#dc2626', fontWeight: '700', fontSize: 13 },
});

export default function POScreen() {
  const {
    pos,
    loading,
    error,
    canCreate,
    needsProject,
    poNumber,
    setPoNumber,
    vendor,
    setVendor,
    totalPrice,
    setTotalPrice,
    items,
    addItem,
    updateItem,
    removeItem,
    poImageUri,
    poImageMime,
    pickPoImage,
    clearPoImage,
    saveError,
    submitPO,
    expandedId,
    expandedItems,
    expandedHasImage,
    expandedS3Key,
    expandedLinkedSlips,
    getPoImageSource,
    toggleExpand,
    confirmDeletePO,
    confirmDeletePoImage,
    reload,
    extracting,
    extractError,
    extractionNotes,
    pickAndExtractPDF,
    cancelPo,
    setBackorderDate,
    requestAmendQty,
    requestMarkFinal,
    isPM,
    matchPromptPoId,
    availableSlips,
    matching,
    showManualPicker,
    dismissMatchPrompt,
    confirmSlipMatch,
  } = usePurchaseOrders();

  const [previewPoId, setPreviewPoId] = useState(null);

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <KeyboardSafeScroll contentContainerStyle={styles.content}>
        <Text style={styles.title}>Purchase Orders</Text>

        {needsProject ? <EmptyState title="Pick a job" /> : null}

        {error ? <Text style={styles.msg}>{error}</Text> : null}
        {loading ? <ActivityIndicator style={{ marginVertical: 16 }} /> : null}

        {canCreate && !needsProject ? (
          <>
            <Text style={styles.formTitle}>New PO</Text>

            {/* PDF Extraction */}
            <Pressable
              style={[
                styles.submit,
                { backgroundColor: '#7c3aed', marginTop: 0, marginBottom: 12 },
                extracting && { opacity: 0.6 },
              ]}
              onPress={pickAndExtractPDF}
              disabled={extracting}
            >
              <Text style={styles.submitText}>
                {extracting ? 'Extracting…' : 'Extract from PDF'}
              </Text>
            </Pressable>
            {extracting ? (
              <ActivityIndicator style={{ marginBottom: 8 }} color="#7c3aed" />
            ) : null}
            {extractError ? <Text style={styles.msg}>{extractError}</Text> : null}
            {extractionNotes ? (
              <Text style={{ fontSize: 13, color: '#92400e', backgroundColor: '#fef3c7', padding: 10, borderRadius: 8, marginBottom: 10, lineHeight: 18 }}>
                ⚠️ {extractionNotes}
              </Text>
            ) : null}

            <Text style={styles.label}>PO Number</Text>
            <TextInput
              style={styles.input}
              value={poNumber}
              onChangeText={setPoNumber}
              placeholder="e.g. 116"
            />

            <Text style={styles.label}>Vendor (optional)</Text>
            <TextInput
              style={styles.input}
              value={vendor}
              onChangeText={setVendor}
              placeholder="Supplier name"
            />

            <Text style={styles.label}>Total Price (optional)</Text>
            <TextInput
              style={styles.input}
              value={totalPrice}
              onChangeText={setTotalPrice}
              placeholder="e.g. 1500.00"
              keyboardType="decimal-pad"
            />

            <Text style={styles.label}>PO Document (photo)</Text>
            <View style={imgStyles.attachRow}>
              <Pressable style={imgStyles.attachBtn} onPress={pickPoImage}>
                <Text style={imgStyles.attachText}>
                  {poImageUri ? 'Change photo' : 'Attach photo'}
                </Text>
              </Pressable>
              {poImageUri ? (
                <>
                  {poImageMime && poImageMime.includes('pdf') ? (
                    <View style={[imgStyles.attachPreview, { justifyContent: 'center', alignItems: 'center' }]}>
                      <Text style={{ fontSize: 20 }}>📄</Text>
                    </View>
                  ) : (
                    <Image
                      source={{ uri: poImageUri }}
                      style={imgStyles.attachPreview}
                      resizeMode="cover"
                    />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#0f172a', fontWeight: '500' }}>
                      {poImageMime && poImageMime.includes('pdf') ? 'PDF Attached' : 'Photo Attached'}
                    </Text>
                  </View>
                  <Pressable style={imgStyles.clearBtn} onPress={clearPoImage}>
                    <Text style={imgStyles.clearText}>X</Text>
                  </Pressable>
                </>
              ) : null}
            </View>

            <Text style={styles.label}>Line items</Text>
            {items.map((item, i) => (
              <View key={i} style={styles.lineItemContainer}>
                <View style={styles.lineItemTopRow}>
                  <View style={{ flex: 1 }}>
                    <TextInput
                      style={styles.inputSmall}
                      value={item.description}
                      onChangeText={(v) => updateItem(i, 'description', v)}
                      placeholder="Material Description"
                    />
                  </View>
                  {items.length > 1 ? (
                    <Pressable
                      style={styles.removeItemBtn}
                      onPress={() => removeItem(i)}
                    >
                      <Text style={styles.removeItemText}>X</Text>
                    </Pressable>
                  ) : null}
                </View>
                <View style={styles.lineItemBottomRow}>
                  <View style={{ flex: 1 }}>
                    <TextInput
                      style={styles.inputSmall}
                      value={item.quantity}
                      onChangeText={(v) => updateItem(i, 'quantity', v)}
                      keyboardType="number-pad"
                      placeholder="Qty"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <TextInput
                      style={styles.inputSmall}
                      value={item.unit}
                      onChangeText={(v) => updateItem(i, 'unit', v)}
                      placeholder="Unit (e.g. ea)"
                    />
                  </View>
                  <View style={{ flex: 1.5 }}>
                    <TextInput
                      style={styles.inputSmall}
                      value={item.price}
                      onChangeText={(v) => updateItem(i, 'price', v)}
                      keyboardType="decimal-pad"
                      placeholder="Unit Price ($)"
                    />
                  </View>
                </View>
              </View>
            ))}

            <Pressable style={styles.addItemBtn} onPress={addItem}>
              <Text style={styles.addItemText}>+ Add item</Text>
            </Pressable>

            {saveError ? <Text style={styles.msg}>{saveError}</Text> : null}

            <Pressable style={styles.submit} onPress={submitPO}>
              <Text style={styles.submitText}>Create PO</Text>
            </Pressable>
          </>
        ) : null}

        <Text style={styles.formTitle}>POs (this job)</Text>

        {!needsProject && !loading && pos.length === 0 ? (
          <EmptyState title="No purchase orders" />
        ) : null}

        {pos.map((po) => (
          <Pressable
            key={po.id}
            style={styles.card}
            onPress={() => toggleExpand(po.id)}
          >
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.poNumber}>PO #{po.po_number}</Text>
                {po.status ? (
                  <View style={[poS.statusBadge, poS[`status_${po.status}`] || poS.status_open]}>
                    <Text style={[poS.statusText, poS[`statusText_${po.status}`] || poS.statusText_open]}>
                      {po.status.charAt(0).toUpperCase() + po.status.slice(1)}
                    </Text>
                  </View>
                ) : null}
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {isPM && po.status !== 'cancelled' ? (
                  <Pressable
                    style={styles.deleteBtn}
                    onPress={() => cancelPo(po.id)}
                  >
                    <Text style={[styles.deleteBtnText, { color: '#9a3412' }]}>Cancel PO</Text>
                  </Pressable>
                ) : null}
                {canCreate ? (
                  <Pressable
                    style={styles.deleteBtn}
                    onPress={() => confirmDeletePO(po.id)}
                  >
                    <Text style={styles.deleteBtnText}>Delete</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
            {po.vendor ? (
              <Text style={styles.vendorText}>{po.vendor}</Text>
            ) : null}
            {po.total_amount != null ? (
              <Text style={[styles.vendorText, { color: '#059669', fontWeight: '600', marginTop: 2 }]}>
                Total: ${Number(po.total_amount).toFixed(2)}
              </Text>
            ) : null}
            <Text style={styles.cardMeta}>
              By {po.created_by} ·{' '}
              {po.created_at ? new Date(po.created_at).toLocaleDateString() : ''}
            </Text>
            {po.s3_key ? (
              <Text style={styles.cardMeta}>📎 Document attached</Text>
            ) : null}
            <Text style={styles.expandHint}>
              {expandedId === po.id ? 'Tap to collapse' : 'Tap to view items'}
            </Text>

            {expandedId === po.id ? (
              <View style={styles.itemsList}>
                {expandedHasImage ? (
                  expandedS3Key && expandedS3Key.includes('.pdf') ? (
                    <View style={{ marginTop: 12 }}>
                      <Pressable
                        style={[imgStyles.attachBtn, { backgroundColor: '#eff6ff', alignSelf: 'flex-start' }]}
                        onPress={() => Linking.openURL(getPoImageSource(po.id).uri)}
                      >
                        <Text style={[imgStyles.attachText, { color: '#2563eb' }]}>📄 View PDF Document</Text>
                      </Pressable>
                      {canCreate ? (
                        <Pressable
                          style={imgStyles.deleteImageBtn}
                          onPress={() => confirmDeletePoImage(po.id)}
                        >
                          <Text style={imgStyles.deleteImageText}>Remove PDF</Text>
                        </Pressable>
                      ) : null}
                    </View>
                  ) : (
                    <View>
                      <Pressable onPress={() => setPreviewPoId(po.id)}>
                        <View style={imgStyles.thumbWrap}>
                          <Image
                            source={getPoImageSource(po.id)}
                            style={imgStyles.thumb}
                            resizeMode="cover"
                          />
                        </View>
                        <Text style={imgStyles.viewHint}>Tap to view full size</Text>
                      </Pressable>
                      {canCreate ? (
                        <Pressable
                          style={imgStyles.deleteImageBtn}
                          onPress={() => confirmDeletePoImage(po.id)}
                        >
                          <Text style={imgStyles.deleteImageText}>Delete photo</Text>
                        </Pressable>
                      ) : null}
                    </View>
                  )
                ) : null}

                {expandedItems.length === 0 ? (
                  <Text style={styles.cardMeta}>No items</Text>
                ) : null}
                {expandedItems.map((it) => {
                  const delivered = it.quantity_delivered || 0;
                  const ordered = it.quantity || 1;
                  const pct = Math.min(100, Math.round((delivered / ordered) * 100));
                  const isComplete = delivered >= ordered || it.is_final;
                  return (
                    <View key={it.id} style={styles.itemRow}>
                      <Text style={styles.itemDesc}>{it.description}</Text>
                      <Text style={styles.itemQty}>
                        {it.quantity} {it.unit}
                        {it.unit_price != null ? ` · $${Number(it.unit_price).toFixed(2)}` : ''}
                      </Text>
                      <View style={delivStyles.progressRow}>
                        <View style={delivStyles.progressBar}>
                          <View style={[
                            delivStyles.progressFill,
                            { width: `${pct}%` },
                            isComplete && { backgroundColor: '#16a34a' },
                          ]} />
                        </View>
                        <Text style={[delivStyles.progressText, isComplete && { color: '#16a34a' }]}>
                          {delivered}/{ordered} delivered
                        </Text>
                      </View>
                      {it.is_final ? (
                        <Text style={poS.finalLabel}>✓ Final — no more expected</Text>
                      ) : null}
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                        {it.backorder_date ? (
                          <Text style={poS.backorderLabel}>
                            📦 Backorder: {new Date(it.backorder_date).toLocaleDateString()}
                          </Text>
                        ) : <View />}
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                          {!isComplete ? (
                            <Pressable onPress={() => requestMarkFinal(po.id, it.id)}>
                              <Text style={{ fontSize: 12, color: '#059669', fontWeight: '600' }}>Mark Final</Text>
                            </Pressable>
                          ) : null}
                          <Pressable onPress={() => requestAmendQty(po.id, it.id, it.quantity)}>
                            <Text style={{ fontSize: 12, color: '#ca8a04', fontWeight: '600' }}>Amend Qty</Text>
                          </Pressable>
                          {isPM ? (
                            <Pressable onPress={() => setBackorderDate(po.id, it.id)}>
                              <Text style={{ fontSize: 12, color: '#3b82f6', fontWeight: '600' }}>
                                {it.backorder_date ? 'Edit Date' : '+ Set Backorder Date'}
                              </Text>
                            </Pressable>
                          ) : null}
                        </View>
                      </View>
                    </View>
                  );
                })}

                {/* Linked delivery slips */}
                {expandedLinkedSlips.length > 0 ? (
                  <View style={delivStyles.linkedSection}>
                    <Text style={delivStyles.linkedTitle}>Linked Deliveries</Text>
                    {expandedLinkedSlips.map((slip) => (
                      <View key={slip.id} style={delivStyles.linkedSlip}>
                        <Text style={delivStyles.linkedSlipText}>
                          Slip #{slip.id} — {slip.uploaded_by}
                        </Text>
                        <Text style={delivStyles.linkedSlipDate}>
                          {slip.created_at ? new Date(slip.created_at).toLocaleDateString() : ''}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                {/* Button to manually link a delivery slip */}
                <Pressable
                  style={{ alignSelf: 'flex-start', marginTop: 12 }}
                  onPress={() => showManualPicker(po.id)}
                >
                  <Text style={{ fontSize: 13, color: '#3b82f6', fontWeight: '600' }}>
                    + Link Delivery Slip
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </Pressable>
        ))}

        {error ? (
          <Pressable onPress={reload}>
            <Text style={{ color: '#3b82f6', marginTop: 12, fontWeight: '600' }}>
              Retry
            </Text>
          </Pressable>
        ) : null}
      </KeyboardSafeScroll>

      {/* Manual Slip Match Modal */}
      <Modal
        visible={matchPromptPoId != null}
        animationType="slide"
        transparent
        onRequestClose={dismissMatchPrompt}
      >
        <SafeAreaView style={delivStyles.modalRoot} edges={['top', 'bottom']}>
          <View style={delivStyles.modalContent}>
            <View style={delivStyles.modalHeader}>
              <Text style={delivStyles.modalTitle}>Link Delivery Slip</Text>
              <Pressable onPress={dismissMatchPrompt} style={delivStyles.closeBtn}>
                <Text style={delivStyles.closeBtnText}>Cancel</Text>
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16 }}>
              {availableSlips.length === 0 ? (
                <Text style={delivStyles.modalEmpty}>No packing slips found for this job.</Text>
              ) : null}
              {availableSlips.map((slip) => (
                <Pressable
                  key={slip.id}
                  style={delivStyles.matchPoBtn}
                  onPress={() => confirmSlipMatch(slip.id)}
                  disabled={matching}
                >
                  <Text style={delivStyles.matchPoTitle}>
                    Slip #{slip.id} — {slip.uploaded_by}
                  </Text>
                  <Text style={delivStyles.matchPoMeta}>
                    {slip.created_at ? new Date(slip.created_at).toLocaleDateString() : ''}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>

      <Modal
        visible={previewPoId != null}
        animationType="fade"
        transparent
        onRequestClose={() => setPreviewPoId(null)}
      >
        <SafeAreaView style={imgStyles.modalRoot} edges={['top', 'bottom']}>
          <View style={imgStyles.modalBar}>
            <Pressable
              style={imgStyles.closeBtn}
              onPress={() => setPreviewPoId(null)}
              hitSlop={16}
            >
              <Text style={imgStyles.closeText}>✕  Close</Text>
            </Pressable>
          </View>
          <Pressable
            style={imgStyles.imageArea}
            onPress={() => setPreviewPoId(null)}
          >
            {previewPoId != null ? (
              <Image
                source={getPoImageSource(previewPoId)}
                style={imgStyles.modalImage}
                resizeMode="contain"
              />
            ) : null}
          </Pressable>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const delivStyles = StyleSheet.create({
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    minWidth: 90,
    textAlign: 'right',
  },
  linkedSection: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  linkedTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  linkedSlip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
  },
  linkedSlipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#166534',
  },
  linkedSlipDate: {
    fontSize: 12,
    color: '#64748b',
  },
});

const poS = StyleSheet.create({
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: 4,
    marginBottom: 2,
  },
  statusText: { fontSize: 12, fontWeight: '700' },
  status_open: { backgroundColor: '#dbeafe' },
  statusText_open: { color: '#1d4ed8' },
  status_partial: { backgroundColor: '#fef3c7' },
  statusText_partial: { color: '#92400e' },
  status_fulfilled: { backgroundColor: '#dcfce7' },
  statusText_fulfilled: { color: '#166534' },
  status_cancelled: { backgroundColor: '#fee2e2' },
  statusText_cancelled: { color: '#991b1b' },
  finalLabel: {
    fontSize: 12,
    color: '#16a34a',
    fontWeight: '600',
    marginTop: 4,
  },
  backorderLabel: {
    fontSize: 12,
    color: '#9a3412',
    fontWeight: '600',
    marginTop: 4,
  },
});
