import TicketDetail from '@/components/tickets/TicketDetail';
import { getTicketById } from '@/lib/ticketService';
import { notFound } from 'next/navigation';

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ticket = await getTicketById(id);

  if (!ticket) {
    notFound();
  }

  return <TicketDetail />;
}

