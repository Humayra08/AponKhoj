import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, MapPin, Phone, User } from 'lucide-react';
import { getPublishedReportById } from '../helpers/missingReportService';

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

export default function EmergencyDetailsPage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [report, setReport] = useState(null);

  useEffect(() => {
    let mounted = true;

    const loadReport = async () => {
      setLoading(true);
      setError('');

      const res = await getPublishedReportById(id);
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
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link to="/search" className="inline-flex items-center gap-2 text-sm text-primary hover:underline mb-5">
          <ArrowLeft size={15} /> রিপোর্ট তালিকায় ফিরে যান
        </Link>

        {loading && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse space-y-4">
            <div className="h-6 bg-gray-100 rounded w-1/3" />
            <div className="h-72 bg-gray-100 rounded-xl" />
            <div className="h-4 bg-gray-100 rounded w-2/3" />
            <div className="h-4 bg-gray-100 rounded w-1/2" />
          </div>
        )}

        {!loading && error && (
          <div className="bg-red-50 border border-red-100 text-red-700 rounded-2xl p-5">
            <p className="font-semibold">{error}</p>
          </div>
        )}

        {!loading && report && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="relative bg-gray-50">
              {report.photo_url ? (
                <img
                  src={report.photo_url}
                  alt={report.name || 'Report photo'}
                  className="w-full h-[420px] object-contain bg-gray-100"
                />
              ) : (
                <div className="w-full h-[340px] flex items-center justify-center text-gray-400 text-sm">ছবি পাওয়া যায়নি</div>
              )}
              <span className="absolute top-3 left-3 text-[11px] font-bold px-2 py-1 rounded-full bg-emerald-500 text-white">
                অনুমোদিত
              </span>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <h1 className="text-2xl font-black text-gray-800">{report.name || 'অজ্ঞাত ব্যক্তি'}</h1>
                <p className="text-sm text-gray-400 mt-1">রিপোর্ট আইডি: {formatBnNumber(report.id)}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-600"><User size={15} /> বয়স: {report.age != null ? `${formatBnNumber(report.age)} বছর` : '—'}</div>
                <div className="flex items-center gap-2 text-gray-600"><User size={15} /> লিঙ্গ: {report.gender || '—'}</div>
                <div className="flex items-center gap-2 text-gray-600"><Calendar size={15} /> সর্বশেষ দেখা: {formatDateBN(report.last_seen_date)}</div>
                <div className="flex items-center gap-2 text-gray-600"><Clock size={15} /> সময়: {report.last_seen_time || '—'}</div>
                <div className="flex items-center gap-2 text-gray-600 md:col-span-2"><MapPin size={15} /> ঠিকানা: {report.address ? `${report.address}, ${report.district || ''}` : (report.district || '—')}</div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">পোশাকের বিবরণ</p>
                <p className="text-sm text-gray-700">{report.clothing_description || 'উল্লেখ নেই'}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">অতিরিক্ত তথ্য</p>
                <p className="text-sm text-gray-700">{report.additional_info || 'উল্লেখ নেই'}</p>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold text-gray-500 mb-2">যোগাযোগ</p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm text-gray-700">
                  <span>নাম: {report.contact_person_name || '—'}</span>
                  <span className="inline-flex items-center gap-1"><Phone size={14} /> {report.contact_phone || '—'}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
