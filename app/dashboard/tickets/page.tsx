import TicketList from '@/components/tickets/TicketList';
import { getAllTickets } from '@/lib/ticketService';

export default async function TicketsPage() {
  const tickets = await getAllTickets();

  return <TicketList initialTickets={tickets} />;
}

