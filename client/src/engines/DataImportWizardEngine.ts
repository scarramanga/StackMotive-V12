// Block 74: Data Import Wizard - Engine

import {
  DataImportWizard,
  ImportWizardStep,
  ImportSourceData,
  ProcessedData,
  ImportResults,
  ImportTemplate,
  DataSchema,
  ValidationRule,
  WizardFilter,
  TemplateFilter,
  ImportHistory,
  ValidatedRecord,
  TransformedRecord,
  MappedRecord,
  ImportError,
  ImportWarning,
  DataQuality,
  QualityIssue,
  WizardSettings,
  FileSource,
  ApiSource,
  DataMetadata,
  ImportProgressResponse,
  ImportDetail,
  ImportSummary,
  FieldMapping,
  FieldTransformation,
  SchemaField,
  ProcessingStatistics,
  AppliedTransformation,
  AppliedMapping,
  ValidationError,
  ValidationWarning,
  CustomValidator,
  CustomTransformer,
  ImportHook,
  TemplateReview,
  TemplateVersion,
  SchemaValidation,
  CrossFieldValidation,
  FieldValidation,
  StepValidation,
  SchemaRelationship,
  MappingRule,
  ClipboardSource,
  ManualSource,
  ApiAuthentication
} from '../types/dataImportWizard';

export class DataImportWizardEngine {
  private static instance: DataImportWizardEngine;
  private wizards: Map<string, DataImportWizard> = new Map();
  private templates: Map<string, ImportTemplate> = new Map();
  private importHistory: Map<string, ImportHistory> = new Map();
  private activeImports: Map<string, AbortController> = new Map();

  private constructor() {}

  static getInstance(): DataImportWizardEngine {
    if (!DataImportWizardEngine.instance) {
      DataImportWizardEngine.instance = new DataImportWizardEngine();
    }
    return DataImportWizardEngine.instance;
  }

  // Wizard Management
  async createWizard(config: Omit<DataImportWizard, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<DataImportWizard> {
    const wizard: DataImportWizard = {
      ...config,
      id: this.generateId(),
      userId: this.getCurrentUserId(),
      status: 'draft',
      progress: 0,
      completedSteps: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Initialize steps if not provided
    if (!wizard.steps.length) {
      wizard.steps = this.generateDefaultSteps(wizard.wizardType);
    }

    // Set current step to first step
    wizard.currentStepId = wizard.steps[0]?.id || '';

    this.wizards.set(wizard.id, wizard);
    return wizard;
  }

  async updateWizard(id: string, updates: Partial<DataImportWizard>): Promise<DataImportWizard> {
    const wizard = this.wizards.get(id);
    if (!wizard) throw new Error('Wizard not found');

    const updatedWizard = {
      ...wizard,
      ...updates,
      updatedAt: new Date()
    };

    this.wizards.set(id, updatedWizard);
    return updatedWizard;
  }

  async deleteWizard(id: string): Promise<void> {
    if (!this.wizards.has(id)) throw new Error('Wizard not found');
    
    // Cancel any active imports
    if (this.activeImports.has(id)) {
      this.activeImports.get(id)?.abort();
      this.activeImports.delete(id);
    }

    this.wizards.delete(id);
  }

  async cloneWizard(id: string): Promise<DataImportWizard> {
    const wizard = this.wizards.get(id);
    if (!wizard) throw new Error('Wizard not found');

    const cloned = {
      ...wizard,
      id: this.generateId(),
      name: `${wizard.name} (Copy)`,
      status: 'draft' as const,
      progress: 0,
      completedSteps: [],
      currentStepId: wizard.steps[0]?.id || '',
      startedAt: undefined,
      completedAt: undefined,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.wizards.set(cloned.id, cloned);
    return cloned;
  }

  // Step Navigation
  async goToStep(wizardId: string, stepId: string): Promise<void> {
    const wizard = this.wizards.get(wizardId);
    if (!wizard) throw new Error('Wizard not found');

    const step = wizard.steps.find(s => s.id === stepId);
    if (!step) throw new Error('Step not found');

    // Check dependencies
    const dependenciesCompleted = step.dependencies.every(dep => 
      wizard.completedSteps.includes(dep)
    );
    if (!dependenciesCompleted) {
      throw new Error('Step dependencies not completed');
    }

    await this.updateWizard(wizardId, { currentStepId: stepId });
  }

  async nextStep(wizardId: string): Promise<void> {
    const wizard = this.wizards.get(wizardId);
    if (!wizard) throw new Error('Wizard not found');

    const currentIndex = wizard.steps.findIndex(s => s.id === wizard.currentStepId);
    if (currentIndex === -1) throw new Error('Current step not found');

    const nextStep = wizard.steps[currentIndex + 1];
    if (!nextStep) throw new Error('No next step available');

    await this.goToStep(wizardId, nextStep.id);
  }

  async previousStep(wizardId: string): Promise<void> {
    const wizard = this.wizards.get(wizardId);
    if (!wizard) throw new Error('Wizard not found');

    const currentIndex = wizard.steps.findIndex(s => s.id === wizard.currentStepId);
    if (currentIndex <= 0) throw new Error('No previous step available');

    const previousStep = wizard.steps[currentIndex - 1];
    await this.goToStep(wizardId, previousStep.id);
  }

  async completeStep(wizardId: string, stepId: string, data: any): Promise<void> {
    const wizard = this.wizards.get(wizardId);
    if (!wizard) throw new Error('Wizard not found');

    const step = wizard.steps.find(s => s.id === stepId);
    if (!step) throw new Error('Step not found');

    // Validate step data
    const validation = await this.validateStepData(step, data);
    if (!validation.isValid) {
      throw new Error(`Step validation failed: ${validation.errors.join(', ')}`);
    }

    // Mark step as completed
    const completedSteps = [...wizard.completedSteps];
    if (!completedSteps.includes(stepId)) {
      completedSteps.push(stepId);
    }

    // Update step completion status
    const updatedSteps = wizard.steps.map(s => 
      s.id === stepId ? { ...s, isCompleted: true } : s
    );

    // Calculate progress
    const progress = Math.round((completedSteps.length / wizard.steps.length) * 100);

    await this.updateWizard(wizardId, {
      completedSteps,
      steps: updatedSteps,
      progress
    });
  }

  // Data Processing
  async uploadFile(file: File): Promise<ImportSourceData> {
    const fileSource: FileSource = {
      file,
      fileName: file.name,
      fileSize: file.size,
      fileType: this.getFileType(file.name),
      mimeType: file.type,
      hasHeaders: true, // Default assumption
      encoding: 'utf-8'
    };

    // Parse file content
    const rawData = await this.parseFileContent(file);
    const metadata = await this.analyzeDataMetadata(rawData);

    return {
      dataType: 'file',
      source: fileSource,
      rawData,
      metadata
    };
  }

  async validateData(data: any[], schema: DataSchema): Promise<ValidatedRecord[]> {
    const validatedRecords: ValidatedRecord[] = [];

    for (let i = 0; i < data.length; i++) {
      const record = data[i];
      const errors: ValidationError[] = [];
      const warnings: ValidationWarning[] = [];

      // Validate each field
      for (const field of schema.fields) {
        const value = record[field.name];
        const fieldErrors = await this.validateField(field, value, record);
        errors.push(...fieldErrors);
      }

      // Cross-field validation
      for (const crossValidation of schema.validation.crossFieldValidation) {
        const crossFieldError = await this.validateCrossFields(crossValidation, record);
        if (crossFieldError) {
          errors.push(crossFieldError);
        }
      }

      validatedRecords.push({
        rowIndex: i,
        data: record,
        isValid: errors.length === 0,
        errors,
        warnings
      });
    }

    return validatedRecords;
  }

  async transformData(data: ValidatedRecord[], transformations: FieldTransformation[]): Promise<TransformedRecord[]> {
    const transformedRecords: TransformedRecord[] = [];

    for (const record of data) {
      const transformedData = { ...record.data };
      const appliedTransformations: AppliedTransformation[] = [];

      for (const transformation of transformations) {
        const result = await this.applyTransformation(record.data, transformation);
        appliedTransformations.push(result);
        
        if (result.success) {
          transformedData[transformation.parameters?.targetField || result.field] = result.transformedValue;
        }
      }

      transformedRecords.push({
        rowIndex: record.rowIndex,
        originalData: record.data,
        transformedData,
        transformations: appliedTransformations
      });
    }

    return transformedRecords;
  }

  async mapData(data: TransformedRecord[], mappings: FieldMapping[]): Promise<MappedRecord[]> {
    const mappedRecords: MappedRecord[] = [];

    for (const record of data) {
      const targetData: Record<string, any> = {};
      const appliedMappings: AppliedMapping[] = [];

      for (const mapping of mappings) {
        const result = await this.applyMapping(record.transformedData, mapping);
        appliedMappings.push(result);
        
        if (result.success) {
          targetData[mapping.targetField] = result.targetValue;
        }
      }

      mappedRecords.push({
        rowIndex: record.rowIndex,
        sourceData: record.transformedData,
        targetData,
        mappings: appliedMappings
      });
    }

    return mappedRecords;
  }

  // Import Execution
  async executeImport(wizardId: string): Promise<ImportResults> {
    const wizard = this.wizards.get(wizardId);
    if (!wizard) throw new Error('Wizard not found');

    const abortController = new AbortController();
    this.activeImports.set(wizardId, abortController);

    try {
      await this.updateWizard(wizardId, { 
        status: 'in_progress',
        startedAt: new Date()
      });

      const startTime = Date.now();
      const results: ImportDetail[] = [];
      const errors: ImportError[] = [];
      const warnings: ImportWarning[] = [];

      // Process mapped data
      const mappedData = wizard.processedData.mappedData;
      let successCount = 0;
      let failureCount = 0;
      let skippedCount = 0;

      for (const record of mappedData) {
        if (abortController.signal.aborted) {
          throw new Error('Import cancelled');
        }

        try {
          const result = await this.importRecord(record, wizard.settings);
          results.push(result);
          
          if (result.status === 'success') {
            successCount++;
          } else if (result.status === 'failed') {
            failureCount++;
          } else if (result.status === 'skipped') {
            skippedCount++;
          }
        } catch (error) {
          failureCount++;
          errors.push({
            type: 'database',
            rowIndex: record.rowIndex,
            message: error instanceof Error ? error.message : 'Unknown error',
            errorCode: 'IMPORT_FAILED'
          });
        }
      }

      const endTime = Date.now();
      const importTime = endTime - startTime;

      const summary: ImportSummary = {
        totalRecords: mappedData.length,
        successfulImports: successCount,
        failedImports: failureCount,
        skippedRecords: skippedCount,
        duplicatesHandled: 0,
        newRecordsCreated: successCount,
        existingRecordsUpdated: 0,
        importTime
      };

      const importResults: ImportResults = {
        status: failureCount === 0 ? 'completed' : 'partial',
        summary,
        details: results,
        errors,
        warnings
      };

      await this.updateWizard(wizardId, {
        status: 'completed',
        completedAt: new Date(),
        importResults
      });

      // Record import history
      await this.recordImportHistory(wizardId, importResults);

      return importResults;
    } catch (error) {
      await this.updateWizard(wizardId, {
        status: 'failed',
        completedAt: new Date()
      });
      throw error;
    } finally {
      this.activeImports.delete(wizardId);
    }
  }

  async cancelImport(wizardId: string): Promise<void> {
    const abortController = this.activeImports.get(wizardId);
    if (abortController) {
      abortController.abort();
      await this.updateWizard(wizardId, { status: 'cancelled' });
    }
  }

  async getImportProgress(wizardId: string): Promise<ImportProgressResponse> {
    const wizard = this.wizards.get(wizardId);
    if (!wizard) throw new Error('Wizard not found');

    return {
      wizardId,
      currentStep: wizard.currentStepId,
      progress: wizard.progress,
      status: wizard.status,
      errors: wizard.importResults?.errors || [],
      warnings: wizard.importResults?.warnings || []
    };
  }

  // Template Management
  async createTemplate(template: Omit<ImportTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<ImportTemplate> {
    const newTemplate: ImportTemplate = {
      ...template,
      id: this.generateId(),
      userId: this.getCurrentUserId(),
      usageCount: 0,
      rating: 0,
      reviews: [],
      changelog: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.templates.set(newTemplate.id, newTemplate);
    return newTemplate;
  }

  async updateTemplate(id: string, updates: Partial<ImportTemplate>): Promise<ImportTemplate> {
    const template = this.templates.get(id);
    if (!template) throw new Error('Template not found');

    const updatedTemplate = {
      ...template,
      ...updates,
      updatedAt: new Date()
    };

    this.templates.set(id, updatedTemplate);
    return updatedTemplate;
  }

  async deleteTemplate(id: string): Promise<void> {
    if (!this.templates.has(id)) throw new Error('Template not found');
    this.templates.delete(id);
  }

  async useTemplate(templateId: string): Promise<DataImportWizard> {
    const template = this.templates.get(templateId);
    if (!template) throw new Error('Template not found');

    const wizard = await this.createWizard({
      name: `Import from ${template.name}`,
      wizardType: template.templateType,
      templateId,
      steps: [...template.steps],
      settings: { ...template.settings },
      sourceData: {} as ImportSourceData,
      processedData: {} as ProcessedData,
      importResults: {} as ImportResults,
      currentStepId: template.steps[0]?.id || ''
    });

    // Increment template usage count
    await this.updateTemplate(templateId, {
      usageCount: template.usageCount + 1
    });

    return wizard;
  }

  // Schema Operations
  async detectSchema(data: any[]): Promise<DataSchema> {
    if (!data.length) throw new Error('No data provided');

    const sample = data[0];
    const fields: SchemaField[] = [];

    for (const [key, value] of Object.entries(sample)) {
      const field: SchemaField = {
        name: key,
        displayName: this.formatFieldName(key),
        type: this.detectFieldType(value),
        isRequired: true,
        isUnique: false,
        validation: this.generateFieldValidation(key, value),
        transformation: { type: 'none' },
        mapping: {
          sourceField: key,
          targetField: key,
          mappingType: 'direct'
        }
      };

      fields.push(field);
    }

    return {
      fields,
      relationships: [],
      validation: {
        rules: [],
        crossFieldValidation: []
      }
    };
  }

  async validateSchema(schema: DataSchema): Promise<SchemaValidation> {
    const rules: ValidationRule[] = [];
    const crossFieldValidation: CrossFieldValidation[] = [];

    // Validate field definitions
    for (const field of schema.fields) {
      if (!field.name) {
        rules.push({
          id: this.generateId(),
          type: 'required',
          field: 'name',
          condition: 'not_empty',
          message: 'Field name is required',
          severity: 'error'
        });
      }

      if (!field.type) {
        rules.push({
          id: this.generateId(),
          type: 'required',
          field: 'type',
          condition: 'not_empty',
          message: 'Field type is required',
          severity: 'error'
        });
      }
    }

    return {
      rules,
      crossFieldValidation
    };
  }

  // Filtering and Search
  filterWizards(wizards: DataImportWizard[], filter: WizardFilter): DataImportWizard[] {
    return wizards.filter(wizard => {
      if (filter.status && !filter.status.includes(wizard.status)) return false;
      if (filter.wizardType && !filter.wizardType.includes(wizard.wizardType)) return false;
      if (filter.templateId && wizard.templateId !== filter.templateId) return false;
      if (filter.hasErrors && !wizard.importResults?.errors?.length) return false;
      if (filter.dateRange) {
        const createdAt = new Date(wizard.createdAt);
        if (createdAt < filter.dateRange.start || createdAt > filter.dateRange.end) return false;
      }
      if (filter.searchTerm) {
        const searchLower = filter.searchTerm.toLowerCase();
        const nameMatch = wizard.name.toLowerCase().includes(searchLower);
        const descriptionMatch = wizard.description?.toLowerCase().includes(searchLower);
        if (!nameMatch && !descriptionMatch) return false;
      }
      return true;
    });
  }

  filterTemplates(templates: ImportTemplate[], filter: TemplateFilter): ImportTemplate[] {
    return templates.filter(template => {
      if (filter.templateType && !filter.templateType.includes(template.templateType)) return false;
      if (filter.category && !filter.category.includes(template.category)) return false;
      if (filter.isPublic !== undefined && template.isPublic !== filter.isPublic) return false;
      if (filter.isSystem !== undefined && template.isSystem !== filter.isSystem) return false;
      if (filter.rating && template.rating < filter.rating) return false;
      if (filter.tags && !filter.tags.some(tag => template.tags.includes(tag))) return false;
      if (filter.searchTerm) {
        const searchLower = filter.searchTerm.toLowerCase();
        const nameMatch = template.name.toLowerCase().includes(searchLower);
        const descriptionMatch = template.description?.toLowerCase().includes(searchLower);
        if (!nameMatch && !descriptionMatch) return false;
      }
      return true;
    });
  }

  // Utility Methods
  private generateId(): string {
    return `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCurrentUserId(): string {
    return 'current_user_id'; // In real app, get from auth context
  }

  private generateDefaultSteps(wizardType: string): ImportWizardStep[] {
    const baseSteps: ImportWizardStep[] = [
      {
        id: 'source',
        name: 'source',
        title: 'Select Data Source',
        description: 'Choose your data source and upload file',
        order: 1,
        isRequired: true,
        isCompleted: false,
        canSkip: false,
        estimatedTime: 5,
        dependencies: [],
        validation: { rules: [], isValid: false, errors: [], warnings: [] }
      },
      {
        id: 'mapping',
        name: 'mapping',
        title: 'Map Fields',
        description: 'Map your data fields to target fields',
        order: 2,
        isRequired: true,
        isCompleted: false,
        canSkip: false,
        estimatedTime: 10,
        dependencies: ['source'],
        validation: { rules: [], isValid: false, errors: [], warnings: [] }
      },
      {
        id: 'validation',
        name: 'validation',
        title: 'Validate Data',
        description: 'Review and validate your data',
        order: 3,
        isRequired: true,
        isCompleted: false,
        canSkip: false,
        estimatedTime: 5,
        dependencies: ['mapping'],
        validation: { rules: [], isValid: false, errors: [], warnings: [] }
      },
      {
        id: 'import',
        name: 'import',
        title: 'Import Data',
        description: 'Execute the data import',
        order: 4,
        isRequired: true,
        isCompleted: false,
        canSkip: false,
        estimatedTime: 15,
        dependencies: ['validation'],
        validation: { rules: [], isValid: false, errors: [], warnings: [] }
      }
    ];

    return baseSteps;
  }

  private async validateStepData(step: ImportWizardStep, data: any): Promise<StepValidation> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Step-specific validation logic would go here
    switch (step.name) {
      case 'source':
        if (!data.sourceData) errors.push('Source data is required');
        break;
      case 'mapping':
        if (!data.mappings || !data.mappings.length) errors.push('Field mappings are required');
        break;
      case 'validation':
        if (!data.validatedData) errors.push('Data validation is required');
        break;
      case 'import':
        if (!data.importReady) errors.push('Import confirmation is required');
        break;
    }

    return {
      rules: step.validation.rules,
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private async parseFileContent(file: File): Promise<any[]> {
    const text = await file.text();
    const extension = file.name.split('.').pop()?.toLowerCase();

    switch (extension) {
      case 'csv':
        return this.parseCSV(text);
      case 'json':
        return JSON.parse(text);
      case 'txt':
        return text.split('\n').map(line => ({ text: line }));
      default:
        throw new Error(`Unsupported file type: ${extension}`);
    }
  }

  private parseCSV(text: string): any[] {
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const data: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row: any = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      
      data.push(row);
    }

    return data;
  }

  private async analyzeDataMetadata(data: any[]): Promise<DataMetadata> {
    const totalRows = data.length;
    const firstRow = data[0] || {};
    const columnNames = Object.keys(firstRow);
    const totalColumns = columnNames.length;

    const columnTypes: Record<string, string> = {};
    columnNames.forEach(col => {
      columnTypes[col] = this.detectFieldType(firstRow[col]);
    });

    const sampleData = data.slice(0, 5).map(row => 
      columnNames.map(col => row[col])
    );

    const duplicateRows = this.countDuplicates(data);
    const emptyRows = data.filter(row => 
      Object.values(row).every(val => !val || val === '')
    ).length;

    const dataQuality = await this.assessDataQuality(data);

    return {
      totalRows,
      totalColumns,
      columnNames,
      columnTypes,
      sampleData,
      duplicateRows,
      emptyRows,
      dataQuality
    };
  }

  private async assessDataQuality(data: any[]): Promise<DataQuality> {
    const issues: QualityIssue[] = [];
    let totalFields = 0;
    let completeFields = 0;
    let validFields = 0;
    let consistentFields = 0;

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      for (const [field, value] of Object.entries(row)) {
        totalFields++;
        
        if (value !== null && value !== undefined && value !== '') {
          completeFields++;
          
          // Basic validity check
          if (this.isValidValue(value)) {
            validFields++;
          } else {
            issues.push({
              type: 'invalid_format',
              field,
              rowIndex: i,
              description: `Invalid value: ${value}`,
              severity: 'medium'
            });
          }
        } else {
          issues.push({
            type: 'missing_data',
            field,
            rowIndex: i,
            description: 'Missing value',
            severity: 'low'
          });
        }
      }
    }

    return {
      completeness: totalFields > 0 ? (completeFields / totalFields) * 100 : 0,
      accuracy: totalFields > 0 ? (validFields / totalFields) * 100 : 0,
      consistency: totalFields > 0 ? (consistentFields / totalFields) * 100 : 0,
      validity: totalFields > 0 ? (validFields / totalFields) * 100 : 0,
      issues
    };
  }

  private getFileType(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'csv': return 'csv';
      case 'json': return 'json';
      case 'xlsx': case 'xls': return 'excel';
      case 'txt': return 'text';
      default: return 'unknown';
    }
  }

  private detectFieldType(value: any): 'string' | 'number' | 'date' | 'boolean' | 'email' | 'url' | 'phone' | 'currency' {
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'string') {
      if (value.includes('@')) return 'email';
      if (value.startsWith('http')) return 'url';
      if (/^\d{4}-\d{2}-\d{2}/.test(value)) return 'date';
      if (/^\$\d/.test(value)) return 'currency';
      if (/^\d{10}$/.test(value)) return 'phone';
      if (!isNaN(Number(value))) return 'number';
    }
    return 'string';
  }

  private formatFieldName(name: string): string {
    return name.charAt(0).toUpperCase() + name.slice(1).replace(/[_-]/g, ' ');
  }

  private generateFieldValidation(name: string, value: any): FieldValidation {
    const validation: FieldValidation = {};
    
    if (typeof value === 'string') {
      validation.min = 1;
      validation.max = 1000;
    } else if (typeof value === 'number') {
      validation.min = 0;
    }
    
    return validation;
  }

  private async validateField(field: SchemaField, value: any, record: any): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];
    
    // Required field validation
    if (field.isRequired && (value === null || value === undefined || value === '')) {
      errors.push({
        field: field.name,
        message: `${field.displayName} is required`,
        value
      });
    }
    
    // Type validation
    if (value && !this.isValidType(value, field.type)) {
      errors.push({
        field: field.name,
        message: `${field.displayName} must be of type ${field.type}`,
        value,
        expectedType: field.type
      });
    }
    
    return errors;
  }

  private async validateCrossFields(validation: CrossFieldValidation, record: any): Promise<ValidationError | null> {
    // Simplified cross-field validation
    return null;
  }

  private async applyTransformation(data: any, transformation: FieldTransformation): Promise<AppliedTransformation> {
    const field = transformation.parameters?.field || 'unknown';
    const originalValue = data[field];
    let transformedValue = originalValue;
    let success = true;
    let error: string | undefined;

    try {
      switch (transformation.type) {
        case 'uppercase':
          transformedValue = String(originalValue).toUpperCase();
          break;
        case 'lowercase':
          transformedValue = String(originalValue).toLowerCase();
          break;
        case 'trim':
          transformedValue = String(originalValue).trim();
          break;
        default:
          transformedValue = originalValue;
      }
    } catch (e) {
      success = false;
      error = e instanceof Error ? e.message : 'Transformation failed';
    }

    return {
      field,
      type: transformation.type,
      originalValue,
      transformedValue,
      success,
      error
    };
  }

  private async applyMapping(data: any, mapping: FieldMapping): Promise<AppliedMapping> {
    const sourceValue = data[mapping.sourceField];
    let targetValue = sourceValue;
    let success = true;
    let error: string | undefined;

    try {
      switch (mapping.mappingType) {
        case 'direct':
          targetValue = sourceValue;
          break;
        case 'transform':
          // Apply transformation logic
          break;
        case 'lookup':
          // Apply lookup logic
          break;
        default:
          targetValue = sourceValue;
      }
    } catch (e) {
      success = false;
      error = e instanceof Error ? e.message : 'Mapping failed';
    }

    return {
      sourceField: mapping.sourceField,
      targetField: mapping.targetField,
      sourceValue,
      targetValue,
      mappingType: mapping.mappingType,
      success,
      error
    };
  }

  private async importRecord(record: MappedRecord, settings: WizardSettings): Promise<ImportDetail> {
    // Simulate record import
    const success = Math.random() > 0.1; // 90% success rate
    
    return {
      rowIndex: record.rowIndex,
      status: success ? 'success' : 'failed',
      recordId: success ? this.generateId() : undefined,
      data: record.targetData,
      message: success ? 'Record imported successfully' : 'Import failed'
    };
  }

  private async recordImportHistory(wizardId: string, results: ImportResults): Promise<void> {
    const wizard = this.wizards.get(wizardId);
    if (!wizard) return;

    const history: ImportHistory = {
      id: this.generateId(),
      userId: wizard.userId,
      wizardId,
      importType: wizard.wizardType,
      sourceFile: wizard.sourceData.dataType === 'file' ? 
        (wizard.sourceData.source as FileSource).fileName : undefined,
      recordsProcessed: results.summary.totalRecords,
      recordsImported: results.summary.successfulImports,
      success: results.status === 'completed',
      duration: results.summary.importTime,
      errorCount: results.errors.length,
      warningCount: results.warnings.length,
      metadata: {},
      createdAt: new Date()
    };

    this.importHistory.set(history.id, history);
  }

  private countDuplicates(data: any[]): number {
    const seen = new Set();
    let duplicates = 0;
    
    for (const item of data) {
      const key = JSON.stringify(item);
      if (seen.has(key)) {
        duplicates++;
      } else {
        seen.add(key);
      }
    }
    
    return duplicates;
  }

  private isValidValue(value: any): boolean {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string' && value.trim() === '') return false;
    return true;
  }

  private isValidType(value: any, type: string): boolean {
    switch (type) {
      case 'string': return typeof value === 'string';
      case 'number': return typeof value === 'number' || !isNaN(Number(value));
      case 'boolean': return typeof value === 'boolean';
      case 'date': return !isNaN(Date.parse(value));
      case 'email': return typeof value === 'string' && /\S+@\S+\.\S+/.test(value);
      case 'url': return typeof value === 'string' && /^https?:\/\//.test(value);
      default: return true;
    }
  }

  // Data Access Methods
  getWizards(): DataImportWizard[] {
    return Array.from(this.wizards.values());
  }

  getWizard(id: string): DataImportWizard | undefined {
    return this.wizards.get(id);
  }

  getTemplates(): ImportTemplate[] {
    return Array.from(this.templates.values());
  }

  getTemplate(id: string): ImportTemplate | undefined {
    return this.templates.get(id);
  }

  getImportHistory(): ImportHistory[] {
    return Array.from(this.importHistory.values());
  }
} 