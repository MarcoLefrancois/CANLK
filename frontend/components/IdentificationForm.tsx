import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useClientSearch } from '../hooks/useClientSearch';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Schéma de validation A-SPEC
 */
const identificationSchema = z.object({
  businessUnit: z.string().default('Canlak'),
  department: z.string().min(1, 'Le département est requis'),
  requester: z.string().min(1),
  supervisor: z.string().optional(),
  clientId: z.string().min(1, 'Le client est requis'),
  contactName: z.string().optional(),
});

type IdentificationFormValues = z.infer<typeof identificationSchema>;

export const IdentificationForm: React.FC = () => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { results, isLoading } = useClientSearch(searchQuery);

  const form = useForm<IdentificationFormValues>({
    resolver: zodResolver(identificationSchema),
    defaultValues: {
      businessUnit: 'Canlak',
      requester: 'Chargement...',
    },
  });

  const onSubmit = (values: IdentificationFormValues) => {
    console.log('Soumission TDL (Identification) :', values);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-premium border border-gray-100">
      <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2">Identification & Service</h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Unité d'affaire */}
            <FormField
              control={form.control}
              name="businessUnit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unité d'affaire</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Canlak">Canlak</SelectItem>
                      <SelectItem value="Autre">Autre (Exemple)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Service-Département */}
            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service / Département</FormLabel>
                  <Select onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un département" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ventes">Ventes</SelectItem>
                      <SelectItem value="labo_couleur">Laboratoire Couleur</SelectItem>
                      <SelectItem value="rd">Recherche & Développement</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Demandeur (Read-only) */}
            <FormField
              control={form.control}
              name="requester"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Demandeur</FormLabel>
                  <FormControl>
                    <Input {...field} readOnly className="bg-gray-50 cursor-not-allowed" />
                  </FormControl>
                  <FormDescription>Azure AD Sync.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Client (Lookup SMART-AC - CANLK-7) */}
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Client</FormLabel>
                  <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value
                            ? results.find((a) => a.id === field.value)?.name || "Client Sélectionné"
                            : "Rechercher par nom, ville ou numéro..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command shouldFilter={false}>
                        <CommandInput 
                          placeholder="Rechercher..." 
                          onValueChange={setSearchQuery}
                        />
                        <CommandEmpty>
                          {isLoading ? (
                            <div className="flex items-center justify-center py-6">
                              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                            </div>
                          ) : (
                            "Aucun client trouvé."
                          )}
                        </CommandEmpty>
                        <CommandGroup>
                          {results.map((account) => (
                            <CommandItem
                              value={account.id}
                              key={account.id}
                              onSelect={() => {
                                form.setValue("clientId", account.id);
                                setSearchOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  account.id === field.value ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col">
                                <span>{account.name}</span>
                                <span className="text-xs text-slate-500">
                                  {account.city} | {account.account_number}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

          </div>

          <div className="flex justify-end pt-4 gap-2">
            <Button type="submit" variant="premium">Enregistrer Initialement</Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
