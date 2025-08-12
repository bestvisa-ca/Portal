import SettingsForm from "../site-components/SettingsForm";
import { AppLayout } from '../site-components/AppLayout';

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
