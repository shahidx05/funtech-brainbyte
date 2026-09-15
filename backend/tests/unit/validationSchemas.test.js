// globals are enabled via vitest config (describe, it, expect)
const {
  registerSchema,
  submitAnswersSchema,
  questionSchema,
  questionUpdateSchema,
} = require('../../src/utils/validationSchemas');

describe('Validation Schemas Unit Tests', () => {
  describe('registerSchema', () => {
    it('should validate valid registration input', () => {
      const input = {
        name: 'Alex Kumar',
        email: 'alex.kumar@example.com',
        rollNumber: 'CS2026',
      };
      const result = registerSchema.safeParse(input);
      expect(result.success).toBe(true);
      expect(result.data.name).toBe('Alex Kumar');
      expect(result.data.email).toBe('alex.kumar@example.com');
    });

    it('should allow optional rollNumber to be omitted', () => {
      const input = {
        name: 'Priya Patel',
        email: 'priya@college.edu',
      };
      const result = registerSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject missing or empty name', () => {
      const input = {
        name: '   ',
        email: 'test@example.com',
      };
      const result = registerSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = ['plainaddress', 'user@.com', '@domain.com', 'user@domain'];
      for (const email of invalidEmails) {
        const result = registerSchema.safeParse({ name: 'User', email });
        expect(result.success).toBe(false);
      }
    });
  });

  describe('submitAnswersSchema', () => {
    const validMongoId = '507f1f77bcf86cd799439011';

    it('should validate valid submission', () => {
      const input = {
        answers: [
          { questionId: validMongoId, selectedOptionKey: 'A' },
        ],
        timeTakenSeconds: 300,
      };
      const result = submitAnswersSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject submission with empty answers array', () => {
      const input = {
        answers: [],
        timeTakenSeconds: 300,
      };
      const result = submitAnswersSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject invalid questionId regex', () => {
      const input = {
        answers: [
          { questionId: 'invalid-id-123', selectedOptionKey: 'A' },
        ],
        timeTakenSeconds: 10,
      };
      const result = submitAnswersSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject negative timeTakenSeconds', () => {
      const input = {
        answers: [
          { questionId: validMongoId, selectedOptionKey: 'B' },
        ],
        timeTakenSeconds: -5,
      };
      const result = submitAnswersSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe('questionSchema', () => {
    it('should validate valid question creation', () => {
      const input = {
        questionText: 'What is the speed of light?',
        options: [
          { key: 'A', text: '3x10^8 m/s' },
          { key: 'B', text: '1.5x10^8 m/s' },
        ],
        correctOptionKey: 'A',
        marks: 2,
        order: 1,
      };
      const result = questionSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject if options count is less than 2', () => {
      const input = {
        questionText: 'Only one option question',
        options: [{ key: 'A', text: 'Single option' }],
        correctOptionKey: 'A',
      };
      const result = questionSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject if correctOptionKey is missing', () => {
      const input = {
        questionText: 'Missing correct key',
        options: [
          { key: 'A', text: 'Opt 1' },
          { key: 'B', text: 'Opt 2' },
        ],
      };
      const result = questionSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });
});
