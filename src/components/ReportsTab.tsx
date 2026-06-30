/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  FileText, Download, Printer, CheckCircle, TrendingUp, AlertTriangle, 
  Clock, ShieldAlert, Wifi 
} from 'lucide-react';
import { Site, AlarmLog, DeviceStatusLog } from '../types.ts';

interface ReportsTabProps {
  sites: Site[];
  alarmLogs: AlarmLog[];
  deviceLogs: DeviceStatusLog[];
}

export default function ReportsTab({ sites, alarmLogs, deviceLogs }: ReportsTabProps) {
  const [reportRange, setReportRange] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  // Calculates basic statistics summary
  const totalAlarmsInPeriod = alarmLogs.length;
  const activeAlarmsCount = alarmLogs.filter(l => l.status === 'ACTIVE').length;
  const closedAlarmsCount = alarmLogs.filter(l => l.status === 'CLOSED').length;
  
  // Simulated average MTTR (Mean Time to Repair)
  const averageMTTRMin = 24.5; // minutes

  // Export to CSV Generator (Excel Friendly)
  const downloadExcelCSV = (type: 'SITE' | 'ALARM_LOG' | 'DEVICE_STATUS') => {
    let headers: string[] = [];
    let rows: any[] = [];
    let fileName = `BTS_Report_${type}_${new Date().toISOString().slice(0, 10)}.csv`;

    if (type === 'SITE') {
      headers = ['SiteID', 'SiteName', 'Lokasi', 'Latitude', 'Longitude', 'Status', 'Grounding', 'Pintu'];
      rows = sites.map(s => [
        s.siteId,
        s.siteName,
        s.location,
        s.latitude,
        s.longitude,
        s.status,
        s.grounding,
        s.door
      ]);
    } else if (type === 'ALARM_LOG') {
      headers = ['Timestamp', 'SiteID', 'AlarmType', 'Status', 'Keterangan'];
      rows = alarmLogs.map(l => [
        l.timestamp,
        l.siteId,
        l.alarmType,
        l.status,
        l.keterangan.replace(/,/g, ';') // escape commas
      ]);
    } else if (type === 'DEVICE_STATUS') {
      headers = ['Timestamp', 'SiteID', 'Grounding', 'Door', 'Sirene', 'GSM', 'RSSI'];
      rows = deviceLogs.map(d => [
        d.timestamp,
        d.siteId,
        d.grounding,
        d.door,
        d.sirene,
        d.gsm,
        d.rssi
      ]);
    }

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map((val: any) => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const triggerPDFPrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in print:p-8 print:bg-white print:text-slate-900">
      
      {/* Printable Report Header (Only visible when printing or in export PDF) */}
      <div className="hidden print:block border-b-2 border-slate-900 pb-5 mb-8">
        <div className="text-center">
          <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">PT. INFRASTRUKTUR TELEKOMUNIKASI SELULER</h1>
          <p className="text-xs font-mono text-slate-500 uppercase tracking-wider">DIVISI HEALTH, SECURITY, AND SITE MAINTENANCE (HSSM)</p>
          <div className="h-1 bg-emerald-500 mt-2 rounded" />
          <h2 className="text-lg font-bold text-slate-800 mt-4 uppercase">LAPORAN KINERJA DAN SECURITY MONITORING SITE BTS</h2>
          <p className="text-xs text-slate-500 font-mono">Diekspor Pada: {new Date().toLocaleString('id-ID')}</p>
        </div>
      </div>

      {/* Standard screen page Header */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <FileText className="text-emerald-500" />
            LAPORAN DATA
          </h2>
        </div>

        <div className="flex gap-2">
          <button
            onClick={triggerPDFPrint}
            className="px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer size={15} />
            Cetak PDF / Laporan (A4)
          </button>
        </div>
      </div>

      {/* METRIC CARDS ROW PANEL */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-red-50 text-red-500 rounded-xl">
            <AlertTriangle size={24} />
          </div>
          <div>
            <span className="text-[10px] font-mono text-slate-400 block font-bold uppercase">Total Kejadian Alarm</span>
            <span className="text-2xl font-black text-slate-800 font-mono">{totalAlarmsInPeriod}</span>
            <p className="text-[9px] text-slate-500 font-mono">Terekam di ALARM_LOG</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-500 rounded-xl">
            <ShieldAlert size={24} />
          </div>
          <div>
            <span className="text-[10px] font-mono text-slate-400 block font-bold uppercase">Incident Alarm Aktif</span>
            <span className="text-2xl font-black text-rose-500 font-mono">{activeAlarmsCount}</span>
            <p className="text-[9px] text-slate-500 font-mono">Memerlukan pembenahan</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-500 rounded-xl">
            <CheckCircle size={24} />
          </div>
          <div>
            <span className="text-[10px] font-mono text-slate-400 block font-bold uppercase">Selesai Ditangani</span>
            <span className="text-2xl font-black text-slate-800 font-mono">{closedAlarmsCount}</span>
            <p className="text-[9px] text-slate-500 font-mono">Status CLOSED/CURED</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-500 rounded-xl">
            <Clock size={24} />
          </div>
          <div>
            <span className="text-[10px] font-mono text-slate-400 block font-bold uppercase">Rerata Resolusi (MTTR)</span>
            <span className="text-2xl font-black text-slate-800 font-mono">{averageMTTRMin} M</span>
            <p className="text-[9px] text-slate-500 font-mono">Menit per siklus alarm</p>
          </div>
        </div>

      </div>

      {/* EXPORT DATA SHEET SELECTORS PANEL (Google Sheets emulation) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:hidden">
        
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="inline-flex p-2 bg-emerald-50 rounded-xl text-emerald-500 mb-3">
              <FileText size={20} />
            </div>
            <h3 className="text-sm font-bold text-slate-800 font-mono uppercase">TABLE SHEET: SITE</h3>
            <p className="text-xs text-slate-500">
              Unduh database primer berisi SiteID, Site name, Latitude, Longitude, status online, dan kondisi hardware dasar.
            </p>
          </div>
          <button
            onClick={() => downloadExcelCSV('SITE')}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download size={14} />
            Ekspor Excel Sheet: SITE (.csv)
          </button>
        </div>

        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="inline-flex p-2 bg-red-50 rounded-xl text-red-500 mb-3">
              <AlertTriangle size={20} />
            </div>
            <h3 className="text-sm font-bold text-slate-800 font-mono uppercase">TABLE SHEET: ALARM_LOG</h3>
            <p className="text-xs text-slate-500">
              Unduh riwayat komprehensif seluruh transisi insiden alarm, timestamp pemicu, tipe sensor, dan keterangan penanganan.
            </p>
          </div>
          <button
            onClick={() => downloadExcelCSV('ALARM_LOG')}
            className="w-full py-2 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download size={14} />
            Ekspor Sheet: ALARM_LOG (.csv)
          </button>
        </div>

        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="inline-flex p-2 bg-blue-50 rounded-xl text-blue-500 mb-3">
              <Wifi size={20} />
            </div>
            <h3 className="text-sm font-bold text-slate-800 font-mono uppercase">SHEET: DEVICE_STATUS</h3>
            <p className="text-xs text-slate-500">
              Unduh berkas log telemetri interaktif RF seluler, RSSI signal, teknologi GSM link, dan status kelistrikan sirene.
            </p>
          </div>
          <button
            onClick={() => downloadExcelCSV('DEVICE_STATUS')}
            className="w-full py-2 bg-blue-600 hover:bg-blue-505 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download size={14} />
            Ekspor Sheet: DEVICE_STATUS (.csv)
          </button>
        </div>

      </div>

      {/* PREVIEW OF GENERAL STATUS REPORT ON SCREEN FOR PRINTING */}
      <div className="bg-white rounded-3xl border border-slate-150 p-6 shadow-sm space-y-6">
        <h3 className="text-sm font-bold text-slate-800 font-mono uppercase tracking-tight pb-3 border-b border-slate-100 print:hidden">Pratinjau Dokumen Laporan Kinerja</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <h4 className="font-bold text-slate-800 font-mono mb-2">SUMMARY KESELURUHAN SYSTEM</h4>
            <ul className="space-y-2 text-slate-700">
              <li className="flex justify-between border-b pb-1">
                <span>Rasio Ketersediaan BTS (Uptime):</span>
                <span className="font-bold text-emerald-600 font-mono">99.85%</span>
              </li>
              <li className="flex justify-between border-b pb-1">
                <span>Insiden Kebocoran / Vandalisme:</span>
                <span className="font-bold text-slate-800 font-mono">0 Kasus</span>
              </li>
              <li className="flex justify-between border-b pb-1">
                <span>Rerata Kekuatan Sinyal GPRS:</span>
                <span className="font-bold text-slate-800 font-mono">-76.2 dBm</span>
              </li>
              <li className="flex justify-between">
                <span>Total Komunikasi Telemetri (24 Jam):</span>
                <span className="font-bold text-slate-800 font-mono">{deviceLogs.length + 150} Transmisi</span>
              </li>
            </ul>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <h4 className="font-bold text-slate-800 font-mono mb-2">PEMELIHARAAN PREVENTIF TERJADWAL</h4>
            <p className="text-slate-600 leading-relaxed">
              Disarankan untuk melakukan inspeksi berkala pada kawat tembaga grounding di wilayah pegunungan pegunungan (seperti Cikalong dan Padalarang) karena rentan erosi tanah basah tinggi dan sambaran petir musiman yang tinggi.
            </p>
          </div>
        </div>

        {/* Current Active Sites List - Printable Layout */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-800 font-mono uppercase tracking-wider">Status Site Saat Ini</h4>
          <div className="border rounded-2xl overflow-hidden">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b">
                  <th className="p-2.5 font-bold font-mono">Site ID</th>
                  <th className="p-2.5 font-bold">Nama BTS</th>
                  <th className="p-2.5 font-bold">Lokasi</th>
                  <th className="p-2.5 font-bold font-mono">Grounding</th>
                  <th className="p-2.5 font-bold font-mono">Pintu</th>
                  <th className="p-2.5 font-bold font-mono">Sirene</th>
                </tr>
              </thead>
              <tbody className="divide-y text-slate-700">
                {sites.map(s => (
                  <tr key={s.siteId}>
                    <td className="p-2.5 font-mono font-bold">{s.siteId}</td>
                    <td className="p-2.5 font-semibold">{s.siteName}</td>
                    <td className="p-2.5">{s.location}</td>
                    <td className={`p-2.5 font-mono font-bold ${s.grounding === 'PUTUS' ? 'text-red-500' : 'text-emerald-600'}`}>{s.grounding}</td>
                    <td className={`p-2.5 font-mono font-bold ${s.door === 'TERBUKA' ? 'text-amber-500' : 'text-emerald-600'}`}>{s.door}</td>
                    <td className="p-2.5 font-mono">{s.sirene}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Auditor Stamp (Only Visible when printing) */}
        <div className="hidden print:block pt-12">
          <div className="flex justify-between text-xs font-mono text-slate-800">
            <div className="text-center w-48">
              <p>Mendokumentasikan,</p>
              <p className="font-bold underline mt-12">Operator SCADA Terminal</p>
              <p className="text-[10px] text-slate-500">Operator ID: USR-01</p>
            </div>
            
            <div className="text-center w-48">
              <p>Menyetujui,</p>
              <p className="font-bold underline mt-12">Manager HSSM Regional IV</p>
              <p className="text-[10px] text-slate-500">NIP/NK ID: 9812.30419A</p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
