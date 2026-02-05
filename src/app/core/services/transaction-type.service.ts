import { Injectable } from '@angular/core';
import { Observable, timer } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApiService } from './api.service';
import {
  TransactionType,
  CreateTransactionTypeRequest,
  UpdateTransactionTypeRequest,
  DeleteTransactionTypeRequest,
  TransactionTypeSearchCriteria,
  TransactionTypeListResponse,
  TransactionTypeUsageInfo,
  TransactionCategory,
  FraudRiskLevel
} from '../models/transaction-type.models';

@Injectable({
  providedIn: 'root'
})
export class TransactionTypeService {
  // Mock data for development
  private mockTransactionTypes: TransactionType[] = [
    {
      id: '1',
      code: 'PUR',
      description: 'Purchase',
      category: TransactionCategory.PURCHASE,
      isActive: true,
      requiresAuthorization: true,
      fraudRiskLevel: FraudRiskLevel.MEDIUM,
      createdDate: new Date('2024-01-01')
    },
    {
      id: '2',
      code: 'WDR',
      description: 'Cash Withdrawal',
      category: TransactionCategory.WITHDRAWAL,
      isActive: true,
      requiresAuthorization: true,
      fraudRiskLevel: FraudRiskLevel.HIGH,
      createdDate: new Date('2024-01-01')
    },
    {
      id: '3',
      code: 'PAY',
      description: 'Bill Payment',
      category: TransactionCategory.PAYMENT,
      isActive: true,
      requiresAuthorization: false,
      fraudRiskLevel: FraudRiskLevel.LOW,
      createdDate: new Date('2024-01-01')
    },
    {
      id: '4',
      code: 'REF',
      description: 'Refund',
      category: TransactionCategory.REFUND,
      isActive: true,
      requiresAuthorization: false,
      fraudRiskLevel: FraudRiskLevel.LOW,
      createdDate: new Date('2024-01-01')
    },
    {
      id: '5',
      code: 'TRF',
      description: 'Transfer',
      category: TransactionCategory.TRANSFER,
      isActive: true,
      requiresAuthorization: true,
      fraudRiskLevel: FraudRiskLevel.MEDIUM,
      createdDate: new Date('2024-01-01')
    },
    {
      id: '6',
      code: 'FEE',
      description: 'Service Fee',
      category: TransactionCategory.FEE,
      isActive: true,
      requiresAuthorization: false,
      fraudRiskLevel: FraudRiskLevel.LOW,
      createdDate: new Date('2024-01-01')
    },
    {
      id: '7',
      code: 'INT',
      description: 'Interest Charge',
      category: TransactionCategory.INTEREST,
      isActive: true,
      requiresAuthorization: false,
      fraudRiskLevel: FraudRiskLevel.LOW,
      createdDate: new Date('2024-01-01')
    },
    {
      id: '8',
      code: 'OLD',
      description: 'Old Transaction Type',
      category: TransactionCategory.OTHER,
      isActive: false,
      requiresAuthorization: false,
      fraudRiskLevel: FraudRiskLevel.LOW,
      createdDate: new Date('2023-01-01')
    }
  ];

  constructor(private apiService: ApiService) {}

  getTransactionTypes(criteria?: TransactionTypeSearchCriteria): Observable<TransactionTypeListResponse> {
    return timer(500).pipe(
      map(() => {
        let filteredTypes = [...this.mockTransactionTypes];

        if (criteria?.query) {
          const query = criteria.query.toLowerCase();
          filteredTypes = filteredTypes.filter(type =>
            type.code.toLowerCase().includes(query) ||
            type.description.toLowerCase().includes(query)
          );
        }

        if (criteria?.category) {
          filteredTypes = filteredTypes.filter(type => type.category === criteria.category);
        }

        if (criteria?.isActive !== undefined) {
          filteredTypes = filteredTypes.filter(type => type.isActive === criteria.isActive);
        }

        if (criteria?.fraudRiskLevel) {
          filteredTypes = filteredTypes.filter(type => type.fraudRiskLevel === criteria.fraudRiskLevel);
        }

        const page = criteria?.page || 1;
        const pageSize = criteria?.pageSize || 10;
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedTypes = filteredTypes.slice(startIndex, endIndex);

        return {
          transactionTypes: paginatedTypes,
          total: filteredTypes.length,
          page,
          pageSize
        };
      })
    );
  }

  getTransactionType(id: string): Observable<TransactionType> {
    return timer(300).pipe(
      map(() => {
        const type = this.mockTransactionTypes.find(t => t.id === id);
        if (!type) {
          throw new Error('Transaction type not found');
        }
        return type;
      })
    );
  }

  createTransactionType(request: CreateTransactionTypeRequest): Observable<TransactionType> {
    return timer(800).pipe(
      map(() => {
        if (this.mockTransactionTypes.some(t => t.code === request.code)) {
          throw new Error('Transaction type code already exists');
        }

        const newType: TransactionType = {
          id: (this.mockTransactionTypes.length + 1).toString(),
          code: request.code,
          description: request.description,
          category: request.category,
          isActive: request.isActive !== undefined ? request.isActive : true,
          requiresAuthorization: request.requiresAuthorization !== undefined ? request.requiresAuthorization : false,
          fraudRiskLevel: request.fraudRiskLevel || FraudRiskLevel.LOW,
          createdDate: new Date(),
          lastModified: new Date()
        };

        this.mockTransactionTypes.push(newType);
        return newType;
      })
    );
  }

  updateTransactionType(request: UpdateTransactionTypeRequest): Observable<TransactionType> {
    return timer(800).pipe(
      map(() => {
        const typeIndex = this.mockTransactionTypes.findIndex(t => t.id === request.id);
        if (typeIndex === -1) {
          throw new Error('Transaction type not found');
        }

        if (request.code && request.code !== this.mockTransactionTypes[typeIndex].code) {
          if (this.mockTransactionTypes.some(t => t.code === request.code)) {
            throw new Error('Transaction type code already exists');
          }
        }

        const updatedType: TransactionType = {
          ...this.mockTransactionTypes[typeIndex],
          ...(request.code && { code: request.code }),
          ...(request.description && { description: request.description }),
          ...(request.category && { category: request.category }),
          ...(request.isActive !== undefined && { isActive: request.isActive }),
          ...(request.requiresAuthorization !== undefined && { requiresAuthorization: request.requiresAuthorization }),
          ...(request.fraudRiskLevel && { fraudRiskLevel: request.fraudRiskLevel }),
          lastModified: new Date()
        };

        this.mockTransactionTypes[typeIndex] = updatedType;
        return updatedType;
      })
    );
  }

  deleteTransactionType(request: DeleteTransactionTypeRequest): Observable<void> {
    return timer(600).pipe(
      map(() => {
        const typeIndex = this.mockTransactionTypes.findIndex(t => t.id === request.id);
        if (typeIndex === -1) {
          throw new Error('Transaction type not found');
        }

        const usageInfo = this.getTransactionTypeUsageSync(request.id);
        if (!usageInfo.canDelete) {
          throw new Error(`Cannot delete transaction type. It is used by ${usageInfo.relatedTransactions} transactions.`);
        }

        this.mockTransactionTypes.splice(typeIndex, 1);
        return void 0;
      })
    );
  }

  getTransactionTypeUsage(id: string): Observable<TransactionTypeUsageInfo> {
    return timer(300).pipe(
      map(() => this.getTransactionTypeUsageSync(id))
    );
  }

  getAvailableCategories(): TransactionCategory[] {
    return Object.values(TransactionCategory);
  }

  getAvailableFraudRiskLevels(): FraudRiskLevel[] {
    return Object.values(FraudRiskLevel);
  }

  private getTransactionTypeUsageSync(id: string): TransactionTypeUsageInfo {
    const mockUsageCounts: Record<string, number> = {
      '1': 150,
      '2': 45,
      '3': 80,
      '4': 12,
      '5': 30,
      '6': 200,
      '7': 100,
      '8': 0
    };

    const usageCount = mockUsageCounts[id] || 0;

    return {
      transactionTypeId: id,
      usageCount,
      canDelete: usageCount === 0,
      relatedTransactions: usageCount
    };
  }
}
