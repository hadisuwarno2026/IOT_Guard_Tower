/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Radio, MapPin, AlertTriangle, ShieldCheck, HelpCircle, Search, 
  Wifi, Thermometer, Battery, Zap, ShieldAlert, Cpu, Siren, Volume2, VolumeX,
  Plus, Edit, Trash2, X, Save
} from 'lucide-react';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Site } from '../types.ts';

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

interface TowerMonitoringTabProps {
  sites: Site[];
  onMuteSiren: (siteId: string, action: 'MUTE' | 'ON') => void;
  onAddSite: (site: any) => Promise<boolean>;
  onUpdateSite: (siteId: string, site: any) => Promise<boolean>;
  onDeleteSite: (siteId: string) => Promise<boolean>;
  currentUser?: { role: string; displayName: string };
}

export default function TowerMonitoringTab({ 
  sites, 
  onMuteSiren,
  onAddSite,
  onUpdateSite,
  onDeleteSite,
  currentUser 
}: TowerMonitoringTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>('BTS-001');
  const [mapMode, setMapMode] = useState<'osm' | 'schematic'>('osm');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Form Fields State
  const [siteId, setSiteId] = useState('');
  const [siteName, setSiteName] = useState('');
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState(-6.9);
  const [longitude, setLongitude] = useState(107.5);
  const [rectifier, setRectifier] = useState<'NORMAL' | 'FAULT'>('NORMAL');
  const [battery, setBattery] = useState<'NORMAL' | 'LOW' | 'FAULT'>('NORMAL');
  const [acPower, setAcPower] = useState<'NORMAL' | 'FAIL'>('NORMAL');
  const [temperature, setTemperature] = useState(25);
  const [gsm, setGsm] = useState('TELKOMSEL');
  const [rssi, setRssi] = useState(-65);
  const [status, setStatus] = useState<'ONLINE' | 'OFFLINE'>('ONLINE');
  const [grounding, setGrounding] = useState<'NORMAL' | 'PUTUS'>('NORMAL');
  const [door, setDoor] = useState<'TERTUTUP' | 'TERBUKA'>('TERTUTUP');

  const openAddModal = () => {
    // Generate a new siteId based on current maximum or sequence
    const nextNum = sites.reduce((max, site) => {
      const match = site.siteId.match(/BTS-(\d+)/);
      if (match) {
        const num = parseInt(match[1]);
        return num > max ? num : max;
      }
      return max;
    }, 0) + 1;
    const formattedId = `BTS-${nextNum.toString().padStart(3, '0')}`;
    
    setSiteId(formattedId);
    setSiteName(`BTS-NEW-${nextNum}`);
    setLocation('Bandung, Indonesia');
    setLatitude(-6.9 + (Math.random() - 0.5) * 0.2);
    setLongitude(107.5 + (Math.random() - 0.5) * 0.2);
    setRectifier('NORMAL');
    setBattery('NORMAL');
    setAcPower('NORMAL');
    setTemperature(26);
    setGsm('TELKOMSEL');
    setRssi(-65);
    setStatus('ONLINE');
    setGrounding('NORMAL');
    setDoor('TERTUTUP');
    setIsAddModalOpen(true);
  };

  const openEditModal = (site: Site) => {
    setSiteId(site.siteId);
    setSiteName(site.siteName);
    setLocation(site.location);
    setLatitude(site.latitude);
    setLongitude(site.longitude);
    setRectifier(site.rectifier);
    setBattery(site.battery);
    setAcPower(site.acPower);
    setTemperature(site.temperature);
    setGsm(site.gsm);
    setRssi(site.rssi);
    setStatus(site.status);
    setGrounding(site.grounding);
    setDoor(site.door);
    setIsEditModalOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await onAddSite({
      siteId,
      siteName,
      location,
      latitude: Number(latitude),
      longitude: Number(longitude),
      rectifier,
      battery,
      acPower,
      temperature: Number(temperature),
      gsm,
      rssi: Number(rssi),
      status,
      grounding,
      door
    });
    if (success) {
      setIsAddModalOpen(false);
      setSelectedSiteId(siteId);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await onUpdateSite(siteId, {
      siteName,
      location,
      latitude: Number(latitude),
      longitude: Number(longitude),
      rectifier,
      battery,
      acPower,
      temperature: Number(temperature),
      gsm,
      rssi: Number(rssi),
      status,
      grounding,
      door
    });
    if (success) {
      setIsEditModalOpen(false);
    }
  };

  const handleDeleteClick = async (targetId: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus site ${targetId}?`)) {
      const success = await onDeleteSite(targetId);
      if (success) {
        const remaining = sites.filter(s => s.siteId !== targetId);
        if (remaining.length > 0) {
          setSelectedSiteId(remaining[0].siteId);
        } else {
          setSelectedSiteId(null);
        }
      }
    }
  };

  const filteredSites = sites.filter(site => {
    return site.siteId.toLowerCase().includes(searchQuery.toLowerCase()) ||
           site.siteName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           site.location.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const selectedSiteMap = sites.find(s => s.siteId === selectedSiteId) || sites[0] || {
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
    temperature: 0
  };

  // Helper colors based on status
  const getGroundingColor = (status: 'NORMAL' | 'PUTUS') => {
    return status === 'PUTUS' ? 'text-red-500 bg-red-50 border-red-200' : 'text-emerald-600 bg-emerald-50 border-emerald-200';
  };

  const getDoorColor = (status: 'TERTUTUP' | 'TERBUKA') => {
    return status === 'TERBUKA' ? 'text-amber-600 bg-amber-50 border-amber-200' : 'text-emerald-600 bg-emerald-50 border-emerald-200';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800 tracking-tight uppercase font-mono flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              Geographic Site Monitor
            </h3>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">Klik pada marker site di peta untuk melihat detail data site, status sensor, dan alarm aktif.</p>
          </div>
          {!hasValidKey && (
            <div className="flex bg-slate-100 p-0.5 rounded-xl text-[10px] font-mono font-bold self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setMapMode('osm')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  mapMode === 'osm'
                    ? 'bg-[#0F172A] text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                OSM MAP
              </button>
              <button
                type="button"
                onClick={() => setMapMode('schematic')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  mapMode === 'schematic'
                    ? 'bg-[#0F172A] text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                SCHEMATIC
              </button>
            </div>
          )}
        </div>

        {/* FULL WIDTH GEOGRAPHY CANVAS or REAL GOOGLE MAPS */}
        <div className="bg-[#0F172A] border border-slate-800 rounded-2xl h-[550px] relative overflow-hidden flex items-center justify-center">
          {hasValidKey ? (
            <APIProvider apiKey={API_KEY} version="weekly">
              <Map
                defaultCenter={{ lat: selectedSiteMap?.latitude || -6.914744, lng: selectedSiteMap?.longitude || 107.609810 }}
                defaultZoom={11}
                mapId="DEMO_MAP_ID"
                internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                style={{ width: '100%', height: '100%' }}
              >
                {sites.map(site => {
                  const hasAlarm = site.grounding === 'PUTUS' || site.door === 'TERBUKA';
                  const isSelected = selectedSiteId === site.siteId;
                  
                  return (
                    <AdvancedMarker
                      key={site.siteId}
                      position={{ lat: Number(site.latitude || 0), lng: Number(site.longitude || 0) }}
                      onClick={() => {
                        setSelectedSiteId(site.siteId);
                        setIsDetailModalOpen(true);
                      }}
                    >
                      <div className="relative flex flex-col items-center">
                        {/* Pulsing halo for alarms */}
                        {site.status === 'ONLINE' && hasAlarm && (
                          <div className="absolute inset-0 rounded-full bg-red-500/30 scale-150 animate-ping pointer-events-none" />
                        )}
                        
                        {/* Tower Icon pin shape */}
                        <div 
                          className={`p-1.5 rounded-full border-2 shadow-md flex items-center justify-center transition-all ${
                            isSelected 
                              ? 'scale-110 ring-4 ring-slate-400/30 bg-slate-800 text-white border-white' 
                              : site.status === 'OFFLINE'
                              ? 'bg-slate-100 border-slate-400 text-slate-500' 
                              : hasAlarm 
                              ? 'bg-red-500 border-white text-white' 
                              : 'bg-emerald-500 border-white text-white'
                          }`}
                          style={{ width: '32px', height: '32px' }}
                        >
                          <Radio size={16} className={hasAlarm ? "animate-pulse" : ""} />
                        </div>

                        {/* Tooltip text tag */}
                        <div className={`mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold font-mono shadow border ${
                          isSelected 
                            ? 'bg-[#0F172A] text-white border-slate-800' 
                            : 'bg-white text-slate-600 border-slate-200'
                        }`}>
                          {site.siteId}
                        </div>
                      </div>
                    </AdvancedMarker>
                  );
                })}
              </Map>
            </APIProvider>
          ) : mapMode === 'osm' ? (
            <>
              <LeafletMap 
                sites={sites} 
                selectedSiteId={selectedSiteId} 
                onSelectSite={(siteId) => {
                  setSelectedSiteId(siteId);
                  setIsDetailModalOpen(true);
                }}
                selectedSiteMap={selectedSiteMap}
              />
              {/* Info banner to tell how to activate GMP */}
              <div className="absolute bottom-2 left-2 z-[1000] bg-slate-900/90 border border-slate-800 px-2 py-1 rounded text-[9px] font-mono text-emerald-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Peta Interaktif Aktif. Klik penanda untuk membuka modal.</span>
              </div>
            </>
          ) : (
            <>
              {/* Topography Grid Line overlays */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-20" />
              
              {/* Compass Rose */}
              <div className="absolute top-4 right-4 pointer-events-none text-slate-600 font-mono text-[9px] text-right">
                <div>GRID: REG-IV</div>
                <div>UTARA ▲</div>
              </div>

              {/* Indonesia West Java SVG Land Outline simulation */}
              <svg viewBox="0 0 400 300" className="w-full h-full relative z-10 p-4">
                {/* Landmass representation (Simple abstract vector curve) */}
                <path 
                  d="M 20,120 Q 80,110 130,120 T 260,115 T 380,130 Q 390,170 380,210 T 250,225 T 140,210 Q 70,220 20,200 Z" 
                  fill="#1E293B" 
                  stroke="#334155" 
                  strokeWidth="2" 
                />
                
                {/* Java Mountain Peaks decoration */}
                <polygon points="120,130 140,90 160,130" fill="#0F172A" stroke="#475569" strokeWidth="1" />
                <polygon points="210,135 235,80 260,135" fill="#0F172A" stroke="#475569" strokeWidth="1" />
                <polygon points="290,140 310,105 330,140" fill="#0F172A" stroke="#475569" strokeWidth="1" />

                {/* Sea names */}
                <text x="180" y="50" fill="#475569" fontSize="10" fontFamily="monospace" letterSpacing="2">LAUT JAWA</text>
                <text x="180" y="270" fill="#475569" fontSize="10" fontFamily="monospace" letterSpacing="2">SAMUDERA HINDIA</text>
                
                {/* Link trails representing RF telemetry beams to central NOC server */}
                {sites.map(site => {
                  if (site.status === 'OFFLINE') return null;
                  const siteLng = Number(site.longitude || 0);
                  const siteLat = Number(site.latitude || 0);
                  const x = 30 + ((siteLng - 107.3) / 0.4) * 340;
                  const y = 60 + ((Math.abs(siteLat) - 6.7) / 0.4) * 180;
                  const hasAlarm = site.grounding === 'PUTUS' || site.door === 'TERBUKA';

                  if (isNaN(x) || isNaN(y)) return null;

                  return (
                    <line 
                      key={`line-${site.siteId}`}
                      x1={x} 
                      y1={y} 
                      x2="200" 
                      y2="150" 
                      stroke={hasAlarm ? '#EF4444' : '#22C55E'} 
                      strokeWidth="1" 
                      strokeDasharray="2,3" 
                      opacity="0.3"
                    />
                  );
                })}

                {/* Central NOC Tower Hub representing target dashboard receiver */}
                <g transform="translate(200, 150)">
                  <circle r="6" fill="#10B981" />
                  <circle r="12" fill="none" stroke="#10B981" strokeWidth="1" className="animate-ping" style={{ transformOrigin: '200px 150px' }} />
                  <path d="M-3,5 L0,-15 L3,5 Z" fill="#F1F5F9" />
                </g>
                <text x="175" y="170" fill="#059669" fontSize="8" fontFamily="monospace" fontWeight="bold">NOC CORE</text>

                {/* SITE MARKERS GENERATOR */}
                {sites.map(site => {
                  const siteLng = Number(site.longitude || 0);
                  const siteLat = Number(site.latitude || 0);
                  const x = 30 + ((siteLng - 107.3) / 0.4) * 340;
                  const y = 60 + ((Math.abs(siteLat) - 6.7) / 0.4) * 180;
                  const hasAlarm = site.grounding === 'PUTUS' || site.door === 'TERBUKA';

                  if (isNaN(x) || isNaN(y)) return null;

                  const isSelected = selectedSiteId === site.siteId;

                  return (
                    <g 
                      key={site.siteId} 
                      transform={`translate(${x}, ${y})`}
                      className="cursor-pointer pointer-events-auto"
                      onClick={() => {
                        setSelectedSiteId(site.siteId);
                        setIsDetailModalOpen(true);
                      }}
                    >
                      {/* Ring highlight if selected */}
                      {isSelected && (
                        <circle r="12" fill="none" stroke="#E2E8F0" strokeWidth="2.5" />
                      )}

                      {/* Blinking signal radiation ripple if alarm blares */}
                      {site.status === 'ONLINE' && hasAlarm && (
                        <circle r="9" fill="none" stroke="#EF4444" strokeWidth="2" className="animate-ping" />
                      )}

                      {/* Central marker node */}
                      <circle 
                        r={isSelected ? "6" : "5"} 
                        fill={
                          site.status === 'OFFLINE' 
                            ? '#64748B' 
                            : hasAlarm 
                            ? '#EF4444' 
                            : '#22C55E'
                        } 
                        stroke="#FFFFFF"
                        strokeWidth="1.5"
                      />

                      {/* ID Label Tag */}
                      <text 
                        y="-10" 
                        textAnchor="middle" 
                        fill={isSelected ? "#FFF" : "#94A3B8"} 
                        fontSize="9" 
                        fontWeight={isSelected ? "bold" : "normal"}
                        fontFamily="monospace"
                      >
                        {site.siteId}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Info banner to tell how to activate GMP */}
              <div className="absolute bottom-2 left-2 z-20 bg-slate-900/90 border border-slate-800 px-2 py-1 rounded text-[9px] font-mono text-emerald-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Skematik Aktif. Klik penanda untuk membuka modal.</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* DETAILED SITE DATA & ALARM MODAL */}
      {isDetailModalOpen && selectedSiteMap && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 rounded-3xl shadow-2xl p-6 max-w-2xl w-full relative max-h-[90vh] overflow-y-auto animate-fade-in text-slate-800">
            {/* Close Button */}
            <button
              onClick={() => setIsDetailModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 bg-slate-50 rounded-full transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            {/* Header: ID, Name, and Status */}
            <div className="border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-2 mb-1">
                <Radio className="text-emerald-500 animate-pulse" size={20} />
                <h3 className="text-lg font-bold text-slate-800 font-mono">{selectedSiteMap.siteId}</h3>
                <span className="text-sm text-slate-500 font-semibold">- {selectedSiteMap.siteName}</span>
              </div>
              <div className="flex flex-wrap items-center gap-4 mt-1.5 text-xs text-slate-500">
                <span className={`inline-flex items-center gap-1 py-0.5 px-2.5 rounded-full text-[10px] font-bold font-mono uppercase ${
                  selectedSiteMap.status === 'ONLINE' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${selectedSiteMap.status === 'ONLINE' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                  {selectedSiteMap.status}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin size={12} className="text-slate-400" />
                  {selectedSiteMap.location}
                </span>
              </div>
            </div>

            {/* Content Body */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Column 1: Data Site (Informasi Teknis) */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 tracking-wider uppercase font-mono border-b border-slate-100 pb-1">
                  SITE INFORMASI
                </h4>
                
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-xs font-mono font-bold text-slate-400">SiteID :</span>
                    <span className="text-xs font-mono font-bold text-slate-800">{selectedSiteMap.siteId}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-xs font-mono font-bold text-slate-400">Site name :</span>
                    <span className="text-xs font-bold text-slate-800">{selectedSiteMap.siteName}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-xs font-mono font-bold text-slate-400">longitude :</span>
                    <span className="text-xs font-mono font-bold text-slate-800">{selectedSiteMap.longitude}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-xs font-mono font-bold text-slate-400">latitude :</span>
                    <span className="text-xs font-mono font-bold text-slate-800">{selectedSiteMap.latitude}</span>
                  </div>
                  <div className="flex flex-col gap-1 pt-1">
                    <span className="text-xs font-mono font-bold text-slate-400">Address :</span>
                    <span className="text-xs text-slate-700 leading-relaxed">{selectedSiteMap.location}</span>
                  </div>
                </div>
              </div>

              {/* Column 2: Status Alarm & Sensors */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 tracking-wider uppercase font-mono border-b border-slate-100 pb-1">
                  STATUS ALARM & SENSOR
                </h4>

                <div className="space-y-2.5">
                  {/* Grounding Sensor */}
                  <div className={`p-3 rounded-xl border flex items-center justify-between ${
                    selectedSiteMap.grounding === 'PUTUS'
                      ? 'bg-rose-50 border-rose-200 text-rose-800'
                      : 'bg-emerald-50 border-emerald-100 text-emerald-800'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <ShieldAlert size={16} className={selectedSiteMap.grounding === 'PUTUS' ? 'text-rose-500 animate-bounce' : 'text-emerald-500'} />
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 block font-bold">GROUNDING BTS</span>
                        <span className="text-xs font-bold block mt-0.5">{selectedSiteMap.grounding === 'PUTUS' ? '⚠️ ALARM: PUTUS' : '🟢 NORMAL'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Door Switch Sensor */}
                  <div className={`p-3 rounded-xl border flex items-center justify-between ${
                    selectedSiteMap.door === 'TERBUKA'
                      ? 'bg-amber-50 border-amber-200 text-amber-800'
                      : 'bg-emerald-50 border-emerald-100 text-emerald-800'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <Siren size={16} className={selectedSiteMap.door === 'TERBUKA' ? 'text-amber-500 animate-pulse' : 'text-emerald-500'} />
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 block font-bold">PINTU SHELTER</span>
                        <span className="text-xs font-bold block mt-0.5">{selectedSiteMap.door === 'TERBUKA' ? '🚪 ALARM: TERBUKA' : '🔒 TERTUTUP'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Sirene Controller directly below Pintu Shelter card inside Status Alarm & Sensor */}
                  {(selectedSiteMap.grounding === 'PUTUS' || selectedSiteMap.door === 'TERBUKA') && (
                    <div className="p-3.5 rounded-xl bg-red-50 border border-red-100 flex flex-col gap-2.5">
                      <div className="flex items-center gap-2 text-red-700">
                        <Siren size={18} className="animate-spin" />
                        <div>
                          <span className="text-[9px] uppercase font-bold font-mono tracking-wider text-red-500 block">KONTROL AUDIO SIRINE</span>
                          <span className="text-xs font-bold block leading-tight">{selectedSiteMap.isMuted ? 'Mute (Sirine Disenyapkan)' : 'Sirine Berbunyi Keras'}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {selectedSiteMap.isMuted ? (
                          <button
                            type="button"
                            onClick={() => onMuteSiren(selectedSiteMap.siteId, 'ON')}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.5 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Volume2 size={13} />
                            Nyalakan Sirine
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onMuteSiren(selectedSiteMap.siteId, 'MUTE')}
                            className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-1.5 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <VolumeX size={13} />
                            Senyapkan Sirine
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex gap-2 justify-end items-center">
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Tutup Detail
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ADD SITE MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 rounded-3xl shadow-2xl p-6 max-w-lg w-full relative max-h-[90vh] overflow-y-auto animate-fade-in text-slate-800">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 bg-slate-50 rounded-full transition-colors"
            >
              <X size={16} />
            </button>
            
            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Plus className="text-emerald-600" />
              <span>Tambah BTS Baru</span>
            </h3>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1 font-bold">SITE ID</label>
                  <input
                    type="text"
                    required
                    value={siteId}
                    onChange={(e) => setSiteId(e.target.value)}
                    className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 font-mono text-slate-800"
                    placeholder="Contoh: BTS-004"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1 font-bold">NAMA SITE</label>
                  <input
                    type="text"
                    required
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 text-slate-800"
                    placeholder="Contoh: BTS CIMAHI"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1 font-bold">LOKASI ALAMAT</label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 text-slate-800"
                    placeholder="Contoh: Cimahi, Jawa Barat"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1 font-bold">LATITUDE</label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={latitude}
                    onChange={(e) => setLatitude(Number(e.target.value))}
                    className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 font-mono text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1 font-bold">LONGITUDE</label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={longitude}
                    onChange={(e) => setLongitude(Number(e.target.value))}
                    className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 font-mono text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1 font-bold">SUHU INTERNAL (°C)</label>
                  <input
                    type="number"
                    required
                    value={temperature}
                    onChange={(e) => setTemperature(Number(e.target.value))}
                    className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 font-mono text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1 font-bold">GSM NETWORK & SIGNAL</label>
                  <input
                    type="text"
                    required
                    value={gsm}
                    onChange={(e) => setGsm(e.target.value)}
                    className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1 font-bold">RECTIFIER</label>
                  <select
                    value={rectifier}
                    onChange={(e) => setRectifier(e.target.value as any)}
                    className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none text-slate-800"
                  >
                    <option value="NORMAL">NORMAL</option>
                    <option value="FAULT">FAULT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1 font-bold">BATERAI BACKUP</label>
                  <select
                    value={battery}
                    onChange={(e) => setBattery(e.target.value as any)}
                    className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none text-slate-800"
                  >
                    <option value="NORMAL">NORMAL</option>
                    <option value="LOW">LOW</option>
                    <option value="FAULT">FAULT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1 font-bold">LISTRIK PLN (AC POWER)</label>
                  <select
                    value={acPower}
                    onChange={(e) => setAcPower(e.target.value as any)}
                    className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none text-slate-800"
                  >
                    <option value="NORMAL">NORMAL</option>
                    <option value="FAIL">FAIL (PADAM)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1 font-bold">STATUS SYSTEM</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none font-mono text-slate-800"
                  >
                    <option value="ONLINE">ONLINE</option>
                    <option value="OFFLINE">OFFLINE</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Plus size={14} />
                  Tambah Site
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT SITE MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 rounded-3xl shadow-2xl p-6 max-w-lg w-full relative max-h-[90vh] overflow-y-auto animate-fade-in text-slate-800">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 bg-slate-50 rounded-full transition-colors"
            >
              <X size={16} />
            </button>
            
            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Edit className="text-emerald-600" size={18} />
              <span>Ubah Data BTS - {siteId}</span>
            </h3>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1 font-bold">SITE ID (TIDAK BISA DIUBAH)</label>
                  <input
                    type="text"
                    disabled
                    value={siteId}
                    className="block w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-400 font-mono cursor-not-allowed text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1 font-bold">NAMA SITE</label>
                  <input
                    type="text"
                    required
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 text-slate-800"
                    placeholder="Contoh: BTS CIMAHI"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1 font-bold">LOKASI ALAMAT</label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 text-slate-800"
                    placeholder="Contoh: Cimahi, Jawa Barat"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1 font-bold">LATITUDE</label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={latitude}
                    onChange={(e) => setLatitude(Number(e.target.value))}
                    className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 font-mono text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1 font-bold">LONGITUDE</label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={longitude}
                    onChange={(e) => setLongitude(Number(e.target.value))}
                    className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 font-mono text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1 font-bold">SUHU INTERNAL (°C)</label>
                  <input
                    type="number"
                    required
                    value={temperature}
                    onChange={(e) => setTemperature(Number(e.target.value))}
                    className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 font-mono text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1 font-bold">GSM NETWORK & SIGNAL</label>
                  <input
                    type="text"
                    required
                    value={gsm}
                    onChange={(e) => setGsm(e.target.value)}
                    className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1 font-bold">RECTIFIER</label>
                  <select
                    value={rectifier}
                    onChange={(e) => setRectifier(e.target.value as any)}
                    className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none text-slate-800"
                  >
                    <option value="NORMAL">NORMAL</option>
                    <option value="FAULT">FAULT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1 font-bold">BATERAI BACKUP</label>
                  <select
                    value={battery}
                    onChange={(e) => setBattery(e.target.value as any)}
                    className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none text-slate-800"
                  >
                    <option value="NORMAL">NORMAL</option>
                    <option value="LOW">LOW</option>
                    <option value="FAULT">FAULT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1 font-bold">LISTRIK PLN (AC POWER)</label>
                  <select
                    value={acPower}
                    onChange={(e) => setAcPower(e.target.value as any)}
                    className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none text-slate-800"
                  >
                    <option value="NORMAL">NORMAL</option>
                    <option value="FAIL">FAIL (PADAM)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1 font-bold">STATUS SYSTEM</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none font-mono text-slate-800"
                  >
                    <option value="ONLINE">ONLINE</option>
                    <option value="OFFLINE">OFFLINE</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Save size={14} />
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

interface LeafletMapProps {
  sites: Site[];
  selectedSiteId: string | null;
  onSelectSite: (siteId: string) => void;
  selectedSiteMap: any;
}

type MapLayerType = 'streets' | 'satellite' | 'light' | 'dark';

function LeafletMap({ sites, selectedSiteId, onSelectSite, selectedSiteMap }: LeafletMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const [layerType, setLayerType] = useState<MapLayerType>('streets'); // Default to streets for supreme clarity

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const initialLat = Number(selectedSiteMap?.latitude || -6.914744);
    const initialLng = Number(selectedSiteMap?.longitude || 107.609810);

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 11,
      zoomControl: false, // Turn off default so we can place it cleanly
      attributionControl: false,
    });

    // Add zoom control to bottom right instead
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    mapRef.current = map;

    // Trigger a resize after map loads to ensure it displays correctly in full size
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      clearTimeout(timer);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Sync selected site center
  useEffect(() => {
    if (!mapRef.current || !selectedSiteMap) return;
    const lat = Number(selectedSiteMap.latitude || 0);
    const lng = Number(selectedSiteMap.longitude || 0);
    if (lat && lng) {
      mapRef.current.setView([lat, lng], mapRef.current.getZoom());
    }
  }, [selectedSiteId]);

  // Handle Layer Type Change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old layer
    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
    }

    let url = '';
    let options = {};

    switch (layerType) {
      case 'streets':
        url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        options = {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors'
        };
        break;
      case 'satellite':
        url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
        options = {
          maxZoom: 19,
          attribution: '&copy; Esri World Imagery'
        };
        break;
      case 'light':
        url = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
        options = {
          maxZoom: 19,
          attribution: '&copy; CARTO Positron'
        };
        break;
      case 'dark':
        url = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
        options = {
          maxZoom: 19,
          attribution: '&copy; CARTO Dark Matter'
        };
        break;
    }

    const newLayer = L.tileLayer(url, options).addTo(map);
    tileLayerRef.current = newLayer;
  }, [layerType]);

  // Sync markers dynamically
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old markers
    Object.keys(markersRef.current).forEach(key => {
      const marker = markersRef.current[key];
      if (marker) marker.remove();
    });
    markersRef.current = {};

    sites.forEach(site => {
      const siteLat = Number(site.latitude || 0);
      const siteLng = Number(site.longitude || 0);
      if (!siteLat || !siteLng) return;

      const hasAlarm = site.grounding === 'PUTUS' || site.door === 'TERBUKA';
      const isSelected = selectedSiteId === site.siteId;

      const markerColorClass = site.status === 'OFFLINE'
        ? 'bg-slate-500'
        : hasAlarm
        ? 'bg-red-500 animate-pulse'
        : 'bg-emerald-500';

      const ringClass = isSelected
        ? 'ring-4 ring-slate-400/50 scale-110 border-white'
        : 'border-white';

      const pulseElement = site.status === 'ONLINE' && hasAlarm
        ? `<div class="absolute -inset-2 rounded-full bg-red-500/30 animate-ping pointer-events-none"></div>`
        : '';

      const customHtml = `
        <div class="relative flex flex-col items-center">
          ${pulseElement}
          <div class="w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center transition-all ${markerColorClass} ${ringClass}">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white"><path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/><path d="M19.1 4.9C23 8.8 23 15.2 19.1 19.1"/></svg>
          </div>
          <div class="mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold font-mono shadow border ${
            isSelected ? 'bg-slate-900 text-white border-slate-800' : 'bg-white text-slate-700 border-slate-200'
          }">
            ${site.siteId}
          </div>
        </div>
      `;

      const icon = L.divIcon({
        html: customHtml,
        className: 'bg-transparent border-none shadow-none',
        iconSize: [50, 60],
        iconAnchor: [25, 45],
      });

      const marker = L.marker([siteLat, siteLng], { icon }).addTo(map);
      marker.on('click', () => {
        onSelectSite(site.siteId);
      });

      markersRef.current[site.siteId] = marker;
    });
  }, [sites, selectedSiteId]);

  return (
    <div className="relative w-full h-full">
      {/* Floating map layer selector */}
      <div className="absolute top-2 right-2 z-[1000] bg-slate-900/90 backdrop-blur-md border border-slate-800 p-1 rounded-xl shadow-lg flex gap-1 text-[10px] font-mono font-bold">
        <button
          onClick={() => setLayerType('streets')}
          className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
            layerType === 'streets'
              ? 'bg-emerald-500 text-slate-950 shadow-sm'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
          JALAN (OSM)
        </button>
        <button
          onClick={() => setLayerType('satellite')}
          className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
            layerType === 'satellite'
              ? 'bg-emerald-500 text-slate-950 shadow-sm'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
          SATELIT
        </button>
        <button
          onClick={() => setLayerType('light')}
          className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
            layerType === 'light'
              ? 'bg-emerald-500 text-slate-950 shadow-sm'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-white inline-block border border-slate-400" />
          TERANG
        </button>
        <button
          onClick={() => setLayerType('dark')}
          className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
            layerType === 'dark'
              ? 'bg-emerald-500 text-slate-950 shadow-sm'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-slate-800 inline-block" />
          GELAP
        </button>
      </div>

      <div ref={mapContainerRef} className="w-full h-full rounded-xl overflow-hidden" />
    </div>
  );
}
