import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useTDLRequests } from '@/hooks/useTDLRequests';
import type { TDLRequest } from '@/types/tdl';

type StatusFilter = 'all' | 'brouillon' | 'en_analyse' | 'en_revision' | 'qualifie' | 'rejete';
type RegionFilter = 'all' | 'QC' | 'ON' | 'US';

export function MasterDashboard() {
  const { data: requests, isLoading } = useTDLRequests();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [regionFilter, setRegionFilter] = useState<RegionFilter>('all');

  const filteredRequests = useMemo(() => {
    if (!requests) return [];
    
    return requests.filter((req) => {
      // Search filter
      const matchesSearch = 
        req.tdl_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.formula_id?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Status filter
      const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
      
      // Region filter
      const matchesRegion = regionFilter === 'all' || req.region === regionFilter;
      
      return matchesSearch && matchesStatus && matchesRegion;
    });
  }, [requests, searchQuery, statusFilter, regionFilter]);

  const stats = useMemo(() => {
    if (!requests) return { total: 0, brouillon: 0, en_analyse: 0, en_revision: 0, qualifie: 0, rejete: 0 };
    
    return {
      total: requests.length,
      brouillon: requests.filter(r => r.status === 'brouillon').length,
      en_analyse: requests.filter(r => r.status === 'en_analyse').length,
      en_revision: requests.filter(r => r.status === 'en_revision').length,
      qualifie: requests.filter(r => r.status === 'qualifie').length,
      rejete: requests.filter(r => r.status === 'rejete').length,
    };
  }, [requests]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'brouillon': return 'bg-gray-100 text-gray-800';
      case 'en_analyse': return 'bg-blue-100 text-blue-800';
      case 'en_revision': return 'bg-yellow-100 text-yellow-800';
      case 'qualifie': return 'bg-green-100 text-green-800';
      case 'rejete': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-gray-500">Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-gray-600">{stats.brouillon}</div>
            <div className="text-sm text-gray-500">Brouillon</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-600">{stats.en_analyse}</div>
            <div className="text-sm text-gray-500">En Analyse</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.en_revision}</div>
            <div className="text-sm text-gray-500">En Révision</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{stats.qualifie}</div>
            <div className="text-sm text-gray-500">Qualifiés</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-600">{stats.rejete}</div>
            <div className="text-sm text-gray-500">Rejetés</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Rechercher par numéro, client, formule..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="px-3 py-2 border rounded-md"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            >
              <option value="all">Tous les statuts</option>
              <option value="brouillon">Brouillon</option>
              <option value="en_analyse">En Analyse</option>
              <option value="en_revision">En Révision</option>
              <option value="qualifie">Qualifié</option>
              <option value="rejete">Rejeté</option>
            </select>
            <select
              className="px-3 py-2 border rounded-md"
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value as RegionFilter)}
            >
              <option value="all">Toutes les régions</option>
              <option value="QC">Québec</option>
              <option value="ON">Ontario</option>
              <option value="US">États-Unis</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Demandes TDL ({filteredRequests.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Numéro</th>
                  <th className="text-left py-3 px-4">Client</th>
                  <th className="text-left py-3 px-4">Formule</th>
                  <th className="text-left py-3 px-4">Région</th>
                  <th className="text-left py-3 px-4">Statut</th>
                  <th className="text-left py-3 px-4">Priorité</th>
                  <th className="text-left py-3 px-4">Créé le</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((req) => (
                  <tr key={req.id} className="border-b hover:bg-gray-50 cursor-pointer">
                    <td className="py-3 px-4 font-medium">{req.tdl_number}</td>
                    <td className="py-3 px-4">{req.client_name}</td>
                    <td className="py-3 px-4">{req.formula_id}</td>
                    <td className="py-3 px-4">{req.region}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(req.status)}`}>
                        {req.status}
                      </span>
                    </td>
                    <td className={`py-3 px-4 font-medium ${getPriorityColor(req.priority)}`}>
                      {req.priority}
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      {req.created_at ? new Date(req.created_at).toLocaleDateString('fr-CA') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
