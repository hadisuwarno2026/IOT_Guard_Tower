/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Eye, Wifi, ShieldCheck, Siren, Cpu, RefreshCw, Radio, Server, Zap, 
  Terminal, ShieldAlert 
} from 'lucide-react';
import { Site, DeviceStatusLog } from '../types.ts';

interface DeviceStatusTabProps {
  sites: Site[];
  deviceLogs: DeviceStatusLog[];
  onInjectTestAlarm: (siteId: string, grounding: string | null, door: string | null) => void;
  onMuteSiren: (siteId: string, action: 'MUTE' | 'ON') => void;
}

export default function DeviceStatusTab({ sites, deviceLogs, onInjectTestAlarm, onMuteSiren }: DeviceStatusTabProps) {
  const [selectedSiteId, setSelectedSiteId] = useState<string>('BTS-001');

  const selectedSite = sites.find(s => s.siteId === selectedSiteId) || sites[0] || {
    siteId: '',
    siteName: 'Tidak Ada Data',
    location: '-',
    latitude: 0,
    longitude: 0,
    grounding: 'NORMAL',
    door: 'TERTUTUP',
    sirene: 'OFF',
    gsm: '3G',
    rssi: 0,
    status: 'OFFLINE',
    lastSeen: '',
    rectifier: 'NORMAL',
    battery: 'NORMAL',
    acPower: 'NORMAL',
    temperature: 0,
    isMuted: false
  };

  const getSignalStrengthQuality = (rssi: number) => {
    if (rssi >= -70) return { label: 'EXCELLENT', color: 'text-emerald-500', barCount: 4 };
    if (rssi >= -85) return { label: 'GOOD', color: 'text-blue-500', barCount: 3 };
    if (rssi >= -95) return { label: 'FAIR / WEAK', color: 'text-amber-500', barCount: 2 };
    return { label: 'POOR / DROPPING', color: 'text-red-500', barCount: 1 };
  };

  const getReadableTime = (isoStr: string) => {
    try {
      const date = new Date(isoStr);
      return date.toLocaleTimeString('id-ID') + ' ' + date.toLocaleDateString('id-ID');
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header section */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Radio className="text-blue-500" />
            DEVICE STATUS
          </h2>
        </div>

        <div className="flex gap-2 items-center">
          <span className="text-xs font-mono font-bold text-slate-400">PILIH SITE:</span>
          <select
            value={selectedSiteId}
            onChange={(e) => setSelectedSiteId(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-1.5 font-mono focus:outline-none"
          >
            {sites.map(s => (
              <option key={s.siteId} value={s.siteId}>
                {s.siteId} - {s.siteName}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT CARD - SENSOR PIN CORRELATION (12 Columns) */}
        <div className="lg:col-span-12 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-2 tracking-tight uppercase font-mono">ARDUINO PIN CORRELATION &amp; HARDWARE CHANNELS</h3>
            <p className="text-xs text-slate-500 font-mono mb-5 leading-normal">
              Status logika pin mikro-kontroller ESP32 yang disesuaikan dengan interkoneksi wiring diagram fisik:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              
              {/* Grounding switch (GPIO18) */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-mono bg-indigo-50 border border-indigo-150 text-indigo-700 px-2 py-0.5 rounded font-black uppercase">
                      GPIO18 INTERRUPT
                    </span>
                    <span className="text-[10px] font-mono font-bold text-slate-400">PULLDOWN</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase font-mono mt-2">Grounding Switch Loop</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5 mb-4 leading-normal">Mendeteksi integritas kawat tembaga grounding copper pad.</p>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-mono">DI-1 Logika input:</span>
                  <span className={`px-2.5 py-1 rounded-xl text-xs font-bold font-mono ${
                    selectedSite.grounding === 'PUTUS' 
                      ? 'bg-red-500 text-white animate-pulse' 
                      : 'bg-emerald-500 text-white'
                  }`}>
                    {selectedSite.grounding === 'PUTUS' ? 'HIGH (BROKEN)' : 'LOW (CONNECTED)'}
                  </span>
                </div>

                <button
                  onClick={() => onInjectTestAlarm(selectedSite.siteId, selectedSite.grounding === 'PUTUS' ? 'NORMAL' : 'PUTUS', null)}
                  className={`w-full mt-3 py-1.5 rounded-xl text-[11px] font-semibold border transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    selectedSite.grounding === 'PUTUS'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                      : 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                  }`}
                >
                  {selectedSite.grounding === 'PUTUS' ? 'Set LOW (Sambungkan)' : 'Set HIGH (Putuskan)'}
                </button>
              </div>

              {/* Door intrusion (GPIO19) */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-mono bg-indigo-50 border border-indigo-150 text-indigo-700 px-2 py-0.5 rounded font-black uppercase">
                      GPIO19 INTERRUPT
                    </span>
                    <span className="text-[10px] font-mono font-bold text-slate-400">PULLDOWN</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase font-mono mt-2">Door Magnetic switch</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5 mb-4 leading-normal">Mendeteksi pembukaan pintu shelter oleh magnetik switch.</p>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-mono">DI-2 Logika input:</span>
                  <span className={`px-2.5 py-1 rounded-xl text-xs font-bold font-mono ${
                    selectedSite.door === 'TERBUKA' 
                      ? 'bg-amber-500 text-white' 
                      : 'bg-emerald-500 text-white'
                  }`}>
                    {selectedSite.door === 'TERBUKA' ? 'HIGH (SHELTER OPEN)' : 'LOW (LOCKED)'}
                  </span>
                </div>

                <button
                  onClick={() => onInjectTestAlarm(selectedSite.siteId, null, selectedSite.door === 'TERBUKA' ? 'TERTUTUP' : 'TERBUKA')}
                  className={`w-full mt-3 py-1.5 rounded-xl text-[11px] font-semibold border transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    selectedSite.door === 'TERBUKA'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                      : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                  }`}
                >
                  {selectedSite.door === 'TERBUKA' ? 'Set LOW (Kunci Pintu)' : 'Set HIGH (Buka Pintu)'}
                </button>
              </div>

              {/* Relay Sirene (GPIO23) */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-mono bg-pink-50 border border-pink-200 text-pink-700 px-2 py-0.5 rounded font-black uppercase">
                      GPIO23 OUTPUT
                    </span>
                    <span className="text-[10px] font-mono font-bold text-slate-400">RELAY DRIVER</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase font-mono mt-2">Relay Sirine Alarm</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5 mb-4 leading-normal">Transistor driver kelistrikan sirine klakson 12V DC shelter.</p>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-mono">DO-1 Logika output:</span>
                  <span className={`px-2.5 py-1 rounded-xl text-xs font-bold font-mono ${
                    selectedSite.sirene === 'ON' 
                      ? 'bg-rose-600 text-white animate-pulse' 
                      : 'bg-slate-600 text-white'
                  }`}>
                    {selectedSite.sirene === 'ON' ? 'HIGH (SIRENE ON)' : 'LOW (SIRENE OFF)'}
                  </span>
                </div>

                <button
                  onClick={() => onMuteSiren(selectedSite.siteId, selectedSite.sirene === 'ON' ? 'MUTE' : 'ON')}
                  className={`w-full mt-3 py-1.5 rounded-xl text-[11px] font-semibold border transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    selectedSite.sirene === 'ON'
                      ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                      : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {selectedSite.sirene === 'ON' ? 'Bungkam Sirine (Set LOW)' : 'Nyalakan Sirine (Set HIGH)'}
                </button>
              </div>

              {/* Teknologi Link GSM Module Card */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-mono bg-indigo-50 border border-indigo-150 text-indigo-700 px-2 py-0.5 rounded font-black uppercase">
                      GSM MODEM
                    </span>
                    <span className="text-[10px] font-mono font-bold text-slate-400">SIM800L</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase font-mono mt-2">Teknologi Link</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5 mb-4 leading-normal">Modul konektivitas jaringan nirkabel seluler untuk transmisi telemetri.</p>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-mono">Jaringan:</span>
                  <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-xl text-xs font-bold font-mono uppercase">
                    {selectedSite.gsm} LINK
                  </span>
                </div>
              </div>

            </div>
          </div>

          <div className="mt-4 p-4 bg-[#F8FAFC] rounded-2xl border border-slate-200 text-xs flex flex-wrap gap-4 items-center justify-between">
            <span className="font-mono text-slate-500">GSM MODEM: SIM800L GPRS QUAD-BAND RECEIVER (AT+HTTPACTION SUPPORT)</span>
            <span className="font-bold text-slate-700">WAKTU DETAK TERAKHIR: {getReadableTime(selectedSite.lastSeen)}</span>
          </div>
        </div>

      </div>

      {/* RECENT TELEMETRY SINKRONISASI LOGS TABLE */}
      <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-800 tracking-tight uppercase font-mono">LOG TELEMETRI REALTIME (20 TRACE TERAKHIR)</h3>
        
        <div className="border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-mono text-slate-500 uppercase font-bold uppercase">
                  <th className="py-2.5 px-3">Waktu Telemetri</th>
                  <th className="py-2.5 px-3">Site ID</th>
                  <th className="py-2.5 px-3">Nama BTS</th>
                  <th className="py-2.5 px-3 font-mono">Grounding</th>
                  <th className="py-2.5 px-3 font-mono">Pintu</th>
                  <th className="py-2.5 px-3 font-mono">Sirene</th>
                  <th className="py-2.5 px-3 font-mono">RSSI</th>
                  <th className="py-2.5 px-3 font-mono">GSM</th>
                </tr>
              </thead>
              <tbody className="divide-y text-[11px] font-mono text-slate-600">
                {deviceLogs.slice(0, 20).map((log, index) => {
                  const isGroundingBroken = log.grounding === 'PUTUS';
                  const isDoorOpened = log.door === 'TERBUKA';
                  return (
                    <tr key={index} className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-slate-500 select-none">
                        {getReadableTime(log.timestamp)}
                      </td>
                      <td className="py-2 px-3 font-bold text-slate-800">
                        {log.siteId}
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-800 font-sans">
                        {log.siteName}
                      </td>
                      <td className={`py-2 px-3 font-bold ${isGroundingBroken ? 'text-red-500' : 'text-emerald-600'}`}>
                        {log.grounding}
                      </td>
                      <td className={`py-2 px-3 font-bold ${isDoorOpened ? 'text-amber-500' : 'text-emerald-600'}`}>
                        {log.door}
                      </td>
                      <td className="py-2 px-3 font-bold">
                        {log.sirene}
                      </td>
                      <td className="py-2 px-3 text-slate-800">
                        {log.rssi} dBm
                      </td>
                      <td className="py-2 px-3 text-indigo-600 font-bold uppercase">
                        {log.gsm}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}
