import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { ROLE_IDS } from '@/lib/roles';
import PageHeader, { EmptyState } from '@/components/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card } from '@/components/ui/Card';

export default function Settings() {
  const { session } = useAuth();
  const [w1, setW1] = useState('');
  const [w2, setW2] = useState('');
  const [ses, setSes] = useState('');
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  const isAdmin = session?.roleId === ROLE_IDS.ADMINISTRATOR;

  useEffect(() => {
    if (!isAdmin) return;
    apiFetch('/api/settings').then((r) => {
      setW1(r?.warehouse1_name || '');
      setW2(r?.warehouse2_name || '');
      setSes(r?.ses_from_email || '');
    });
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div>
        <PageHeader title="Settings" />
        <EmptyState title="Restricted" description="Administrator access required." />
      </div>
    );
  }

  const save = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', text: '' });
    try {
      await apiFetch('/api/settings', {
        method: 'PUT',
        body: { warehouse1_name: w1, warehouse2_name: w2, ses_from_email: ses },
      });
      setFeedback({ type: 'ok', text: 'Settings saved.' });
    } catch (err) {
      setFeedback({ type: 'err', text: err.message });
    }
  };

  return (
    <div>
      <PageHeader title="Admin Settings" description="Configure warehouses and email sender." />
      <form onSubmit={save} className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card accent className="p-5">
          <div className="text-base font-bold text-[#0f172a]">Warehouses</div>
          <div className="mt-1 text-sm text-[#64748b]">
            These names appear in transfer pickers across the app.
          </div>
          <div className="mt-4">
            <Label>Warehouse 1 name</Label>
            <Input value={w1} onChange={(e) => setW1(e.target.value)} placeholder="Main Warehouse" />
          </div>
          <div className="mt-3.5">
            <Label>Warehouse 2 name</Label>
            <Input value={w2} onChange={(e) => setW2(e.target.value)} placeholder="Overflow Warehouse" />
          </div>
        </Card>

        <Card accent className="p-5">
          <div className="text-base font-bold text-[#0f172a]">Transactional email (Amazon SES)</div>
          <div className="mt-1 text-sm text-[#64748b]">
            This address appears as the sender for automated emails. It must be verified in
            AWS SES (same region as the app). In SES sandbox, recipient addresses must be
            verified too.
          </div>
          <div className="mt-4">
            <Label>From email</Label>
            <Input
              type="email"
              value={ses}
              onChange={(e) => setSes(e.target.value)}
              placeholder="frankhl1@umbc.edu"
            />
          </div>
        </Card>

        <div className="flex items-center gap-3 lg:col-span-2">
          <Button type="submit"><Save className="h-4 w-4" /> Save settings</Button>
          {feedback.text ? (
            <span className={feedback.type === 'ok' ? 'text-sm font-semibold text-[#16a34a]' : 'text-sm font-semibold text-[#dc2626]'}>
              {feedback.text}
            </span>
          ) : null}
        </div>
      </form>
    </div>
  );
}
