// Block 73: Custom Asset Categories - Engine

import { 
  AssetCategory, 
  AssetCategoryRule, 
  AssetCategoryAssignment, 
  CategoryTaxonomy,
  CategoryPerformanceMetrics,
  CategoryAnalytics,
  AssetClassificationSuggestion,
  CategoryValidationResult,
  CategoryBulkOperation,
  CategoryImportTemplate,
  CategoryFilter,
  AssetAssignmentFilter,
  CategoryHierarchyNode,
  CategoryCondition
} from '../types/customAssetCategories';

class CustomAssetCategoriesEngine {
  private static instance: CustomAssetCategoriesEngine;
  private apiUrl: string;

  private constructor() {
    this.apiUrl = '';
  }

  public static getInstance(): CustomAssetCategoriesEngine {
    if (!CustomAssetCategoriesEngine.instance) {
      CustomAssetCategoriesEngine.instance = new CustomAssetCategoriesEngine();
    }
    return CustomAssetCategoriesEngine.instance;
  }

  // Category Management
  async createCategory(categoryData: Omit<AssetCategory, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<AssetCategory> {
    try {
      const response = await fetch(`${this.apiUrl}/api/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(categoryData)
      });

      if (!response.ok) {
        throw new Error(`Failed to create category: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }

  async updateCategory(categoryId: string, updates: Partial<AssetCategory>): Promise<AssetCategory> {
    try {
      const response = await fetch(`${this.apiUrl}/api/categories/${categoryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error(`Failed to update category: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  }

  async deleteCategory(categoryId: string): Promise<void> {
    try {
      const response = await fetch(`${this.apiUrl}/api/categories/${categoryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to delete category: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }

  async getCategories(filter?: CategoryFilter, page = 1, pageSize = 50): Promise<{categories: AssetCategory[], total: number}> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString()
      });

      if (filter) {
        Object.entries(filter).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              params.append(key, value.join(','));
            } else {
              params.append(key, value.toString());
            }
          }
        });
      }

      const response = await fetch(`${this.apiUrl}/api/categories?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  async getCategoryById(categoryId: string): Promise<AssetCategory> {
    try {
      const response = await fetch(`${this.apiUrl}/api/categories/${categoryId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch category: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching category:', error);
      throw error;
    }
  }

  // Asset Assignment Management
  async assignAssetToCategory(
    assetSymbol: string, 
    categoryId: string, 
    assignmentData: Partial<AssetCategoryAssignment>
  ): Promise<AssetCategoryAssignment> {
    try {
      const payload = {
        assetSymbol,
        categoryId,
        ...assignmentData
      };

      const response = await fetch(`${this.apiUrl}/api/categories/assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Failed to assign asset: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error assigning asset to category:', error);
      throw error;
    }
  }

  async removeAssetFromCategory(assignmentId: string): Promise<void> {
    try {
      const response = await fetch(`${this.apiUrl}/api/categories/assignments/${assignmentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to remove assignment: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error removing asset assignment:', error);
      throw error;
    }
  }

  async bulkAssignAssets(assetSymbols: string[], categoryId: string): Promise<AssetCategoryAssignment[]> {
    try {
      const response = await fetch(`${this.apiUrl}/api/categories/assignments/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          assetSymbols,
          categoryId
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to bulk assign assets: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error bulk assigning assets:', error);
      throw error;
    }
  }

  async getAssetAssignments(filter?: AssetAssignmentFilter, page = 1, pageSize = 50): Promise<{assignments: AssetCategoryAssignment[], total: number}> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString()
      });

      if (filter) {
        Object.entries(filter).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              params.append(key, value.join(','));
            } else if (typeof value === 'object' && 'start' in value && 'end' in value) {
              params.append(`${key}_start`, value.start.toISOString());
              params.append(`${key}_end`, value.end.toISOString());
            } else {
              params.append(key, value.toString());
            }
          }
        });
      }

      const response = await fetch(`${this.apiUrl}/api/categories/assignments?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch assignments: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching assignments:', error);
      throw error;
    }
  }

  // Rule Management
  async createRule(ruleData: Omit<AssetCategoryRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<AssetCategoryRule> {
    try {
      const response = await fetch(`${this.apiUrl}/api/categories/rules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(ruleData)
      });

      if (!response.ok) {
        throw new Error(`Failed to create rule: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating rule:', error);
      throw error;
    }
  }

  async executeRule(ruleId: string): Promise<AssetCategoryAssignment[]> {
    try {
      const response = await fetch(`${this.apiUrl}/api/categories/rules/${ruleId}/execute`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to execute rule: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error executing rule:', error);
      throw error;
    }
  }

  async getRules(categoryId?: string): Promise<AssetCategoryRule[]> {
    try {
      const params = categoryId ? `?categoryId=${categoryId}` : '';
      const response = await fetch(`${this.apiUrl}/api/categories/rules${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch rules: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching rules:', error);
      throw error;
    }
  }

  // Asset Classification Suggestions
  async getSuggestions(assetSymbol: string): Promise<AssetClassificationSuggestion> {
    try {
      const response = await fetch(`${this.apiUrl}/api/categories/suggestions/${assetSymbol}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get suggestions: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting suggestions:', error);
      throw error;
    }
  }

  async acceptSuggestion(suggestionId: string, categoryId: string): Promise<AssetCategoryAssignment> {
    try {
      const response = await fetch(`${this.apiUrl}/api/categories/suggestions/${suggestionId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ categoryId })
      });

      if (!response.ok) {
        throw new Error(`Failed to accept suggestion: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error accepting suggestion:', error);
      throw error;
    }
  }

  // Category Validation
  async validateCategory(categoryId: string): Promise<CategoryValidationResult> {
    try {
      const response = await fetch(`${this.apiUrl}/api/categories/${categoryId}/validate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to validate category: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error validating category:', error);
      throw error;
    }
  }

  // Analytics and Performance
  async getCategoryAnalytics(categoryId: string, period?: { start: Date; end: Date }): Promise<CategoryAnalytics> {
    try {
      const params = new URLSearchParams();
      if (period) {
        params.append('start', period.start.toISOString());
        params.append('end', period.end.toISOString());
      }

      const response = await fetch(`${this.apiUrl}/api/categories/${categoryId}/analytics?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get analytics: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting category analytics:', error);
      throw error;
    }
  }

  async getCategoryPerformance(categoryId: string, period?: { start: Date; end: Date }): Promise<CategoryPerformanceMetrics> {
    try {
      const params = new URLSearchParams();
      if (period) {
        params.append('start', period.start.toISOString());
        params.append('end', period.end.toISOString());
      }

      const response = await fetch(`${this.apiUrl}/api/categories/${categoryId}/performance?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get performance: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting category performance:', error);
      throw error;
    }
  }

  // Hierarchy Operations
  async getCategoryHierarchy(rootCategoryId?: string): Promise<CategoryHierarchyNode[]> {
    try {
      const params = rootCategoryId ? `?rootId=${rootCategoryId}` : '';
      const response = await fetch(`${this.apiUrl}/api/categories/hierarchy${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get hierarchy: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting category hierarchy:', error);
      throw error;
    }
  }

  async moveCategory(categoryId: string, newParentId?: string): Promise<AssetCategory> {
    try {
      const response = await fetch(`${this.apiUrl}/api/categories/${categoryId}/move`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ newParentId })
      });

      if (!response.ok) {
        throw new Error(`Failed to move category: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error moving category:', error);
      throw error;
    }
  }

  // Bulk Operations
  async executeBulkOperation(operation: Omit<CategoryBulkOperation, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<CategoryBulkOperation> {
    try {
      const response = await fetch(`${this.apiUrl}/api/categories/bulk-operations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(operation)
      });

      if (!response.ok) {
        throw new Error(`Failed to execute bulk operation: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error executing bulk operation:', error);
      throw error;
    }
  }

  async getBulkOperationStatus(operationId: string): Promise<CategoryBulkOperation> {
    try {
      const response = await fetch(`${this.apiUrl}/api/categories/bulk-operations/${operationId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get operation status: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting bulk operation status:', error);
      throw error;
    }
  }

  // Import/Export
  async importCategories(template: CategoryImportTemplate, data: any[]): Promise<CategoryBulkOperation> {
    try {
      const response = await fetch(`${this.apiUrl}/api/categories/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          template,
          data
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to import categories: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error importing categories:', error);
      throw error;
    }
  }

  async exportCategories(categoryIds: string[], format: 'csv' | 'excel' | 'json'): Promise<Blob> {
    try {
      const response = await fetch(`${this.apiUrl}/api/categories/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          categoryIds,
          format
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to export categories: ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Error exporting categories:', error);
      throw error;
    }
  }

  // Taxonomy Management
  async createTaxonomy(taxonomyData: Omit<CategoryTaxonomy, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<CategoryTaxonomy> {
    try {
      const response = await fetch(`${this.apiUrl}/api/categories/taxonomies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(taxonomyData)
      });

      if (!response.ok) {
        throw new Error(`Failed to create taxonomy: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating taxonomy:', error);
      throw error;
    }
  }

  async getTaxonomies(): Promise<CategoryTaxonomy[]> {
    try {
      const response = await fetch(`${this.apiUrl}/api/categories/taxonomies`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch taxonomies: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching taxonomies:', error);
      throw error;
    }
  }

  // Utility Methods
  evaluateCondition(condition: CategoryCondition, assetData: any): boolean {
    const { field, operator, value } = condition;
    const fieldValue = this.getNestedValue(assetData, field);

    switch (operator) {
      case 'equals':
        return fieldValue === value;
      case 'contains':
        return typeof fieldValue === 'string' && fieldValue.toLowerCase().includes(value.toLowerCase());
      case 'startsWith':
        return typeof fieldValue === 'string' && fieldValue.toLowerCase().startsWith(value.toLowerCase());
      case 'endsWith':
        return typeof fieldValue === 'string' && fieldValue.toLowerCase().endsWith(value.toLowerCase());
      case 'regex':
        return new RegExp(value, 'i').test(fieldValue);
      case 'range':
        return Array.isArray(value) && fieldValue >= value[0] && fieldValue <= value[1];
      case 'in':
        return Array.isArray(value) && value.includes(fieldValue);
      case 'not_in':
        return Array.isArray(value) && !value.includes(fieldValue);
      default:
        return false;
    }
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  calculateCategoryPath(category: AssetCategory, allCategories: AssetCategory[]): string {
    const path: string[] = [category.name];
    let currentCategory = category;

    while (currentCategory.parentCategoryId) {
      const parent = allCategories.find(c => c.id === currentCategory.parentCategoryId);
      if (!parent) break;
      path.unshift(parent.name);
      currentCategory = parent;
    }

    return path.join('/');
  }

  validateCategoryHierarchy(categories: AssetCategory[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const categoryMap = new Map(categories.map(c => [c.id, c]));

    // Check for circular references
    for (const category of categories) {
      const visited = new Set<string>();
      let current = category;

      while (current.parentCategoryId) {
        if (visited.has(current.id)) {
          errors.push(`Circular reference detected for category: ${category.name}`);
          break;
        }
        visited.add(current.id);
        
        const parent = categoryMap.get(current.parentCategoryId);
        if (!parent) {
          errors.push(`Parent category not found for: ${current.name}`);
          break;
        }
        current = parent;
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default CustomAssetCategoriesEngine;  