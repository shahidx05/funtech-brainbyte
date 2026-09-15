import { test, expect } from '@playwright/test';

test.describe('FunTech BrainByte End-to-End System Tests', () => {
  const timestamp = Date.now();
  const testUser = {
    name: `Participant_${timestamp}`,
    email: `student_${timestamp}@college.edu`,
    rollNumber: `CS_${timestamp.toString().slice(-4)}`,
  };

  test('E2E Full Participant Lifecycle: Registration -> Rules -> Quiz -> Submit -> Results', async ({ page }) => {
    // 1. Visit landing page
    await page.goto('/');
    await expect(page.getByText('BrainByte Arena')).toBeVisible();

    // 2. Complete Registration Form
    await page.getByPlaceholder(/Alex Morgan/i).fill(testUser.name);
    await page.getByPlaceholder(/alex.m@college.edu/i).fill(testUser.email);
    await page.getByPlaceholder(/CS2026091/i).fill(testUser.rollNumber);
    await page.getByRole('button', { name: /Proceed to Rules/i }).click();

    // 3. Verify Rules Modal appears
    await expect(page.getByText(/Competition Guidelines/i)).toBeVisible();
    await expect(page.getByText(/Anti-Cheat Enforcement/i)).toBeVisible();

    // 4. Accept Rules and Launch Quiz
    await page.getByRole('button', { name: /I Understand & Agree to Rules/i }).click();

    // 5. Active Quiz Workspace
    await expect(page.getByText(/Tab Warnings:/i)).toBeVisible();
    await expect(page.getByText(/Question 1 of/i)).toBeVisible();

    // Select first option
    const firstOption = page.locator('.quiz-secure-container .group').first();
    await firstOption.click();

    // Mark question 1 for review
    await page.getByRole('button', { name: /Mark for Review/i }).click();
    await expect(page.getByText(/Review Marked/i)).toBeVisible();

    // Navigate to next question if available
    const nextBtn = page.getByRole('button', { name: /Next/i });
    if (await nextBtn.isEnabled()) {
      await nextBtn.click();
      await expect(page.getByText(/Question 2 of/i)).toBeVisible();
    }

    // 6. Submit Quiz
    await page.getByRole('button', { name: /Submit Quiz/i }).click();

    // 7. Verify Results Card Screen
    await expect(page.getByText(/Quiz Attempt Completed/i)).toBeVisible();
    await expect(page.getByText(testUser.name)).toBeVisible();
    await expect(page.getByText(/Your Total Score/i)).toBeVisible();
    await expect(page.getByText(/Accuracy/i)).toBeVisible();
  });

  test('E2E Anti-Cheat Enforcement: Tab Switches trigger Warnings and Lockout', async ({ page }) => {
    const antiCheatUser = {
      name: `Cheater_${timestamp}`,
      email: `cheater_${timestamp}@college.edu`,
    };

    // Register and start
    await page.goto('/');
    await page.getByPlaceholder(/Alex Morgan/i).fill(antiCheatUser.name);
    await page.getByPlaceholder(/alex.m@college.edu/i).fill(antiCheatUser.email);
    await page.getByRole('button', { name: /Proceed to Rules/i }).click();
    await page.getByRole('button', { name: /I Understand & Agree to Rules/i }).click();

    await expect(page.getByText(/Tab Warnings:/i)).toBeVisible();

    // Simulate 1st Tab Switch
    await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    await expect(page.getByText(/Tab Switch Detected/i)).toBeVisible();
    await page.getByRole('button', { name: /Return to Assessment/i }).click();

    // Simulate 2nd Tab Switch
    await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    await expect(page.getByText(/Tab Switch Detected/i)).toBeVisible();
    await page.getByRole('button', { name: /Return to Assessment/i }).click();

    // Simulate 3rd Tab Switch (Threshold Reached)
    await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    
    // Verifies Lockout screen or auto-submission triggers
    await expect(page.locator('body')).toContainText(/Assessment Locked|Session Disqualified|Quiz Attempt Completed/i);
  });

  test('E2E Admin Workflow: Login, Question Bank Inspection, Leaderboard', async ({ page }) => {
    await page.goto('/');
    
    // Toggle Admin Portal
    await page.getByRole('button', { name: /Admin Portal/i }).click();
    await expect(page.getByText(/Administrator Access/i)).toBeVisible();

    // Enter Admin Secret
    await page.getByPlaceholder(/Enter your secure admin key/i).fill('14c0f30cbc361e236d70f6f03d7c1de694b66be4a352b1b9faaa35c984e65257');
    await page.getByRole('button', { name: /Authenticate & Enter/i }).click();

    // Verify Admin Dashboard loads
    await expect(page.getByText(/Admin Control Center/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Add Question/i })).toBeVisible();
    await expect(page.getByText(/Leaderboard/i)).toBeVisible();
  });
});
