"use client";

import React, { useEffect, useMemo, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { apiService } from '../../services/api';
import { kycStatusService } from '../../services/kycStatusService';
import { 
	Upload, 
	CheckCircle, 
	X, 
	AlertCircle,
	Eye,
	Trash2,
	Loader2,
	Shield,
	User,
	Phone,
	GraduationCap,
	Mail,
	Briefcase,
	Calendar,
	Image as ImageIcon,
	Clock,
	Lock
} from 'lucide-react';

const ACCENT = "#2A8A8C";

type StudentForm = {
	name: string;
	phone: string;
	college: string;
	college_email: string;
	id_doc_url: string; // College ID only
	skills: string[];
	availability: string[];
};

const allAvailability = ['weekdays', 'weekends', 'both', 'flexible', 'morning', 'evening', 'night'];

interface ImageUploadProps {
	label: string;
	currentUrl: string;
	onUpload: (url: string) => void;
	onDelete: () => void;
	accept?: string;
	disabled?: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ 
	label, 
	currentUrl, 
	onUpload, 
	onDelete,
	accept = "image/*",
	disabled = false
}) => {
	const [isUploading, setIsUploading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [preview, setPreview] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
		if (disabled) return;
		const file = event.target.files?.[0];
		if (!file) return;

		// Accept any image format
		if (!file.type.startsWith('image/')) {
			setError('Please select an image file');
			return;
		}

		if (file.size > 10 * 1024 * 1024) { // 10MB limit
			setError('File size must be less than 10MB');
			return;
		}

		setError(null);
		
		// Create preview immediately
		const reader = new FileReader();
		reader.onload = (e) => {
			setPreview(e.target?.result as string);
		};
		reader.readAsDataURL(file);

		// Upload file
		setIsUploading(true);
		try {
			const fd = new FormData();
			fd.append('document', file);
			fd.append('documentType', 'college_id');
			const res = await apiService.post<any>('/upload/kyc-document', fd as any);
			const url = (res as any)?.data?.url || (res as any)?.url || '';
			if (url) {
				onUpload(url);
				setPreview(null);
			} else {
				throw new Error('Failed to upload document');
			}
		} catch (e: any) {
			setError(e?.message || 'Upload failed');
			setPreview(null);
		} finally {
			setIsUploading(false);
		}
	};

	const handleDelete = () => {
		if (disabled) return;
		setPreview(null);
		onDelete();
	};

	const openFileDialog = () => {
		if (disabled) return;
		fileInputRef.current?.click();
	};

	const displayUrl = currentUrl || preview;

	return (
		<div className="space-y-2">
			<label className="block text-sm font-medium text-gray-700 mb-2">
				{label}
			</label>
			<div
				onClick={openFileDialog}
				className={`
					relative border-2 border-dashed rounded-xl p-6 transition-all duration-200
					${disabled || isUploading
						? 'opacity-50 cursor-not-allowed pointer-events-none'
						: 'cursor-pointer'
					}
					${displayUrl 
						? 'border-green-300 bg-green-50' 
						: 'border-gray-300 hover:border-[#2A8A8C] hover:bg-gray-50'
					}
				`}
			>
				<input
					ref={fileInputRef}
					type="file"
					accept={accept}
					onChange={handleFileSelect}
					className="hidden"
					disabled={isUploading || disabled}
				/>

				{isUploading ? (
					<div className="flex flex-col items-center justify-center text-center py-4">
						<Loader2 className="w-8 h-8 text-[#2A8A8C] animate-spin mb-2" />
						<p className="text-sm text-gray-600">Uploading...</p>
					</div>
				) : displayUrl ? (
					<div className="flex flex-col items-center justify-center text-center">
						<div className="relative mb-3">
							<img
								src={displayUrl}
								alt={label}
								className="w-32 h-40 object-cover rounded-lg border-2 border-gray-200 shadow-sm"
							/>
							<div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1">
								<CheckCircle className="w-4 h-4 text-white" />
							</div>
						</div>
						<div className="flex gap-2">
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									window.open(displayUrl, '_blank');
								}}
								className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
							>
								<Eye className="w-3 h-3" />
								View
							</button>
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									handleDelete();
								}}
								className="flex items-center gap-1 px-3 py-1.5 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
							>
								<Trash2 className="w-3 h-3" />
								Remove
							</button>
						</div>
						<p className="text-xs text-green-600 mt-2 font-medium">
							✓ Uploaded successfully
						</p>
					</div>
				) : (
					<div className="flex flex-col items-center justify-center text-center py-4">
						<div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
							<ImageIcon className="w-6 h-6 text-gray-400" />
						</div>
						<p className="text-sm font-medium text-gray-700 mb-1">
							Click to upload or drag and drop
						</p>
						<p className="text-xs text-gray-500">
							Any image format up to 10MB
						</p>
					</div>
				)}
			</div>
			{error && (
				<div className="flex items-center gap-2 text-red-600 text-sm">
					<AlertCircle className="w-4 h-4" />
					{error}
				</div>
			)}
		</div>
	);
};

export default function StudentKYCForm() {
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [message, setMessage] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [verified, setVerified] = useState<boolean>(false);
	const [kycStatus, setKycStatus] = useState<string>('not_submitted');
	const [isSubmitted, setIsSubmitted] = useState(false);
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
				
				// Check KYC status first
				try {
					const status = await kycStatusService.forceRefreshKYCStatus();
					setKycStatus(status.status);
					setIsSubmitted(status.status === 'pending' || status.status === 'approved' || status.status === 'rejected' || status.status === 'suspended');
				} catch (e) {
					console.error('Error checking KYC status:', e);
				}
				
				const res = await apiService.getMyStudentProfile();
				const student = (res as any)?.data?.student ?? (res as any)?.student ?? null;
				if (student) {
					setVerified(Boolean(student.verified));
					setForm({
						name: student.name || '',
						phone: student.phone || '',
						college: student.college || '',
						college_email: student.college_email || '',
						id_doc_url: student.id_doc_url || student.id_doc_front_url || '',
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
		return !!(
			form.name && 
			form.phone && 
			form.college && 
			form.college_email &&
			form.id_doc_url
		);
	}, [form]);

	const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setForm(prev => ({ ...prev, [name]: value }));
	};

	const onToggleAvailability = (value: string) => {
		setForm(prev => {
			const has = prev.availability.includes(value);
			return { 
				...prev, 
				availability: has 
					? prev.availability.filter(a => a !== value) 
					: [...prev.availability, value] 
			};
		});
	};

	const onAddSkill = () => {
		const v = skillInput.trim();
		if (!v) return;
		setForm(prev => ({ 
			...prev, 
			skills: Array.from(new Set([...(prev.skills || []), v])) 
		}));
		setSkillInput('');
	};

	const onRemoveSkill = (s: string) => {
		setForm(prev => ({ 
			...prev, 
			skills: (prev.skills || []).filter(x => x !== s) 
		}));
	};

	const fillTestData = () => {
		setForm({
			name: 'John Doe',
			phone: '+1234567890',
			college: 'State University',
			college_email: 'john.doe@university.edu',
			id_doc_url: 'https://via.placeholder.com/400x300/2A8A8C/FFFFFF?text=College+ID',
			skills: ['React', 'Node.js', 'TypeScript', 'JavaScript'],
			availability: ['weekdays', 'weekends', 'flexible']
		});
		setSkillInput('');
		setMessage(null);
		setError(null);
	};

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!canSubmit) return;
		try {
			setSaving(true);
			setError(null);
			setMessage(null);
			const { name, phone, college, college_email, id_doc_url, skills, availability } = form;
			const res = await apiService.saveMyStudentProfile({ 
				name, 
				phone, 
				college, 
				college_email, 
				id_doc_url,
				skills, 
				availability 
			});
			const student = (res as any)?.data?.student ?? (res as any)?.student ?? null;
			if (student) {
				setVerified(Boolean(student.verified));
				setMessage('Profile saved successfully! Your KYC is now pending review.');
				try {
					localStorage.setItem('kycSubmitted', 'true');
				} catch {}
			} else {
				setMessage('Profile saved successfully!');
				try {
					localStorage.setItem('kycSubmitted', 'true');
				} catch {}
			}
		} catch (e: any) {
			setError(e?.message || 'Save failed. Please try again.');
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return (
			<div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
				<div className="flex items-center justify-center py-12">
					<Loader2 className="w-8 h-8 text-[#2A8A8C] animate-spin" />
					<span className="ml-3 text-gray-600">Loading...</span>
				</div>
			</div>
		);
	}

	return (
		<motion.form 
			onSubmit={onSubmit} 
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
		>
			{/* Header */}
			<div className="bg-gradient-to-r from-[#2A8A8C] to-[#1f6a6c] px-6 py-5">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
							<Shield className="w-5 h-5 text-white" />
						</div>
						<div>
							<h2 className="text-xl font-bold text-white">Student Verification</h2>
							<p className="text-sm text-white/90">Complete your profile to get verified</p>
						</div>
					</div>
					<div className="flex items-center gap-3">
						<button
							type="button"
							onClick={fillTestData}
							className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-medium rounded-lg transition-colors border border-white/30"
							title="Fill test data for testing"
						>
							Fill Test Data
						</button>
						<div className={`px-4 py-1.5 rounded-full text-sm font-medium ${
							verified 
								? 'bg-green-500 text-white' 
								: 'bg-white/20 text-white'
						}`}>
							{verified ? '✓ Verified' : 'Pending Verification'}
						</div>
					</div>
				</div>
			</div>

			<div className="p-6 space-y-6">
				{message && (
					<motion.div 
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3"
					>
						<CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
						<div className="flex-1">
							<p className="text-sm font-medium text-green-800">{message}</p>
							<a
								href="/verification"
								className="inline-flex items-center gap-2 mt-2 text-xs font-medium text-green-700 hover:text-green-800"
							>
								Proceed to Get Verified →
							</a>
						</div>
					</motion.div>
				)}
				
				{error && (
					<motion.div 
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3"
					>
						<AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
						<p className="text-sm text-red-800">{error}</p>
					</motion.div>
				)}

				{/* Personal Information */}
				<div className="space-y-4">
					<h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
						<User className="w-5 h-5 text-[#2A8A8C]" />
						Personal Information
					</h3>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Full Name <span className="text-red-500">*</span>
							</label>
							<div className="relative">
								<User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
								<input 
									name="name" 
									value={form.name} 
									onChange={onChange} 
									className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2A8A8C] focus:border-[#2A8A8C] transition-all" 
									placeholder="Enter your full name"
									required
								/>
							</div>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Phone Number <span className="text-red-500">*</span>
							</label>
							<div className="relative">
								<Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
								<input 
									name="phone" 
									value={form.phone} 
									onChange={onChange} 
									className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2A8A8C] focus:border-[#2A8A8C] transition-all" 
									placeholder="Enter your phone number"
									required
								/>
							</div>
						</div>
					</div>
				</div>

				{/* Academic Information */}
				<div className="space-y-4">
					<h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
						<GraduationCap className="w-5 h-5 text-[#2A8A8C]" />
						Academic Information
					</h3>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								College/University <span className="text-red-500">*</span>
							</label>
							<div className="relative">
								<GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
								<input 
									name="college" 
									value={form.college} 
									onChange={onChange} 
									disabled={isSubmitted}
									className={`w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg transition-all ${
										isSubmitted 
											? 'bg-gray-100 cursor-not-allowed' 
											: 'focus:ring-2 focus:ring-[#2A8A8C] focus:border-[#2A8A8C]'
									}`}
									placeholder="Enter college/university name"
									required
								/>
							</div>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								College Email <span className="text-red-500">*</span>
							</label>
							<div className="relative">
								<Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
								<input 
									name="college_email" 
									type="email"
									value={form.college_email} 
									onChange={onChange} 
									disabled={isSubmitted}
									className={`w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg transition-all ${
										isSubmitted 
											? 'bg-gray-100 cursor-not-allowed' 
											: 'focus:ring-2 focus:ring-[#2A8A8C] focus:border-[#2A8A8C]'
									}`}
									placeholder="name@college.edu"
									required
								/>
							</div>
						</div>
					</div>
				</div>

				{/* College ID Document Upload */}
				<div className="space-y-4">
					<h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
						<ImageIcon className="w-5 h-5 text-[#2A8A8C]" />
						College ID Verification
					</h3>
					<div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
						<div className="flex items-start gap-3">
							<AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
							<div className="text-sm text-blue-800">
								<p className="font-medium mb-1">Upload your College ID Card</p>
								<p className="text-xs">Upload a clear photo of your College ID Card for verification purposes.</p>
							</div>
						</div>
					</div>
					<div className="max-w-md">
						<ImageUpload
							label="College ID Card *"
							currentUrl={form.id_doc_url}
							onUpload={(url) => setForm(prev => ({ ...prev, id_doc_url: url }))}
							onDelete={() => setForm(prev => ({ ...prev, id_doc_url: '' }))}
						/>
					</div>
				</div>

				{/* Skills */}
				<div className="space-y-4">
					<h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
						<Briefcase className="w-5 h-5 text-[#2A8A8C]" />
						Skills
					</h3>
					<div className="flex gap-2">
						<div className="relative flex-1">
							<input 
								value={skillInput} 
								onChange={(e) => !isSubmitted && setSkillInput(e.target.value)}
								onKeyPress={(e) => !isSubmitted && e.key === 'Enter' && (e.preventDefault(), onAddSkill())}
								disabled={isSubmitted}
								className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg transition-all ${
									isSubmitted 
										? 'bg-gray-100 cursor-not-allowed' 
										: 'focus:ring-2 focus:ring-[#2A8A8C] focus:border-[#2A8A8C]'
								}`}
								placeholder="Add a skill and press Enter or click Add"
							/>
						</div>
						<button 
							type="button" 
							onClick={onAddSkill}
							disabled={isSubmitted}
							className={`px-6 py-2.5 rounded-lg transition-colors font-medium ${
								isSubmitted
									? 'bg-gray-300 text-gray-500 cursor-not-allowed'
									: 'bg-[#2A8A8C] text-white hover:bg-[#1f6a6c]'
							}`}
						>
							Add
						</button>
					</div>
					{form.skills.length > 0 && (
						<div className="flex flex-wrap gap-2">
							{form.skills.map((s) => (
								<span 
									key={s} 
									className="inline-flex items-center gap-2 bg-[#2A8A8C]/10 text-[#2A8A8C] px-3 py-1.5 rounded-full text-sm font-medium"
								>
									{s}
									<button 
										type="button" 
										onClick={() => onRemoveSkill(s)} 
										className="text-[#2A8A8C] hover:text-[#1f6a6c] transition-colors"
									>
										<X className="w-4 h-4" />
									</button>
								</span>
							))}
						</div>
					)}
				</div>

				{/* Availability */}
				<div className="space-y-4">
					<h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
						<Calendar className="w-5 h-5 text-[#2A8A8C]" />
						Availability
					</h3>
					<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
						{allAvailability.map(a => (
							<label 
								key={a} 
								className={`
									flex items-center gap-2 px-4 py-2.5 border-2 rounded-lg cursor-pointer transition-all
									${form.availability.includes(a)
										? 'border-[#2A8A8C] bg-[#2A8A8C]/10 text-[#2A8A8C]'
										: 'border-gray-200 hover:border-gray-300 text-gray-700'
									}
								`}
							>
								<input 
									type="checkbox" 
									checked={form.availability.includes(a)} 
									onChange={() => onToggleAvailability(a)}
									className="w-4 h-4 text-[#2A8A8C] border-gray-300 rounded focus:ring-[#2A8A8C]"
								/>
								<span className="text-sm font-medium capitalize">{a.replace('-', ' ')}</span>
							</label>
						))}
					</div>
				</div>

				{/* Submit Button */}
				{!isSubmitted && (
					<div className="flex justify-end pt-4 border-t border-gray-200">
						<button 
							type="submit"
							disabled={saving || !canSubmit || isSubmitted} 
							className={`
								px-8 py-3 rounded-lg font-semibold text-white transition-all flex items-center gap-2
								${canSubmit && !saving && !isSubmitted
									? 'bg-[#2A8A8C] hover:bg-[#1f6a6c] shadow-md hover:shadow-lg'
									: 'bg-gray-300 cursor-not-allowed'
								}
							`}
						>
							{saving ? (
								<>
									<Loader2 className="w-5 h-5 animate-spin" />
									Saving...
								</>
							) : (
								<>
									<Shield className="w-5 h-5" />
									Submit for Verification
								</>
							)}
						</button>
					</div>
				)}
				
				{/* Additional KYC Details Link - Show after submission */}
				{isSubmitted && (
					<div className="pt-4 border-t border-gray-200">
						<div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-6">
							<div className="flex items-start gap-4">
								<div className="flex-shrink-0">
									<div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
										<Shield className="w-6 h-6 text-indigo-600" />
									</div>
								</div>
								<div className="flex-1">
									<h4 className="text-lg font-semibold text-gray-900 mb-2">
										Complete Additional KYC Details
									</h4>
									<p className="text-sm text-gray-600 mb-4">
										You've submitted your basic profile. Now complete additional KYC details including:
									</p>
									<ul className="text-sm text-gray-600 space-y-1 mb-4">
										<li>• Full address and stay details</li>
										<li>• Emergency contact information</li>
										<li>• Work preferences and experience</li>
										<li>• Payroll and bank account details</li>
										<li>• Additional identity documents</li>
									</ul>
									<Link
										href="/verification"
										className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
									>
										<Shield className="w-5 h-5" />
										Complete Additional KYC Details
									</Link>
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
		</motion.form>
	);
}
