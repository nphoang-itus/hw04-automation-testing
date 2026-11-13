import { Page, Locator, expect } from '@playwright/test';

// Locators live here only (DRY). Prefer role/label/test-id; if the DOM offers none,
// use the most stable alternative and explain why in a comment.
export class {{PAGE_CLASS}} {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/'); // TODO: feature URL
    // await expect(<key element>).toBeVisible();
  }
}
