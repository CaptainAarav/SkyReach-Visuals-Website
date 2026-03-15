import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';

export default function AdminLogs() {
  const [data, setData] = useState({ auditLogs: [], pageViews: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/api/admin/logs')
      .then((res) => setData({ auditLogs: res.auditLogs || [], pageViews: res.pageViews || [] }))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  const fmtDate = (d) =>
    new Date(d).toLocaleString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  const { auditLogs: logs, pageViews } = data;

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-lg font-semibold text-white mb-1">Audit logs</h2>
        <p className="text-sm text-cream/50 mb-4">Last 10 entries.</p>
        {error && <p className="text-sm text-red mb-4">{error}</p>}

        {logs.length === 0 ? (
          <p className="text-cream/60 py-8">No audit logs yet.</p>
        ) : (
          <div className="space-y-2 max-h-[50vh] overflow-y-auto">
            {logs.map((log) => (
              <div key={log.id} className="bg-bg rounded-lg p-4 border border-white/10">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono bg-white/10 text-cream px-2 py-0.5 rounded">
                        {log.action}
                      </span>
                      <span className="text-xs text-cream/50">
                        by <span className="text-cream/80">{log.admin?.name || 'Unknown'}</span>
                      </span>
                      {log.targetUser && (
                        <span className="text-xs text-cream/50">
                          &rarr; <span className="text-cream/80">{log.targetUser.name}</span>
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-cream/70 mt-1">{log.details}</p>
                  </div>
                  <span className="text-xs text-cream/40 whitespace-nowrap">{fmtDate(log.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-white mb-1">Site visits</h2>
        <p className="text-sm text-cream/50 mb-4">When anyone goes onto the website (last 50).</p>
        {pageViews.length === 0 ? (
          <p className="text-cream/60 py-8">No page views yet.</p>
        ) : (
          <div className="space-y-2 max-h-[50vh] overflow-y-auto">
            {pageViews.map((v) => (
              <div key={v.id} className="bg-bg rounded-lg p-3 border border-white/10 flex items-center justify-between gap-4">
                <span className="text-sm font-mono text-cream/90 truncate">{v.path || '/'}</span>
                <span className="text-xs text-cream/40 whitespace-nowrap">{fmtDate(v.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
