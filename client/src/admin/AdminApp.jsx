import { authClient } from '../auth-client.js';
import AdminLogin from './AdminLogin.jsx';
import AdminDashboard from './AdminDashboard.jsx';

export default function AdminApp() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <div className="admin-splash">
        <div className="spinner" />
      </div>
    );
  }

  if (!session) {
    return <AdminLogin />;
  }

  return <AdminDashboard user={session.user} />;
}
