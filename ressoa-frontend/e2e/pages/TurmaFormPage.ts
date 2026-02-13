import { Page, Locator } from '@playwright/test';

/**
 * Page Object for Turma (Class) creation form
 * URL: /turmas/nova
 */
export class TurmaFormPage {
  readonly page: Page;
  readonly nomeInput: Locator;
  readonly tipoEnsinoSelect: Locator;
  readonly curriculoSelect: Locator;
  readonly contextoPedagogicoTextarea: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nomeInput = page.locator('input[name="nome"]');
    this.tipoEnsinoSelect = page.locator('button[role="combobox"]').filter({ hasText: /Tipo de Ensino|LIVRE|FUNDAMENTAL/ });
    this.curriculoSelect = page.locator('button[role="combobox"]').filter({ hasText: /Currículo|BNCC|CUSTOM/ });
    this.contextoPedagogicoTextarea = page.locator('textarea[name="contexto_pedagogico"]');
    this.submitButton = page.locator('button[type="submit"]');
  }

  async navigate() {
    await this.page.goto('/turmas/nova');
  }

  async fillForm(data: {
    nome: string;
    tipoEnsino: string;
    curriculo: string;
    contextoPedagogico?: string;
  }) {
    await this.nomeInput.fill(data.nome);

    // Select Tipo de Ensino (Radix Select)
    await this.tipoEnsinoSelect.click();
    await this.page.locator(`[role="option"][data-value="${data.tipoEnsino}"]`).click();

    // Select Currículo (Radix Select)
    await this.curriculoSelect.click();
    await this.page.locator(`[role="option"][data-value="${data.curriculo}"]`).click();

    // Fill context if CUSTOM
    if (data.contextoPedagogico && data.curriculo === 'CUSTOM') {
      await this.contextoPedagogicoTextarea.fill(data.contextoPedagogico);
    }
  }

  async submit() {
    await this.submitButton.click();
  }

  async waitForSuccess() {
    // Wait for redirect to turma details page or success message
    await this.page.waitForURL(/\/turmas\/[a-z0-9-]+/, { timeout: 10000 });
  }
}
