import React from 'react';
import { useParams } from 'react-router-dom';
import GuardianPortal from '../../components/portal/GuardianPortal';
import { Santri, Transaction, InstitutionSettings, FinancialSettings, PendingRegistration } from '../../types';

interface SantriDetailPageProps {
  students: Santri[];
  transactions: Transaction[];
  institution: InstitutionSettings;
  financial: FinancialSettings;
  onAdminLoginClick: () => void;
  onRegister?: (reg: Omit<PendingRegistration, 'id' | 'timestamp' | 'status'>) => void;
  registrations?: PendingRegistration[];
}

export const SantriDetailPage: React.FC<SantriDetailPageProps> = (props) => {
  const { nis } = useParams<{ nis: string }>();
  return <GuardianPortal {...props} initialNis={nis} />;
};

export default SantriDetailPage;
