import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { useClients } from '@/hooks/useClients'
import type { Client } from '@/lib/supabase'

interface ClientSearchProps {
  onSelect: (client: Client) => void
}

export function ClientSearch({ onSelect }: ClientSearchProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const { data: clients, isLoading } = useClients({ search: searchTerm })

  return (
    <div className="space-y-2">
      <Input
        type="search"
        placeholder="Rechercher un client par nom ou code..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      
      {isLoading && (
        <p className="text-sm text-muted-foreground">Chargement...</p>
      )}
      
      {clients && clients.length > 0 && (
        <ul className="border rounded-md divide-y max-h-60 overflow-y-auto">
          {clients.map((client) => (
            <li key={client.id}>
              <button
                type="button"
                className="w-full text-left px-4 py-2 hover:bg-accent focus:bg-accent"
                onClick={() => onSelect(client)}
              >
                <div className="font-medium">{client.name}</div>
                <div className="text-sm text-muted-foreground">
                  Code: {client.code} | Région: {client.region}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
      
      {searchTerm && clients && clients.length === 0 && !isLoading && (
        <p className="text-sm text-muted-foreground">Aucun client trouvé</p>
      )}
    </div>
  )
}
