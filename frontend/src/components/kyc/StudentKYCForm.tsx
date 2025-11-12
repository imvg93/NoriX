"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { apiService } from '../../services/api';
import { Upload } from 'lucide-react';

type StudentForm = {
	name: string;
	phone: string;
	college: string;
	college_email: string;
	id_doc_url: string;
	skills: string[];
	availability: string[];
};

const allAvailability = ['weekdays', 'weekends', 'both', 'flexible', 'morning', 'evening', 'night'];

export default function StudentKYCForm() {
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [message, setMessage] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [verified, setVerified] = useState<boolean>(false);
	const [form, setForm] = useState<StudentForm>({
		name: '',
		phone: '',
		college: '',
		college_email: '',
		id_doc_url: '',
		skills: [],
		availability: []
	});
	const [skillInput, setSkillInput] = useState('');

	useEffect(() => {
		const load = async () => {
			try {
				setLoading(true);
				const res = await apiService.getMyStudentProfile();
				const student = (res as any)?.data?.student ?? (res as any)?.student ?? null;
				if (student) {
					setVerified(Boolean(student.verified));
					setForm({
						name: student.name || '',
						phone: student.phone || '',
						college: student.college || '',
						college_email: student.college_email || '',
						id_doc_url: student.id_doc_url || '',
						skills: Array.isArray(student.skills) ? student.skills : [],
						availability: Array.isArray(student.availability) ? student.availability : []
					});
				}
			} catch (e: any) {
				// No student profile yet - ignore
			} finally {
				setLoading(false);
			}
		};
		load();
	}, []);

	const canSubmit = useMemo(() => {
		return !!(form.name && form.phone && form.college && form.college_email);
	}, [form]);

	const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setForm(prev => ({ ...prev, [name]: value }));
	};

	const onToggleAvailability = (value: string) => {
		setForm(prev => {
			const has = prev.availability.includes(value);
			return { ...prev, availability: has ? prev.availability.filter(a => a !== value) : [...prev.availability, value] };
		});
	};

	const onAddSkill = () => {
		const v = skillInput.trim();
		if (!v) return;
		setForm(prev => ({ ...prev, skills: Array.from(new Set([...(prev.skills || []), v])) }));
		setSkillInput('');
	};

	const onRemoveSkill = (s: string) => {
		setForm(prev => ({ ...prev, skills: (prev.skills || []).filter(x => x !== s) }));
	};

	const onUploadId = async (file: File) => {
		try {
			setError(null);
			setMessage(null);
			// Reuse existing upload endpoint
			const fd = new FormData();
			fd.append('document', file);
			fd.append('documentType', 'college_id');
			const res = await apiService.post<any>('/upload/kyc-document', fd as any);
			const url = (res as any)?.data?.url || (res as any)?.url || '';
			if (url) {
				setForm(prev => ({ ...prev, id_doc_url: url }));
				setMessage('ID document uploaded');
			} else {
				setError('Failed to upload document');
			}
		} catch (e: any) {
			setError(e?.message || 'Upload failed');
		}
	};

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!canSubmit) return;
		try {
			setSaving(true);
			setError(null);
			setMessage(null);
			const { name, phone, college, college_email, id_doc_url, skills, availability } = form;
			const res = await apiService.saveMyStudentProfile({ name, phone, college, college_email, id_doc_url, skills, availability });
			const student = (res as any)?.data?.student ?? (res as any)?.student ?? null;
			if (student) {
				setVerified(Boolean(student.verified));
				setMessage('Saved successfully');
				// Persist an immediate prompt to verify after KYC save
				try {
					localStorage.setItem('kycSubmitted', 'true');
				} catch {}
			} else {
				setMessage('Saved');
				try {
					localStorage.setItem('kycSubmitted', 'true');
				} catch {}
			}
		} catch (e: any) {
			setError(e?.message || 'Save failed');
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return (
			<div className="bg-white rounded-xl shadow-sm border p-6">Loading...</div>
		);
	}

	return (
		<form onSubmit={onSubmit} className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
			<div className="flex items-center justify-between">
				<h2 className="text-lg font-semibold">Student Verification</h2>
				<div className={`text-sm px-3 py-1 rounded-full ${verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-800'}`}>
					{verified ? 'Verified' : 'Not verified'}
				</div>
			</div>

			{message && (
				<div className="text-sm text-green-700 bg-green-50 border border-green-200 p-3 rounded flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
					<span>{message}</span>
					<a
						href="/verification"
						className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-white text-xs font-medium hover:bg-indigo-700"
					>
						Proceed to Get Verified
					</a>
				</div>
			)}
			{error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 p-2 rounded">{error}</div>}

			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div>
					<label className="block text-sm text-gray-700 mb-1">Name</label>
					<input name="name" value={form.name} onChange={onChange} className="w-full border rounded px-3 py-2" placeholder="Your full name" />
				</div>
				<div>
					<label className="block text-sm text-gray-700 mb-1">Phone</label>
					<input name="phone" value={form.phone} onChange={onChange} className="w-full border rounded px-3 py-2" placeholder="Phone number" />
				</div>
				<div>
					<label className="block text-sm text-gray-700 mb-1">College</label>
					<input name="college" value={form.college} onChange={onChange} className="w-full border rounded px-3 py-2" placeholder="College / University" />
				</div>
				<div>
					<label className="block text-sm text-gray-700 mb-1">College Email</label>
					<input name="college_email" value={form.college_email} onChange={onChange} className="w-full border rounded px-3 py-2" placeholder="name@college.edu" />
				</div>
			</div>

			<div>
				<label className="block text-sm text-gray-700 mb-2">ID Document</label>
				<div className="flex items-center gap-3">
					<label className="inline-flex items-center gap-2 px-3 py-2 border rounded cursor-pointer hover:bg-gray-50">
						<Upload className="w-4 h-4" />
						<span>Upload ID</span>
						<input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => e.target.files && onUploadId(e.target.files[0])} />
					</label>
					{form.id_doc_url ? <a className="text-blue-600 text-sm truncate max-w-xs" href={form.id_doc_url} target="_blank" rel="noreferrer">View uploaded</a> : <span className="text-sm text-gray-500">No document uploaded</span>}
				</div>
			</div>

			<div>
				<label className="block text-sm text-gray-700 mb-2">Skills</label>
				<div className="flex gap-2">
					<input value={skillInput} onChange={(e) => setSkillInput(e.target.value)} className="flex-1 border rounded px-3 py-2" placeholder="Add a skill and press Add" />
					<button type="button" onClick={onAddSkill} className="px-3 py-2 bg-gray-800 text-white rounded">Add</button>
				</div>
				<div className="flex flex-wrap gap-2 mt-2">
					{(form.skills || []).map((s) => (
						<span key={s} className="inline-flex items-center gap-2 bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-sm">
							{s}
							<button type="button" onClick={() => onRemoveSkill(s)} className="text-gray-500 hover:text-gray-700">×</button>
						</span>
					))}
				</div>
			</div>

			<div>
				<label className="block text-sm text-gray-700 mb-2">Availability</label>
				<div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
					{allAvailability.map(a => (
						<label key={a} className="inline-flex items-center gap-2 text-sm">
							<input type="checkbox" checked={form.availability.includes(a)} onChange={() => onToggleAvailability(a)} />
							<span className="capitalize">{a.replace('-', ' ')}</span>
						</label>
					))}
				</div>
			</div>

			<div className="flex justify-end">
				<button disabled={saving || !canSubmit} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">
					{saving ? 'Saving...' : 'Save'}
				</button>
			</div>
		</form>
	);
}


