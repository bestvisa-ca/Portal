import { useState } from 'react';
import PractitionerServicesForm from "../site-forms/PractitionerServicesForm"; // Adjust path if needed
import { AppLayout } from '../site-forms/AppLayout'; // Adjust path if needed

const PractitionerServicesPage = () => {
  // 1. Add state to manage the active tab, defaulting to 'general'.
  const [activeTab, setActiveTab] = useState('general');

  // 2. Create a handler to update the state when a tab is clicked.
  const handleTabChange = (tabName: string) => {
    setActiveTab(tabName);
  };

  return (
    <div className="practitioner-services">
      <AppLayout>
        {/* 3. Pass the state and the handler down as props.
          Now this page is "controlling" the form component.
        */}
        <PractitionerServicesForm
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
      </AppLayout>
    </div>
  );
};

export default PractitionerServicesPage;
