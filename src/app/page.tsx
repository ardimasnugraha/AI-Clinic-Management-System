"use client";

import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, Users, Calendar, Activity, 
  FlaskConical, Pill, Receipt, FileText, 
  Sparkles, ShieldCheck, Settings, Search, 
  ChevronDown, Building2,
  LogOut, Clock, Menu, X, User
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

import DashboardView from "@/components/DashboardView";
import PatientsView from "@/components/PatientsView";
import AppointmentsView from "@/components/AppointmentsView";
import EncounterView from "@/components/EncounterView";
import LabView from "@/components/LabView";
import PharmacyView from "@/components/PharmacyView";
import BillingView from "@/components/BillingView";
import DocumentsView from "@/components/DocumentsView";
import AuditLogView from "@/components/AuditLogView";
import SettingsView from "@/components/SettingsView";
import QueueView from "@/components/QueueView";

type Tab = 
  | "Dashboard" | "Pasien" | "Appointment" | "Antrean" | "Encounter"
  | "Laboratorium" | "Farmasi" | "Billing" | "Dokumen" | "AI Assistant"
  | "Audit Log" | "Pengaturan";

const menuItems = [
  { name: "Dashboard",    icon: LayoutDashboard, color: "#ff5a50" },
  { name: "Pasien",       icon: Users,           color: "#8b5cf6" },
  { name: "Appointment",  icon: Calendar,        color: "#3b82f6" },
  { name: "Antrean",      icon: Clock,           color: "#0d9488" },
  { name: "Encounter",    icon: Activity,        color: "#ec4899" },
  { name: "Laboratorium", icon: FlaskConical,    color: "#06b6d4" },
  { name: "Farmasi",      icon: Pill,            color: "#10b981" },
  { name: "Billing",      icon: Receipt,         color: "#f59e0b" },
  { name: "Dokumen",      icon: FileText,        color: "#6366f1" },
  { name: "AI Assistant", icon: Sparkles,        color: "#a855f7" },
  { name: "Audit Log",    icon: ShieldCheck,     color: "#0ea5e9" },
  { name: "Pengaturan",   icon: Settings,        color: "#6b7280" },
];

export default function MainPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("Dashboard");
  const [showDocMenu, setShowDocMenu] = useState(false);
  const [showBranchMenu, setShowBranchMenu] = useState(false);
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState("Klinik Sehat Sentosa - Cabang Semarang");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [prefilledPatientForAppt, setPrefilledPatientForAppt] = useState<{ rm: string; name: string; phone: string } | null>(null);
  const [prefilledPatientForEncounter, setPrefilledPatientForEncounter] = useState<null | { rm: string; name: string; insurance?: string }>(null);

  // Auth State
  const [sessionUser, setSessionUser] = useState<{ name: string; email: string; role: string } | null>(null);

  // Global Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    // Load session
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const meta = user.user_metadata || {};
        const email = user.email || "";
        const name = meta.full_name || meta.name || email.split("@")[0].replace(/\./g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase());
        const role = meta.role || "Dokter";
        setSessionUser({ name, email, role });
      } else {
        router.push("/login");
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push("/login");
      } else {
        const meta = session.user.user_metadata || {};
        const email = session.user.email || "";
        const name = meta.full_name || meta.name || email.split("@")[0].replace(/\./g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase());
        setSessionUser({ name, email, role: meta.role || "Dokter" });
      }
    });
    return () => subscription.unsubscribe();
  }, [router]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const branches = [
    "Klinik Sehat Sentosa - Cabang Semarang (Utama)",
    "Klinik Sehat Sentosa - Cabang Jakarta Selatan",
    "Klinik Sehat Sentosa - Cabang Surabaya Pusat",
    "Klinik Sehat Sentosa - Cabang Bandung Kota"
  ];

  const handleStartEncounter = (patient: { rm: string; name: string; insurance?: string }) => {
    setActiveTab("Encounter");
    setPrefilledPatientForEncounter(patient);
  };

  const handleMakeAppointmentForPatient = (patient: { rm: string; name: string; phone: string }) => {
    setPrefilledPatientForAppt(patient);
    setActiveTab("Appointment");
  };

  // Search matches
  const matchedMenus = searchQuery.trim() 
    ? menuItems.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"#faf6f3", fontFamily:"Inter,system-ui,sans-serif" }}>

      {toastMsg && (
        <div style={{ 
          position: "fixed", top: 20, right: 20, zIndex: 1000, 
          background: "#0f172a", color: "#fff", padding: "10px 18px", 
          borderRadius: 12, boxShadow: "0 8px 20px rgba(0,0,0,0.2)", 
          fontSize: 12.5, fontWeight: 700 
        }}>
          {toastMsg}
        </div>
      )}

      {isSidebarOpen && (
        <div onClick={() => setIsSidebarOpen(false)}
          style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.3)", zIndex:30 }}
          className="md:hidden" />
      )}

      {/* SIDEBAR */}
      <aside style={{
        width: 230, background:"#fffcfb", borderRight:"1px solid #f3e8e2",
        boxShadow:"2px 0 12px rgba(243,232,226,0.3)", display:"flex", flexDirection:"column",
        position:"fixed", top:0, bottom:0, left:0, zIndex:40,
        transition:"transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      }} className={`md:static ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>

        {/* Logo (Heart with Medical Cross) */}
        <div style={{ padding:"24px 20px 16px", borderBottom:"1px solid #fdf8f5", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ position:"relative", flexShrink:0 }}>
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#ff5a50" />
                <path d="M12 3.82c-1.09-1.28-2.76-2.09-4.5-2.09C4.42 1.73 2 7.23 2 7.23c0 3.78 3.4 6.86 8.55 11.54L12 20.08V3.82z" fill="#0ea5e9" />
                <path d="M10.5 10.5h3v3h3v3h-3v3h-3v-3h-3v-3h3v-3z" fill="#ffffff" style={{ transform: "translate(0.5px, 0.5px) scale(0.8)", transformOrigin: "12px 12px" }} />
              </svg>
            </div>
            <div>
              <div style={{ fontWeight:800, fontSize:13, color:"#0f172a", lineHeight:1.2, letterSpacing:"-0.2px" }}>Sistem</div>
              <div style={{ fontWeight:800, fontSize:13, color:"#0f172a", lineHeight:1.2, letterSpacing:"-0.2px" }}>Manajemen</div>
              <div style={{ fontWeight:800, fontSize:13, color:"#ff5a50", lineHeight:1.2, letterSpacing:"-0.2px" }}>Klinik AI</div>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden"
            style={{ padding:6, borderRadius:10, border:"none", background:"#fcf8f5", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <X style={{ width:16, height:16, color:"#64748b" }} />
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, overflowY:"auto", padding:"16px 14px", display:"flex", flexDirection:"column", gap:2 }}>
          {menuItems.map((item) => {
            const isActive = activeTab === item.name;
            const Icon = item.icon;
            return (
              <button key={item.name}
                onClick={() => { setActiveTab(item.name as Tab); setIsSidebarOpen(false); }}
                style={{
                  width:"100%", display:"flex", alignItems:"center", gap:12,
                  padding:"10px 14px", borderRadius:12, border:"none", cursor:"pointer",
                  background: isActive ? "linear-gradient(135deg, #ff5a50, #ff7860)" : "transparent",
                  color: isActive ? "#fff" : "#334155",
                  fontWeight: isActive ? 700 : 600,
                  fontSize: 13,
                  transition:"all 0.2s ease",
                  boxShadow: isActive ? "0 4px 12px rgba(255,90,80,0.25)" : "none",
                  textAlign:"left"
                }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "#fdf9f6"; }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}>
                <Icon style={{ width:18, height:18, color: isActive ? "#fff" : item.color, flexShrink:0 }} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* AI Banner Footer */}
        <div style={{ padding:"12px 14px 20px" }}>
          <div style={{ borderRadius:20, padding:16, background:"#fff2eb", border:"1px solid #ffd8c2", position:"relative", overflow:"hidden", boxShadow:"0 4px 10px rgba(255,107,80,0.05)" }}>
            <div style={{ fontWeight:800, fontSize:12, color:"#0f172a", marginBottom:2 }}>Kelola klinik lebih</div>
            <div style={{ fontWeight:800, fontSize:12, color:"#0f172a", marginBottom:6 }}>cerdas dengan AI</div>
            <p style={{ fontSize:10, color:"#64748b", lineHeight:1.5, marginBottom:12, maxWidth:"80%" }}>
              Dapatkan insight, ringkasan pasien, dan rekomendasi klinik secara instan.
            </p>
            
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end" }}>
              <button onClick={() => setActiveTab("AI Assistant")}
                style={{
                  background:"#0d9488", color:"#fff", border:"none", borderRadius:10,
                  padding:"8px 14px", fontSize:11, fontWeight:700, cursor:"pointer",
                  display:"flex", alignItems:"center", gap:4, zIndex:2, boxShadow:"0 2px 6px rgba(13,148,136,0.2)"
                }}>
                Pelajari Selengkapnya →
              </button>
              
              <div style={{ position:"absolute", right:4, bottom:-2, width:64, height:72, zIndex:1 }}>
                <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 70c0-12 12-16 28-16s28 4 28 16v20H20V70z" fill="#2d6a4f" />
                  <path d="M41 54l7 14 7-14h-14z" fill="#fff" />
                  <circle cx="48" cy="38" r="15" fill="#ffd166" />
                  <path d="M33 38c0-12 6-18 15-18s15 6 15 18c0 5-1 10-3 12-2-9-5-11-12-11s-10 2-12 11c-2-2-3-7-3-12z" fill="#1e293b" />
                  <circle cx="43" cy="36" r="1.5" fill="#1e293b" />
                  <circle cx="53" cy="36" r="1.5" fill="#1e293b" />
                  <path d="M45 42c1 1.5 3 1.5 4 0" stroke="#1e293b" strokeWidth="1.2" strokeLinecap="round" />
                  <path d="M38 56c2 4 4 6 10 6s8-2 10-6" stroke="#94a3b8" strokeWidth="1.5" fill="none" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0, paddingLeft:230 }} className="md:pl-[230px]">

        {/* HEADER */}
        <header style={{ height:70, background:"#fff", borderBottom:"1px solid #f3e8e2", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 28px", flexShrink:0, position:"sticky", top:0, zIndex:20 }}>
          
          {/* Clinic Selector Dropdown */}
          <div style={{ display:"flex", alignItems:"center", gap:12, position: "relative" }}>
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden"
              style={{ padding:8, borderRadius:12, background:"#fcf8f5", border:"1px solid #f3e8e2", cursor:"pointer", display:"flex", alignItems:"center" }}>
              <Menu style={{ width:18, height:18, color:"#64748b" }} />
            </button>
            
            <div style={{ position: "relative" }}>
              <button 
                onClick={() => setShowBranchMenu(!showBranchMenu)}
                style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 16px", borderRadius:16, border:"1px solid #f3e8e2", background:"#fff", cursor: "pointer" }}>
                <div style={{ width:24, height:24, borderRadius:8, background:"#eff6ff", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <Building2 style={{ width:14, height:14, color:"#3b82f6" }} />
                </div>
                <span style={{ fontSize:12.5, fontWeight:750, color:"#0f172a" }}>
                  {selectedBranch}
                </span>
                <ChevronDown style={{ width:14, height:14, color:"#94a3b8" }} />
              </button>

              {showBranchMenu && (
                <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, width: 310, background: "#fff", border: "1px solid #f3e8e2", borderRadius: 16, boxShadow: "0 10px 25px rgba(0,0,0,0.12)", padding: 8, zIndex: 100 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", padding: "6px 12px", textTransform: "uppercase" }}>Pilih Cabang Klinik</div>
                  {branches.map(b => (
                    <button 
                      key={b}
                      onClick={() => {
                        setSelectedBranch(b.replace(" (Utama)", ""));
                        setShowBranchMenu(false);
                        showToast(`Berhasil berpindah ke ${b}`);
                      }}
                      style={{
                        width: "100%", textAlign: "left", padding: "9px 12px", borderRadius: 10, border: "none",
                        background: selectedBranch === b.replace(" (Utama)", "") ? "#e0f2fe" : "none",
                        color: selectedBranch === b.replace(" (Utama)", "") ? "#0369a1" : "#334155",
                        fontSize: 12, fontWeight: 700, cursor: "pointer"
                      }}>
                      🏥 {b}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Search bar */}
          <div style={{ position:"relative", flex:1, maxWidth:420, margin:"0 24px", display:"none" }} className="md:block">
            <Search style={{ position:"absolute", left:16, top:"50%", transform:"translateY(-50%)", width:16, height:16, color:"#94a3b8" }} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
              placeholder="Cari modul, pasien, atau menu..."
              style={{
                width:"100%", paddingLeft:42, paddingRight:16, paddingTop:10, paddingBottom:10,
                borderRadius:24, border:"1.5px solid #f3e8e2", background:"#f6eeea",
                fontSize:12.5, color:"#1e293b", fontFamily:"inherit", outline:"none"
              }} 
            />

            {/* Live Search Results Dropdown */}
            {searchFocused && matchedMenus.length > 0 && (
              <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, background: "#fff", border: "1px solid #f3e8e2", borderRadius: 16, boxShadow: "0 10px 25px rgba(0,0,0,0.12)", padding: 8, zIndex: 100 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", padding: "6px 12px" }}>Hasil Pencarian Modul</div>
                {matchedMenus.map(m => {
                  const Icon = m.icon;
                  return (
                    <button 
                      key={m.name}
                      onClick={() => {
                        setActiveTab(m.name as Tab);
                        setSearchQuery("");
                      }}
                      style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 10, border: "none", background: "none", cursor: "pointer", fontSize: 12.5, fontWeight: 700, color: "#0f172a", textAlign: "left" }}>
                      <Icon style={{ width: 16, height: 16, color: m.color }} />
                      <span>Buka Modul {m.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* User Profile dropdown */}
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ position:"relative" }}>
              <button onClick={() => setShowDocMenu(!showDocMenu)}
                style={{ display:"flex", alignItems:"center", gap:10, padding:"6px 12px 6px 6px", borderRadius:16, background:"#fff", border:"1px solid #f3e8e2", cursor:"pointer" }}>
                <div style={{ width:32, height:32, borderRadius:"50%", background:"linear-gradient(135deg,#ff5a50,#0d9488)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <User style={{ width:16, height:16, color:"#fff" }} />
                </div>
                <div style={{ textAlign:"left", display:"none" }} className="sm:block">
                  <div style={{ fontSize:12.5, fontWeight:750, color:"#0f172a", lineHeight:1.2 }}>{sessionUser?.name || "Memuat..."}</div>
                  <div style={{ fontSize:10.5, color:"#64748b" }}>{sessionUser?.role || ""}</div>
                </div>
                <ChevronDown style={{ width:14, height:14, color:"#94a3b8" }} />
              </button>
              {showDocMenu && (
                <div style={{ position:"absolute", right:0, top:"calc(100% + 8px)", width:210, background:"#fff", border:"1px solid #f3e8e2", borderRadius:16, boxShadow:"0 8px 24px rgba(0,0,0,0.1)", padding:8, zIndex:50 }}>
                  <div style={{ padding:"8px 12px", borderBottom:"1px solid #f1f5f9", marginBottom:4 }}>
                    <div style={{ fontSize:12.5, fontWeight:800, color:"#0f172a" }}>{sessionUser?.name}</div>
                    <div style={{ fontSize:11, color:"#64748b" }}>{sessionUser?.email}</div>
                  </div>
                  <button onClick={() => { setShowDocMenu(false); setShowDoctorModal(true); }} style={{ width:"100%", textAlign:"left", padding:"8px 10px", borderRadius:10, border:"none", background:"none", cursor:"pointer", fontSize:12, fontWeight:600, color:"#334155" }}>Profil Saya</button>
                  <button onClick={() => { setShowDocMenu(false); setActiveTab("Pengaturan"); }} style={{ width:"100%", textAlign:"left", padding:"8px 10px", borderRadius:10, border:"none", background:"none", cursor:"pointer", fontSize:12, fontWeight:600, color:"#334155" }}>Pengaturan Akun</button>
                  <div style={{ height:1, background:"#f3e8e2", margin:"4px 0" }} />
                  <button onClick={async () => { setShowDocMenu(false); await supabase.auth.signOut(); router.push("/login"); }}
                    style={{ width:"100%", textAlign:"left", padding:"8px 10px", borderRadius:10, border:"none", background:"none", cursor:"pointer", fontSize:12, fontWeight:600, color:"#dc2626", display:"flex", alignItems:"center", gap:6 }}>
                    <LogOut style={{ width:14, height:14 }} /> Keluar dari Sesi
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Doctor Profile Modal */}
        {showDoctorModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
            <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 420, padding: 24, boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: 0 }}>Profil Dokter Pemeriksa</h3>
                <button onClick={() => setShowDoctorModal(false)} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 16 }}>✕</button>
              </div>

              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#ccfbf1", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                  <User style={{ width: 32, height: 32, color: "#0d9488" }} />
                </div>
                <h4 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: 0 }}>{sessionUser?.name || "Memuat..."}</h4>
                <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0" }}>{sessionUser?.email}</p>
                <span style={{ display: "inline-block", background: "#dcfce7", color: "#166534", padding: "3px 12px", borderRadius: 12, fontSize: 11, fontWeight: 800, marginTop: 8 }}>
                  Status: Praktik Aktif
                </span>
              </div>

              <div style={{ background: "#f8fafc", padding: 14, borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12, color: "#475569", display: "flex", flexDirection: "column", gap: 8 }}>
                <div><strong>No. SIP:</strong> SIP-5542/DINKES/2024</div>
                <div><strong>No. STR:</strong> 3374.8812.2023</div>
                <div><strong>Poli Klinik:</strong> Poli Umum & Penyakit Dalam</div>
                <div><strong>Jadwal Praktik:</strong> Senin - Sabtu (08:00 - 16:00)</div>
              </div>

              <button 
                onClick={() => setShowDoctorModal(false)}
                style={{ width: "100%", marginTop: 20, padding: 10, borderRadius: 10, border: "none", background: "#0d9488", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                Tutup Profil
              </button>
            </div>
          </div>
        )}

        {/* WORKSPACE */}
        <main style={{ flex:1, overflowY:"auto", padding:"24px 28px 40px" }}>
          <div style={{ maxWidth:1500, margin:"0 auto" }}>
            {activeTab === "Dashboard"    && <DashboardView onNavigateTab={(tab) => setActiveTab(tab as any)} />}
            {activeTab === "Pasien"       && <PatientsView onMakeAppointment={handleMakeAppointmentForPatient} onStartEncounter={handleStartEncounter} />}
            {activeTab === "Appointment"  && <AppointmentsView initialPatient={prefilledPatientForAppt} onClearInitialPatient={() => setPrefilledPatientForAppt(null)} onNavigateTab={(tab, patient) => { if (patient && tab === "Encounter") { handleStartEncounter(patient); } else { setActiveTab(tab as any); } }} />}
            {activeTab === "Antrean"      && <QueueView />}
            {activeTab === "Encounter"    && <EncounterView initialPatient={prefilledPatientForEncounter} onClearInitialPatient={() => setPrefilledPatientForEncounter(null)} />}
            {activeTab === "Laboratorium" && <LabView />}
            {activeTab === "Farmasi"      && <PharmacyView />}
            {activeTab === "Billing"      && <BillingView />}
            {activeTab === "Dokumen"      && <DocumentsView />}
            {activeTab === "Audit Log"    && <AuditLogView />}
            {activeTab === "Pengaturan"   && <SettingsView />}
            {activeTab === "AI Assistant" && (
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"60vh", textAlign:"center", padding:40 }}>
                <div style={{ width:80, height:80, borderRadius:"50%", background:"linear-gradient(135deg,#ff5a50,#0d9488)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:24 }}>
                  <Sparkles style={{ width:40, height:40, color:"#fff" }} />
                </div>
                <h2 style={{ fontSize:22, fontWeight:800, color:"#0f172a", marginBottom:8 }}>AI Clinical Assistant</h2>
                <p style={{ fontSize:14, color:"#64748b", marginBottom:8 }}>Modul asisten klinis AI ini sedang dinonaktifkan sementara.</p>
                <p style={{ fontSize:12, color:"#94a3b8", maxWidth:340, marginBottom:32 }}>Hubungi administrator klinik untuk mengaktifkan modul asisten ini.</p>
                <button onClick={() => setActiveTab("Dashboard")}
                  style={{ padding:"12px 28px", borderRadius:12, background:"#0d9488", color:"#fff", border:"none", fontSize:14, fontWeight:700, cursor:"pointer", boxShadow:"0 4px 12px rgba(13,148,136,0.3)" }}>
                  Kembali ke Dashboard
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
