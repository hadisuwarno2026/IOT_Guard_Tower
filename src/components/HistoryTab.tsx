/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Search, Calendar, Filter, Trash2, HelpCircle, HardDriveDownload } from 'lucide-react';
import { AlarmLog } from '../types.ts';

interface HistoryTabProps {
  alarmLogs: AlarmLog[];
  onClearLogs: () => void;
}

export default function HistoryTab({ alarmLogs, onClearLogs }: HistoryTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'CLOSED'>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  const filteredLogs = alarmLogs.filter(log => {
    const matchesSearch = log.siteId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.siteName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.keterangan.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || log.status === statusFilter;
    
    const matchesType = typeFilter === 'ALL' || log.alarmType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const getReadableDateTime = (isoStr: string) => {
    try {
      const date = new Date(isoStr);
      return date.toLocaleDateString('id-ID') + ' ' + date.toLocaleTimeString('id-ID');
    } catch(e) {
      return '2026-06-23';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header section */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Calendar className="text-indigo-500" />
            RIWAYAT LOG ALARM
          </h2>
        </div>
      </div>

      {/* Control filters panel */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
        
        {/* Search */}
        <div className="relative w-full md:max-w-xs">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Cari Site ID, keterangan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">Status</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-2.5 py-1.5 font-mono focus:outline-none"
            >
              <option value="ALL">ALL EVENTS</option>
              <option value="ACTIVE">ACTIVE ONLY</option>
              <option value="CLOSED">RESOLVED ONLY</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">ALARM TYPE</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-2.5 py-1.5 font-mono focus:outline-none"
            >
              <option value="ALL">ALL TYPES</option>
              <option value="GROUNDING_PUTUS">GROUNDING PUTUS</option>
              <option value="PINTU_TERBUKA">PINTU TERBUKA</option>
              <option value="AC_POWER_FAIL">AC POWER DROP</option>
              <option value="ESP32_OFFLINE">ESP32 OFFLINE</option>
            </select>
          </div>

        </div>

      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">
                <th className="py-3 px-4 font-bold">Waktu Alarm</th>
                <th className="py-3 px-4 font-bold">Site ID</th>
                <th className="py-3 px-4 font-bold">Nama BTS</th>
                <th className="py-3 px-4 font-bold">Tipe Alarm</th>
                <th className="py-3 px-4 font-bold">Kondisi Status</th>
                <th className="py-3 px-4 font-bold">Keterangan Teknis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Tidak ada logs riwayat alarm yang cocok dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => {
                  const isActive = log.status === 'ACTIVE';
                  const isGrounding = log.alarmType === 'GROUNDING_PUTUS';

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-slate-600">
                        {getReadableDateTime(log.timestamp)}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">
                        {log.siteId}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">
                        {log.siteName}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          isGrounding 
                            ? 'bg-red-50 text-red-700 border border-red-200' 
                            : log.alarmType === 'PINTU_TERBUKA' 
                            ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {log.alarmType.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          isActive 
                            ? 'bg-rose-500 text-white animate-pulse' 
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {isActive ? 'CRITICAL (ACTIVE)' : 'CLOSED / CURED'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 leading-normal max-w-sm">
                        {log.keterangan}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
