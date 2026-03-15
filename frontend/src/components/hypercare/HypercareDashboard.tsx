import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';

export interface BugReport {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'in_progress' | 'resolved' | 'wont_fix';
  reported_by: string;
  assigned_to?: string;
  created_at: Date;
  resolved_at?: Date;
  tdl_id?: string;
}

export function useBugTracker() {
  const [bugs, setBugs] = useState<BugReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBugs();
  }, []);

  const fetchBugs = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('bug_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setBugs(data);
    }
    setIsLoading(false);
  };

  const createBug = async (bug: Omit<BugReport, 'id' | 'created_at' | 'status'>) => {
    const { data, error } = await supabase
      .from('bug_reports')
      .insert({
        ...bug,
        status: 'open',
      })
      .select()
      .single();

    if (!error && data) {
      setBugs([data, ...bugs]);
    }
    return { data, error };
  };

  const updateBugStatus = async (id: string, status: BugReport['status']) => {
    const updates = { status };
    if (status === 'resolved') {
      updates.resolved_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('bug_reports')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (!error && data) {
      setBugs(bugs.map(b => b.id === id ? data : b));
    }
    return { data, error };
  };

  const getStats = () => {
    return {
      total: bugs.length,
      open: bugs.filter(b => b.status === 'open').length,
      inProgress: bugs.filter(b => b.status === 'in_progress').length,
      resolved: bugs.filter(b => b.status === 'resolved').length,
      critical: bugs.filter(b => b.severity === 'critical' && b.status !== 'resolved').length,
    };
  };

  return {
    bugs,
    isLoading,
    fetchBugs,
    createBug,
    updateBugStatus,
    getStats,
  };
}

export function HypercareDashboard() {
  const { bugs, createBug, updateBugStatus, getStats } = useBugTracker();
  const [newBug, setNewBug] = useState({ title: '', description: '', severity: 'medium' as const });
  const [showForm, setShowForm] = useState(false);

  const stats = getStats();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createBug({
      ...newBug,
      reported_by: 'Current User',
    });
    setNewBug({ title: '', description: '', severity: 'medium' });
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-gray-500">Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
            <div className="text-sm text-gray-500">Critiques</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-orange-500">{stats.open}</div>
            <div className="text-sm text-gray-500">Ouverts</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
            <div className="text-sm text-gray-500">En cours</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
            <div className="text-sm text-gray-500">Résolus</div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Signalements de bugs</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700"
        >
          {showForm ? 'Annuler' : 'Signaler un bug'}
        </button>
      </div>

      {/* Bug Form */}
      {showForm && (
        <Card>
          <CardContent className="pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Titre du bug"
                value={newBug.title}
                onChange={(e) => setNewBug({ ...newBug, title: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
              <textarea
                placeholder="Description"
                value={newBug.description}
                onChange={(e) => setNewBug({ ...newBug, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                rows={3}
              />
              <select
                value={newBug.severity}
                onChange={(e) => setNewBug({ ...newBug, severity: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="critical">Critique</option>
                <option value="high">Haute</option>
                <option value="medium">Moyenne</option>
                <option value="low">Basse</option>
              </select>
              <button type="submit" className="px-4 py-2 bg-sky-600 text-white rounded-md">
                Soumettre
              </button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Bug List */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des bugs</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Titre</th>
                <th className="text-left py-2">Sévérité</th>
                <th className="text-left py-2">Statut</th>
                <th className="text-left py-2">Rapporté par</th>
                <th className="text-left py-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {bugs.map((bug) => (
                <tr key={bug.id} className="border-b">
                  <td className="py-2">{bug.title}</td>
                  <td className="py-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      bug.severity === 'critical' ? 'bg-red-100 text-red-800' :
                      bug.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                      bug.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {bug.severity}
                    </span>
                  </td>
                  <td className="py-2">{bug.status}</td>
                  <td className="py-2">{bug.reported_by}</td>
                  <td className="py-2">{new Date(bug.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
