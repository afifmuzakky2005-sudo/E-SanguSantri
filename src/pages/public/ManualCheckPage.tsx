import React from 'react';
import GuardianPortal from '../../components/portal/GuardianPortal';
import { Santri, Transaction, InstitutionSettings, FinancialSettings, PendingRegistration } from '../../types';

interface ManualCheckPageProps {
  students: Santri[];
  transactions: Transaction[];
  institution: InstitutionSettings;
  financial: FinancialSettings;
  onAdminLoginClick: () => void;
  onRegister?: (reg: Omit<PendingRegistration, 'id' | 'timestamp' | 'status'>) => void;
  registrations?: PendingRegistration[];
}

export const ManualCheckPage: React.FC<ManualCheckPageProps> = (props) => {
  return <GuardianPortal {...props} />;
};

export default ManualCheckPage;
