import { WithSidebarToolbarLayout } from '../site-layouts/WithSidebarToolbarLayout';
import PageTitle from '../site-components/ApplicantFinancial/PageTitle';
import PaymentsPanel from '../site-components/ApplicantFinancial/PaymentsPanel';
import { CreditCard, FileText, Wallet } from 'lucide-react';

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
          case 'payments':
            return <PaymentsPanel />;
          case 'invoices':
            return <div>Invoices list…</div>;
          case 'wallet':
            return <div>Wallet summary + ledger…</div>;
          default:
            return null;
        }
      }}
    />
  );
}
