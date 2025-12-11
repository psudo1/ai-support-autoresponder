import TicketForm from '@/components/tickets/TicketForm';

export default function NewTicketPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Ticket</h1>
      <TicketForm />
    </div>
  );
}

