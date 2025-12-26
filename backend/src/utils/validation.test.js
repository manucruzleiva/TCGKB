import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  validateCardId,
  sanitizeHtml,
  validateQuantity,
  validateObjectId,
  validateTcgSystem,
  validateDeckStatus
} from './validation.js'

describe('Input Validation Framework', () => {
  describe('validateCardId', () => {
    let mockCardCache

    beforeEach(() => {
      mockCardCache = {
        findOne: vi.fn()
      }
    })

    it('should reject null/undefined cardId', async () => {
      const result1 = await validateCardId(null, mockCardCache)
      const result2 = await validateCardId(undefined, mockCardCache)

      expect(result1.valid).toBe(false)
      expect(result1.error).toContain('non-empty string')
      expect(result2.valid).toBe(false)
    })

    it('should reject non-string cardId', async () => {
      const result = await validateCardId(123, mockCardCache)

      expect(result.valid).toBe(false)
      expect(result.error).toContain('non-empty string')
    })

    it('should reject invalid format (no hyphen)', async () => {
      const result = await validateCardId('sv125', mockCardCache)

      expect(result.valid).toBe(false)
      expect(result.error).toContain('Invalid card ID format')
    })

    it('should reject invalid format (letters in number)', async () => {
      const result = await validateCardId('sv1-abc', mockCardCache)

      expect(result.valid).toBe(false)
      expect(result.error).toContain('Invalid card ID format')
    })

    it('should accept valid format and return card if exists', async () => {
      const mockCard = { id: 'sv1-25', name: 'Pikachu ex' }
      mockCardCache.findOne.mockResolvedValue(mockCard)

      const result = await validateCardId('sv1-25', mockCardCache)

      expect(result.valid).toBe(true)
      expect(result.card).toEqual(mockCard)
      expect(mockCardCache.findOne).toHaveBeenCalledWith({ id: 'sv1-25' })
    })

    it('should reject if card not found in database', async () => {
      mockCardCache.findOne.mockResolvedValue(null)

      const result = await validateCardId('sv1-999', mockCardCache)

      expect(result.valid).toBe(false)
      expect(result.error).toContain('not found in database')
    })

    it('should handle database errors gracefully', async () => {
      mockCardCache.findOne.mockRejectedValue(new Error('DB connection failed'))

      const result = await validateCardId('sv1-25', mockCardCache)

      expect(result.valid).toBe(false)
      expect(result.error).toContain('Database error')
    })

    it('should accept various valid formats', async () => {
      const validIds = ['sv1-25', 'obb-123', 'ssp-97', 'PAL-172']

      for (const cardId of validIds) {
        mockCardCache.findOne.mockResolvedValue({ id: cardId })
        const result = await validateCardId(cardId, mockCardCache)
        expect(result.valid).toBe(true)
      }
    })
  })

  describe('sanitizeHtml', () => {
    it('should strip all HTML tags', () => {
      const input = '<script>alert("xss")</script>Hello'
      const result = sanitizeHtml(input)

      expect(result).toBe('Hello')
      expect(result).not.toContain('<script>')
    })

    it('should strip complex HTML structures', () => {
      const input = '<div><p>Text</p><img src=x onerror=alert(1)>More text</div>'
      const result = sanitizeHtml(input)

      expect(result).toBe('TextMore text')
      expect(result).not.toContain('<')
      expect(result).not.toContain('>')
    })

    it('should return empty string for null/undefined', () => {
      expect(sanitizeHtml(null)).toBe('')
      expect(sanitizeHtml(undefined)).toBe('')
    })

    it('should return empty string for non-string input', () => {
      expect(sanitizeHtml(123)).toBe('')
      expect(sanitizeHtml({})).toBe('')
      expect(sanitizeHtml([])).toBe('')
    })

    it('should trim whitespace', () => {
      const input = '   Hello World   '
      const result = sanitizeHtml(input)

      expect(result).toBe('Hello World')
    })

    it('should respect maxLength option', () => {
      const input = 'A'.repeat(2000)
      const result = sanitizeHtml(input, { maxLength: 500 })

      expect(result.length).toBe(500)
    })

    it('should use default maxLength of 1000', () => {
      const input = 'B'.repeat(2000)
      const result = sanitizeHtml(input)

      expect(result.length).toBe(1000)
    })

    it('should preserve text content from HTML entities', () => {
      const input = '<p>Hello &amp; Goodbye</p>'
      const result = sanitizeHtml(input)

      expect(result).toContain('&')
    })
  })

  describe('validateQuantity', () => {
    it('should accept valid integer', () => {
      const result = validateQuantity(5)

      expect(result.valid).toBe(true)
      expect(result.value).toBe(5)
    })

    it('should accept valid string number', () => {
      const result = validateQuantity('10')

      expect(result.valid).toBe(true)
      expect(result.value).toBe(10)
    })

    it('should reject non-numeric input', () => {
      const result = validateQuantity('abc')

      expect(result.valid).toBe(false)
      expect(result.error).toContain('must be a number')
    })

    it('should reject decimal numbers', () => {
      const result = validateQuantity(5.5)

      expect(result.valid).toBe(false)
      expect(result.error).toContain('must be an integer')
    })

    it('should reject negative numbers (default min: 0)', () => {
      const result = validateQuantity(-5)

      expect(result.valid).toBe(false)
      expect(result.error).toContain('at least 0')
    })

    it('should reject values above max (default: 1000)', () => {
      const result = validateQuantity(1001)

      expect(result.valid).toBe(false)
      expect(result.error).toContain('cannot exceed 1000')
    })

    it('should respect custom min option', () => {
      const result = validateQuantity(5, { min: 10 })

      expect(result.valid).toBe(false)
      expect(result.error).toContain('at least 10')
    })

    it('should respect custom max option', () => {
      const result = validateQuantity(100, { max: 60 })

      expect(result.valid).toBe(false)
      expect(result.error).toContain('cannot exceed 60')
    })

    it('should accept 0 as valid', () => {
      const result = validateQuantity(0)

      expect(result.valid).toBe(true)
      expect(result.value).toBe(0)
    })
  })

  describe('validateObjectId', () => {
    it('should accept valid 24-char hex ObjectId', () => {
      const result = validateObjectId('507f1f77bcf86cd799439011')

      expect(result.valid).toBe(true)
    })

    it('should reject null/undefined', () => {
      const result1 = validateObjectId(null)
      const result2 = validateObjectId(undefined)

      expect(result1.valid).toBe(false)
      expect(result2.valid).toBe(false)
    })

    it('should reject non-string', () => {
      const result = validateObjectId(123)

      expect(result.valid).toBe(false)
    })

    it('should reject invalid length', () => {
      const result = validateObjectId('507f1f77bcf86cd79943')

      expect(result.valid).toBe(false)
      expect(result.error).toContain('Invalid ID format')
    })

    it('should reject non-hex characters', () => {
      const result = validateObjectId('507f1f77bcf86cd79943901z')

      expect(result.valid).toBe(false)
    })
  })

  describe('validateTcgSystem', () => {
    it('should accept "pokemon"', () => {
      const result = validateTcgSystem('pokemon')

      expect(result.valid).toBe(true)
      expect(result.value).toBe('pokemon')
    })

    it('should accept "riftbound"', () => {
      const result = validateTcgSystem('riftbound')

      expect(result.valid).toBe(true)
      expect(result.value).toBe('riftbound')
    })

    it('should normalize to lowercase', () => {
      const result = validateTcgSystem('POKEMON')

      expect(result.valid).toBe(true)
      expect(result.value).toBe('pokemon')
    })

    it('should trim whitespace', () => {
      const result = validateTcgSystem('  pokemon  ')

      expect(result.valid).toBe(true)
      expect(result.value).toBe('pokemon')
    })

    it('should reject invalid system', () => {
      const result = validateTcgSystem('yugioh')

      expect(result.valid).toBe(false)
      expect(result.error).toContain('must be one of')
    })

    it('should reject null/undefined', () => {
      const result1 = validateTcgSystem(null)
      const result2 = validateTcgSystem(undefined)

      expect(result1.valid).toBe(false)
      expect(result2.valid).toBe(false)
    })
  })

  describe('validateDeckStatus', () => {
    it('should accept "draft"', () => {
      const result = validateDeckStatus('draft')

      expect(result.valid).toBe(true)
      expect(result.value).toBe('draft')
    })

    it('should accept "built"', () => {
      const result = validateDeckStatus('built')

      expect(result.valid).toBe(true)
      expect(result.value).toBe('built')
    })

    it('should normalize to lowercase', () => {
      const result = validateDeckStatus('BUILT')

      expect(result.valid).toBe(true)
      expect(result.value).toBe('built')
    })

    it('should reject invalid status', () => {
      const result = validateDeckStatus('published')

      expect(result.valid).toBe(false)
      expect(result.error).toContain('must be one of')
    })

    it('should reject null/undefined', () => {
      const result1 = validateDeckStatus(null)
      const result2 = validateDeckStatus(undefined)

      expect(result1.valid).toBe(false)
      expect(result2.valid).toBe(false)
    })
  })
})
