import { useState } from 'react';
import { Upload, User, MapPin, Calendar, FileText, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { submitMissingReport } from '../helpers/missingReportService';
import { useAuth } from '../helpers/AuthContext';

const ReportMissingPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [photo, setPhoto] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        age: '',
        gender: 'male',
        height: '',
        last_seen_date: '',
        last_seen_time: '',
        district: 'ঢাকা',
        address: '',
        clothing_description: '',
        additional_info: '',
        contact_person_name: '',
        contact_phone: '',
    });

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPhoto(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.name.trim()) {
            toast.error('অনুগ্রহ করে নাম প্রবেश করুন');
            return;
        }

        if (!formData.district.trim()) {
            toast.error('অনুগ্রহ করে জেলা নির্বাচন করুন');
            return;
        }

        if (!formData.contact_person_name.trim()) {
            toast.error('অনুগ্রহ করে যোগাযোগের ব্যক্তির নাম প্রবেশ করুন');
            return;
        }

        if (!formData.contact_phone.trim()) {
            toast.error('অনুগ্রহ করে ফোন নম্বর প্রবেশ করুন');
            return;
        }

        setLoading(true);

        try {
            const formDataToSubmit = new FormData();
            
            // Add form fields
            Object.keys(formData).forEach(key => {
                if (formData[key]) {
                    formDataToSubmit.append(key, formData[key]);
                }
            });

            // Add photo if exists
            if (photo) {
                formDataToSubmit.append('photo', photo);
            }

            const result = await submitMissingReport(formDataToSubmit);

            if (result.success) {
                toast.success('রিপোর্ট সফলভাবে জমা দেওয়া হয়েছে! আমাদের টিম এটি পর্যালোচনা করবে।');
                
                // Reset form
                setFormData({
                    name: '',
                    age: '',
                    gender: 'male',
                    height: '',
                    last_seen_date: '',
                    last_seen_time: '',
                    district: 'ঢাকা',
                    address: '',
                    clothing_description: '',
                    additional_info: '',
                    contact_person_name: '',
                    contact_phone: '',
                });
                setPhoto(null);
                setPhotoPreview(null);

                // Redirect to dashboard after 2 seconds
                setTimeout(() => {
                    navigate('/dashboard');
                }, 2000);
            } else {
                toast.error(result.message || 'রিপোর্ট জমা দিতে ব্যর্থ হয়েছে');
            }
        } catch (error) {
            console.error('Submit error:', error);
            toast.error('একটি ত্রুটি ঘটেছে, অনুগ্রহ করে পুনরায় চেষ্টা করুন');
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-background py-10 px-4 flex items-center justify-center">
                <div className="max-w-md mx-auto text-center">
                    <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-800 mb-2">লগইন প্রয়োজন</h2>
                    <p className="text-gray-600 mb-6">রিপোর্ট জমা দিতে আপনাকে লগইন করতে হবে</p>
                    <button 
                        onClick={() => navigate('/login')}
                        className="w-full bg-primary text-white py-2 rounded-lg font-medium hover:bg-primary-dark transition-colors"
                    >
                        লগইন করুন
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background py-10 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-800">নিখোঁজ ব্যক্তির রিপোর্ট করুন</h1>
                    <p className="text-gray-500 text-sm mt-1">নিচের ফর্মটি পূরণ করে রিপোর্ট জমা দিন</p>
                </div>

                <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6 space-y-6">
                    {/* Photo Upload */}
                    <div>
                        <h2 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2"><Upload size={16} /> ছবি আপলোড করুন</h2>
                        <label className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                            <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={handlePhotoChange}
                                disabled={loading}
                            />
                            {photoPreview ? (
                                <div className="text-center">
                                    <img 
                                        src={photoPreview} 
                                        alt="Preview" 
                                        className="w-20 h-20 rounded-full object-cover mx-auto mb-2"
                                    />
                                    <p className="text-sm text-primary font-medium">{photo.name}</p>
                                    <p className="text-xs text-gray-400 mt-1">পরিবর্তন করতে ক্লিক করুন</p>
                                </div>
                            ) : (
                                <>
                                    <Upload size={32} className="text-gray-300 mb-2" />
                                    <p className="text-sm text-gray-500">ছবি টেনে আনুন বা ক্লিক করুন</p>
                                    <p className="text-xs text-gray-400 mt-1">JPG, PNG (সর্বোচ্চ 5MB)</p>
                                </>
                            )}
                        </label>
                    </div>

                    {/* Personal Info */}
                    <div>
                        <h2 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2"><User size={16} /> ব্যক্তিগত তথ্য</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">নাম *</label>
                                <input 
                                    type="text" 
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="পূর্ণ নাম" 
                                    className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    disabled={loading}
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">বয়স</label>
                                <input 
                                    type="number" 
                                    name="age"
                                    value={formData.age}
                                    onChange={handleInputChange}
                                    placeholder="বয়স" 
                                    className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    disabled={loading}
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">লিঙ্গ</label>
                                <select 
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleInputChange}
                                    className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                                    disabled={loading}
                                >
                                    <option value="male">পুরুষ</option>
                                    <option value="female">নারী</option>
                                    <option value="other">অন্যান্য</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">উচ্চতা</label>
                                <input 
                                    type="text" 
                                    name="height"
                                    value={formData.height}
                                    onChange={handleInputChange}
                                    placeholder="যেমন: ৫ ফুট ৭ ইঞ্চি" 
                                    className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    disabled={loading}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Last Seen */}
                    <div>
                        <h2 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2"><MapPin size={16} /> শেষ দেখা যাওয়ার তথ্য</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">তারিখ</label>
                                <input 
                                    type="date" 
                                    name="last_seen_date"
                                    value={formData.last_seen_date}
                                    onChange={handleInputChange}
                                    className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    disabled={loading}
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">সময়</label>
                                <input 
                                    type="time" 
                                    name="last_seen_time"
                                    value={formData.last_seen_time}
                                    onChange={handleInputChange}
                                    className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    disabled={loading}
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">জেলা *</label>
                                <select 
                                    name="district"
                                    value={formData.district}
                                    onChange={handleInputChange}
                                    className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                                    disabled={loading}
                                >
                                    <option value="ঢাকা">ঢাকা</option>
                                    <option value="চট্টগ্রাম">চট্টগ্রাম</option>
                                    <option value="রাজশাহী">রাজশাহী</option>
                                    <option value="খুলনা">খুলনা</option>
                                    <option value="বরিশাল">বরিশাল</option>
                                    <option value="সিলেট">সিলেট</option>
                                    <option value="রংপুর">রংপুর</option>
                                    <option value="ময়মনসিংহ">ময়মনসিংহ</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs text-gray-500 mb-1">বিস্তারিত ঠিকানা</label>
                                <input 
                                    type="text" 
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    placeholder="এলাকা / থানা / স্থানের নাম" 
                                    className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    disabled={loading}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <h2 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2"><FileText size={16} /> বিবরণ</h2>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">পোশাকের বিবরণ</label>
                            <input 
                                type="text" 
                                name="clothing_description"
                                value={formData.clothing_description}
                                onChange={handleInputChange}
                                placeholder="হারিয়ে যাওয়ার সময় কী পোশাক পরেছিলেন" 
                                className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 mb-3"
                                disabled={loading}
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">অতিরিক্ত তথ্য</label>
                            <textarea 
                                name="additional_info"
                                value={formData.additional_info}
                                onChange={handleInputChange}
                                rows={3} 
                                placeholder="অন্য কোনো গুরুত্বপূর্ণ তথ্য..." 
                                className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    {/* Contact */}
                    <div>
                        <h2 className="text-base font-semibold text-gray-700 mb-3">যোগাযোগের তথ্য</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">যোগাযোগের ব্যক্তির নাম *</label>
                                <input 
                                    type="text" 
                                    name="contact_person_name"
                                    value={formData.contact_person_name}
                                    onChange={handleInputChange}
                                    placeholder="রিপোর্টকারীর নাম" 
                                    className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    disabled={loading}
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">ফোন নম্বর *</label>
                                <input 
                                    type="tel" 
                                    name="contact_phone"
                                    value={formData.contact_phone}
                                    onChange={handleInputChange}
                                    placeholder="01XXXXXXXXX" 
                                    className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    disabled={loading}
                                />
                            </div>
                        </div>
                    </div>

                    <button 
                        type="submit"
                        disabled={loading}
                        className="w-full bg-secondary hover:bg-secondary-dark disabled:bg-gray-400 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={20} className="animate-spin" />
                                জমা দিচ্ছি...
                            </>
                        ) : (
                            'রিপোর্ট জমা দিন'
                        )}
                    </button>

                    <p className="text-xs text-gray-500 text-center">
                        আমরা আপনার রিপোর্ট পর্যালোচনা করব এবং যাচাই করার পর প্রকাশ করব
                    </p>
                </form>
            </div>
        </div>
    );
};

export default ReportMissingPage;