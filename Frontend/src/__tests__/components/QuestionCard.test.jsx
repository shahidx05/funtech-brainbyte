import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import QuestionCard from '../../components/QuestionCard';

describe('QuestionCard Component Tests', () => {
  const mockQuestion = {
    _id: 'q123',
    questionText: 'What is the capital of Japan?',
    marks: 2,
    options: [
      { key: 'A', text: 'Kyoto' },
      { key: 'B', text: 'Tokyo' },
      { key: 'C', text: 'Osaka' },
      { key: 'D', text: 'Hiroshima' },
    ],
  };

  it('should render question details and options accurately', () => {
    render(
      <QuestionCard
        question={mockQuestion}
        currentIndex={0}
        totalQuestions={10}
        selectedOptionKey={null}
        onSelectOption={vi.fn()}
        onNext={vi.fn()}
        onPrev={vi.fn()}
        isReviewed={false}
        onToggleReview={vi.fn()}
      />
    );

    expect(screen.getByText(/Question 1 of 10/i)).toBeInTheDocument();
    expect(screen.getByText(/2 Marks/i)).toBeInTheDocument();
    expect(screen.getByText('What is the capital of Japan?')).toBeInTheDocument();
    expect(screen.getByText('Tokyo')).toBeInTheDocument();
  });

  it('should trigger onSelectOption when an option is clicked', () => {
    const onSelectMock = vi.fn();
    render(
      <QuestionCard
        question={mockQuestion}
        currentIndex={0}
        totalQuestions={10}
        selectedOptionKey={null}
        onSelectOption={onSelectMock}
        onNext={vi.fn()}
        onPrev={vi.fn()}
        isReviewed={false}
        onToggleReview={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText('Tokyo'));
    expect(onSelectMock).toHaveBeenCalledWith('B');
  });

  it('should trigger onToggleReview when Mark for Review button is clicked', () => {
    const onToggleMock = vi.fn();
    render(
      <QuestionCard
        question={mockQuestion}
        currentIndex={0}
        totalQuestions={10}
        selectedOptionKey="B"
        onSelectOption={vi.fn()}
        onNext={vi.fn()}
        onPrev={vi.fn()}
        isReviewed={false}
        onToggleReview={onToggleMock}
      />
    );

    fireEvent.click(screen.getByText(/Mark for Review/i));
    expect(onToggleMock).toHaveBeenCalled();
  });

  it('should disable Previous button on first question and trigger Next on click', () => {
    const onNextMock = vi.fn();
    const onPrevMock = vi.fn();

    render(
      <QuestionCard
        question={mockQuestion}
        currentIndex={0}
        totalQuestions={10}
        selectedOptionKey={null}
        onSelectOption={vi.fn()}
        onNext={onNextMock}
        onPrev={onPrevMock}
        isReviewed={false}
        onToggleReview={vi.fn()}
      />
    );

    const prevBtn = screen.getByRole('button', { name: /Previous/i });
    const nextBtn = screen.getByRole('button', { name: /Next/i });

    expect(prevBtn).toBeDisabled();
    expect(nextBtn).not.toBeDisabled();

    fireEvent.click(nextBtn);
    expect(onNextMock).toHaveBeenCalled();
  });
});
