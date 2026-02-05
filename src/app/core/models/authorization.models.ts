export enum AuthorizationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  DENIED = 'denied',
  EXPIRED = 'expired'
}

export interface Authorization {
  id: string;
  transactionId: string;
  cardId: string;
  amount: number;
  merchantName: string;
  requestDate: Date;
  status: AuthorizationStatus;
  riskScore: number;
  fraudIndicators: string[];
  // Additional fields for comprehensive authorization management
  accountId?: string;
  cardNumber?: string;
  transactionType?: string;
  description?: string;
  expirationDate?: Date;
  processedDate?: Date;
  processedBy?: string;
  denialReason?: string;
  auditTrail?: AuthorizationAuditEntry[];
}

export interface AuthorizationAuditEntry {
  id: string;
  authorizationId: string;
  action: AuthorizationAction;
  performedBy: string;
  performedAt: Date;
  previousStatus?: AuthorizationStatus;
  newStatus: AuthorizationStatus;
  reason?: string;
  notes?: string;
}

export enum AuthorizationAction {
  CREATED = 'created',
  APPROVED = 'approved',
  DENIED = 'denied',
  EXPIRED = 'expired',
  REVIEWED = 'reviewed',
  ESCALATED = 'escalated'
}

export interface AuthorizationFilter {
  status?: AuthorizationStatus;
  dateFrom?: Date;
  dateTo?: Date;
  amountMin?: number;
  amountMax?: number;
  riskScoreMin?: number;
  riskScoreMax?: number;
  cardId?: string;
  merchantName?: string;
  fraudOnly?: boolean;
}

export interface AuthorizationDecisionRequest {
  authorizationId: string;
  decision: 'approve' | 'deny';
  reason?: string;
  notes?: string;
}

export interface AuthorizationSummary {
  totalPending: number;
  totalApproved: number;
  totalDenied: number;
  totalExpired: number;
  highRiskCount: number;
  averageProcessingTime: number;
}

export interface CreateAuthorizationRequest {
  transactionId: string;
  cardId: string;
  amount: number;
  merchantName: string;
  transactionType: string;
  description?: string;
  riskScore?: number;
  fraudIndicators?: string[];
}