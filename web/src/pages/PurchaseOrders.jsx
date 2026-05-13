import { useEffect, useRef, useState } from 'react';
import {
  Plus, Trash2, ChevronDown, ChevronRight, X, Bell,
  FileUp, Loader2, AlertTriangle, CheckCircle2,
} from 'lucide-react';
import { apiFetch, getToken, API_BASE_URL } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useProject } from '@/lib/project';
import { can, FOREMAN_TYPES } from '@/lib/roles';
import PageHeader, { EmptyState } from '@/components/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Chip } from '@/components/ui/Chip';
import { cn } from '@/lib/utils';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/Dialog';

const STATUS_VARIANT = {
  open: 'default',
  partial: 'warning',
  fulfilled: 'success',
  cancelled: 'destructive',
};

const BLANK_ITEM = () => ({ description: '', quantity: '1', unit: 'each', price: '', notify_foreman_type: null });

export default function PurchaseOrders() {
  const { session } = useAuth();
  const { selectedProjectId } = useProject();
  const [pos, setPos] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [expandedDetail, setExpandedDetail] = useState(null);
  const [open, setOpen] = useState(false);

  const [poNumber, setPoNumber] = useState('');
  const [vendor, setVendor] = useState('');
  const [totalPrice, setTotalPrice] = useState('');
  const [items, setItems] = useState([BLANK_ITEM()]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // PDF extraction state
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState('');
  const [extractNotes, setExtractNotes] = useState('');
  const [pdfFiles, setPdfFiles] = useState([]); // { name, file }[]
  const fileInputRef = useRef(null);

  const canCreate = can.createPO(session?.roleId);

  const reload = () => {
    if (!selectedProjectId) { setPos([]); return; }
    apiFetch(`/api/purchase-orders?projectId=${selectedProjectId}`)
      .then((r) => setPos(Array.isArray(r) ? r : []));
  };

  useEffect(() => { reload(); }, [selectedProjectId]);

  // ── PDF extraction ────────────────────────────────────────────────────────
  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files || []).filter(
      (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'),
    );
    if (!selected.length) return;
    setPdfFiles(selected.map((f) => ({ name: f.name, file: f })));
    // Reset extraction state when new files chosen
    setExtractError('');
    setExtractNotes('');
  };

  const extractFromPDF = async () => {
    if (!pdfFiles.length) return;
    setExtracting(true);
    setExtractError('');
    setExtractNotes('');
    try {
      const form = new FormData();
      for (const { file } of pdfFiles) {
        form.append('files', file, file.name);
      }
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/api/purchase-orders/extract`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || 'Extraction failed');
      }
      const data = await res.json();
      if (data.suggestedPoNumber) setPoNumber(data.suggestedPoNumber);
      if (data.suggestedVendor)   setVendor(data.suggestedVendor);
      if (data.suggestedTotalPrice != null) setTotalPrice(String(data.suggestedTotalPrice));
      if (Array.isArray(data.suggestedItems) && data.suggestedItems.length > 0) {
        setItems(data.suggestedItems.map((it) => ({
          description: it.description || '',
          quantity:    String(it.quantity || 1),
          unit:        it.unit || 'each',
          price:       it.unit_price != null ? String(it.unit_price) : '',
          notify_foreman_type: null,
        })));
      }
      if (data.extractionNotes) setExtractNotes(data.extractionNotes);
    } catch (e) {
      setExtractError(e.message || 'PDF extraction failed.');
    } finally {
      setExtracting(false);
    }
  };

  const resetDialog = () => {
    setPoNumber(''); setVendor(''); setTotalPrice('');
    setItems([BLANK_ITEM()]);
    setError(''); setSubmitting(false);
    setExtractError(''); setExtractNotes('');
    setPdfFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Line items ────────────────────────────────────────────────────────────
  const addLine    = () => setItems((p) => [...p, BLANK_ITEM()]);
  const updateLine = (i, k, v) => setItems((p) => p.map((it, idx) => idx === i ? { ...it, [k]: v } : it));
  const removeLine = (i) => setItems((p) => p.filter((_, idx) => idx !== i));

  // ── Expand / collapse PO ─────────────────────────────────────────────────
  const expand = async (poId) => {
    if (expandedId === poId) { setExpandedId(null); setExpandedDetail(null); return; }
    const detail = await apiFetch(`/api/purchase-orders/${poId}`);
    setExpandedId(poId);
    setExpandedDetail(detail);
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!selectedProjectId) { setError('Select a job first.'); return; }
    if (!poNumber.trim()) { setError('PO number is required.'); return; }
    const validItems = items.filter((i) => i.description.trim());
    if (!validItems.length) { setError('Add at least one line item.'); return; }
    setSubmitting(true);
    try {
      const poData = await apiFetch('/api/purchase-orders', {
        method: 'POST',
        body: {
          projectId:  selectedProjectId,
          poNumber:   poNumber.trim(),
          vendor:     vendor.trim() || undefined,
          totalPrice: totalPrice ? parseFloat(totalPrice) : undefined,
          items: validItems.map((it) => ({
            description:         it.description.trim(),
            quantity:            parseInt(it.quantity, 10) || 1,
            unit:                it.unit.trim() || 'each',
            unit_price:          it.price ? parseFloat(it.price) || null : null,
            notify_foreman_type: it.notify_foreman_type || null,
          })),
        },
      });

      // Upload the first PDF as the PO attachment if present
      if (pdfFiles.length > 0 && poData?.id) {
        const form = new FormData();
        form.append('photo', pdfFiles[0].file, pdfFiles[0].name);
        const token = getToken();
        await fetch(`${API_BASE_URL}/api/purchase-orders/${poData.id}/image`, {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: form,
        });
      }

      setOpen(false);
      resetDialog();
      reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const cancelPO = async (id) => {
    if (!confirm('Cancel this PO?')) return;
    await apiFetch(`/api/purchase-orders/${id}/cancel`, { method: 'PATCH' });
    reload();
  };

  const updateForemanType = async (lineId, newType) => {
    await apiFetch(`/api/po-line-items/${lineId}/foreman-type`, {
      method: 'PATCH',
      body: { notify_foreman_type: newType },
    });
    setExpandedDetail((d) =>
      d ? { ...d, items: d.items.map((it) => it.id === lineId ? { ...it, notify_foreman_type: newType } : it) } : d,
    );
  };

  if (!canCreate && pos.length === 0) {
    return (
      <div>
        <PageHeader title="Purchase Orders" />
        <EmptyState title="Restricted" description="Only Project Managers can view POs." />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Purchase Orders"
        description={selectedProjectId ? 'POs for the selected project' : 'Pick a job to view POs'}
        actions={
          canCreate && selectedProjectId ? (
            <Dialog
              open={open}
              onOpenChange={(v) => { if (!v) resetDialog(); setOpen(v); }}
            >
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4" /> New PO</Button>
              </DialogTrigger>

              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create purchase order</DialogTitle>
                </DialogHeader>

                <form onSubmit={submit} noValidate>
                  <div className="max-h-[72vh] space-y-4 overflow-y-auto pr-1">

                    {/* ── AI Extraction ── */}
                    <div className="rounded-2xl border border-brand-200 bg-brand-50 p-4">

                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          variant="action"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={extracting}
                        >
                          <FileUp className="h-3.5 w-3.5" />
                          {pdfFiles.length ? `${pdfFiles.length} PDF${pdfFiles.length > 1 ? 's' : ''} selected` : 'Choose PDF(s)'}
                        </Button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="application/pdf,.pdf"
                          multiple
                          className="hidden"
                          onChange={handleFileChange}
                        />
                        {pdfFiles.length > 0 && (
                          <Button
                            type="button"
                            size="sm"
                            onClick={extractFromPDF}
                            disabled={extracting}
                            className="min-w-[140px]"
                          >
                            {extracting
                              ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Extracting…</>
                              : 'Extract with AI'}
                          </Button>
                        )}
                        {pdfFiles.length > 0 && !extracting && (
                          <button
                            type="button"
                            className="text-xs text-[#94a3b8] hover:text-[#475569] cursor-pointer"
                            onClick={() => { setPdfFiles([]); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                          >
                            Clear
                          </button>
                        )}
                      </div>

                      {/* File list */}
                      {pdfFiles.length > 0 && (
                        <ul className="mt-2 space-y-0.5">
                          {pdfFiles.map(({ name }) => (
                            <li key={name} className="text-[12px] text-[#475569]">📄 {name}</li>
                          ))}
                        </ul>
                      )}

                      {/* Extraction notes */}
                      {extractNotes && !extractError && (
                        <div className="mt-3 flex items-start gap-2 rounded-xl border border-[#bfdbfe] bg-[#eff6ff] p-3 text-[13px] text-[#1d4ed8]">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                          <span><span className="font-semibold">AI note: </span>{extractNotes}</span>
                        </div>
                      )}

                      {/* Extraction error */}
                      {extractError && (
                        <div className="mt-3 flex items-start gap-2 rounded-xl border border-[#fecaca] bg-[#fef2f2] p-3 text-[13px] text-[#b91c1c]">
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                          <span>{extractError}</span>
                        </div>
                      )}
                    </div>

                    {/* ── PO details ── */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>PO Number</Label>
                        <Input value={poNumber} onChange={(e) => setPoNumber(e.target.value)} required />
                      </div>
                      <div>
                        <Label>Vendor</Label>
                        <Input value={vendor} onChange={(e) => setVendor(e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <Label>Total Price (optional)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={totalPrice}
                        onChange={(e) => setTotalPrice(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>

                    {/* ── Line items ── */}
                    <div>
                      <div className="mb-2 text-base font-bold text-[#0f172a]">Line items</div>
                      <div className="space-y-3">
                        {items.map((it, i) => (
                          <div key={i} className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-3">
                            <div className="grid grid-cols-12 gap-2">
                              <Input
                                className="col-span-5"
                                placeholder="Material description"
                                value={it.description}
                                onChange={(e) => updateLine(i, 'description', e.target.value)}
                              />
                              <Input
                                className="col-span-2"
                                placeholder="Qty"
                                type="number"
                                min="0"
                                value={it.quantity}
                                onChange={(e) => updateLine(i, 'quantity', e.target.value)}
                              />
                              <Input
                                className="col-span-2"
                                placeholder="Unit"
                                value={it.unit}
                                onChange={(e) => updateLine(i, 'unit', e.target.value)}
                              />
                              <Input
                                className="col-span-2"
                                placeholder="$/unit"
                                type="number"
                                step="0.01"
                                value={it.price}
                                onChange={(e) => updateLine(i, 'price', e.target.value)}
                              />
                              <button
                                type="button"
                                className="col-span-1 flex items-center justify-center rounded-lg text-[#dc2626] hover:bg-red-50 cursor-pointer"
                                onClick={() => removeLine(i)}
                                disabled={items.length === 1}
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>

                            {/* Foreman notification chips */}
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <Bell className="h-3.5 w-3.5 text-[#94a3b8]" />
                              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
                                Notify foreman:
                              </span>
                              {FOREMAN_TYPES.map((ft) => (
                                <Chip
                                  key={ft.id}
                                  accent
                                  active={it.notify_foreman_type === ft.id}
                                  onClick={() =>
                                    updateLine(i, 'notify_foreman_type', it.notify_foreman_type === ft.id ? null : ft.id)
                                  }
                                  className="px-2.5 py-1 text-[12px]"
                                >
                                  {ft.label}
                                </Chip>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                      <Button type="button" variant="outline" className="mt-3" onClick={addLine}>
                        <Plus className="h-4 w-4" /> Add line
                      </Button>
                    </div>

                    {error ? (
                      <div className="text-sm text-[#dc2626]">{error}</div>
                    ) : null}
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => { setOpen(false); resetDialog(); }}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating…</> : 'Create PO'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          ) : null
        }
      />

      {!selectedProjectId ? (
        <EmptyState title="Pick a job" description="Use the project picker in the header." />
      ) : pos.length === 0 ? (
        <EmptyState title="No POs yet" description="Create your first purchase order to get started." />
      ) : (
        <div className="space-y-3">
          {pos.map((po) => {
            const isExpanded = expandedId === po.id;
            return (
              <Card key={po.id} accent>
                <div className="flex items-center justify-between p-5">
                  <button
                    onClick={() => expand(po.id)}
                    className="-m-3 flex flex-1 items-center gap-3 rounded-xl p-3 text-left transition hover:bg-slate-50 cursor-pointer"
                  >
                    {isExpanded
                      ? <ChevronDown className="h-5 w-5 text-[#94a3b8]" />
                      : <ChevronRight className="h-5 w-5 text-[#94a3b8]" />}
                    <div>
                      <div className="text-base font-extrabold text-[#0f172a]">
                        PO #{po.po_seq}&nbsp;
                        <span className="text-sm font-semibold text-[#64748b]">({po.po_number})</span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                        {po.vendor ? <span className="text-[#64748b]">{po.vendor}</span> : null}
                        {po.total_amount != null ? (
                          <span className="font-bold text-emerald-700">
                            ${Number(po.total_amount).toFixed(2)}
                          </span>
                        ) : null}
                        <Badge variant={STATUS_VARIANT[po.status] || 'default'}>{po.status}</Badge>
                      </div>
                    </div>
                  </button>
                  {canCreate && po.status !== 'cancelled' ? (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="ml-3"
                      onClick={() => cancelPO(po.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Cancel
                    </Button>
                  ) : null}
                </div>

                {isExpanded && expandedDetail ? (
                  <div className="space-y-3 border-t border-[#f1f5f9] px-5 pb-5 pt-4">
                    {expandedDetail.items?.length === 0 ? (
                      <div className="text-sm text-[#64748b]">No line items.</div>
                    ) : (
                      expandedDetail.items.map((it) => {
                        const delivered = it.quantity_delivered || 0;
                        const ordered   = it.quantity || 1;
                        const pct       = Math.min(100, Math.round((delivered / ordered) * 100));
                        const complete  = delivered >= ordered || it.is_final;
                        return (
                          <div key={it.id} className="rounded-xl border border-[#e2e8f0] bg-white p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="font-bold text-[#0f172a]">{it.description}</div>
                              <div className="text-sm font-semibold text-[#475569]">
                                {it.quantity} {it.unit}
                                {it.unit_price != null ? (
                                  <span className="text-[#94a3b8]"> · ${Number(it.unit_price).toFixed(2)}/unit</span>
                                ) : null}
                              </div>
                            </div>
                            <div className="mt-2.5 flex items-center gap-2">
                              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#e2e8f0]">
                                <div
                                  className={cn('h-full transition-all', complete ? 'bg-emerald-500' : 'bg-brand-500')}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <div className={cn('text-xs font-bold', complete ? 'text-emerald-700' : 'text-[#64748b]')}>
                                {delivered}/{ordered}
                              </div>
                            </div>
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <Bell className="h-3.5 w-3.5 text-[#94a3b8]" />
                              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
                                Notify foreman:
                              </span>
                              {FOREMAN_TYPES.map((ft) => (
                                <Chip
                                  key={ft.id}
                                  accent
                                  active={it.notify_foreman_type === ft.id}
                                  onClick={() =>
                                    updateForemanType(it.id, it.notify_foreman_type === ft.id ? null : ft.id)
                                  }
                                  className="px-2.5 py-1 text-[12px]"
                                >
                                  {ft.label}
                                </Chip>
                              ))}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
