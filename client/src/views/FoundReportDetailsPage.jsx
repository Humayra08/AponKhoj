import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, MapPin, Phone, User, Shield } from 'lucide-react';
import { getPublishedFoundReportById } from '../helpers/foundReportService';

const formatDateBN = (dateStr) => {
  if (!dateStr) return '—';
  const dt = new Date(dateStr);
  if (Number.isNaN(dt.getTime())) return dateStr;

  return dt.toLocaleDateString('bn-BD', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

const formatBnNumber = (value) => new Intl.NumberFormat('bn-BD').format(Number(value || 0));

const genderLabel = (gender) => {
  if (gender === 'male') return 'পুরুষ';
  if (gender === 'female') return 'নারী';
  if (gender === 'other') return 'অন্যান্য';
  return '—';
};

const healthLabel = (status) => {
  if (status === 'healthy') return 'স্বাভাবিক';
  if (status === 'sick') return 'চিকিৎসাধীন';
  if (status === 'unknown') return 'অজানা';
  return status || '—';
};

export default function FoundReportDetailsPage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [report, setReport] = useState(null);
  const mapQuery = [report?.address, report?.district].filter(Boolean).join(', ');
  const mapSearchUrl = mapQuery
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`
    : '';

  useEffect(() => {
    let mounted = true;

    const loadReport = async () => {
      setLoading(true);
      setError('');

      const res = await getPublishedFoundReportById(id);
      if (!mounted) return;

      if (res.success && res.report) {
        setReport(res.report);
      } else {
        setReport(null);
        setError(res.message || 'রিপোর্ট খুঁজে পাওয়া যায়নি');
      }

      setLoading(false);
    };

    loadReport();

    return () => {
      mounted = false;
    };
  }, [id]);

  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Link to="/found" className="inline-flex items-center gap-2 text-sm text-primary hover:underline mb-6">
          <ArrowLeft size={16} /> উদ্ধার তালিকায় ফিরে যান
        </Link>

        {loading && (
          <div className="bg-white rounded-3xl border border-gray-100 p-8 animate-pulse space-y-6">
            <div className="h-8 bg-gray-100 rounded w-1/3" />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 h-96 bg-gray-100 rounded-2xl" />
              <div className="lg:col-span-7 space-y-4">
                <div className="h-6 bg-gray-100 rounded w-2/3" />
                <div className="h-4 bg-gray-100 rounded" />
                <div className="h-4 bg-gray-100 rounded w-5/6" />
              </div>
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="bg-red-50 border border-red-100 text-red-700 rounded-3xl p-6">
            <p className="font-semibold">{error}</p>
          </div>
        )}

        {!loading && report && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-5 space-y-4 max-w-md">
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="relative">
                  {report.photo_url ? (
                    <img
                      src={report.photo_url}
                      alt={report.name || 'Found report photo'}
                      className="w-full h-[320px] md:h-[420px] object-cover object-center"
                    />
                  ) : (
                    <div className="w-full h-[320px] md:h-[420px] bg-slate-50 border-b border-gray-100 flex flex-col items-center justify-center text-gray-400">
                      <Shield size={34} className="mb-2 text-gray-300" />
                      <p className="text-xs">ছবি পাওয়া যায়নি</p>
                    </div>
                  )}
                  <span className="absolute top-3 left-3 text-[11px] font-semibold px-3 py-1 rounded-full bg-orange-500 text-white shadow-md">
                    নিশ্চিত
                  </span>
                </div>
                <div className="p-4">
                  <h2 className="text-base md:text-xl font-semibold text-slate-900 leading-tight mb-1">{report.name || 'অজ্ঞাত ব্যক্তি'}</h2>
                  <p className="text-xs text-slate-500 font-normal">আনুমানিক {report.approximate_age != null ? `${formatBnNumber(report.approximate_age)} বছর বয়সী` : 'বয়স অজানা'}</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                <p className="text-slate-700 text-sm font-semibold mb-3">দ্রুত তথ্য</p>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-orange-50 text-orange-700 rounded-lg text-[11px] font-medium">
                    <MapPin size={12} /> {report.district || 'জেলা নেই'}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-teal-50 text-teal-700 rounded-lg text-[11px] font-medium">
                    <Shield size={12} /> {healthLabel(report.health_status)}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-medium">
                    <Calendar size={12} /> {formatDateBN(report.found_date)}
                  </span>
                </div>
                {mapSearchUrl && (
                  <div className="mt-3 rounded-xl overflow-hidden border border-gray-200">
                    <iframe
                      title="বিস্তারিত ঠিকানার ম্যাপ"
                      src={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=15&output=embed`}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      className="w-full h-40"
                    />
                    <a
                      href={mapSearchUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 py-2 transition-colors"
                    >
                      <MapPin size={12} /> বিস্তারিত ঠিকানা ম্যাপে দেখুন
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-7 space-y-4">
              <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                <h3 className="text-base font-semibold text-slate-900">উদ্ধারের বিবরণ</h3>
                <p className="text-xs text-slate-400 font-normal mt-1 mb-4">উদ্ধারের সময় ও স্থানের তথ্য</p>

                <div className="divide-y divide-gray-100">
                  <div className="py-2.5 flex items-start gap-2.5">
                    <MapPin size={17} className="text-slate-300 mt-1" />
                    <div>
                      <p className="text-[11px] font-medium text-slate-400">উদ্ধারস্থল</p>
                      <p className="text-sm font-semibold text-slate-800 leading-tight">{report.district || '—'}</p>
                    </div>
                  </div>
                  <div className="py-2.5 flex items-start gap-2.5">
                    <MapPin size={17} className="text-slate-300 mt-1" />
                    <div>
                      <p className="text-[11px] font-medium text-slate-400">বিস্তারিত ঠিকানা</p>
                      <p className="text-xs font-medium text-slate-700 leading-snug">{report.address || 'উল্লেখ নেই'}</p>
                    </div>
                  </div>
                  <div className="py-2.5 flex items-start gap-2.5">
                    <Calendar size={17} className="text-slate-300 mt-1" />
                    <div>
                      <p className="text-[11px] font-medium text-slate-400">উদ্ধারের তারিখ</p>
                      <p className="text-sm font-semibold text-slate-800">{formatDateBN(report.found_date)}</p>
                    </div>
                  </div>
                  <div className="py-2.5 flex items-start gap-2.5">
                    <Clock size={17} className="text-slate-300 mt-1" />
                    <div>
                      <p className="text-[11px] font-medium text-slate-400">সময়</p>
                      <p className="text-sm font-semibold text-slate-800">{report.found_time || '—'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                <h3 className="text-base font-semibold text-slate-900 mb-2.5">শারীরিক বিবরণ</h3>
                <div className="divide-y divide-gray-100">
                  <div className="py-2.5 flex items-start gap-2.5">
                    <User size={17} className="text-slate-300 mt-1" />
                    <div>
                      <p className="text-[11px] font-medium text-slate-400">নাম</p>
                      <p className="text-sm font-semibold text-slate-800">{report.name || '—'}</p>
                    </div>
                  </div>
                  <div className="py-2.5 flex items-start gap-2.5">
                    <User size={17} className="text-slate-300 mt-1" />
                    <div>
                      <p className="text-[11px] font-medium text-slate-400">বয়স</p>
                      <p className="text-sm font-semibold text-slate-800">{report.approximate_age != null ? `আনুমানিক ${formatBnNumber(report.approximate_age)} বছর` : '—'}</p>
                    </div>
                  </div>
                  <div className="py-2.5 flex items-start gap-2.5">
                    <User size={17} className="text-slate-300 mt-1" />
                    <div>
                      <p className="text-[11px] font-medium text-slate-400">লিঙ্গ</p>
                      <p className="text-sm font-semibold text-slate-800">{genderLabel(report.gender)}</p>
                    </div>
                  </div>
                  <div className="py-2.5 flex items-start gap-2.5">
                    <Shield size={17} className="text-slate-300 mt-1" />
                    <div>
                      <p className="text-[11px] font-medium text-slate-400">স্বাস্থ্যের অবস্থা</p>
                      <p className="text-sm font-semibold text-slate-800">{healthLabel(report.health_status)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-gradient-to-r from-emerald-900 to-green-900 text-white p-4 shadow-sm">
                <p className="text-base font-semibold">যোগাযোগের তথ্য</p>
                <p className="text-xs text-emerald-200 mt-1">তথ্য থাকলে এই নম্বরে যোগাযোগ করুন</p>
                <div className="mt-3 space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <User size={17} className="mt-0.5 text-emerald-200" />
                    <div>
                      <p className="text-emerald-200 text-[11px]">যোগাযোগকারী</p>
                      <p className="font-semibold text-sm">{report.contact_person_name || '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 rounded-xl bg-white/10 px-3 py-2.5">
                    <Phone size={17} className="mt-0.5 text-emerald-200" />
                    <p className="font-semibold text-sm tracking-wide">{report.contact_phone || '—'}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3.5">
                <p className="text-sm font-semibold text-orange-600">আপনি কি এই ব্যক্তিকে চেনেন?</p>
                <p className="text-xs text-orange-600 font-medium mt-1">যোগাযোগকারীর সাথে যোগাযোগ করুন বা নিকটস্থ থানায় জানান।</p>
              </div>

              {(report.physical_description || report.additional_info) && (
                <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm space-y-3">
                  {report.physical_description && (
                    <div>
                      <p className="text-xs font-semibold text-slate-700 mb-1">বিস্তারিত শারীরিক বর্ণনা</p>
                      <p className="text-xs text-slate-600 leading-relaxed">{report.physical_description}</p>
                    </div>
                  )}
                  {report.additional_info && (
                    <div>
                      <p className="text-xs font-semibold text-slate-700 mb-1">অতিরিক্ত তথ্য</p>
                      <p className="text-xs text-slate-600 leading-relaxed">{report.additional_info}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
