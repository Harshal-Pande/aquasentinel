"use client";

import { ModalType } from "./Dashboard";
import { X, Activity, Database, BellRing, Settings as SettingsIcon, Info } from "lucide-react";

interface Props {
  activeModal: ModalType;
  onClose: () => void;
  logs: { time: string; message: string; status?: string }[];
  notifications: { message: string; read: boolean }[];
}

export default function SystemModal({ activeModal, onClose, logs, notifications }: Props) {
  if (!activeModal) return null;

  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-[#0d1421] border border-slate-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-3 text-slate-200 font-space tracking-widest uppercase text-xs font-bold">
            {activeModal === "health" && <><Activity className="w-4 h-4 text-teal-400" /> System Health</>}
            {activeModal === "logs" && <><Database className="w-4 h-4 text-cyan-400" /> Data Logs</>}
            {activeModal === "notifications" && <><BellRing className="w-4 h-4 text-amber-400" /> Notifications</>}
            {activeModal === "settings" && <><SettingsIcon className="w-4 h-4 text-slate-400" /> Settings</>}
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 font-sans text-sm text-slate-300">
          
          {/* HEALTH */}
          {activeModal === "health" && (
            <div className="flex flex-col gap-4 font-mono text-xs">
              <div className="flex justify-between items-center p-3 border border-slate-800 rounded bg-slate-900/50">
                <span className="text-slate-400">APPLICATION</span>
                <span className="text-emerald-400 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Operational</span>
              </div>
              <div className="flex justify-between items-center p-3 border border-slate-800 rounded bg-slate-900/50">
                <span className="text-slate-400">MAP ENGINE (Leaflet)</span>
                <span className="text-emerald-400 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Operational</span>
              </div>
              <div className="flex justify-between items-center p-3 border border-slate-800 rounded bg-slate-900/50">
                <span className="text-slate-400">ENVIRONMENTAL APIs (Open-Meteo)</span>
                <span className="text-emerald-400 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Operational</span>
              </div>
              <div className="flex justify-between items-center p-3 border border-slate-800 rounded bg-slate-900/50">
                <span className="text-slate-400">SUPABASE CACHE</span>
                <span className="text-emerald-400 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Connected</span>
              </div>
              <div className="flex justify-between items-center p-3 border border-slate-800 rounded bg-slate-900/50">
                <span className="text-slate-400">GEMINI AI</span>
                <span className="text-emerald-400 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Connected</span>
              </div>
              <div className="mt-4 text-[10px] text-slate-500 text-center uppercase tracking-widest font-space">
                LAST CHECK: JUST NOW
              </div>
            </div>
          )}

          {/* LOGS */}
          {activeModal === "logs" && (
            <div className="flex flex-col gap-2 font-mono text-[10px]">
              {logs.length === 0 ? (
                <div className="text-center text-slate-500 py-8">NO DATA LOGS YET</div>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className="flex gap-4 p-2 border-b border-slate-800/50">
                    <span className="text-slate-500 shrink-0">{log.time}</span>
                    <span className="flex-1 text-slate-300">{log.message}</span>
                    <span className={`shrink-0 ${
                      log.status === 'ERROR' ? 'text-red-400' :
                      log.status === 'SUCCESS' ? 'text-emerald-400' :
                      log.status === 'PENDING' ? 'text-cyan-400 animate-pulse' :
                      'text-slate-400'
                    }`}>
                      {log.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* NOTIFICATIONS */}
          {activeModal === "notifications" && (
            <div className="flex flex-col gap-3 font-sans text-sm">
              {notifications.length === 0 ? (
                <div className="text-center text-slate-500 py-8 font-space uppercase tracking-widest text-[10px]">NO NEW NOTIFICATIONS</div>
              ) : (
                notifications.map((notif, i) => (
                  <div key={i} className="p-3 border border-slate-800 rounded bg-slate-900/50 flex items-start gap-3">
                    <Info className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
                    <span className="text-slate-300 leading-relaxed">{notif.message}</span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* SETTINGS */}
          {activeModal === "settings" && (
            <div className="flex flex-col gap-6">
              <div>
                <h4 className="text-[10px] font-space text-slate-500 uppercase tracking-widest mb-3">Display</h4>
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 border border-slate-800 rounded bg-slate-900/50">
                    <span className="text-sm">Compact Density</span>
                    <input type="checkbox" className="accent-teal-500" />
                  </label>
                  <label className="flex items-center justify-between p-3 border border-slate-800 rounded bg-slate-900/50">
                    <span className="text-sm">Reduce Animations</span>
                    <input type="checkbox" className="accent-teal-500" />
                  </label>
                </div>
              </div>
              
              <div>
                <h4 className="text-[10px] font-space text-slate-500 uppercase tracking-widest mb-3">AI & Data</h4>
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 border border-slate-800 rounded bg-slate-900/50">
                    <span className="text-sm">Enable Gemini Interpretation</span>
                    <input type="checkbox" defaultChecked className="accent-teal-500" />
                  </label>
                  <label className="flex items-center justify-between p-3 border border-slate-800 rounded bg-slate-900/50">
                    <span className="text-sm">Show Data Provenance Tags</span>
                    <input type="checkbox" defaultChecked className="accent-teal-500" />
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800">
                <button className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-bold font-space uppercase tracking-widest rounded transition-colors border border-red-500/30">
                  Reset Current Analysis
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
