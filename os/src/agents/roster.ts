/** Les 9 agents de TIMBI OS. Seuls ATLAS et HUNTER sont actifs dans le MVP. */
export interface RosterEntry {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'planned';
  /** Liste blanche des outils autorisés (RBAC agent). */
  tools: string[];
}

export const AGENT_ROSTER: RosterEntry[] = [
  {
    id: 'atlas', name: 'ATLAS', role: 'Direction exécutive et orchestration', status: 'active',
    tools: ['get_system_status', 'memory_read', 'memory_write', 'list_leads', 'delegate_to_agent', 'create_task', 'notify_owner'],
  },
  {
    id: 'hunter', name: 'HUNTER', role: 'Prospection et veille commerciale', status: 'active',
    tools: ['search_companies', 'score_lead', 'save_lead', 'list_leads', 'memory_read', 'memory_write', 'request_outreach_approval'],
  },
  { id: 'nexus', name: 'NEXUS', role: 'Ventes, qualification et propositions', status: 'planned', tools: [] },
  { id: 'pixel', name: 'PIXEL', role: 'UI/UX et identité de marque', status: 'planned', tools: [] },
  { id: 'forge', name: 'FORGE', role: 'Développement et déploiement web', status: 'planned', tools: [] },
  { id: 'echo', name: 'ECHO', role: 'Marketing et contenu', status: 'planned', tools: [] },
  { id: 'care', name: 'CARE', role: 'Support client', status: 'planned', tools: [] },
  { id: 'ledger', name: 'LEDGER', role: 'Suivi financier et reporting', status: 'planned', tools: [] },
  { id: 'guard', name: 'GUARD', role: 'Qualité et sécurité', status: 'planned', tools: [] },
];

export function rosterEntry(id: string): RosterEntry | undefined {
  return AGENT_ROSTER.find((a) => a.id === id);
}
