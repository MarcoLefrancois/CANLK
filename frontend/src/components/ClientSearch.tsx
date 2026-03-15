import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useClientSearch, Account } from '@/hooks/useClientSearch'
import { CreateClientDialog } from './client/CreateClientDialog'
import { Loader2 } from 'lucide-react'

interface ClientSearchProps {
  onSelect: (client: Account) => void
}

export function ClientSearch({ onSelect }: ClientSearchProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const { results: clients, isLoading } = useClientSearch(searchTerm)

  // Callback when a new client is created - auto-select it
  const handleClientCreated = (clientId: string, clientName: string) => {
    // Find the newly created client in results or create a minimal object
    const newClient: Account = {
      id: clientId,
      name: clientName,
      account_number: 'NEWACCOUNT',
      city: ''
    }
    onSelect(newClient)
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            type="search"
            placeholder="Rechercher un client par nom ou code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <CreateClientDialog onSuccess={handleClientCreated} />
      </div>
      
      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Recherche en cours...
        </div>
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
                  Code: {client.account_number} | Ville: {client.city || 'N/A'}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
      
      {searchTerm && clients && clients.length === 0 && !isLoading && (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground mb-3">
            Aucun client trouvé pour "{searchTerm}"
          </p>
          <p className="text-xs text-muted-foreground">
            Vous pouvez créer un nouveau prospect ci-dessus
          </p>
        </div>
      )}
    </div>
  )
}

export default ClientSearch
