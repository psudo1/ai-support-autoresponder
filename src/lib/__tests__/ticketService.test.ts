import { 
  getAllTickets, 
  getTicketById, 
  createTicket, 
  updateTicket,
  getTicketStats 
} from '../ticketService';
import { supabaseAdmin } from '../supabaseClient';

// Mock the supabase client
jest.mock('../supabaseClient');

// Helper to create chainable query builders
const createChainableQuery = (finalResolve) => {
  const chain = {
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue(finalResolve),
  }
  chain.then = (resolve) => Promise.resolve(finalResolve).then(resolve)
  chain.catch = (reject) => Promise.resolve(finalResolve).catch(reject)
  return chain
}

describe('ticketService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllTickets', () => {
    it('should fetch all tickets without filters', async () => {
      const mockTickets = [
        { id: '1', subject: 'Test Ticket', status: 'new' },
        { id: '2', subject: 'Another Ticket', status: 'resolved' },
      ];

      const mockQuery = createChainableQuery({ data: mockTickets, error: null });
      
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn(() => mockQuery),
      });

      const result = await getAllTickets();

      expect(supabaseAdmin.from).toHaveBeenCalledWith('tickets');
      expect(result).toEqual(mockTickets);
    });

    it('should apply status filter', async () => {
      const mockData = [];
      const mockQuery = createChainableQuery({ data: mockData, error: null });
      
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn(() => mockQuery),
      });

      await getAllTickets({ status: 'new' });

      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'new');
    });

    it('should handle errors', async () => {
      const mockQuery = createChainableQuery({ 
        data: null, 
        error: { message: 'Database error' } 
      });

      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn(() => mockQuery),
      });

      await expect(getAllTickets()).rejects.toThrow('Failed to get tickets: Database error');
    });
  });

  describe('getTicketById', () => {
    it('should fetch a ticket by ID', async () => {
      const mockTicket = { id: '1', subject: 'Test Ticket', status: 'new' };
      const mockQuery = createChainableQuery({ data: mockTicket, error: null });

      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn(() => mockQuery),
      });

      const result = await getTicketById('1');

      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1');
      expect(result).toEqual(mockTicket);
    });

    it('should return null for non-existent ticket', async () => {
      const mockQuery = createChainableQuery({ 
        data: null, 
        error: { code: 'PGRST116' } 
      });

      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn(() => mockQuery),
      });

      const result = await getTicketById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('createTicket', () => {
    it('should create a new ticket', async () => {
      const ticketInput = {
        subject: 'New Ticket',
        initial_message: 'Test message',
        customer_email: 'test@example.com',
      };

      const mockTicket = {
        id: '1',
        ...ticketInput,
        status: 'new',
        created_at: new Date().toISOString(),
      };

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnValue(mockQuery),
      });

      mockQuery.single.mockResolvedValue({ data: mockTicket, error: null });

      const result = await createTicket(ticketInput);

      expect(supabaseAdmin.from).toHaveBeenCalledWith('tickets');
      expect(result).toEqual(mockTicket);
    });
  });

  describe('updateTicket', () => {
    it('should update a ticket', async () => {
      const updateInput = {
        status: 'resolved' as const,
        priority: 'high' as const,
      };

      const mockUpdatedTicket = {
        id: '1',
        status: 'resolved',
        priority: 'high',
        updated_at: new Date().toISOString(),
      };

      const mockQuery = {
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue(mockQuery),
      });

      mockQuery.single.mockResolvedValue({ data: mockUpdatedTicket, error: null });

      const result = await updateTicket('1', updateInput);

      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1');
      expect(result).toEqual(mockUpdatedTicket);
    });
  });

  describe('getTicketStats', () => {
    it('should calculate ticket statistics', async () => {
      const mockData = [
        { status: 'new', priority: 'medium' },
        { status: 'new', priority: 'high' },
        { status: 'resolved', priority: 'low' },
        { status: 'resolved', priority: 'medium' },
      ];

      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue({ data: mockData, error: null }),
      });

      const result = await getTicketStats();

      expect(result.total).toBe(4);
      expect(result.byStatus.new).toBe(2);
      expect(result.byStatus.resolved).toBe(2);
      expect(result.byPriority.medium).toBe(2);
    });

    it('should handle empty data', async () => {
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue({ data: [], error: null }),
      });

      const result = await getTicketStats();

      expect(result.total).toBe(0);
      expect(result.byStatus.new).toBe(0);
    });
  });
});

