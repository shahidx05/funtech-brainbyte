import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ResultCard from '../../components/ResultCard';

vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

describe('ResultCard Component Tests', () => {
  const mockResultData = {
    score: 18,
    maxPossibleScore: 20,
    totalQuestions: 20,
    attempted: 20,
    correct: 18,
    incorrect: 2,
    timeTakenSeconds: 750,
    breakdown: [
      { questionId: 'q1', selectedOptionKey: 'A', isCorrect: true },
      { questionId: 'q2', selectedOptionKey: 'C', isCorrect: false },
    ],
  };

  const mockParticipant = {
    name: 'Dev Sharma',
  };

  it('should render score, accuracy, participant name, and breakdown', () => {
    render(<ResultCard resultData={mockResultData} participant={mockParticipant} />);

    expect(screen.getByText('Dev Sharma')).toBeInTheDocument();
    expect(screen.getAllByText('18').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/\/ 20/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('90% Accuracy')).toBeInTheDocument();
    expect(screen.getByText('12m 30s')).toBeInTheDocument();
    expect(screen.getByText('Q1')).toBeInTheDocument();
    expect(screen.getByText('Q2')).toBeInTheDocument();
  });
});
