import SettingsForm from "../site-forms/SettingsForm";
import { AppLayout } from '../site-forms/AppLayout';

const SettingsPage = () => {
  return (
    <div className="practitioner-settings">
      <AppLayout>
        <SettingsForm />
      </AppLayout>
    </div>
  );
};
//

export default SettingsPage;
