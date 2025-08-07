import PractitionerServicesForm from "../site-forms/PractitionerServicesForm";
import { AppLayout } from '../site-forms/AppLayout';

const PractitionerServicesPage = () => {
  return (
    <div className="practitioner-services">
      <AppLayout>
        <PractitionerServicesForm />
      </AppLayout>
    </div>
  );
};

export default PractitionerServicesPage;