import React, { useEffect, useState } from 'react';
import axiosInstance from '../../api/axiosInstance';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  createdAt?: string;
  enabled?: boolean;
}

const SkeletonRow = () => (
  <tr>
    <td className="px-5 py-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 admin-skeleton rounded-full flex-shrink-0" />
        <div className="h-3.5 admin-skeleton rounded w-28" />
      </div>
    </td>
    <td className="px-5 py-4"><div className="h-3.5 admin-skeleton rounded w-40" /></td>
    <td className="px-5 py-4"><div className="h-3.5 admin-skeleton rounded w-24" /></td>
    <td className="px-5 py-4"><div className="h-5 admin-skeleton rounded-full w-20" /></td>
    <td className="px-5 py-4"><div className="h-3.5 admin-skeleton rounded w-20" /></td>
    <td className="px-5 py-4"><div className="h-5 admin-skeleton rounded-full w-16" /></td>
  </tr>
);

export default function ManageUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const load = async (p = 0) => {
    setIsLoading(true);
    setError('');
    try {
      const res = await axiosInstance.get(`/api/admin/users?page=${p}&size=15`);
      const data = res.data.data;
      setUsers(data.content || []);
      setTotalPages(data.totalPages || 1);
      setTotalElements(data.totalElements || 0);
    } catch {
      setError('Failed to load users. Make sure the admin endpoint /api/admin/users is available.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(page); }, [page]);

  const filtered = users.filter(u =>
    (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase())
  );

  // Generate initials + gradient colors from name
  const getInitials = (name: string, email: string) =>
    (name || email || 'U').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  const avatarGradients = [
    'from-violet-500 to-purple-700',
    'from-blue-500 to-indigo-700',
    'from-emerald-500 to-teal-700',
    'from-orange-500 to-red-600',
    'from-pink-500 to-rose-700',
    'from-amber-500 to-yellow-600',
  ];
  const getGradient = (id: string) => avatarGradients[id.charCodeAt(0) % avatarGradients.length];

  return (
    <div className="space-y-5">

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Users</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {totalElements > 0 ? (
            <>
              <span className="inline-flex items-center bg-gray-100 text-gray-600 text-xs font-semibold px-2 py-0.5 rounded-full mr-1">{totalElements}</span>
              registered customers
            </>
          ) : 'View all registered customers'}
        </p>
      </div>

      {/* ── Search ───────────────────────────────────────────────────────── */}
      <div className="relative max-w-sm">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        <input
          type="text"
          placeholder="Search by name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 bg-white transition-all"
        />
      </div>

      {/* ── Table ────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {error ? (
          <div className="p-10 text-center">
            <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-red-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-700 mb-1">Failed to load users</p>
            <p className="text-xs text-gray-400">
              Requires admin endpoint: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-mono">/api/admin/users</code>
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto admin-sticky-head">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 border-b border-gray-100">
                  <th className="px-5 py-3.5 whitespace-nowrap">User</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">Email</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">Phone</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">Role</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">Joined</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-400">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                        </svg>
                      </div>
                      <p className="text-sm font-semibold text-gray-700">No users found</p>
                      <p className="text-xs text-gray-400 mt-1">{search ? `No results for "${search}"` : 'No users have registered yet.'}</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50/70 transition-colors">
                      {/* User */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${getGradient(user.id)} flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 shadow-sm`}>
                            {getInitials(user.name, user.email)}
                          </div>
                          <p className="font-semibold text-gray-900 text-[13px]">{user.name || '(No name)'}</p>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-5 py-4 text-gray-600 text-[13px]">{user.email}</td>

                      {/* Phone */}
                      <td className="px-5 py-4 text-gray-500 text-[13px]">{user.phone || <span className="text-gray-300">—</span>}</td>

                      {/* Role */}
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full ${
                          user.role === 'ROLE_ADMIN' || user.role === 'ADMIN'
                            ? 'bg-violet-50 text-violet-700 border border-violet-100'
                            : 'bg-gray-100 text-gray-600 border border-gray-200'
                        }`}>
                          {user.role === 'ROLE_ADMIN' || user.role === 'ADMIN' ? (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                                <path fillRule="evenodd" d="M16.403 12.652a3 3 0 0 0 0-5.304 3 3 0 0 0-3.75-3.751 3 3 0 0 0-5.305 0 3 3 0 0 0-3.751 3.75 3 3 0 0 0 0 5.305 3 3 0 0 0 3.75 3.751 3 3 0 0 0 5.305 0 3 3 0 0 0 3.751-3.75Zm-2.546-4.46a.75.75 0 0 0-1.214-.883l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
                              </svg>
                              ADMIN
                            </>
                          ) : 'CUSTOMER'}
                        </span>
                      </td>

                      {/* Joined */}
                      <td className="px-5 py-4 text-xs text-gray-400">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full ${
                          user.enabled !== false
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            : 'bg-red-50 text-red-600 border border-red-100'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${user.enabled !== false ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                          {user.enabled !== false ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Table footer */}
        {!isLoading && !error && filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-50 bg-gray-50/50">
            <p className="text-xs text-gray-400">
              Showing <span className="font-semibold text-gray-600">{filtered.length}</span> of <span className="font-semibold text-gray-600">{users.length}</span> users on this page
            </p>
          </div>
        )}
      </div>

      {/* ── Pagination ───────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={page === 0}
            onClick={() => setPage(p => p - 1)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Prev
          </button>
          <span className="text-sm font-semibold text-white bg-gray-900 px-4 py-2 rounded-xl min-w-[80px] text-center">
            {page + 1} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages - 1}
            onClick={() => setPage(p => p + 1)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            Next
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </div>
      )}

    </div>
  );
}
