import { BrowserRouter } from 'react-router-dom';
// import OnboardingServicesPage from './site-components/OnboardingServicesPage';
// import PractitionerServicesForm from './site-forms/PractitionerServicesForm';
// import PractitionerServicesPage from './site-pages/PractitionerServicesPage';
// import SettingsPage from './site-pages/SettingsPage';
// import TestStripePaymentPage from './site-pages/TestStripePaymentPage';
import LiveStripePaymentPage from './site-pages/LiveStripePaymentPage';
// import ApplicantFinancialPage from './site-pages/ApplicantFinancialPage';

function App() {

  return (
    <div>
      <BrowserRouter>
        <LiveStripePaymentPage />
      </BrowserRouter>

      {/* <ApplicantFinancialPage /> */}
      {/* <OnboardingServicesPage  /> */}
      {/* <PractitionerServicesPage /> */}

    </div>
  )
}

export default App
