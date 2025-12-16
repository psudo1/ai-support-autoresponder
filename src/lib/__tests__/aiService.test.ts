import { generateAIResponse } from '../aiService';
import { openai } from '../openaiClient';
import { getRelevantKnowledgeForTicket } from '../knowledgeBaseService';
import { getConversationsByTicketId } from '../conversationService';
import { getTicketById } from '../ticketService';
import { getAISettings } from '../settingsService';
import { getCategoryPrompt } from '../templateService';
import { getLanguageSettings } from '../brandingService';

jest.mock('../openaiClient');
jest.mock('../knowledgeBaseService');
jest.mock('../conversationService');
jest.mock('../ticketService');
jest.mock('../settingsService');
jest.mock('../templateService');
jest.mock('../brandingService');

describe('aiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock default settings
    (getAISettings as jest.Mock).mockResolvedValue({
      model: 'gpt-4o',
      temperature: 0.7,
      max_tokens: 1000,
      auto_send_threshold: 0.85,
      require_review_below: 0.7,
    });
    
    (getCategoryPrompt as jest.Mock).mockResolvedValue(null);
    (getLanguageSettings as jest.Mock).mockResolvedValue({
      default_language: 'en',
      brand_voice: 'professional',
    });
  });

  describe('generateAIResponse', () => {
    it('should generate an AI response for a ticket', async () => {
      const mockTicket = {
        id: '1',
        subject: 'Test Ticket',
        initial_message: 'I need help',
        customer_email: 'test@example.com',
      };

      const mockKnowledgeEntries = [];
      const mockConversations = [];

      (getTicketById as jest.Mock).mockResolvedValue(mockTicket);
      (getRelevantKnowledgeForTicket as jest.Mock).mockResolvedValue(mockKnowledgeEntries);
      (getConversationsByTicketId as jest.Mock).mockResolvedValue(mockConversations);

      const mockAIResponse = {
        choices: [{
          message: {
            content: 'Here is a helpful response',
            role: 'assistant',
          },
        }],
        usage: {
          total_tokens: 100,
          prompt_tokens: 50,
          completion_tokens: 50,
        },
      };

      (openai.chat.completions.create as jest.Mock).mockResolvedValue(mockAIResponse);

      const result = await generateAIResponse({ ticket_id: '1' }, {
        include_knowledge_base: false,
      });

      expect(result.response).toBe('Here is a helpful response');
      expect(result.tokens_used).toBe(100);
      expect(openai.chat.completions.create).toHaveBeenCalled();
    });

    it('should include knowledge base context when requested', async () => {
      const mockTicket = {
        id: '1',
        subject: 'Test Ticket',
        initial_message: 'I need help',
        customer_email: 'test@example.com',
      };

      const mockKnowledgeEntries = [
        { id: '1', title: 'FAQ', content: 'Common question answer' },
      ];
      const mockConversations = [];

      (getTicketById as jest.Mock).mockResolvedValue(mockTicket);
      (getRelevantKnowledgeForTicket as jest.Mock).mockResolvedValue(mockKnowledgeEntries);
      (getConversationsByTicketId as jest.Mock).mockResolvedValue(mockConversations);

      const mockAIResponse = {
        choices: [{
          message: {
            content: 'Response with KB context',
            role: 'assistant',
          },
        }],
        usage: {
          total_tokens: 150,
          prompt_tokens: 100,
          completion_tokens: 50,
        },
      };

      (openai.chat.completions.create as jest.Mock).mockResolvedValue(mockAIResponse);

      const result = await generateAIResponse({ ticket_id: '1' }, {
        include_knowledge_base: true,
      });

      expect(result.response).toBe('Response with KB context');
      expect(getRelevantKnowledgeForTicket).toHaveBeenCalled();
    });

    it('should calculate confidence score', async () => {
      const mockTicket = {
        id: '1',
        subject: 'Test Ticket',
        initial_message: 'I need help',
        customer_email: 'test@example.com',
      };

      (getTicketById as jest.Mock).mockResolvedValue(mockTicket);
      (getRelevantKnowledgeForTicket as jest.Mock).mockResolvedValue([]);
      (getConversationsByTicketId as jest.Mock).mockResolvedValue([]);

      const mockAIResponse = {
        choices: [{
          message: {
            content: 'Response',
            role: 'assistant',
          },
          finish_reason: 'stop',
        }],
        usage: {
          total_tokens: 100,
          prompt_tokens: 50,
          completion_tokens: 50,
        },
      };

      (openai.chat.completions.create as jest.Mock).mockResolvedValue(mockAIResponse);

      const result = await generateAIResponse({ ticket_id: '1' });

      expect(result.confidence_score).toBeGreaterThanOrEqual(0);
      expect(result.confidence_score).toBeLessThanOrEqual(1);
    });

    it('should handle API errors', async () => {
      const mockTicket = {
        id: '1',
        subject: 'Test Ticket',
        initial_message: 'I need help',
        customer_email: 'test@example.com',
      };

      (getTicketById as jest.Mock).mockResolvedValue(mockTicket);
      (getRelevantKnowledgeForTicket as jest.Mock).mockResolvedValue([]);
      (getConversationsByTicketId as jest.Mock).mockResolvedValue([]);
      (openai.chat.completions.create as jest.Mock).mockRejectedValue(
        new Error('API Error')
      );

      await expect(generateAIResponse({ ticket_id: '1' })).rejects.toThrow('API Error');
    });
  });
});

