/**
 * File System Error Classes
 *
 * Errors related to file system operations
 */

import { KigumiError, ErrorCode, type ErrorSuggestion } from './base.js';

/**
 * File not found error
 */
export class FileNotFoundError extends KigumiError {
  constructor(filePath: string) {
    const suggestions: ErrorSuggestion[] = [
      {
        title: 'Check the file path',
        steps: [
          `File not found: ${filePath}`,
          'Verify the path is correct',
          'Check that the file exists',
          "Ensure you're in the correct directory",
        ],
      },
    ];

    super(
      ErrorCode.FILE_NOT_FOUND,
      `File not found: ${filePath}`,
      { filePath },
      suggestions
    );
  }
}

/**
 * File read error
 */
export class FileReadError extends KigumiError {
  constructor(filePath: string, cause: Error) {
    const suggestions: ErrorSuggestion[] = [
      {
        title: 'Fix file permissions',
        steps: [
          `Failed to read file: ${filePath}`,
          'Check file permissions',
          'Ensure you have read access',
          'Verify the file is not locked by another process',
        ],
      },
    ];

    super(
      ErrorCode.FILE_READ_ERROR,
      `Failed to read file: ${filePath}`,
      { filePath, error: cause.message },
      suggestions,
      cause
    );
  }
}

/**
 * File write error
 */
export class FileWriteError extends KigumiError {
  constructor(filePath: string, cause: Error) {
    const suggestions: ErrorSuggestion[] = [
      {
        title: 'Fix file permissions',
        steps: [
          `Failed to write file: ${filePath}`,
          'Check directory permissions',
          'Ensure you have write access',
          'Verify the directory exists',
          'Check available disk space',
        ],
      },
    ];

    super(
      ErrorCode.FILE_WRITE_ERROR,
      `Failed to write file: ${filePath}`,
      { filePath, error: cause.message },
      suggestions,
      cause
    );
  }
}

/**
 * Directory not found error
 */
export class DirectoryNotFoundError extends KigumiError {
  constructor(dirPath: string) {
    const suggestions: ErrorSuggestion[] = [
      {
        title: 'Create the directory',
        steps: [
          `Directory not found: ${dirPath}`,
          'Create the directory manually',
          'Or run the command again - it may create it automatically',
        ],
      },
    ];

    super(
      ErrorCode.DIRECTORY_NOT_FOUND,
      `Directory not found: ${dirPath}`,
      { dirPath },
      suggestions
    );
  }
}

/**
 * Permission denied error
 */
export class PermissionDeniedError extends KigumiError {
  constructor(path: string, operation: 'read' | 'write' | 'execute') {
    const suggestions: ErrorSuggestion[] = [
      {
        title: 'Fix permissions',
        steps: [
          `Permission denied for ${operation} operation: ${path}`,
          `Grant ${operation} permissions to the file/directory`,
          'On Unix: chmod +r (read) or +w (write) or +x (execute)',
          'Or run the command with appropriate privileges',
        ],
      },
    ];

    super(
      ErrorCode.PERMISSION_DENIED,
      `Permission denied: ${path}`,
      { path, operation },
      suggestions
    );
  }
}

/**
 * Component already exists error
 */
export class ComponentExistsError extends KigumiError {
  constructor(componentName: string, componentPath: string) {
    const suggestions: ErrorSuggestion[] = [
      {
        title: 'Use the --force flag',
        steps: [
          `Component "${componentName}" already exists at: ${componentPath}`,
          'To replace it, run the command with --force flag',
          'This will overwrite existing files',
        ],
      },
      {
        title: 'Or remove the existing component',
        steps: [
          'Delete the existing component directory',
          'Then run the command again',
        ],
      },
    ];

    super(
      ErrorCode.FILE_WRITE_ERROR,
      `Component already exists: ${componentName}`,
      { componentName, componentPath },
      suggestions
    );
  }
}
