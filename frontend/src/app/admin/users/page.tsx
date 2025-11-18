'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle,
  Loader2,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  XCircle,
} from 'lucide-react';
import { apiService } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';

type UserType = 'student' | 'employer' | 'admin';

interface AdminUser {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
  userType?: UserType;
  role?: 'user' | 'admin';
  status?: string;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  kycStatus?: string;
  isActive?: boolean;
  createdAt?: string;
}

const userTypeFilters: Array<{ value: 'all' | UserType; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'student', label: 'Students' },
  { value: 'employer', label: 'Employers' },
  { value: 'admin', label: 'Admins' },
];

const statusFilters: Array<{ value: 'all' | 'active' | 'inactive'; label: string }> = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const roleOptions: Array<{ value: UserType; label: string }> = [
  { value: 'student', label: 'Student' },
  { value: 'employer', label: 'Employer' },
  { value: 'admin', label: 'Admin' },
];

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filters, setFilters] = useState<{ userType: 'all' | UserType; status: 'all' | 'active' | 'inactive' }>({
    userType: 'all',
    status: 'all',
  });
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.getAllUsersAdmin({
        page: 1,
        limit: 100,
        userType: filters.userType === 'all' ? undefined : filters.userType,
        status: filters.status,
        search: searchTerm || undefined,
      });
      const payload = (response as any)?.data ?? response;
      const list: AdminUser[] = payload?.users ?? payload?.data?.users ?? [];
      setUsers(list);
    } catch (error) {
      console.error('❌ Failed to fetch users:', error);
      alert('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filters.status, filters.userType, searchTerm]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const pendingCount = useMemo(
    () => users.filter((u) => (u.kycStatus || u.approvalStatus) === 'pending').length,
    [users]
  );

  const performUserAction = useCallback(
    async (
      userId: string,
      actionKey: string,
      action: () => Promise<unknown>,
      successMessage: string,
      errorMessage: string,
      optimisticUpdate?: () => void
    ) => {
      const key = `${actionKey}-${userId}`;
      setActionLoading(key);
      try {
        await action();
        if (optimisticUpdate) {
          optimisticUpdate();
        }
        await fetchUsers();
        alert(successMessage);
      } catch (error) {
        console.error(errorMessage, error);
        alert(errorMessage);
      } finally {
        setActionLoading(null);
      }
    },
    [fetchUsers]
  );

  const handleChangeRole = async (userId: string, nextRole: UserType) => {
    if (!nextRole) return;
    await performUserAction(
      userId,
      'role',
      () => apiService.updateUserRoleAdmin(userId, nextRole),
      'Role updated successfully.',
      'Unable to update role. Please try again.',
      () =>
        setUsers((prev) =>
          prev.map((u) =>
            u._id === userId ? { ...u, userType: nextRole, role: nextRole === 'admin' ? 'admin' : 'user' } : u
          )
        )
    );
  };

  const handleDeleteUser = async (userId: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this user? This will deactivate their account.');
    if (!confirmed) return;
    await performUserAction(
      userId,
      'delete',
      () => apiService.adminDeleteUser(userId),
      'User deleted successfully.',
      'Unable to delete user. Please try again.',
      () => setUsers((prev) => prev.filter((u) => u._id !== userId))
    );
  };

  const handleApproveUser = async (userId: string) => {
    await performUserAction(
      userId,
      'approve',
      () => apiService.approveUser(userId),
      'User approved successfully.',
      'Unable to approve user. Please try again.'
    );
  };

  const handleRejectUser = async (userId: string) => {
    const reason = window.prompt('Enter a reason for rejection:') || '';
    if (!reason.trim()) {
      alert('Rejection reason is required.');
      return;
    }
    await performUserAction(
      userId,
      'reject',
      () => apiService.rejectUser(userId, reason.trim()),
      'User rejected successfully.',
      'Unable to reject user. Please try again.'
    );
  };

  const handleSuspendUser = async (userId: string) => {
    await performUserAction(
      userId,
      'suspend',
      () => apiService.suspendUser(userId),
      'User suspended successfully.',
      'Unable to suspend user. Please try again.'
    );
  };

  const handleActivateUser = async (userId: string) => {
    await performUserAction(
      userId,
      'activate',
      () => apiService.activateUser(userId),
      'User activated successfully.',
      'Unable to activate user. Please try again.'
    );
  };

  const isBusy = (key: string) => actionLoading === key;

  const renderStatusBadge = (user: AdminUser) => {
    const approval = user.kycStatus || user.approvalStatus;
    if (approval === 'approved') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
          <CheckCircle className="h-3 w-3" />
          Approved
        </span>
      );
    }
    if (approval === 'rejected') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
          <XCircle className="h-3 w-3" />
          Rejected
        </span>
      );
    }
    if (approval === 'pending') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-700">
          <Shield className="h-3 w-3" />
          Pending
        </span>
      );
    }
    return (
      <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
        {user.isActive ? 'Active' : 'Inactive'}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Admin Control</p>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-sm text-gray-600">Change roles, suspend accounts, or delete users in one place.</p>
          </div>
          <button
            onClick={fetchUsers}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </button>
        </div>

        <div className="mt-6 rounded-2xl bg-white p-4 shadow-sm sm:p-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl bg-indigo-50 p-4">
              <p className="text-sm font-medium text-indigo-600">Total Users</p>
              <p className="mt-1 text-3xl font-semibold text-indigo-900">{users.length}</p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-4">
              <p className="text-sm font-medium text-emerald-600">Active</p>
              <p className="mt-1 text-3xl font-semibold text-emerald-900">
                {users.filter((u) => u.isActive !== false).length}
              </p>
            </div>
            <div className="rounded-xl bg-amber-50 p-4">
              <p className="text-sm font-medium text-amber-600">Pending</p>
              <p className="mt-1 text-3xl font-semibold text-amber-900">{pendingCount}</p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex flex-1 items-center rounded-xl border border-gray-200 bg-white px-3">
              <Search className="h-4 w-4 text-gray-400" />
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    setSearchTerm(searchInput.trim());
                  }
                }}
                placeholder="Search by name, email, or phone"
                className="w-full border-0 bg-transparent px-3 py-2 text-sm text-gray-700 focus:outline-none"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={filters.userType}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, userType: event.target.value as 'all' | UserType }))
                }
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none"
              >
                {userTypeFilters.map((filter) => (
                  <option key={filter.value} value={filter.value}>
                    {filter.label}
                  </option>
                ))}
              </select>
              <select
                value={filters.status}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, status: event.target.value as 'all' | 'active' | 'inactive' }))
                }
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none"
              >
                {statusFilters.map((filter) => (
                  <option key={filter.value} value={filter.value}>
                    {filter.label}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setSearchTerm(searchInput.trim())}
                className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black"
              >
                Apply
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-white p-4 shadow-sm sm:p-6">
          {loading ? (
            <div className="flex min-h-[200px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-gray-700">
                <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3 text-left">User</th>
                    <th className="px-4 py-3 text-left">Role</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Created</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-500">
                        No users found for the selected filters.
                      </td>
                    </tr>
                  )}
                  {users.map((user) => {
                    const status = user.kycStatus || user.approvalStatus;
                    const isPending = status === 'pending';
                    const isSuspended = user.status === 'suspended' || user.isActive === false;
                    const isSelf = currentUser?._id === user._id;
                    return (
                      <tr key={user._id} className="border-b border-gray-100 hover:bg-gray-50/60">
                        <td className="px-4 py-4">
                          <div className="font-semibold text-gray-900">{user.name || 'Unnamed'}</div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                          <div className="text-xs text-gray-400">{user.phone || '-'}</div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-xs font-medium text-gray-500">User Type</div>
                          <div className="mt-1 flex items-center gap-2">
                            <select
                              disabled={isSelf || isBusy(`role-${user._id}`)}
                              value={user.userType ?? 'student'}
                              onChange={(event) => handleChangeRole(user._id, event.target.value as UserType)}
                              className="rounded-lg border border-gray-200 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100"
                            >
                              {roleOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                            {isBusy(`role-${user._id}`) && <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />}
                          </div>
                        </td>
                        <td className="px-4 py-4">{renderStatusBadge(user)}</td>
                        <td className="px-4 py-4 text-xs text-gray-500">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            {isPending && (
                              <>
                                <button
                                  onClick={() => handleApproveUser(user._id)}
                                  disabled={isBusy(`approve-${user._id}`)}
                                  className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                                >
                                  {isBusy(`approve-${user._id}`) ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <CheckCircle className="h-3 w-3" />
                                  )}
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleRejectUser(user._id)}
                                  disabled={isBusy(`reject-${user._id}`)}
                                  className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                                >
                                  {isBusy(`reject-${user._id}`) ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <XCircle className="h-3 w-3" />
                                  )}
                                  Reject
                                </button>
                              </>
                            )}
                            {!isPending && (
                              <>
                                {isSuspended ? (
                                  <button
                                    onClick={() => handleActivateUser(user._id)}
                                    disabled={isBusy(`activate-${user._id}`)}
                                    className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                                  >
                                    {isBusy(`activate-${user._id}`) ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <PlayCircle className="h-3 w-3" />
                                    )}
                                    Activate
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleSuspendUser(user._id)}
                                    disabled={isBusy(`suspend-${user._id}`)}
                                    className="inline-flex items-center gap-1 rounded-lg bg-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-800 hover:bg-gray-300 disabled:opacity-50"
                                  >
                                    {isBusy(`suspend-${user._id}`) ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <PauseCircle className="h-3 w-3" />
                                    )}
                                    Suspend
                                  </button>
                                )}
                              </>
                            )}
                            <button
                              onClick={() => handleDeleteUser(user._id)}
                              disabled={isSelf || isBusy(`delete-${user._id}`)}
                              className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-red-600 shadow-sm ring-1 ring-red-100 hover:bg-red-50 disabled:opacity-50"
                            >
                              {isBusy(`delete-${user._id}`) ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Trash2 className="h-3 w-3" />
                              )}
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Tips</h2>
          <ul className="mt-3 text-sm text-gray-600">
            <li>• Changing a user to Admin instantly grants access to all admin tools.</li>
            <li>• Delete is a soft-delete; you can re-activate from the dashboard later.</li>
            <li>• You cannot remove your own admin access for safety reasons.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}


