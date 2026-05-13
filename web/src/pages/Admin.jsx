import { useEffect, useState } from 'react';
import { Plus, Trash2, Pencil, Save, X } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { ASSIGNABLE_ROLES, FOREMAN_TYPES, ROLE_IDS, roleLabel } from '@/lib/roles';
import PageHeader, { EmptyState } from '@/components/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Chip } from '@/components/ui/Chip';

export default function Admin() {
  const { canManageUsers } = useAuth();
  const [users, setUsers] = useState([]);
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState(ROLE_IDS.WAREHOUSE_STAFF);
  const [foremanType, setForemanType] = useState(FOREMAN_TYPES[0].id);
  const [feedback, setFeedback] = useState({ type: '', text: '' });
  const [editing, setEditing] = useState(null);

  const reload = () => apiFetch('/api/auth/users').then((r) => setUsers(Array.isArray(r) ? r : []));
  useEffect(() => { if (canManageUsers) reload(); }, [canManageUsers]);

  if (!canManageUsers) {
    return (
      <div>
        <PageHeader title="Users" />
        <EmptyState title="Restricted" description="Administrator access required." />
      </div>
    );
  }

  const create = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', text: '' });
    try {
      await apiFetch('/api/auth/users', {
        method: 'POST',
        body: { email, displayName, password, roleId, foremanType: roleId === ROLE_IDS.FOREMAN ? foremanType : undefined },
      });
      setEmail(''); setDisplayName(''); setPassword('');
      reload();
      setFeedback({ type: 'ok', text: 'User created.' });
    } catch (err) { setFeedback({ type: 'err', text: err.message }); }
  };

  const remove = async (u) => {
    if (!confirm(`Remove "${u.display_name}" (${u.email})?`)) return;
    try { await apiFetch(`/api/auth/users/${u.id}`, { method: 'DELETE' }); reload(); }
    catch (err) { setFeedback({ type: 'err', text: err.message }); }
  };

  const beginEdit = (u) => setEditing({ id: u.id, email: u.email, displayName: u.display_name, password: '' });
  const saveEdit = async () => {
    try {
      await apiFetch(`/api/auth/users/${editing.id}`, {
        method: 'PATCH',
        body: { email: editing.email, displayName: editing.displayName, password: editing.password || undefined },
      });
      setEditing(null);
      reload();
      setFeedback({ type: 'ok', text: 'User updated.' });
    } catch (err) { setFeedback({ type: 'err', text: err.message }); }
  };

  const isForeman = roleId === ROLE_IDS.FOREMAN;

  return (
    <div>
      <PageHeader title="Users" description="Manage accounts, passwords, and roles." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Account list */}
        <div className="space-y-3 lg:col-span-2">
          <div className="text-base font-bold text-[#0f172a]">Accounts ({users.length})</div>
          {users.length === 0 ? <EmptyState title="No users yet" /> : users.map((u) => (
            <Card key={u.id} accent className="p-4">
              {editing?.id === u.id ? (
                <div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Display name</Label>
                      <Input value={editing.displayName} onChange={(e) => setEditing((p) => ({ ...p, displayName: e.target.value }))} />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input value={editing.email} onChange={(e) => setEditing((p) => ({ ...p, email: e.target.value }))} />
                    </div>
                  </div>
                  <div className="mt-3.5">
                    <Label>New password</Label>
                    <Input
                      type="password"
                      value={editing.password}
                      onChange={(e) => setEditing((p) => ({ ...p, password: e.target.value }))}
                      placeholder="Leave blank to keep current password"
                    />
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button onClick={saveEdit}><Save className="h-4 w-4" /> Save</Button>
                    <Button variant="outline" onClick={() => setEditing(null)}><X className="h-4 w-4" /> Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-base font-extrabold text-[#0f172a]">{u.display_name}</div>
                    <div className="text-sm text-[#64748b]">{u.email}</div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <Badge>{roleLabel(u.role_id)}</Badge>
                      {u.role_id === ROLE_IDS.FOREMAN && u.foreman_type ? (
                        <Badge variant="accent">{FOREMAN_TYPES.find((f) => f.id === u.foreman_type)?.label || u.foreman_type}</Badge>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="action" onClick={() => beginEdit(u)} title="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="destructive" onClick={() => remove(u)} title="Remove">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Create form */}
        <Card className="p-5 lg:sticky lg:top-20 lg:self-start">
          <div className="mb-3 text-base font-bold text-[#0f172a]">Create user</div>
          <form onSubmit={create}>
            <Label>Display name</Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
            <div className="mt-3.5">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="mt-3.5">
              <Label>Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>

            <div className="mt-4">
              <Label>Role</Label>
              <div className="flex flex-wrap gap-2">
                {ASSIGNABLE_ROLES.map((r) => (
                  <Chip key={r} active={roleId === r} onClick={() => setRoleId(r)}>
                    {roleLabel(r)}
                  </Chip>
                ))}
              </div>
            </div>

            {isForeman ? (
              <div className="mt-4">
                <Label>Foreman type</Label>
                <div className="flex flex-wrap gap-2">
                  {FOREMAN_TYPES.map((f) => (
                    <Chip key={f.id} accent active={foremanType === f.id} onClick={() => setForemanType(f.id)}>
                      {f.label}
                    </Chip>
                  ))}
                </div>
              </div>
            ) : null}

            {feedback.text ? (
              <div className={feedback.type === 'ok' ? 'mt-4 text-sm font-semibold text-[#16a34a]' : 'mt-4 text-sm font-semibold text-[#dc2626]'}>
                {feedback.text}
              </div>
            ) : null}

            <Button type="submit" className="mt-5 w-full">
              <Plus className="h-4 w-4" /> Create user
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
