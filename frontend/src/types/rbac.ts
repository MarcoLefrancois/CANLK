// CANLK-138: Role-Based Access Control (RBS) Types
export type UserRole = 
  | 'admin'
  | 'supervisor_qc'
  | 'supervisor_on'
  | 'technician'
  | 'sales'
  | 'viewer';

export interface RolePermissions {
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canApprove: boolean;
  canReject: boolean;
  canViewAll: boolean;
  canExport: boolean;
}

export interface UserRoleMapping {
  userId: string;
  email: string;
  roles: UserRole[];
  region: 'QC' | 'ON' | 'US';
  department: string;
  createdAt: Date;
  updatedAt: Date;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  admin: {
    canCreate: true,
    canRead: true,
    canUpdate: true,
    canDelete: true,
    canApprove: true,
    canReject: true,
    canViewAll: true,
    canExport: true,
  },
  supervisor_qc: {
    canCreate: true,
    canRead: true,
    canUpdate: true,
    canDelete: false,
    canApprove: true,
    canReject: true,
    canViewAll: true,
    canExport: true,
  },
  supervisor_on: {
    canCreate: true,
    canRead: true,
    canUpdate: true,
    canDelete: false,
    canApprove: true,
    canReject: true,
    canViewAll: true,
    canExport: true,
  },
  technician: {
    canCreate: false,
    canRead: true,
    canUpdate: true,
    canDelete: false,
    canApprove: false,
    canReject: false,
    canViewAll: false,
    canExport: false,
  },
  sales: {
    canCreate: true,
    canRead: true,
    canUpdate: false,
    canDelete: false,
    canApprove: false,
    canReject: false,
    canViewAll: false,
    canExport: true,
  },
  viewer: {
    canCreate: false,
    canRead: true,
    canUpdate: false,
    canDelete: false,
    canApprove: false,
    canReject: false,
    canViewAll: false,
    canExport: false,
  },
};

export const REGIONAL_ROLES: Record<string, UserRole[]> = {
  QC: ['supervisor_qc', 'technician', 'sales', 'viewer'],
  ON: ['supervisor_on', 'technician', 'sales', 'viewer'],
  US: ['supervisor_qc', 'technician', 'sales', 'viewer'],
};
