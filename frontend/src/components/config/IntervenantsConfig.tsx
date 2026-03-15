import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';

export interface Intervenant {
  id: string;
  name: string;
  email: string;
  role: string;
  region: 'QC' | 'ON' | 'US';
  departments: string[];
  is_active: boolean;
  max_capacity: number;
  current_load: number;
}

export function useIntervenants() {
  const [intervenants, setIntervenants] = useState<Intervenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchIntervenants();
  }, []);

  const fetchIntervenants = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('intervenants')
      .select('*')
      .order('name');

    if (!error && data) {
      setIntervenants(data);
    }
    setIsLoading(false);
  };

  const addIntervenant = async (intervenant: Omit<Intervenant, 'id'>) => {
    const { data, error } = await supabase
      .from('intervenants')
      .insert(intervenant)
      .select()
      .single();

    if (!error && data) {
      setIntervenants([...intervenants, data]);
    }
    return { data, error };
  };

  const updateIntervenant = async (id: string, updates: Partial<Intervenant>) => {
    const { data, error } = await supabase
      .from('intervenants')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (!error && data) {
      setIntervenants(intervenants.map(i => i.id === id ? data : i));
    }
    return { data, error };
  };

  const deleteIntervenant = async (id: string) => {
    const { error } = await supabase
      .from('intervenants')
      .delete()
      .eq('id', id);

    if (!error) {
      setIntervenants(intervenants.filter(i => i.id !== id));
    }
    return { error };
  };

  const getAvailableIntervenants = (region: string, department: string): Intervenants[] => {
    return intervenants.filter(i => 
      i.is_active && 
      i.region === region && 
      i.departments.includes(department) &&
      i.current_load < i.max_capacity
    );
  };

  const getRecommendedIntervenant = (region: string, department: string): Intervenant | null => {
    const available = getAvailableIntervenants(region, department);
    if (available.length === 0) return null;
    
    // Return the one with lowest current load
    return available.sort((a, b) => a.current_load - b.current_load)[0];
  };

  return {
    intervenants,
    isLoading,
    fetchIntervenants,
    addIntervenant,
    updateIntervenant,
    deleteIntervenant,
    getAvailableIntervenants,
    getRecommendedIntervenant,
  };
}

export function IntervenantsConfig() {
  const { intervenants, addIntervenant, updateIntervenant, deleteIntervenant } = useIntervenants();
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');

  const handleAdd = async () => {
    if (!newName || !newEmail) return;
    
    await addIntervenant({
      name: newName,
      email: newEmail,
      role: 'technician',
      region: 'QC',
      departments: [],
      is_active: true,
      max_capacity: 10,
      current_load: 0,
    });
    
    setNewName('');
    setNewEmail('');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configuration des Intervenants</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <Input
              placeholder="Nom"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <Input
              placeholder="Email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
            <Button onClick={handleAdd}>Ajouter</Button>
          </div>

          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Nom</th>
                <th className="text-left py-2">Email</th>
                <th className="text-left py-2">Région</th>
                <th className="text-left py-2">Charge</th>
                <th className="text-left py-2">Statut</th>
                <th className="text-left py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {intervenants.map((intervenant) => (
                <tr key={intervenant.id} className="border-b">
                  <td className="py-2">{intervenant.name}</td>
                  <td className="py-2">{intervenant.email}</td>
                  <td className="py-2">{intervenant.region}</td>
                  <td className="py-2">
                    {intervenant.current_load}/{intervenant.max_capacity}
                  </td>
                  <td className="py-2">
                    <span className={intervenant.is_active ? 'text-green-600' : 'text-gray-400'}>
                      {intervenant.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="py-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteIntervenant(intervenant.id)}
                    >
                      Supprimer
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
