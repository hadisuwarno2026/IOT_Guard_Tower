/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Settings, Save, Globe, Send, Radio, Code2, AlertTriangle, Check, 
  Copy, Eye, MessageSquare, Play, Plus, Trash2, X, Volume2, Upload, Square,
  Database
} from 'lucide-react';
import { IntegrationConfig, User } from '../types.ts';
import { GOOGLE_APPS_SCRIPT_CODE, ESP32_HARDWARE_CODE, SUPABASE_SQL_DDL } from '../codeSnippets.ts';

interface SettingsTabProps {
  config: IntegrationConfig;
  onSaveConfig: (cfg: IntegrationConfig) => void;
  currentUser: User;
}

export default function SettingsTab({ config, onSaveConfig, currentUser }: SettingsTabProps) {
  const [gasUrl, setGasUrl] = useState(config.gasUrl);
  const [whatsappProvider, setWhatsappProvider] = useState(config.whatsappProvider);
  const [whatsappToken, setWhatsappToken] = useState(config.whatsappToken);
  const [whatsappPhone, setWhatsappPhone] = useState(config.whatsappPhone);
  const [newPhone, setNewPhone] = useState('');
  const [whatsappEnabled, setWhatsappEnabled] = useState(config.whatsappEnabled);
  const [muteDurationMin, setMuteDurationMin] = useState(config.muteDurationMin);
  const [supabaseUrl, setSupabaseUrl] = useState(config.supabaseUrl || '');
  const [supabaseKey, setSupabaseKey] = useState(config.supabaseKey || '');
  const [supabaseEnabled, setSupabaseEnabled] = useState(config.supabaseEnabled || false);

  const [activeSubTab, setActiveSubTab] = useState<'api' | 'gas_code' | 'esp_code' | 'sql_code'>('api');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedText, setCopiedText] = useState<'gas' | 'esp' | 'sql' | null>(null);

  // Simulated WhatsApp tester state
  const [testStatus, setTestStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  // SIREN SOUND CONFIGURATION STATE
  const [soundType, setSoundType] = useState<'SYNTH' | 'CUSTOM'>(
    (localStorage.getItem('siren_sound_type') as 'SYNTH' | 'CUSTOM') || 'SYNTH'
  );
  const [customAudioData, setCustomAudioData] = useState<string>(
    localStorage.getItem('siren_custom_sound') || ''
  );
  const [customAudioName, setCustomAudioName] = useState<string>(
    localStorage.getItem('siren_custom_sound_name') || ''
  );
  const [isPlayingTest, setIsPlayingTest] = useState(false);
  
  const testAudioRef = React.useRef<HTMLAudioElement | null>(null);
  const testOscIntervalRef = React.useRef<any>(null);
  const testOscContextRef = React.useRef<any>(null);

  const startTestAudio = () => {
    setIsPlayingTest(true);
    if (soundType === 'CUSTOM' && customAudioData) {
      if (testAudioRef.current) {
        testAudioRef.current.pause();
      }
      const audio = new Audio(customAudioData);
      audio.loop = true;
      audio.play().catch(err => {
        console.error('Playback failed', err);
        setIsPlayingTest(false);
      });
      testAudioRef.current = audio;
    } else {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        testOscContextRef.current = ctx;

        let toggleFreq = false;
        testOscIntervalRef.current = setInterval(() => {
          if (testOscContextRef.current && testOscContextRef.current.state !== 'closed') {
            const osc = testOscContextRef.current.createOscillator();
            const gainNode = testOscContextRef.current.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(toggleFreq ? 900 : 600, testOscContextRef.current.currentTime);
            gainNode.gain.setValueAtTime(0.12, testOscContextRef.current.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, testOscContextRef.current.currentTime + 0.35);

            osc.connect(gainNode);
            gainNode.connect(testOscContextRef.current.destination);

            osc.start();
            osc.stop(testOscContextRef.current.currentTime + 0.4);

            toggleFreq = !toggleFreq;
          }
        }, 450);
      } catch (err) {
        console.warn(err);
      }
    }
  };

  const stopTestAudio = () => {
    setIsPlayingTest(false);
    if (testAudioRef.current) {
      testAudioRef.current.pause();
      testAudioRef.current = null;
    }
    if (testOscIntervalRef.current) {
      clearInterval(testOscIntervalRef.current);
      testOscIntervalRef.current = null;
    }
    if (testOscContextRef.current) {
      try {
        testOscContextRef.current.close();
      } catch (e) {}
      testOscContextRef.current = null;
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file maksimal adalah 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setCustomAudioData(base64);
      setCustomAudioName(file.name);
      localStorage.setItem('siren_custom_sound', base64);
      localStorage.setItem('siren_custom_sound_name', file.name);
      stopTestAudio();
    };
    reader.readAsDataURL(file);
  };

  const handleSelectSoundType = (type: 'SYNTH' | 'CUSTOM') => {
    setSoundType(type);
    localStorage.setItem('siren_sound_type', type);
    stopTestAudio();
  };

  // Clean up test sound if tab changes
  React.useEffect(() => {
    return () => {
      stopTestAudio();
    };
  }, []);

  const phoneList = whatsappPhone
    ? whatsappPhone.split(/[,;\s]+/).map(p => p.trim()).filter(p => p.length > 0)
    : [];

  const handleAddPhone = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newPhone.trim();
    if (!trimmed) return;

    // Simple digits and + prefix check
    if (!/^\+?[0-9]{5,20}$/.test(trimmed)) {
      alert('Format nomor handphone tidak valid (gunakan angka saja, misal: 081234567890)');
      return;
    }

    if (phoneList.includes(trimmed)) {
      alert('Nomor handphone sudah ada di daftar.');
      return;
    }

    const updatedList = [...phoneList, trimmed];
    setWhatsappPhone(updatedList.join(', '));
    setNewPhone('');
  };

  const handleRemovePhone = (phoneToRemove: string) => {
    const updatedList = phoneList.filter(p => p !== phoneToRemove);
    setWhatsappPhone(updatedList.join(', '));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser.role !== 'admin') {
      alert('Hanya role ADMIN yang diijinkan mengubah konfigurasi integrasi.');
      return;
    }

    onSaveConfig({
      gasUrl,
      whatsappProvider,
      whatsappToken,
      whatsappPhone,
      whatsappEnabled,
      muteDurationMin,
      supabaseUrl,
      supabaseKey,
      supabaseEnabled
    });
    
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const copyToClipboard = (code: string, type: 'gas' | 'esp' | 'sql') => {
    navigator.clipboard.writeText(code);
    setCopiedText(type);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleTestWhatsApp = async () => {
    setTestStatus('sending');
    try {
      const res = await fetch('/api/test-whatsapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: currentUser?.displayName || 'Admin'
        })
      });
      if (res.ok) {
        const data = await res.json();
        const anyFailed = data.results?.some((r: any) => r.status === 'FAILED');
        if (anyFailed) {
          const errors = data.results
            .filter((r: any) => r.status === 'FAILED')
            .map((r: any) => `${r.phone}: ${r.error}`)
            .join('\n');
          alert(`Uji coba dikirim, namun ada kegagalan:\n${errors}`);
          setTestStatus('error');
        } else {
          setTestStatus('success');
        }
      } else {
        const data = await res.json();
        alert(data.error || 'Gagal mengirim uji coba notifikasi.');
        setTestStatus('error');
      }
    } catch (e: any) {
      console.error('[SettingsTab] Test WhatsApp error:', e);
      alert('Koneksi ke server gagal.');
      setTestStatus('error');
    } finally {
      setTimeout(() => setTestStatus('idle'), 3000);
    }
  };

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://tbig-guard.vercel.app';
  const dynamicEsp32Code = ESP32_HARDWARE_CODE.replace(
    'const String SERVER_URL = "https://tbig-guard.vercel.app/api/esp32";',
    `const String SERVER_URL = "${currentOrigin}/api/esp32";`
  );

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Settings Header */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Settings className="text-slate-600" />
            SINKRONISASI &amp; SETUP INTEGRASI
          </h2>
        </div>
      </div>

      {/* SUB TABS NAVIGATION BAR */}
      <div className="flex border-b border-slate-200 gap-1 print:hidden flex-wrap">
        <button
          onClick={() => setActiveSubTab('api')}
          className={`py-2.5 px-4 text-xs font-semibold tracking-tight border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'api' 
              ? 'border-emerald-500 text-emerald-600 font-bold' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Konfigurasi Endpoint API &amp; WA
        </button>
        <button
          onClick={() => setActiveSubTab('gas_code')}
          className={`py-2.5 px-4 text-xs font-semibold tracking-tight border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'gas_code' 
              ? 'border-emerald-500 text-emerald-600 font-bold' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Skrip Google Apps Script (GAS)
        </button>
        <button
          onClick={() => setActiveSubTab('esp_code')}
          className={`py-2.5 px-4 text-xs font-semibold tracking-tight border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'esp_code' 
              ? 'border-emerald-500 text-emerald-600 font-bold' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Kode Sketch ESP32 (Arduino .ino)
        </button>
        <button
          onClick={() => setActiveSubTab('sql_code')}
          className={`py-2.5 px-4 text-xs font-semibold tracking-tight border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'sql_code' 
              ? 'border-emerald-500 text-emerald-600 font-bold' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          🔑 Database SQL (Supabase)
        </button>
      </div>

      {activeSubTab === 'api' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Main settings form */}
          <form onSubmit={handleSave} className="lg:col-span-8 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-sm font-bold text-slate-800 tracking-tight uppercase font-mono border-b pb-2">Kredensial Gateway Server</h3>

            {saveSuccess && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-semibold">
                <Check size={16} />
                <span>Konfigurasi API berhasil disimpan ke data persisten server.</span>
              </div>
            )}

            <div className="space-y-4">
              {/* GAS Spreadsheet URL */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5 font-bold">
                  URL Webhook Google Apps Script
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Globe size={16} />
                  </span>
                  <input
                    type="url"
                    required
                    value={gasUrl}
                    onChange={(e) => setGasUrl(e.target.value)}
                    disabled={currentUser.role !== 'admin'}
                    className="block w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl focus:outline-none focus:border-emerald-500 transition-colors disabled:opacity-50"
                    placeholder="https://script.google.com/macros/s/..."
                  />
                </div>
                <p className="text-[10px] text-slate-500 font-mono mt-1 leading-tight">
                  Alamat deploy web apps dari Google Apps Script untuk merekam data ke Spreadsheet.
                </p>
              </div>

              {/* Whatsapp integration section */}
              <div className="pt-4 border-t border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono tracking-tight text-slate-700 uppercase">Integrasi Notifikasi WhatsApp (WA)</span>
                  <input
                    type="checkbox"
                    checked={whatsappEnabled}
                    disabled={currentUser.role !== 'admin'}
                    onChange={(e) => setWhatsappEnabled(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                  />
                </div>

                {whatsappEnabled && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
                    
                    {/* WA Provider */}
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5 font-bold">
                        Provider API Gateway
                      </label>
                      <select
                        value={whatsappProvider}
                        onChange={(e) => setWhatsappProvider(e.target.value as any)}
                        disabled={currentUser.role !== 'admin'}
                        className="block w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2.5 font-mono focus:outline-none"
                      >
                        <option value="fonnte">FONNTE API GATEWAY</option>
                        <option value="wablas">WABLAS SERVICE</option>
                        <option value="whatsapp_cloud_api">OFFICIAL WHATSAPP CLOUD API</option>
                      </select>
                    </div>

                    {/* Target phone number */}
                    <div className="sm:col-span-2 space-y-2">
                      <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1 font-bold">
                        Daftar Nomor Handphone Penerima (SMS/WA)
                      </label>
                      
                      {/* Current Numbers List/Chips */}
                      <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl min-h-[50px] items-center">
                        {phoneList.length === 0 ? (
                          <span className="text-slate-400 text-xs italic">Belum ada nomor ditambahkan. Gunakan kolom di bawah untuk menambah.</span>
                        ) : (
                          phoneList.map((phone) => (
                            <span 
                              key={phone} 
                              className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold px-2.5 py-1 rounded-lg shadow-sm"
                            >
                              <span>{phone}</span>
                              {currentUser.role === 'admin' && (
                                <button
                                  type="button"
                                  onClick={() => handleRemovePhone(phone)}
                                  className="text-emerald-600 hover:text-rose-600 p-0.5 rounded transition-colors cursor-pointer"
                                  title="Hapus nomor ini"
                                >
                                  <X size={12} />
                                </button>
                              )}
                            </span>
                          ))
                        )}
                      </div>

                      {/* Add New Number Form Row */}
                      {currentUser.role === 'admin' && (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newPhone}
                            onChange={(e) => setNewPhone(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddPhone();
                              }
                            }}
                            className="block flex-1 px-3 py-2 bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl focus:outline-none focus:border-emerald-500"
                            placeholder="Ketik nomor penerima, lalu tekan Enter / tombol Tambah (Contoh: 081234567890)"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddPhone()}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
                          >
                            <Plus size={14} />
                            Tambah
                          </button>
                        </div>
                      )}
                      <p className="text-[10px] text-slate-400 font-mono leading-tight">
                        Sistem mendukung pengiriman alert ke banyak nomor secara bersamaan (broadcast).
                      </p>
                    </div>

                    {/* Token Key */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5 font-bold">
                        API Token / Token Kunci Akses
                      </label>
                      <input
                        type="password"
                        required
                        value={whatsappToken}
                        onChange={(e) => setWhatsappToken(e.target.value)}
                        disabled={currentUser.role !== 'admin'}
                        className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl focus:outline-none focus:border-emerald-500 transition-colors"
                        placeholder="TOKEN_KEY_API_ANDA"
                      />
                    </div>

                  </div>
                )}
              </div>

              {/* Supabase integration section */}
              <div className="pt-4 border-t border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono tracking-tight text-slate-700 uppercase flex items-center gap-1.5">
                    <Database size={16} className="text-emerald-500" />
                    Integrasi Database Supabase (Cloud SQL)
                  </span>
                  <input
                    type="checkbox"
                    checked={supabaseEnabled}
                    disabled={currentUser.role !== 'admin'}
                    onChange={(e) => setSupabaseEnabled(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                  />
                </div>

                {supabaseEnabled && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
                    
                    {/* Supabase URL */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5 font-bold">
                        Supabase Project URL
                      </label>
                      <input
                        type="url"
                        required
                        value={supabaseUrl}
                        onChange={(e) => setSupabaseUrl(e.target.value)}
                        disabled={currentUser.role !== 'admin'}
                        className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl focus:outline-none focus:border-emerald-500 transition-colors"
                        placeholder="https://your-project-id.supabase.co"
                      />
                    </div>

                    {/* Supabase Anon Key */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5 font-bold">
                        Supabase API Anon Key (Service Role / Anon)
                      </label>
                      <input
                        type="password"
                        required
                        value={supabaseKey}
                        onChange={(e) => setSupabaseKey(e.target.value)}
                        disabled={currentUser.role !== 'admin'}
                        className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl focus:outline-none focus:border-emerald-500 transition-colors"
                        placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      />
                    </div>

                    <div className="sm:col-span-2 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-[11px] leading-relaxed font-sans">
                      💡 <strong>Penting:</strong> Setelah menyimpan, data BTS, Alarm, dan Log Telemetri Perangkat akan direkam secara real-time ke tabel <code>SITE</code>, <code>ALARM</code>, dan <code>DEVICE</code> di Supabase. Anda dapat melihat struktur DDL SQL untuk membuat tabel tersebut pada sub-tab <strong>Database SQL (Supabase)</strong> di atas.
                    </div>

                  </div>
                )}
              </div>

              {/* Siren sound customization section */}
              <div className="pt-5 border-t border-slate-100 space-y-4">
                <span className="text-xs font-bold font-mono tracking-tight text-slate-700 uppercase flex items-center gap-1.5">
                  <Volume2 size={16} className="text-emerald-500" />
                  Kustomisasi Suara Sirine Alarm Web
                </span>

                <div className="space-y-4">
                  {/* Select Sound Type */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={() => handleSelectSoundType('SYNTH')}
                      className={`flex-1 p-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                        soundType === 'SYNTH'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span>🔊 Suara Sintetis Bawaan (Oscillator)</span>
                      {soundType === 'SYNTH' && <Check size={14} className="text-emerald-600" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectSoundType('CUSTOM')}
                      className={`flex-1 p-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                        soundType === 'CUSTOM'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span>📁 File Audio Kustom (.mp3, .wav)</span>
                      {soundType === 'CUSTOM' && <Check size={14} className="text-emerald-600" />}
                    </button>
                  </div>

                  {/* File Upload / Details if CUSTOM selected */}
                  {soundType === 'CUSTOM' && (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 animate-fade-in">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold font-mono text-slate-400 uppercase">UNGGAH FILE SUARA SIRINE</span>
                        {customAudioName && (
                          <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                            Terunggah
                          </span>
                        )}
                      </div>

                      {/* File Upload Dropzone / Select */}
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:border-emerald-500 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer shadow-sm transition-colors">
                          <Upload size={14} className="text-emerald-500" />
                          <span>Pilih File Suara</span>
                          <input
                            type="file"
                            accept="audio/*"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                        </label>
                        <div className="text-xs text-slate-500 truncate font-mono">
                          {customAudioName || 'Tidak ada file kustom yang terpilih (Gunakan file .mp3 / .wav)'}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Test Playback button */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={isPlayingTest ? stopTestAudio : startTestAudio}
                      className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                        isPlayingTest
                          ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-100'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-100'
                      }`}
                    >
                      {isPlayingTest ? (
                        <>
                          <Square size={14} />
                          <span>Hentikan Uji Suara</span>
                        </>
                      ) : (
                        <>
                          <Play size={14} />
                          <span>Uji Coba Bunyi Sirine</span>
                        </>
                      )}
                    </button>
                    {isPlayingTest && (
                      <span className="text-xs text-slate-500 flex items-center font-mono animate-pulse">
                        📢 Sedang berbunyi...
                      </span>
                    )}
                  </div>
                </div>
              </div>

            </div>

            {currentUser.role === 'admin' ? (
              <button
                type="submit"
                className="py-2.5 px-6 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Save size={15} />
                Simpan Konfigurasi Integrasi
              </button>
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 font-mono flex items-start gap-2">
                <AlertTriangle size={15} className="shrink-0 text-amber-500" />
                <span>Operator Viewer hanya dapat membaca konfigurasi token. Ganti User ke role Admin untuk menyimpan perubahan.</span>
              </div>
            )}
          </form>

          {/* RIGHT COLUMN - SIMULATE NOTIFICATION SEND COMPONENT */}
          <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between min-h-[350px]">
            <div>
              <h3 className="text-sm font-bold text-slate-800 tracking-tight uppercase font-mono mb-2 flex items-center gap-1.5">
                <Send size={16} className="text-emerald-500" />
                WA SENDER SIMULATOR
              </h3>
              <p className="text-xs text-slate-500 mb-4 leading-normal">
                Uji coba pengiriman broadcast notifikasi alarm model Fonnte/Wablas ke handphone tujuan.
              </p>

              <div className="bg-[#FAF5FF] border border-purple-200 p-4 rounded-2xl text-xs space-y-2 mb-4">
                <span className="text-[10px] uppercase font-mono font-bold text-purple-600 block">PRATINJAU NOTIFIKASI MANUAL</span>
                <p className="text-slate-700 font-semibold">🔴 BTS ALARM CRITICAL</p>
                <p className="text-slate-600 leading-tight">
                  ⚠️ Grounding Putus<br />
                  Site: BTS-001 - BTS SUMBERJAYA<br />
                  Lokasi: Sumberjaya, Indonesia<br />
                  Status: GROUNDING PUTUS
                </p>
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={handleTestWhatsApp}
                disabled={testStatus === 'sending' || !whatsappEnabled}
                className={`w-full py-2.5 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  testStatus === 'sending'
                    ? 'bg-purple-100 text-purple-600 border border-purple-300'
                    : testStatus === 'success'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-40 shadow-lg'
                }`}
              >
                {testStatus === 'sending' ? (
                  <span>Mengirim Paket Webhook...</span>
                ) : testStatus === 'success' ? (
                  <span>Berhasil Dikirim (Simulated!)</span>
                ) : (
                  <>
                    <MessageSquare size={14} />
                    <span>Kirim Test WhatsApp Alarm</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      )}

      {activeSubTab === 'gas_code' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight uppercase font-mono">GOOGLE APPS SCRIPT SPREADSHEET CODE</h3>
              <p className="text-xs text-slate-400">Salin skrip Javascript ini ke Extensions - Apps Script di target Spreadsheet Anda</p>
            </div>
            
            <button
              onClick={() => copyToClipboard(GOOGLE_APPS_SCRIPT_CODE, 'gas')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer font-semibold"
            >
              {copiedText === 'gas' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              {copiedText === 'gas' ? 'Tersalin' : 'Salin Kode GAS'}
            </button>
          </div>

          <div className="relative">
            <pre className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-[11px] font-mono text-slate-350 overflow-x-auto max-h-[400px] leading-relaxed scrollbar-thin">
              <code>{GOOGLE_APPS_SCRIPT_CODE}</code>
            </pre>
          </div>
        </div>
      )}

      {activeSubTab === 'esp_code' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight uppercase font-mono">ESP32 + SIM800L ARDUINO SKETCH (.ino)</h3>
              <p className="text-xs text-slate-400">Kode program C++ Arduino untuk dicolokkan ke ESP32 microcontroller di dalam panel tower</p>
            </div>

            <button
              onClick={() => copyToClipboard(dynamicEsp32Code, 'esp')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer font-semibold"
            >
              {copiedText === 'esp' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              {copiedText === 'esp' ? 'Tersalin' : 'Salin Kode ESP32'}
            </button>
          </div>

          <div className="relative">
            <pre className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-[11px] font-mono text-slate-350 overflow-x-auto max-h-[400px] leading-relaxed scrollbar-thin">
              <code>{dynamicEsp32Code}</code>
            </pre>
          </div>
        </div>
      )}

      {activeSubTab === 'sql_code' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 animate-fade-in">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight uppercase font-mono flex items-center gap-1.5">
                <Database size={16} className="text-emerald-500" />
                SUPABASE CLOUD SQL DATABASE SCHEMA
              </h3>
              <p className="text-xs text-slate-400">Salin skrip SQL DDL ini dan eksekusi di SQL Editor dalam Dashboard Supabase Anda</p>
            </div>

            <button
              onClick={() => copyToClipboard(SUPABASE_SQL_DDL, 'sql')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer font-semibold"
            >
              {copiedText === 'sql' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              {copiedText === 'sql' ? 'Tersalin' : 'Salin Skrip SQL'}
            </button>
          </div>

          <div className="relative">
            <pre className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-[11px] font-mono text-slate-350 overflow-x-auto max-h-[450px] leading-relaxed scrollbar-thin font-mono">
              <code>{SUPABASE_SQL_DDL}</code>
            </pre>
          </div>
        </div>
      )}

    </div>
  );
}
