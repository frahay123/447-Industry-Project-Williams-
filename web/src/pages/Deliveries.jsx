import { useEffect, useState } from 'react';
import { Truck, FileText } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useProject } from '@/lib/project';
import PageHeader, { EmptyState } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/Dialog';

export default function Deliveries() {
  const { selectedProjectId } = useProject();
  const [slips, setSlips] = useState([]);
  const [activeSlip, setActiveSlip] = useState(null);
  const [items, setItems] = useState([]);

  const reload = () => {
    const path = selectedProjectId
      ? `/api/packing-slips?projectId=${selectedProjectId}`
      : '/api/packing-slips';
    apiFetch(path).then((r) => setSlips(Array.isArray(r) ? r : []));
  };

  useEffect(() => { reload(); }, [selectedProjectId]);

  useEffect(() => {
    if (!activeSlip) return;
    apiFetch(`/api/packing-slips/${activeSlip.id}/items`)
      .then((r) => setItems(Array.isArray(r) ? r : []))
      .catch(() => setItems([]));
  }, [activeSlip]);

  return (
    <div>
      <PageHeader title="Deliveries" description="All packing slips received and processed." />

      {slips.length === 0 ? (
        <EmptyState title="No deliveries" description="Slips uploaded by warehouse / foreman / logistics will show here." />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {slips.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSlip(s)}
              className="group rounded-2xl border border-[#e2e8f0] border-l-4 border-l-brand-500 bg-white p-5 text-left shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-l-brand-600 hover:shadow-md cursor-pointer"
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-extrabold text-[#0f172a]">
                  <Truck className="h-4 w-4 text-brand-500" />
                  Slip #{s.slip_seq || s.id}
                </div>
                {s.is_rejected ? (
                  <Badge variant="destructive">Rejected</Badge>
                ) : s.completed_at ? (
                  <Badge variant="success">Completed</Badge>
                ) : (
                  <Badge variant="warning">In progress</Badge>
                )}
              </div>
              <div className="text-xs font-semibold text-[#64748b]">{s.project_name}</div>
              <div className="mt-2 text-xs text-[#475569]">
                {s.uploaded_by ? `By ${s.uploaded_by}` : ''}
                {s.signed_by ? ` · Signed by ${s.signed_by}` : ''}
              </div>
              <div className="mt-1 text-xs text-[#94a3b8]">
                {new Date(s.created_at).toLocaleString()}
              </div>
              {s.linked_pos?.length ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  {s.linked_pos.map((p) => (
                    <Badge key={p.id} variant="outline">PO #{p.po_seq} ({p.po_number})</Badge>
                  ))}
                </div>
              ) : null}
              <div className="mt-2 text-xs font-semibold text-[#475569]">{s.item_count || 0} items</div>
            </button>
          ))}
        </div>
      )}

      <Dialog open={!!activeSlip} onOpenChange={(v) => !v && setActiveSlip(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              <FileText className="inline h-4 w-4 mr-1.5 -mt-0.5 text-brand-500" />
              Slip #{activeSlip?.slip_seq || activeSlip?.id} — {activeSlip?.project_name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-sm text-[#64748b]">
              Uploaded by <span className="font-semibold text-[#475569]">{activeSlip?.uploaded_by}</span> on {activeSlip ? new Date(activeSlip.created_at).toLocaleString() : ''}
            </div>
            <div className="overflow-hidden rounded-xl border border-[#e2e8f0]">
              <table className="w-full text-sm">
                <thead className="bg-[#f8fafc] text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
                  <tr>
                    <th className="p-3 text-left">Description</th>
                    <th className="p-3 text-right">Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr><td className="p-3 text-[#64748b]" colSpan={2}>No items logged</td></tr>
                  ) : items.map((it) => (
                    <tr key={it.id} className="border-t border-[#f1f5f9]">
                      <td className="p-3 font-semibold text-[#0f172a]">{it.description}</td>
                      <td className="p-3 text-right font-mono font-bold">{it.quantity_received}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button variant="outline" onClick={() => setActiveSlip(null)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
