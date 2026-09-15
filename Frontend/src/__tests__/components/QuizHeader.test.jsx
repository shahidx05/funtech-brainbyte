import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import QuizHeader from '../../components/QuizHeader';

describe('QuizHeader Component Tests', () => {
  it('should render answered count, tab switch count, and timer', () => {
    render(
      <QuizHeader
        totalQuestions={25}
        answeredCount={10}
        timeLimitSeconds={600}
        tabSwitchCount={1}
        maxTabSwitches={3}
        onSubmitClick={vi.fn()}
      />
    );

    expect(screen.getByText(/Answered:/i)).toBeInTheDocument();
    expect(screen.getByText(/^10$/)).toBeInTheDocument();
    expect(screen.getByText(/25/)).toBeInTheDocument();
    expect(screen.getByText(/1 \/ 3/i)).toBeInTheDocument();
    expect(screen.getByText('10:00')).toBeInTheDocument();
  });

  it('should trigger onSubmitClick when Submit Quiz button is clicked', () => {
    const onSubmitMock = vi.fn();
    render(
      <QuizHeader
        totalQuestions={25}
        answeredCount={15}
        timeLimitSeconds={600}
        tabSwitchCount={0}
        maxTabSwitches={3}
        onSubmitClick={onSubmitMock}
      />
    );

    const submitBtn = screen.getByRole('button', { name: /Submit Quiz/i });
    fireEvent.click(submitBtn);

    expect(onSubmitMock).toHaveBeenCalled();
  });
});
