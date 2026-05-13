import { useEffect, useState } from 'react';
import { Plus, ArrowRight } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useProject } from '@/lib/project';
import { can } from '@/lib/roles';
import PageHeader, { EmptyState } from '@/components/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/Dialog';

const STATUS_VARIANT = {
  pending: 'warning',
  manifested: 'default',
  in_transit: 'accent',
  delivered: 'success',
};

const STATUS_NEXT = {
  pending: 'manifested',
  manifested: 'in_transit',
  in_transit: 'delivered',
};

export default function Transfers() {
  const { session } = useAuth();
  const { selectedProjectId } = useProject();
  const [requests, setRequests] = useState([]);
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState({});
  const [projects, setProjects] = useState([]);

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [desc, setDesc] = useState('');
  const [qty, setQty] = useState('1');
  const [unit, setUnit] = useState('');

  const allowedCreate = can.createTransfer(session?.roleId);

  const reload = () => {
    const path = selectedProjectId
      ? `/api/requests?projectId=${selectedProjectId}`
      : '/api/requests';
    apiFetch(path).then((r) => setRequests(Array.isArray(r) ? r : []));
  };

  useEffect(() => {
    reload();
    apiFetch('/api/settings').then((r) => setSettings(r || {}));
    apiFetch('/api/projects').then((r) => setProjects(Array.isArray(r) ? r : []));
  }, [selectedProjectId]);

  const locationOptions = [
    settings.warehouse1_name && { id: settings.warehouse1_name, label: settings.warehouse1_name },
    settings.warehouse2_name && { id: settings.warehouse2_name, label: settings.warehouse2_name },
    selectedProjectId && projects.find((p) => p.id === selectedProjectId)?.name &&
      { id: projects.find((p) => p.id === selectedProjectId).name, label: `Jobsite: ${projects.find((p) => p.id === selectedProjectId).name}` },
  ].filter(Boolean);

  const submit = async (e) => {
    e.preventDefault();
    await apiFetch('/api/requests', {
      method: 'POST',
      body: {
        projectId: selectedProjectId,
        sourceLocation: from || undefined,
        destLocation: to || undefined,
        description: desc,
        quantity: parseInt(qty, 10) || 1,
        unit: unit || undefined,
      },
    });
    setOpen(false);
    setFrom(''); setTo(''); setDesc(''); setQty('1'); setUnit('');
    reload();
  };

  const advance = async (id, current) => {
    const next = STATUS_NEXT[current];
    if (!next) return;
    await apiFetch(`/api/requests/${id}`, { method: 'PATCH', body: { status: next } });
    reload();
  };

  return (
    <div>
      <PageHeader
        title="Transfers"
        description="Move material between warehouses and jobsites."
        actions={
          allowedCreate ? (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button><Plus className="h-4 w-4" /> New transfer</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Create transfer</DialogTitle></DialogHeader>
                <form onSubmit={submit}>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>From</Label>
                      <Select value={from} onChange={(e) => setFrom(e.target.value)} required>
                        <option value="">— Select —</option>
                        {locationOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                      </Select>
                    </div>
                    <div>
                      <Label>To</Label>
                      <Select value={to} onChange={(e) => setTo(e.target.value)} required>
                        <option value="">— Select —</option>
                        {locationOptions.filter((o) => o.id !== from).map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                      </Select>
                    </div>
                  </div>
                  <div className="mt-3.5"><Label>Material</Label><Input value={desc} onChange={(e) => setDesc(e.target.value)} required /></div>
                  <div className="mt-3.5 grid grid-cols-2 gap-3">
                    <div><Label>Quantity</Label><Input type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} /></div>
                    <div><Label>Unit</Label><Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="ft, units…" /></div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button type="submit">Create</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          ) : null
        }
      />

      {requests.length === 0 ? (
        <EmptyState title="No transfers yet" description="Create a transfer to track material between warehouses and jobsites." />
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <Card
              key={r.id}
              accent
              className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant={STATUS_VARIANT[r.status] || 'outline'}>{r.status.replace('_', ' ')}</Badge>
                  <span className="text-base font-extrabold text-[#0f172a]">
                    {r.quantity}{r.unit ? ` ${r.unit}` : ''} · {r.description}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-2 text-xs text-[#64748b]">
                  <span className="font-semibold">{r.source_location || r.source_project_name || '—'}</span>
                  <ArrowRight className="h-3 w-3 text-[#94a3b8]" />
                  <span className="font-semibold">{r.dest_location || r.project_name || '—'}</span>
                  <span>•</span>
                  <span>by {r.requested_by}</span>
                </div>
              </div>
              {STATUS_NEXT[r.status] ? (
                <Button size="sm" variant="action" onClick={() => advance(r.id, r.status)}>
                  Mark {STATUS_NEXT[r.status].replace('_', ' ')}
                </Button>
              ) : null}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
