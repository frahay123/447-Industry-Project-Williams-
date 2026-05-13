import { useEffect, useMemo, useState } from 'react';
import { Plus, Minus, Search } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useProject } from '@/lib/project';
import { can } from '@/lib/roles';
import PageHeader, { EmptyState } from '@/components/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card } from '@/components/ui/Card';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/Dialog';

export default function Inventory() {
  const { session } = useAuth();
  const { selectedProjectId } = useProject();
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [desc, setDesc] = useState('');
  const [qty, setQty] = useState('1');
  const [loc, setLoc] = useState('warehouse');

  const allowedAdd = can.addInventory(session?.roleId);
  const allowedAdjust = can.adjustInventory(session?.roleId);

  const reload = () => {
    const path = selectedProjectId
      ? `/api/inventory?projectId=${selectedProjectId}`
      : '/api/inventory';
    apiFetch(path).then((r) => setItems(Array.isArray(r) ? r : []));
  };

  useEffect(() => { reload(); }, [selectedProjectId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) =>
      `${i.description} ${i.location || ''}`.toLowerCase().includes(q),
    );
  }, [items, search]);

  const addItem = async (e) => {
    e.preventDefault();
    await apiFetch('/api/inventory', {
      method: 'POST',
      body: {
        projectId: selectedProjectId,
        description: desc,
        quantity: parseInt(qty, 10) || 0,
        location: loc,
      },
    });
    setDesc(''); setQty('1'); setLoc('warehouse'); setOpen(false);
    reload();
  };

  const adjust = async (id, delta) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const next = Math.max(0, item.quantity + delta);
    await apiFetch(`/api/inventory/${id}`, { method: 'PATCH', body: { quantity: next } });
    reload();
  };

  return (
    <div>
      <PageHeader
        title="Inventory"
        description={selectedProjectId ? 'Items at this jobsite or warehouse' : 'All inventory across all projects'}
        actions={
          allowedAdd ? (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button><Plus className="h-4 w-4" /> New item</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add inventory item</DialogTitle></DialogHeader>
                <form onSubmit={addItem}>
                  <Label>Description</Label>
                  <Input value={desc} onChange={(e) => setDesc(e.target.value)} required />
                  <div className="mt-3.5 grid grid-cols-2 gap-3">
                    <div><Label>Quantity</Label><Input type="number" min="0" value={qty} onChange={(e) => setQty(e.target.value)} /></div>
                    <div><Label>Location</Label><Input value={loc} onChange={(e) => setLoc(e.target.value)} /></div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button type="submit">Add</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          ) : null
        }
      />

      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-[#475569]">{filtered.length} items</div>
        <div className="relative w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className="pl-9" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No inventory" description="Items appear here as packing slips are processed." />
      ) : (
        <div className="space-y-2">
          {filtered.map((i) => (
            <Card key={i.id} accent className="flex items-center justify-between gap-3 px-5 py-4">
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-bold text-[#0f172a]">{i.description}</div>
                <div className="mt-0.5 text-xs text-[#64748b]">
                  {i.project_name || 'Unassigned'} · {i.location || 'warehouse'}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-2xl font-extrabold leading-none text-[#0f172a]">{i.quantity}</div>
                  <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#94a3b8]">on hand</div>
                </div>
                {allowedAdjust ? (
                  <div className="inline-flex items-center gap-1.5">
                    <Button size="icon" variant="outline" onClick={() => adjust(i.id, -1)}><Minus className="h-4 w-4" /></Button>
                    <Button size="icon" variant="outline" onClick={() => adjust(i.id, +1)}><Plus className="h-4 w-4" /></Button>
                  </div>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
