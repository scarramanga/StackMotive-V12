import { VAULT_TEMPLATES, VaultTemplate } from '../modules/vault/VaultTemplates';

export function getTemplateById(id: string): VaultTemplate | undefined {
  return VAULT_TEMPLATES.find(t => t.id === id);
}

export function getAllTemplates(): VaultTemplate[] {
  return VAULT_TEMPLATES;
} 