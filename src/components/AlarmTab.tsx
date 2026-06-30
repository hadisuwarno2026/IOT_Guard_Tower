/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Siren, VolumeX, Volume2, ShieldAlert, Zap, AlertTriangle, Play, HelpCircle, 
  Trash2, RefreshCw, Layers, CheckCircle 
} from 'lucide-react';
import { Site, AlarmLog, User } from '../types.ts';

interface AlarmTabProps {
  sites: Site[];
  alarmLogs: AlarmLog[];
  currentUser: User;
  onMuteSiren: (siteId: string, action: 'MUTE' | 'ON') => void;
  onInjectTestAlarm: (siteId: string, grounding: string | null, door: string | null) => void;
  onResetAll: () => void;
  onClearLogs: () => void;
}

export default function AlarmTab({
  sites,
  alarmLogs,
  currentUser,
  onMuteSiren,
  onInjectTestAlarm,
  onResetAll,
  onClearLogs
}: AlarmTabProps) {
  const [selectedSiteId, setSelectedSiteId] = useState<string>('BTS-001');
  const [isResetting, setIsResetting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const activeAlarmsSites = sites.filter(s => s.grounding === 'PUTUS' || s.door === 'TERBUKA');
  const activeAlarmsLogsList = alarmLogs.filter(log => log.status === 'ACTIVE');

  const handleResetAllAction = () => {
    setIsResetting(true);
    setTimeout(() => {
      onResetAll();
      setIsResetting(false);
    }, 600);
  };

  const handleClearLogsAction = () => {
    if (confirm('Apakah Anda yakin ingin menghapus semua riwayat logs dan alarm?')) {
      setIsClearing(true);
      setTimeout(() => {
        onClearLogs();
        setIsClearing(false);
      }, 600);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header with quick diagnostic buttons */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Siren className="text-rose-500 animate-spin" />
            KONTROL ALARM SIRENE
          </h2>
        </div>

        {currentUser.role === 'admin' && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleResetAllAction}
              disabled={isResetting}
              className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-xl transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle size={15} />
              {isResetting ? 'Mereset...' : 'reset alarm all'}
            </button>
            <button
              onClick={handleClearLogsAction}
              disabled={isClearing}
              className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-xl transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <Trash2 size={15} />
              {isClearing ? 'Membersihkan...' : 'Bersihkan Logs'}
            </button>
          </div>
        )}
      </div>

      {/* ALERT PANEL SHOWCASE (Large visual warnings when alarms exist) */}
      <div className="space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider font-mono text-slate-400">ACTIVE EMERGENCY SHELTER PANELS</span>
        
        {activeAlarmsSites.length === 0 ? (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-6 text-center shadow-sm flex flex-col items-center justify-center">
            <CheckCircle size={44} className="text-emerald-500 mb-2" />
            <h3 className="text-base font-bold">Seluruh Shelter Dalam Keadaan Aman</h3>
            <p className="text-xs font-mono text-emerald-600 mt-1 max-w-lg">
              Semua kabel tembaga grounding tersambung stabil (Ground &lt; 5 Ohm) dan pintu shelter terkunci rapat.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeAlarmsSites.map(site => {
              const isGroundingBroken = site.grounding === 'PUTUS';
              const isDoorOpened = site.door === 'TERBUKA';

              return (
                <div key={site.siteId} className="space-y-4">
                  
                  {/* Case 1: GROUNDING PUTUS (PANEL MERAH) */}
                  {isGroundingBroken && (
                    <div className="bg-red-500 border border-red-600 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden animate-pulse">
                      <div className="absolute right-[-10px] top-[-10px] opacity-10 pointer-events-none">
                        <Siren size={120} />
                      </div>
                      
                      <div className="relative z-10 flex flex-col justify-between h-full">
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-mono tracking-wider bg-black/35 px-2.5 py-0.5 rounded font-bold uppercase">
                              CRITICAL THREAT
                            </span>
                            <span className="text-xs font-mono font-medium">Site ID: {site.siteId}</span>
                          </div>

                          <h3 className="text-2xl font-black tracking-tight mb-1 flex items-center gap-1.5">
                            <Zap className="text-white fill-white" />
                            GROUNDING PUTUS
                          </h3>
                          <h4 className="text-sm font-semibold opacity-90 mb-3">{site.siteName}</h4>
                          
                          <p className="text-xs opacity-90 leading-relaxed mb-5">
                            Sensor mendeteksi loop kawat tembaga grounding terputus atau rusak. Resiko tinggi induksi petir dan kerusakan rectifier.
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/20">
                          <div className="text-xs font-mono">
                            SIRENE LOKAL STATUS: <span className="font-bold underline">{site.sirene}</span>
                          </div>

                          {site.isMuted ? (
                            <button
                              onClick={() => onMuteSiren(site.siteId, 'ON')}
                              className="px-3.5 py-2 bg-emerald-600 text-white hover:bg-emerald-700 font-bold rounded-xl text-xs transition-all flex items-center gap-1 cursor-pointer border border-transparent"
                            >
                              <Volume2 size={14} strokeWidth={2.5} />
                              AKTIFKAN SIRENE (ON)
                            </button>
                          ) : (
                            <button
                              onClick={() => onMuteSiren(site.siteId, 'MUTE')}
                              className="px-3.5 py-2 bg-white text-red-600 hover:bg-slate-150 font-bold rounded-xl text-xs transition-all flex items-center gap-1 cursor-pointer border border-transparent"
                            >
                              <VolumeX size={14} strokeWidth={2.5} />
                              SENYAPKAN (MUTE)
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Case 2: PINTU SHELTER TERBUKA (PANEL ORANGE) */}
                  {isDoorOpened && (
                    <div className="bg-amber-500 border border-amber-600 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
                      <div className="absolute right-[-10px] top-[-10px] opacity-10 pointer-events-none">
                        <ShieldAlert size={120} />
                      </div>

                      <div className="relative z-10 flex flex-col justify-between h-full">
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-mono tracking-wider bg-black/35 px-2.5 py-0.5 rounded font-bold uppercase">
                              SECURITY WARNING
                            </span>
                            <span className="text-xs font-mono font-medium">Site ID: {site.siteId}</span>
                          </div>

                          <h3 className="text-2xl font-black tracking-tight mb-1 flex items-center gap-1.5">
                            <ShieldAlert className="text-white" />
                            PINTU BTS TERBUKA
                          </h3>
                          <h4 className="text-sm font-semibold opacity-90 mb-3">{site.siteName}</h4>

                          <p className="text-xs opacity-90 leading-relaxed mb-5">
                            Pintu shelter BTS dipastikan terbuka tanpa dijadwalkan otorisasi pemeliharaan. Indikasi pencurian baterai rectifier atau vandalisme.
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/20">
                          <div className="text-xs font-mono">
                            SIRENE LOKAL STATUS: <span className="font-bold underline">{site.sirene}</span>
                          </div>

                          {site.isMuted ? (
                            <button
                              onClick={() => onMuteSiren(site.siteId, 'ON')}
                              className="px-3.5 py-2 bg-emerald-600 text-white hover:bg-emerald-700 font-bold rounded-xl text-xs transition-all flex items-center gap-1 cursor-pointer border border-transparent"
                            >
                              <Volume2 size={14} strokeWidth={2.5} />
                              AKTIFKAN SIRENE (ON)
                            </button>
                          ) : (
                            <button
                              onClick={() => onMuteSiren(site.siteId, 'MUTE')}
                              className="px-3.5 py-2 bg-white text-amber-600 hover:bg-slate-150 font-bold rounded-xl text-xs transition-all flex items-center gap-1 cursor-pointer border border-transparent"
                            >
                              <VolumeX size={14} strokeWidth={2.5} />
                              SENYAPKAN (MUTE)
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* DIAGNOSTIC PLAYGROUND LAB (Manual Alarm Injectors for client testing) */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 mb-2 tracking-tight uppercase font-mono">MANUAL DIAGNOSTIC INJECTOR (LAB PLAYGROUND)</h3>
        <p className="text-xs text-slate-500 font-mono mb-4">
          Gunakan panel ini untuk menginjeksi status buatan (Grounding putus, pintu terbuka) pada target site terpilih tanpa memerlukan perangkat ESP32 fisik.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          
          <div className="md:col-span-4 space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5 font-bold">
                PILIH TARGET SITE
              </label>
              <select
                value={selectedSiteId}
                onChange={(e) => setSelectedSiteId(e.target.value)}
                className="block w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2.5 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                {sites.map(s => (
                  <option key={s.siteId} value={s.siteId}>
                    {s.siteId} - {s.siteName} (Ground: {s.grounding}, Pintu: {s.door})
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl space-y-1.5">
              <span className="text-[10px] font-mono text-slate-400 block font-bold">INFO OPERATOR PRIVILEGES</span>
              <span className="text-[11px] text-slate-600 block">
                Anda login sebagai <strong className="font-semibold text-slate-800">{currentUser.displayName}</strong> ({currentUser.role}).
              </span>
              {currentUser.role !== 'admin' && (
                <span className="text-[10px] text-amber-500 bg-amber-50 border border-amber-200/50 p-1.5 rounded block font-mono">
                  ⚠️ Viewer hanya bisa memantau. Ganti role sebagai ADMIN di menu Login/User Management untuk memicu tes.
                </span>
              )}
            </div>
          </div>

          <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            <button
              onClick={() => onInjectTestAlarm(selectedSiteId, 'PUTUS', null)}
              disabled={currentUser.role !== 'admin'}
              className="p-4 bg-slate-50 hover:bg-red-50 border border-slate-200 hover:border-red-200 disabled:opacity-40 text-slate-700 hover:text-red-700 rounded-2xl flex flex-col items-center text-center justify-center gap-1.5 font-medium text-xs transition-all cursor-pointer shadow-sm group-hover:scale-102"
            >
              <Zap size={22} className="text-slate-400 group-hover:text-red-500" />
              <span className="font-bold uppercase tracking-wider font-mono text-[9px] text-slate-400">GPIO18 PULLUP</span>
              <span>Injeksi Grounding Putus</span>
            </button>

            <button
              onClick={() => onInjectTestAlarm(selectedSiteId, null, 'TERBUKA')}
              disabled={currentUser.role !== 'admin'}
              className="p-4 bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-200 disabled:opacity-40 text-slate-700 hover:text-amber-700 rounded-2xl flex flex-col items-center text-center justify-center gap-1.5 font-medium text-xs transition-all cursor-pointer shadow-sm"
            >
              <ShieldAlert size={22} className="text-slate-400" />
              <span className="font-bold uppercase tracking-wider font-mono text-[9px] text-slate-400">GPIO19 PULLUP</span>
              <span>Injeksi Pintu Terbuka</span>
            </button>

            <button
              onClick={() => onInjectTestAlarm(selectedSiteId, 'NORMAL', 'TERTUTUP')}
              disabled={currentUser.role !== 'admin'}
              className="p-4 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 disabled:opacity-40 text-slate-700 hover:text-emerald-700 rounded-2xl flex flex-col items-center text-center justify-center gap-1.5 font-medium text-xs transition-all cursor-pointer shadow-sm"
            >
              <CheckCircle size={22} className="text-slate-400" />
              <span className="font-bold uppercase tracking-wider font-mono text-[9px] text-slate-400">DIAGNOSTIC NORMAL</span>
              <span>Cure Site / Normal</span>
            </button>

          </div>

        </div>
      </div>
    </div>
  );
}
