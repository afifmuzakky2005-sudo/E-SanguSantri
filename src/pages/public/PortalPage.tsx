import React from 'react';
import GuardianPortal from '../../components/portal/GuardianPortal';
import { Santri, Transaction, InstitutionSettings, FinancialSettings, PendingRegistration } from '../../types';

interface PortalPageProps {
  students: Santri[];
  transactions: Transaction[];
  institution: InstitutionSettings;
  financial: FinancialSettings;
  onAdminLoginClick: () => void;
  onRegister?: (reg: Omit<PendingRegistration, 'id' | 'timestamp' | 'status'>) => void;
  registrations?: PendingRegistration[];
}

export const PortalPage: React.FC<PortalPageProps> = (props) => {
  return <GuardianPortal {...props} />;
};

export default PortalPage;
