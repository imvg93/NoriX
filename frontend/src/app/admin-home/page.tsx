import AdminHome from '../../components/AdminHome';

export default function AdminHomePage() {
  // Mock user data for now - replace with real auth context later
  const mockUser = {
    name: 'Admin User',
    userType: 'admin'
  };

  return <AdminHome user={mockUser} />;
}
