/**
 * E2E Test: Museum Check-in Photo Upload → Game Trigger Flow
 * 
 * Tests the complete user flow:
 * 1. Navigate to museum check-in page
 * 2. Open first task modal
 * 3. Select and upload a photo
 * 4. Complete the task immediately
 * 5. Verify fireworks celebration appears
 * 6. Verify game overlay is shown (if puzzle game enabled)
 * 
 * Regression test for: Photo upload race condition where clicking
 * "Complete" before FileReader finishes would not trigger the game.
 */

import { test, expect } from '@playwright/test';

test.describe('Check-in Photo Upload and Game Trigger', () => {
    test.beforeEach(async ({ page }) => {
        // Clear localStorage before each test
        await page.goto('about:blank');
        await page.evaluate(() => localStorage.clear());
    });

    test('should trigger game after uploading photo and completing task', async ({ page }) => {
        // Navigate to check-in page for National Natural History Museum
        await page.goto('/museum-checkin.html?museum=beijing-natural-history-museum&age=7-12');

        // Wait for page to load and tasks to render
        await page.waitForSelector('.task-card', { timeout: 10000 });

        // Ensure puzzle game is enabled (set in localStorage)
        await page.evaluate(() => {
            localStorage.setItem('puzzleGameEnabled', 'true');
        });

        // Click the first task card to open modal
        const firstTaskCard = page.locator('.task-card').first();
        await firstTaskCard.click();

        // Wait for task modal to appear
        await page.waitForSelector('#taskModal.show', { timeout: 5000 });

        // Verify modal is visible
        await expect(page.locator('#taskModal')).toHaveClass(/show/);

        // Prepare to upload a photo
        // Create a simple test image file
        const photoInput = page.locator('#taskPhotoInput');
        
        // Create a simple 1x1 pixel PNG (base64)
        const base64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
        const buffer = Buffer.from(base64Image, 'base64');
        
        // Set the file input with a test image
        await photoInput.setInputFiles({
            name: 'test-photo.png',
            mimeType: 'image/png',
            buffer: buffer
        });

        // Wait a brief moment for file processing to start (but not complete)
        await page.waitForTimeout(100);

        // Immediately click "Complete Task" button (simulating race condition)
        const completeButton = page.locator('#completeButton');
        await completeButton.click();

        // Wait for modal to close
        await page.waitForSelector('#taskModal:not(.show)', { timeout: 5000 });

        // Verify fireworks canvas becomes visible (celebration triggered)
        const fireworksCanvas = page.locator('#fireworksCanvas');
        await expect(fireworksCanvas).toBeVisible({ timeout: 3000 });

        // Verify game overlay appears (puzzle game)
        // The game overlay should appear after ~800ms delay
        const gameOverlay = page.locator('#puzzleGameOverlay, #mazeGameOverlay, #shootingGameOverlay, #spaceInvadersGameOverlay, #tankBattleGameOverlay, #minesweeperGameOverlay, #petAdventureGameOverlay, #snakeInlineOverlay');
        await expect(gameOverlay.first()).toBeVisible({ timeout: 2000 });

        // Verify photo was saved to localStorage
        const savedPhoto = await page.evaluate(() => {
            const photos = JSON.parse(localStorage.getItem('museumPhotos_beijing-natural-history-museum_7-12') || '{}');
            return photos[0]; // First task index is 0
        });
        expect(savedPhoto).toBeTruthy();
        expect(savedPhoto).toContain('data:image/');

        // Verify task was marked as completed
        const completedTasks = await page.evaluate(() => {
            const checklists = JSON.parse(localStorage.getItem('museumChecklists') || '{}');
            return checklists['beijing-natural-history-museum-child-7-12'] || [];
        });
        expect(completedTasks).toContain(0); // First task completed

        // Verify progress counter updated
        const progressText = page.locator('#completedCount');
        await expect(progressText).toHaveText('1');
    });

    test('should not trigger game if puzzle game setting is disabled', async ({ page }) => {
        // Navigate to check-in page
        await page.goto('/museum-checkin.html?museum=beijing-natural-history-museum&age=7-12');

        // Wait for page to load
        await page.waitForSelector('.task-card', { timeout: 10000 });

        // Disable puzzle game
        await page.evaluate(() => {
            localStorage.setItem('puzzleGameEnabled', 'false');
        });

        // Open first task modal
        await page.locator('.task-card').first().click();
        await page.waitForSelector('#taskModal.show', { timeout: 5000 });

        // Upload photo
        const photoInput = page.locator('#taskPhotoInput');
        const base64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
        const buffer = Buffer.from(base64Image, 'base64');
        await photoInput.setInputFiles({
            name: 'test-photo.png',
            mimeType: 'image/png',
            buffer: buffer
        });

        await page.waitForTimeout(100);

        // Complete task
        await page.locator('#completeButton').click();

        // Wait for modal to close
        await page.waitForSelector('#taskModal:not(.show)', { timeout: 5000 });

        // Verify fireworks still appears
        await expect(page.locator('#fireworksCanvas')).toBeVisible({ timeout: 3000 });

        // Verify NO game overlay appears (setting disabled)
        await page.waitForTimeout(1500); // Wait past the game trigger delay
        const gameOverlay = page.locator('#puzzleGameOverlay, #mazeGameOverlay, #shootingGameOverlay');
        await expect(gameOverlay.first()).not.toBeVisible();
    });

    test('should handle completing task without photo (no game triggered)', async ({ page }) => {
        // Navigate to check-in page
        await page.goto('/museum-checkin.html?museum=beijing-natural-history-museum&age=7-12');

        // Wait for page to load
        await page.waitForSelector('.task-card', { timeout: 10000 });

        // Enable puzzle game
        await page.evaluate(() => {
            localStorage.setItem('puzzleGameEnabled', 'true');
        });

        // Open first task modal
        await page.locator('.task-card').first().click();
        await page.waitForSelector('#taskModal.show', { timeout: 5000 });

        // Complete task WITHOUT uploading photo
        await page.locator('#completeButton').click();

        // Wait for modal to close
        await page.waitForSelector('#taskModal:not(.show)', { timeout: 5000 });

        // Verify fireworks appears
        await expect(page.locator('#fireworksCanvas')).toBeVisible({ timeout: 3000 });

        // Verify NO game appears (no photo = no game)
        await page.waitForTimeout(1500);
        const gameOverlay = page.locator('#puzzleGameOverlay, #mazeGameOverlay, #shootingGameOverlay');
        await expect(gameOverlay.first()).not.toBeVisible();
    });
});
