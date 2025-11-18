'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import socketService from '../../../services/socketService';
import apiService from '../../../services/api';

type PendingItem = {
  _id: string;
  name: string;
  phone: string;
  college: string;
  idPreview?: string | null;
  videoPreview?: string | null;
  ocr_conf?: number | null;
  face_score?: number | null;
  submittedAt?: string;
  trial_shift_status?: string;
  rejection_code?: string;
  admin_notes?: string;
  duplicate_flag?: boolean;
};

function authHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export default function AdminVerificationPage() {
  const [items, setItems] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);
  const [modal, setModal] = useState<{ open: boolean; item?: PendingItem }>({ open: false });

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    setError(null);
    try {
      const resp = await apiService.getPendingVerifications(p, 10);
      const data = (resp as any)?.data ?? resp;
      setItems(data.items);
      setPage(data.pagination.current);
      setTotalPages(data.pagination.pages);
    } catch (e: any) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(1);
    const onAdminUpdate = () => load(page);
    socketService.on('verification:pending', onAdminUpdate);
    socketService.on('verification:updated', onAdminUpdate);
    return () => {
      socketService.off('verification:pending', onAdminUpdate);
      socketService.off('verification:updated', onAdminUpdate);
    };
  }, [load, page]);

  const act = useCallback(
    async (studentId: string, action: 'approve' | 'reject' | 'require_trial', body: any = {}) => {
      setActionBusyId(studentId);
      try {
        await apiService.updateStudentVerification(studentId, action, body);
        await load(page);
      } catch (e: any) {
        setError(e.message || 'Action failed');
      } finally {
        setActionBusyId(null);
        setModal({ open: false });
      }
    },
    [load, page]
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="text-2xl font-semibold text-gray-900">Verification Review</h1>
      <p className="mt-1 text-sm text-gray-600">New submissions appear instantly. Review ID, video, and auto-checks.</p>

      {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}

      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-left text-gray-600">
            <tr>
              <th className="px-2 py-2">Name</th>
              <th className="px-2 py-2">Phone</th>
              <th className="px-2 py-2">College</th>
              <th className="px-2 py-2">ID</th>
              <th className="px-2 py-2">Video</th>
              <th className="px-2 py-2">OCR</th>
              <th className="px-2 py-2">Face</th>
              <th className="px-2 py-2">Submitted</th>
              <th className="px-2 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it._id} className="odd:bg-white even:bg-gray-50">
                <td className="px-2 py-2">{it.name}</td>
                <td className="px-2 py-2">{it.phone}</td>
                <td className="px-2 py-2">{it.college}</td>
                <td className="px-2 py-2">
                  {it.idPreview ? <img src={it.idPreview} alt="ID" className="h-12 w-20 object-cover rounded" /> : '—'}
                </td>
                <td className="px-2 py-2">
                  {it.videoPreview ? (
                    <video src={it.videoPreview} className="h-12 w-20 rounded" />
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-2 py-2">{it.ocr_conf ?? '—'}</td>
                <td className="px-2 py-2">{it.face_score ?? '—'}</td>
                <td className="px-2 py-2">{it.submittedAt ? new Date(it.submittedAt).toLocaleString() : '—'}</td>
                <td className="px-2 py-2">
                  <div className="flex flex-wrap gap-2">
                    <button
                      disabled={actionBusyId === it._id}
                      onClick={() => setModal({ open: true, item: it })}
                      className="rounded-md bg-indigo-600 px-3 py-1.5 text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                      Review
                    </button>
                    <button
                      disabled={actionBusyId === it._id}
                      onClick={() => act(it._id, 'require_trial')}
                      className="rounded-md bg-amber-600 px-3 py-1.5 text-white hover:bg-amber-700 disabled:opacity-50"
                    >
                      Require Trial
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={() => load(Math.max(1, page - 1))}
          className="rounded-md bg-gray-200 px-3 py-1.5 text-sm hover:bg-gray-300"
          disabled={page <= 1 || loading}
        >
          Previous
        </button>
        <p className="text-sm text-gray-600">Page {page} of {totalPages}</p>
        <button
          onClick={() => load(Math.min(totalPages, page + 1))}
          className="rounded-md bg-gray-200 px-3 py-1.5 text-sm hover:bg-gray-300"
          disabled={page >= totalPages || loading}
        >
          Next
        </button>
      </div>

      {/* Modal */}
      {modal.open && modal.item && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-white p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Review: {modal.item.name}</h3>
              <button onClick={() => setModal({ open: false })} className="text-gray-500 hover:text-gray-700">Close</button>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-gray-900">ID Preview</p>
                {modal.item.idPreview ? (
                  <img src={modal.item.idPreview} alt="ID" className="mt-2 rounded-md" />
                ) : (
                  <p className="mt-2 text-sm text-gray-600">No ID available</p>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Video</p>
                {modal.item.videoPreview ? (
                  <video src={modal.item.videoPreview} controls className="mt-2 w-full rounded-md" />
                ) : (
                  <p className="mt-2 text-sm text-gray-600">No video available</p>
                )}
              </div>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3 text-sm">
              <p><span className="font-medium">OCR:</span> {modal.item.ocr_conf ?? '—'}</p>
              <p><span className="font-medium">Face:</span> {modal.item.face_score ?? '—'}</p>
              <p><span className="font-medium">Duplicate:</span> {String(modal.item?.duplicate_flag ?? false)}</p>
            </div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                disabled={actionBusyId === modal.item._id}
                onClick={() => act(modal.item!._id, 'approve')}
                className="rounded-md bg-green-600 px-3 py-2 text-white hover:bg-green-700 disabled:opacity-50"
              >
                Approve
              </button>
              <button
                disabled={actionBusyId === modal.item._id}
                onClick={() => act(modal.item!._id, 'reject', { rejection_code: 'low_quality', admin_notes: 'Please re-upload clearer images.' })}
                className="rounded-md bg-rose-600 px-3 py-2 text-white hover:bg-rose-700 disabled:opacity-50"
              >
                Reject
              </button>
              <button
                disabled={actionBusyId === modal.item._id}
                onClick={() => act(modal.item!._id, 'require_trial')}
                className="rounded-md bg-amber-600 px-3 py-2 text-white hover:bg-amber-700 disabled:opacity-50"
              >
                Require Trial
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


