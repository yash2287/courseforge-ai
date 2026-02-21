'use client';

import { createContext, useContext } from 'react';

interface OrgMembership {
  _id: any;
  orgId: any;
  userId: string;
  email: string;
  name?: string;
  role: 'owner' | 'admin' | 'manager' | 'learner';
  provisionedVia?: 'invite' | 'sso' | 'manual';
  joinedAt: number;
}

interface Organization {
  _id: any;
  name: string;
  slug: string;
  industry?: string;
  createdBy: string;
  ssoConfig?: {
    enabled: boolean;
    provider?: string;
    defaultRole: 'admin' | 'manager' | 'learner';
    autoProvision: boolean;
    defaultDepartmentId?: any;
  };
  createdAt: number;
  updatedAt: number;
}

interface OrgContextType {
  org: Organization | null;
  membership: OrgMembership | null;
  isAdmin: boolean;
  isManager: boolean;
  isLoading: boolean;
}

const OrgContext = createContext<OrgContextType>({
  org: null,
  membership: null,
  isAdmin: false,
  isManager: false,
  isLoading: true,
});

export function OrgProvider({
  children,
  org,
  membership,
  isLoading = false,
}: {
  children: React.ReactNode;
  org: Organization | null;
  membership: OrgMembership | null;
  isLoading?: boolean;
}) {
  const role = membership?.role;
  const isAdmin = role === 'owner' || role === 'admin';
  const isManager = isAdmin || role === 'manager';

  return (
    <OrgContext.Provider
      value={{ org, membership, isAdmin, isManager, isLoading }}
    >
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg() {
  return useContext(OrgContext);
}
