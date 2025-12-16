// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Polyfill for Next.js Request/Response APIs - must be first
import { TextEncoder, TextDecoder } from 'util'
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Note: Next.js provides NextRequest/NextResponse which extend Web APIs
// We don't need to polyfill Request/Response as Next.js handles this
// The test environment should have these available via Next.js

if (typeof global.Headers === 'undefined') {
  global.Headers = class Headers {
    constructor(init) {
      this.map = new Map()
      if (init) {
        if (init instanceof Headers) {
          init.forEach((value, key) => this.map.set(key, value))
        } else if (Array.isArray(init)) {
          init.forEach(([key, value]) => this.map.set(key, value))
        } else {
          Object.entries(init).forEach(([key, value]) => this.map.set(key, value))
        }
      }
    }
    get(key) {
      return this.map.get(key.toLowerCase()) || null
    }
    set(key, value) {
      this.map.set(key.toLowerCase(), value)
    }
    has(key) {
      return this.map.has(key.toLowerCase())
    }
    forEach(callback) {
      this.map.forEach((value, key) => callback(value, key))
    }
  }
}

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
    }
  },
  usePathname() {
    return '/'
  },
  useSearchParams() {
    return new URLSearchParams()
  },
}))

// Mock Supabase client - create a chainable query builder
const createChainableQuery = (finalResolve) => {
  const chain = {
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue(finalResolve),
  }
  // Make the final await resolve to the finalResolve value
  chain.then = (resolve) => Promise.resolve(finalResolve).then(resolve)
  chain.catch = (reject) => Promise.resolve(finalResolve).catch(reject)
  return chain
}

jest.mock('@/lib/supabaseClient', () => ({
  supabaseAdmin: {
    from: jest.fn(() => ({
      select: jest.fn(() => createChainableQuery({ data: [], error: null })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
          })),
        })),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      })),
    })),
  },
  createBrowserClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(),
  })),
}))

// Mock OpenAI client
jest.mock('@/lib/openaiClient', () => ({
  openai: {
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  },
  calculateCost: jest.fn((tokens, model) => tokens * 0.0001), // Mock cost calculation
  getDefaultModel: jest.fn(() => 'gpt-4o'),
}))

// Suppress console errors in tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
}

