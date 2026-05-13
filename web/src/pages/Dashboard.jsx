import { useEffect, useState } from 'react';
import {
  FolderKanban, FileText, Truck, Package, ArrowRightLeft, Loader2,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useProject } from '@/lib/project';
import { roleLabel, ROLE_IDS } from '@/lib/roles';
import { Card } from '@/components/ui/Card';
import PageHeader from '@/components/PageHeader';

const STAT_CARDS = (s, isPM) => [
  { label: 'Projects',          value: s.projects,         Icon: FolderKanban,    color: '#3b82f6' },
  isPM && { label: 'Purchase Orders', value: s.purchaseOrders, Icon: FileText, color: '#8b5cf6' },
  { label: 'Packing Slips',     value: s.packingSlips,     Icon: Truck,           color: '#22c55e' },
  { label: 'Inventory Items',   value: s.inventoryItems,   Icon: Package,         color: '#f59e0b' },
  { label: 'Pending Transfers', value: s.pendingRequests,  Icon: ArrowRightLeft,  color: '#ef4444' },
].filter(Boolean);

export default function Dashboard() {
  const { session } = useAuth();
  const { selectedProjectId } = useProject();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const path = selectedProjectId
      ? `/api/summary?projectId=${selectedProjectId}`
      : '/api/summary';
    apiFetch(path)
      .then((r) => setSummary(r))
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  }, [selectedProjectId]);

  const isPM = session?.roleId === ROLE_IDS.PROJECT_MANAGER;

  return (
    <div>
      {/* User card matching mobile (white card with brand left accent) */}
      <Card accent className="mb-5 flex items-start justify-between gap-3 p-5">
        <div>
          <div className="text-sm text-[#64748b]">Signed in as</div>
          <div className="mt-1 text-xl font-extrabold tracking-tight text-[#0f172a]">
            {session?.displayName}
          </div>
          <div className="mt-1 text-sm font-semibold text-brand-500">
            {roleLabel(session?.roleId)}
            {summary?.projectName ? ` • ${summary.projectName}` : ' • All projects'}
          </div>
        </div>
      </Card>

      <PageHeader title="Dashboard" />

      {loading ? (
        <div className="flex items-center gap-2 text-[#64748b]">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : summary ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {STAT_CARDS(summary, isPM).map(({ label, value, Icon, color }) => (
            <div
              key={label}
              className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-[#cbd5e1]"
            >
              <div className="flex items-start justify-between">
                <div className="text-[28px] font-extrabold leading-none" style={{ color }}>
                  {value ?? 0}
                </div>
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${color}15`, color }}
                >
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 text-xs font-semibold text-[#64748b]">{label}</div>
            </div>
          ))}
        </div>
      ) : (
        <Card className="p-6 text-sm text-[#64748b]">No data available.</Card>
      )}
    </div>
  );
}
