import { Page, Locator } from '@playwright/test';

/**
 * Page Object for Planejamento (Planning) wizard
 * URL: /planejamentos/novo
 * Steps: 1. Dados Gerais, 2. Habilidades BNCC OR Objetivos Custom, 3. Revisão
 */
export class PlanejamentoWizardPage {
  readonly page: Page;
  readonly turmaSelect: Locator;
  readonly bimestreSelect: Locator;
  readonly tituloInput: Locator;
  readonly descricaoTextarea: Locator;
  readonly nextButton: Locator;
  readonly submitButton: Locator;
  readonly addObjetivoButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.turmaSelect = page.locator('button[role="combobox"]').filter({ hasText: /Turma/ });
    this.bimestreSelect = page.locator('button[role="combobox"]').filter({ hasText: /Bimestre/ });
    this.tituloInput = page.locator('input[name="titulo"]');
    this.descricaoTextarea = page.locator('textarea[name="descricao"]');
    this.nextButton = page.locator('button').filter({ hasText: /Próximo/ });
    this.submitButton = page.locator('button').filter({ hasText: /Salvar|Criar Planejamento/ });
    this.addObjetivoButton = page.locator('button').filter({ hasText: /Adicionar Objetivo/ });
  }

  async navigate() {
    await this.page.goto('/planejamentos/novo');
  }

  /**
   * Step 1: Fill general planning data
   */
  async fillStep1(data: {
    turmaId: string;
    bimestre: string;
    titulo: string;
    descricao?: string;
  }) {
    // Select turma
    await this.turmaSelect.click();
    await this.page.locator(`[role="option"][data-value="${data.turmaId}"]`).click();

    // Select bimestre
    await this.bimestreSelect.click();
    await this.page.locator(`[role="option"][data-value="${data.bimestre}"]`).click();

    // Fill form
    await this.tituloInput.fill(data.titulo);
    if (data.descricao) {
      await this.descricaoTextarea.fill(data.descricao);
    }

    await this.nextButton.click();
  }

  /**
   * Step 2: Select BNCC habilidades (for BNCC turmas)
   */
  async selectHabilidadesBNCC(habilidadeCodes: string[]) {
    for (const code of habilidadeCodes) {
      const checkbox = this.page.locator(`input[type="checkbox"][value="${code}"]`);
      await checkbox.check();
    }
    await this.nextButton.click();
  }

  /**
   * Step 2/3: Add custom objetivos (for CUSTOM turmas)
   */
  async addCustomObjetivo(data: {
    codigo: string;
    descricao: string;
    nivelBloom: string;
    criterios?: string;
  }) {
    await this.addObjetivoButton.click();

    // Fill objetivo form in modal/inline
    await this.page.locator('input[name="codigo_objetivo"]').last().fill(data.codigo);
    await this.page.locator('textarea[name="descricao"]').last().fill(data.descricao);

    // Select Bloom level
    const bloomSelect = this.page.locator('button[role="combobox"]').filter({ hasText: /Bloom/ }).last();
    await bloomSelect.click();
    await this.page.locator(`[role="option"][data-value="${data.nivelBloom}"]`).click();

    if (data.criterios) {
      await this.page.locator('textarea[name="criterios_evidencia"]').last().fill(data.criterios);
    }

    // Confirm objetivo (if there's a save button in modal)
    const confirmButton = this.page.locator('button').filter({ hasText: /Confirmar|Adicionar/ }).last();
    if (await confirmButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await confirmButton.click();
    }
  }

  /**
   * Step 3: Review and submit
   */
  async submitPlanejamento() {
    // Navigate to review step if needed
    const reviewButton = this.nextButton;
    if (await reviewButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await reviewButton.click();
    }

    await this.submitButton.click();
  }

  async waitForSuccess() {
    await this.page.waitForURL(/\/planejamentos/, { timeout: 10000 });
  }
}
