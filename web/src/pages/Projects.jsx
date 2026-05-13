import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { can } from '@/lib/roles';
import PageHeader, { EmptyState } from '@/components/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card } from '@/components/ui/Card';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/Dialog';

export default function Projects() {
  const { session } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [jobNumber, setJobNumber] = useState('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState('');

  const allowedCreate = can.createProject(session?.roleId);
  const allowedDelete = can.deleteProject(session?.roleId);

  const reload = async () => {
    setLoading(true);
    try {
      const r = await apiFetch('/api/projects');
      setProjects(Array.isArray(r) ? r : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); }, []);

  const create = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await apiFetch('/api/projects', {
        method: 'POST',
        body: { name, jobNumber: jobNumber || undefined, location },
      });
      setOpen(false);
      setName(''); setJobNumber(''); setLocation('');
      reload();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete this project? All linked POs, slips, and inventory will be removed.')) return;
    try {
      await apiFetch(`/api/projects/${id}`, { method: 'DELETE' });
      reload();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      <PageHeader
        title="Projects"
        description="All active jobs across the company."
        actions={
          allowedCreate ? (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4" /> New project</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Create a new project</DialogTitle></DialogHeader>
                <form onSubmit={create}>
                  <Label>Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="" required />
                  <div className="mt-3.5">
                    <Label>Job number (optional)</Label>
                    <Input value={jobNumber} onChange={(e) => setJobNumber(e.target.value)} placeholder="" />
                  </div>
                  <div className="mt-3.5">
                    <Label>Location</Label>
                    <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="" required />
                  </div>
                  {error ? <div className="mt-3 text-sm text-[#dc2626]">{error}</div> : null}
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

      {loading ? (
        <div className="text-[#64748b]">Loading…</div>
      ) : projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description={allowedCreate ? 'Create your first project to begin.' : 'Ask a Project Manager to create one.'}
        />
      ) : (
        <div className="space-y-3">
          {projects.map((p) => (
            <Card key={p.id} accent className="flex items-start justify-between gap-3 p-5">
              <div className="min-w-0">
                <div className="text-base font-extrabold text-[#0f172a]">{p.name}</div>
                <div className="mt-1 text-sm text-[#64748b]">
                  {p.location || '—'}{p.job_number ? ` · Job #${p.job_number}` : ''}
                </div>
                <div className="mt-1 text-xs text-[#94a3b8]">
                  Created {p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}
                </div>
              </div>
              {allowedDelete ? (
                <Button size="icon" variant="destructive" onClick={() => remove(p.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              ) : null}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
