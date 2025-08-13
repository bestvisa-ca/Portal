import PageTitle from '../site-components/ApplicantFinancial/PageTitle';
import { WithSidebarToolbarLayout } from '../site-layouts/WithSidebarToolbarLayout';
import { Wallet, FileText, CreditCard } from 'lucide-react';

export default function ApplicantFinancialPage() {
  return (
    <WithSidebarToolbarLayout
      navbarVariant="applicant"
      sidebarVariant="applicant"
      pageTitle={
        <PageTitle
          title="Applicant Financial"
          subtitle="Wallet credits, invoices, and payments"
          badge="Financial Center"
        />
      }
      toolbarItems={[
        { key: 'payments', label: 'Payments', icon: CreditCard },
        { key: 'invoices', label: 'Invoices', icon: FileText },
        { key: 'wallet', label: 'Wallet', icon: Wallet },
      ]}
      defaultActiveKey="payments"
      renderContent={(activeKey) => {
        switch (activeKey) {
          case 'wallet':
            return <div>Wallet summary + ledger...</div>;
          case 'invoices':
            return <div>Invoices list...</div>;
          case 'payments':
            return <div>Payments history...</div>;
          default:
            return null;
        }
      }}
    />
  );
}
