import { expect, test, type Page } from '@playwright/test';

const AUDIO_FILE = {
  name: 'etude.wav',
  mimeType: 'audio/wav',
  buffer: Buffer.from('UklGRiQAAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YQAAAAA=', 'base64'),
};

async function uploadLocalAudio(page: Page) {
  await page
    .locator('label:has-text("load a local audio or video file") input[type="file"]')
    .setInputFiles(AUDIO_FILE);
}

test.describe('critical practice session flows', () => {
  test('restores a local session after reload', async ({ page }) => {
    await page.goto('/');

    await uploadLocalAudio(page);
    await expect(page.getByRole('heading', { name: 'etude' })).toBeVisible();

    await page
      .locator('section')
      .filter({ has: page.getByRole('heading', { name: 'Markers & loop points' }) })
      .getByRole('button', { name: 'Add marker' })
      .click();
    await page
      .getByPlaceholder('Write general observations for the session, phrasing reminders, or passages to revisit...')
      .fill('Slow down the opening phrase.');
    await page.waitForTimeout(500);

    await page.reload();

    await expect(page.getByRole('heading', { name: 'etude' })).toBeVisible();
    await expect(
      page.getByPlaceholder('Write general observations for the session, phrasing reminders, or passages to revisit...'),
    ).toHaveValue('Slow down the opening phrase.');
    await expect(page.getByText('No markers yet. Add one at the current playback position.')).not.toBeVisible();
  });

  test('round-trips a full backup through the session drawer', async ({ page }) => {
    await page.goto('/');

    await uploadLocalAudio(page);
    await page
      .getByPlaceholder('Write general observations for the session, phrasing reminders, or passages to revisit...')
      .fill('Revisit the shift before the cadence.');
    await page.waitForTimeout(500);

    await page.getByRole('button', { name: 'Sessions' }).click();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download copy' }).click();
    await page.getByRole('button', { name: 'Full copy' }).click();
    const download = await downloadPromise;
    const backupPath = await download.path();

    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Clear all' }).click();
    await expect(page.getByRole('button', { name: 'Sessions' })).toBeVisible();

    await page.getByRole('button', { name: 'Sessions' }).click();
    await expect(page.getByText('No sessions yet. Load a source to start your first one.')).toBeVisible();
    await page.locator('aside input[type="file"][accept="application/json"]').setInputFiles(backupPath!);
    await expect(page.getByRole('heading', { name: 'Import sessions' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Import selected sessions' })).toBeEnabled();
    await page.getByRole('button', { name: 'Import selected sessions' }).click();

    await expect(page.getByText(/Local media is missing/)).not.toBeVisible();
    await expect(
      page.getByPlaceholder('Write general observations for the session, phrasing reminders, or passages to revisit...'),
    ).toHaveValue('Revisit the shift before the cadence.');
  });
});
