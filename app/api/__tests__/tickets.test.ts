import { GET, POST } from '../tickets/route';
import { getAllTickets, createTicket } from '@/lib/ticketService';
import { NextRequest } from 'next/server';

// Mock Next.js server modules that require Web APIs
jest.mock('next/server', () => {
  const actual = jest.requireActual('next/server');
  return {
    ...actual,
    NextRequest: class NextRequest extends Request {
      constructor(input, init) {
        super(input, init);
        this.nextUrl = {
          searchParams: new URL(input).searchParams,
        };
      }
    },
  };
});

jest.mock('@/lib/ticketService');
jest.mock('@/lib/supabaseClient');

describe('/api/tickets', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return all tickets', async () => {
      const mockTickets = [
        { id: '1', subject: 'Test Ticket', status: 'new' },
        { id: '2', subject: 'Another Ticket', status: 'resolved' },
      ];

      (getAllTickets as jest.Mock).mockResolvedValue(mockTickets);

      const request = new NextRequest('http://localhost:3000/api/tickets');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.tickets).toEqual(mockTickets);
      expect(getAllTickets).toHaveBeenCalled();
    });

    it('should apply query parameters', async () => {
      (getAllTickets as jest.Mock).mockResolvedValue([]);

      const request = new NextRequest(
        'http://localhost:3000/api/tickets?status=new&priority=high'
      );
      await GET(request);

      expect(getAllTickets).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'new',
          priority: 'high',
        })
      );
    });

    it('should handle errors', async () => {
      (getAllTickets as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const request = new NextRequest('http://localhost:3000/api/tickets');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();
    });
  });

  describe('POST', () => {
    it('should create a new ticket', async () => {
      const ticketData = {
        subject: 'New Ticket',
        initial_message: 'Test message',
        customer_email: 'test@example.com',
      };

      const mockTicket = {
        id: '1',
        ...ticketData,
        status: 'new',
        created_at: new Date().toISOString(),
      };

      (createTicket as jest.Mock).mockResolvedValue(mockTicket);

      const request = new NextRequest('http://localhost:3000/api/tickets', {
        method: 'POST',
        body: JSON.stringify(ticketData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.ticket).toEqual(mockTicket);
      expect(createTicket).toHaveBeenCalledWith(
        expect.objectContaining(ticketData)
      );
    });

    it('should validate required fields', async () => {
      const invalidData = {
        subject: 'Test',
        // missing required fields
      };

      const request = new NextRequest('http://localhost:3000/api/tickets', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it('should handle creation errors', async () => {
      const ticketData = {
        subject: 'New Ticket',
        initial_message: 'Test message',
        customer_email: 'test@example.com',
      };

      (createTicket as jest.Mock).mockRejectedValue(
        new Error('Creation failed')
      );

      const request = new NextRequest('http://localhost:3000/api/tickets', {
        method: 'POST',
        body: JSON.stringify(ticketData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();
    });
  });
});

