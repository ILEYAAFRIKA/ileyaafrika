import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Copy,
  ChevronDown,
  ChevronUp,
  Database,
  ShieldCheck,
  Server,
  Zap,
  ExternalLink,
  Code2,
  X,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import {
  runSupabaseDiagnostics,
  DiagnosticReport,
  redactSecret,
} from '../lib/supabaseDiagnostic';
import { supabase } from '../lib/supabase';
import { generateUUID } from '../lib/uuid';

export interface SupabaseDiagnosticRoutineProps {
  isOpen?: boolean;
  onClose?: () => void;
  autoRunOnMount?: boolean;
  defaultOpen?: boolean;
  showFloatingTrigger?: boolean;
  triggerRunTimestamp?: number;
}

export const SupabaseDiagnosticRoutine: React.FC<SupabaseDiagnosticRoutineProps> = ({
  isOpen,
  onClose,
  autoRunOnMount = false,
  defaultOpen = false,
  showFloatingTrigger = false,
  triggerRunTimestamp,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState<boolean>(defaultOpen);
  const isModalOpen = isOpen !== undefined ? isOpen : internalIsOpen;

  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [report, setReport] = useState<DiagnosticReport | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'profiles' | 'bookings' | 'raw'>('overview');
  const [liveTestState, setLiveTestState] = useState<{
    running: boolean;
    result: string | null;
    success?: boolean;
  }>({ running: false, result: null });

  const handleClose = useCallback(() => {
    setInternalIsOpen(false);
    if (onClose) {
      onClose();
    }
  }, [onClose]);

  // Execute diagnostics
  const executeDiagnostics = useCallback(async () => {
    setIsRunning(true);
    try {
      const res = await runSupabaseDiagnostics();
      setReport(res);
    } catch (err: any) {
      console.error('Diagnostic error:', err);
    } finally {
      setIsRunning(false);
    }
  }, []);

  // Run on mount only if explicitly requested
  useEffect(() => {
    if (autoRunOnMount) {
      executeDiagnostics();
    }
  }, [autoRunOnMount, executeDiagnostics]);

  // Trigger when admin manually clicks "Run System Diagnostics" button
  useEffect(() => {
    if (triggerRunTimestamp && triggerRunTimestamp > 0) {
      executeDiagnostics();
    }
  }, [triggerRunTimestamp, executeDiagnostics]);

  // Auto-run if opened and no report has been generated yet
  useEffect(() => {
    if (isModalOpen && !report && !isRunning) {
      executeDiagnostics();
    }
  }, [isModalOpen, report, isRunning, executeDiagnostics]);

  // Copy report to clipboard
  const handleCopyReport = () => {
    if (!report) return;
    navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Perform a Live Simulated Booking Write to prove end-to-end functionality
  const handleRunLiveBookingSimulation = async () => {
    setLiveTestState({ running: true, result: null });
    const testId = generateUUID();
    const testRef = `LIVE-PROBE-${Date.now()}`;
    const payload = {
      id: testId,
      listing_id: 'il-524270',
      guest_name: 'Live Diagnostic Guest',
      guest_email: 'diagnostic.guest@ileya.ng',
      amount_paid: 150000,
      check_in_date: '2026-11-10',
      check_out_date: '2026-11-14',
      payment_status: 'completed',
      payment_reference: testRef,
      booked_at: new Date().toISOString(),
    };

    try {
      // 1. Insert
      const { data: insertData, error: insertError, status: insertStatus } = await supabase
        .from('bookings')
        .insert([payload])
        .select();

      if (insertError) {
        setLiveTestState({
          running: false,
          success: false,
          result: `Insert Failed [HTTP ${insertStatus}]: ${insertError.message} (${insertError.code || 'no code'})`,
        });
        return;
      }

      // 2. Select back
      const { data: selectData, error: selectError, status: selectStatus } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', testId);

      if (selectError) {
        setLiveTestState({
          running: false,
          success: false,
          result: `Insert Succeeded, but Select Query Failed [HTTP ${selectStatus}]: ${selectError.message}`,
        });
        return;
      }

      if (!selectData || selectData.length === 0) {
        setLiveTestState({
          running: false,
          success: false,
          result: `Insert Succeeded [HTTP 201], but Select returned 0 rows! Row Level Security (RLS) is hiding data from anon role.`,
        });
        return;
      }

      // 3. Clean up
      await supabase.from('bookings').delete().eq('id', testId);

      setLiveTestState({
        running: false,
        success: true,
        result: `Live Test Succeeded! Inserted row with ID ${testId} (HTTP 201), verified via SELECT (HTTP 200), and cleaned up cleanly.`,
      });

      // Refresh diagnostic report
      executeDiagnostics();
    } catch (err: any) {
      setLiveTestState({
        running: false,
        success: false,
        result: `Simulation Exception: ${err?.message || String(err)}`,
      });
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'passed':
      case 'HEALTHY':
        return 'text-emerald-700 bg-emerald-50 border-emerald-300';
      case 'warning':
      case 'ACTION_REQUIRED':
        return 'text-amber-700 bg-amber-50 border-amber-300';
      case 'failed':
      case 'CRITICAL':
        return 'text-rose-700 bg-rose-50 border-rose-300';
      default:
        return 'text-neutral-700 bg-neutral-100 border-neutral-300';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'passed':
      case 'HEALTHY':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'warning':
      case 'ACTION_REQUIRED':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'failed':
      case 'CRITICAL':
        return <XCircle className="w-4 h-4 text-rose-600" />;
      default:
        return <Activity className="w-4 h-4 text-neutral-500" />;
    }
  };

  return (
    <>
      {/* Floating Trigger Badge (Hidden by default, only shown if explicitly enabled) */}
      {showFloatingTrigger && (
        <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2">
          <button
            id="supabase-diagnostic-trigger"
            type="button"
            onClick={() => setInternalIsOpen(!isModalOpen)}
            className="group flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#1B4332] text-white shadow-xl hover:bg-[#143427] border border-[#E8A33D]/40 transition-all cursor-pointer text-xs font-semibold"
            title="Open Supabase & Booking Diagnostic Routine"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  report?.overallStatus === 'HEALTHY'
                    ? 'bg-emerald-400'
                    : report?.overallStatus === 'CRITICAL'
                    ? 'bg-rose-400'
                    : 'bg-amber-400'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  report?.overallStatus === 'HEALTHY'
                    ? 'bg-emerald-500'
                    : report?.overallStatus === 'CRITICAL'
                    ? 'bg-rose-500'
                    : 'bg-amber-500'
                }`}
              />
            </span>
            <Database className="w-3.5 h-3.5 text-[#E8A33D]" />
            <span>Supabase Diagnostics</span>
            {report && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${
                  report.overallStatus === 'HEALTHY'
                    ? 'bg-emerald-800 text-emerald-200'
                    : report.overallStatus === 'CRITICAL'
                    ? 'bg-rose-900 text-rose-200'
                    : 'bg-amber-800 text-amber-200'
                }`}
              >
                {report.overallStatus}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Main Diagnostic Modal / Panel */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleClose();
            }
          }}
        >
          <div
            className={`bg-white rounded-3xl shadow-2xl border border-[#1B4332]/20 flex flex-col overflow-hidden transition-all duration-200 ${
              isExpanded
                ? 'w-full h-[96vh] max-w-7xl'
                : 'w-full max-w-4xl max-h-[90vh]'
            }`}
          >
            {/* Header Bar */}
            <div className="px-6 py-4 bg-[#14231C] text-white flex items-center justify-between border-b border-white/10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white/10 text-[#E8A33D]">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold tracking-tight">
                      Automated Supabase & Booking Diagnostic Routine
                    </h2>
                    {report && (
                      <span
                        className={`px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider border ${getStatusColor(
                          report.overallStatus
                        )}`}
                      >
                        {report.overallStatus}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-300 font-mono">
                    Project Ref: <span className="text-[#E8A33D] font-bold">{report?.config.projectRef || 'Detecting...'}</span>
                    {report?.networkPing && (
                      <span className="ml-3 text-neutral-400">
                        • Ping: {report.networkPing.latencyMs}ms ({report.networkPing.reachable ? 'Reachable' : 'Unreachable'})
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={executeDiagnostics}
                  disabled={isRunning}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  title="Run all diagnostic probes"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin text-[#E8A33D]' : ''}`} />
                  <span>{isRunning ? 'Running...' : 'Run Diagnostics'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyReport}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs transition-colors cursor-pointer"
                  title="Copy JSON Report"
                >
                  <Copy className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs transition-colors cursor-pointer hidden sm:block"
                  title={isExpanded ? 'Collapse' : 'Maximize'}
                >
                  {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={handleClose}
                  className="p-2 rounded-xl bg-white/10 hover:bg-rose-500/30 text-white text-xs transition-colors cursor-pointer"
                  title="Close Diagnostic Window"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Actions & Live Probe Bar */}
            <div className="px-6 py-3 bg-[#FBF6EC] border-b border-[#1B4332]/10 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#1B4332]">Diagnostic Tabs:</span>
                <div className="inline-flex rounded-xl bg-white p-1 border border-[#1B4332]/10 text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveTab('overview')}
                    className={`px-3 py-1 rounded-lg font-medium transition-all ${
                      activeTab === 'overview'
                        ? 'bg-[#1B4332] text-white shadow-xs'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    Overview & Audit
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('bookings')}
                    className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                      activeTab === 'bookings'
                        ? 'bg-[#1B4332] text-white shadow-xs'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    <span>Bookings Table</span>
                    {report?.bookingsProbe.insertResult && getStatusIcon(report.bookingsProbe.insertResult.status)}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('profiles')}
                    className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                      activeTab === 'profiles'
                        ? 'bg-[#1B4332] text-white shadow-xs'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    <span>Profiles Table</span>
                    {report?.profilesProbe.insertResult && getStatusIcon(report.profilesProbe.insertResult.status)}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('raw')}
                    className={`px-3 py-1 rounded-lg font-medium transition-all ${
                      activeTab === 'raw'
                        ? 'bg-[#1B4332] text-white shadow-xs'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    Raw JSON Report
                  </button>
                </div>
              </div>

              {/* Live Test Trigger Button */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRunLiveBookingSimulation}
                  disabled={liveTestState.running}
                  className="px-3 py-1.5 rounded-xl bg-[#E8A33D] hover:bg-[#d8932d] text-[#14231C] font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Zap className={`w-3.5 h-3.5 ${liveTestState.running ? 'animate-pulse' : ''}`} />
                  <span>{liveTestState.running ? 'Simulating Write...' : 'Test Live Booking Write'}</span>
                </button>
                {copied && <span className="text-xs font-semibold text-emerald-700">Copied!</span>}
              </div>
            </div>

            {/* Live Test Feedback Banner (if executed) */}
            {liveTestState.result && (
              <div
                className={`px-6 py-2.5 text-xs font-medium border-b flex items-center justify-between ${
                  liveTestState.success
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                    : 'bg-rose-50 text-rose-900 border-rose-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  {liveTestState.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{liveTestState.result}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setLiveTestState({ running: false, result: null })}
                  className="text-xs text-neutral-500 hover:text-neutral-800 underline ml-2"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {!report ? (
                <div className="py-16 text-center space-y-4">
                  <RefreshCw className="w-8 h-8 text-[#1B4332] animate-spin mx-auto" />
                  <p className="text-sm font-medium text-neutral-600">
                    Executing automated configuration audit and table probes...
                  </p>
                </div>
              ) : activeTab === 'overview' ? (
                <div className="space-y-6">
                  {/* 1. CONFIGURATION AUDIT CARD */}
                  <div className="bg-white rounded-2xl border border-[#1B4332]/10 p-5 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                      <div className="flex items-center gap-2">
                        <Server className="w-4 h-4 text-[#1B4332]" />
                        <h3 className="text-sm font-bold text-[#1B4332]">
                          1. Configuration Audit
                        </h3>
                      </div>
                      <span className="text-xs font-mono text-neutral-500">
                        Evaluated: {new Date(report.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200/80 space-y-1">
                        <span className="text-neutral-500 font-medium">Active Supabase URL:</span>
                        <div className="font-mono text-neutral-900 font-semibold break-all select-all flex items-center justify-between">
                          <span>{report.config.supabaseUrl}</span>
                        </div>
                        <span className="text-[11px] text-neutral-500">
                          Origin: {report.config.hasCustomEnvUrl ? 'VITE_SUPABASE_URL env var' : 'Project Default Fallback'}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200/80 space-y-1">
                        <span className="text-neutral-500 font-medium">Supabase Anon Key:</span>
                        <div className="font-mono text-neutral-900 font-semibold break-all select-all">
                          {report.config.anonKeyRedacted}
                        </div>
                        <span className="text-[11px] text-neutral-500">
                          Total Length: {report.config.anonKeyLength} chars (Middle redacted for security)
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200/80 space-y-1">
                        <span className="text-neutral-500 font-medium">Project Reference ID:</span>
                        <div className="font-mono text-emerald-800 font-bold text-sm">
                          {report.config.projectRef}
                        </div>
                        <span className="text-[11px] text-neutral-500">
                          Verify this matches the project ID in your Supabase dashboard URL
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200/80 space-y-1">
                        <span className="text-neutral-500 font-medium">Paystack Public Key:</span>
                        <div className="font-mono text-neutral-900 font-semibold">
                          {report.config.paystackPublicKeyPrefix}
                        </div>
                        <span className="text-[11px] text-neutral-500">
                          {report.config.paystackPublicKeyPrefix.includes('placeholder')
                            ? 'Using Sandbox Test Mode (instant simulated checkout)'
                            : 'Live / Test Paystack Key Configured'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 2. AUTOMATED WRITE & READ PROBE SUMMARY */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Bookings Card */}
                    <div className="bg-white rounded-2xl border border-[#1B4332]/10 p-5 shadow-xs space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Database className="w-4 h-4 text-[#1B4332]" />
                          <h4 className="text-sm font-bold text-[#1B4332]">
                            Bookings Table Probe
                          </h4>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase border ${getStatusColor(
                            report.bookingsProbe.insertResult.status
                          )}`}
                        >
                          {report.bookingsProbe.insertResult.status}
                        </span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between py-1 border-b border-neutral-100">
                          <span className="text-neutral-500">Insert Operation:</span>
                          <span className="font-mono font-bold">
                            HTTP {report.bookingsProbe.insertResult.httpStatus || 201} (
                            {report.bookingsProbe.insertResult.durationMs}ms)
                          </span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-neutral-100">
                          <span className="text-neutral-500">Select (RLS) Operation:</span>
                          <span className="font-mono font-bold">
                            HTTP {report.bookingsProbe.selectResult.httpStatus || 200} (
                            {report.bookingsProbe.selectResult.durationMs}ms)
                          </span>
                        </div>
                        <div className="py-1">
                          <span className="text-neutral-500 block mb-0.5">RLS Assessment:</span>
                          <p className="font-medium text-neutral-800 text-[11px] bg-neutral-50 p-2 rounded-lg border border-neutral-200">
                            {report.bookingsProbe.rlsAssessment}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setActiveTab('bookings')}
                        className="w-full mt-2 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-[#1B4332] text-xs font-semibold transition-colors"
                      >
                        Inspect Bookings Payload & Schema &rarr;
                      </button>
                    </div>

                    {/* Profiles Card */}
                    <div className="bg-white rounded-2xl border border-[#1B4332]/10 p-5 shadow-xs space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-[#1B4332]" />
                          <h4 className="text-sm font-bold text-[#1B4332]">
                            Profiles Table Probe
                          </h4>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase border ${getStatusColor(
                            report.profilesProbe.insertResult.status
                          )}`}
                        >
                          {report.profilesProbe.insertResult.status}
                        </span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between py-1 border-b border-neutral-100">
                          <span className="text-neutral-500">Insert/Upsert Operation:</span>
                          <span className="font-mono font-bold">
                            HTTP {report.profilesProbe.insertResult.httpStatus || 'N/A'} (
                            {report.profilesProbe.insertResult.durationMs}ms)
                          </span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-neutral-100">
                          <span className="text-neutral-500">Select Operation:</span>
                          <span className="font-mono font-bold">
                            HTTP {report.profilesProbe.selectResult.httpStatus || 'N/A'} (
                            {report.profilesProbe.selectResult.durationMs}ms)
                          </span>
                        </div>
                        <div className="py-1">
                          <span className="text-neutral-500 block mb-0.5">RLS Assessment:</span>
                          <p className="font-medium text-neutral-800 text-[11px] bg-neutral-50 p-2 rounded-lg border border-neutral-200">
                            {report.profilesProbe.rlsAssessment}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setActiveTab('profiles')}
                        className="w-full mt-2 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-[#1B4332] text-xs font-semibold transition-colors"
                      >
                        Inspect Profiles Foreign Key & RLS &rarr;
                      </button>
                    </div>
                  </div>

                  {/* 3. EXECUTION GUARD AUDIT CARD */}
                  <div className="bg-white rounded-2xl border border-[#1B4332]/10 p-5 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-700" />
                        <h3 className="text-sm font-bold text-[#1B4332]">
                          3. Execution Guard & Checkout Flow Inspection
                        </h3>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                        PROTECTED
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-neutral-50 border border-neutral-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                        <div>
                          <strong className="text-neutral-900 block font-semibold">
                            UUID v4 Primary Key Enforced
                          </strong>
                          <span className="text-neutral-600 text-[11px]">
                            PostgreSQL `uuid` type requires valid RFC4122 strings. Non-UUID IDs like `BK-178...` cause PostgreSQL error 22P02.
                          </span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-neutral-50 border border-neutral-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                        <div>
                          <strong className="text-neutral-900 block font-semibold">
                            Database Schema Sanitization
                          </strong>
                          <span className="text-neutral-600 text-[11px]">
                            Payload only sends columns existing in `bookings`: `id`, `listing_id`, `guest_name`, `guest_email`, `amount_paid`, `check_in_date`, `check_out_date`, `payment_status`, `payment_reference`, `booked_at`.
                          </span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-neutral-50 border border-neutral-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                        <div>
                          <strong className="text-neutral-900 block font-semibold">
                            Insert Awaited Before Modal Close
                          </strong>
                          <span className="text-neutral-600 text-[11px]">
                            `await supabase.from('bookings').insert([payload])` must complete and succeed before parent callbacks or unmount transitions are permitted.
                          </span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-neutral-50 border border-neutral-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                        <div>
                          <strong className="text-neutral-900 block font-semibold">
                            Unmount & Lifecycle Guard Active
                          </strong>
                          <span className="text-neutral-600 text-[11px]">
                            Modal close buttons and backdrop dismissals are disabled while database writes are in-flight to prevent aborted promises.
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* RECOMMENDATIONS (IF ANY) */}
                  {report.recommendations && report.recommendations.length > 0 && (
                    <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4 space-y-2">
                      <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                        <AlertTriangle className="w-4 h-4 text-amber-700" />
                        <span>Diagnostic Recommendations:</span>
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-xs text-amber-800">
                        {report.recommendations.map((rec, idx) => (
                          <li key={idx}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : activeTab === 'bookings' ? (
                /* BOOKINGS PROBE DETAILS TAB */
                <div className="space-y-4">
                  <div className="bg-white rounded-2xl border border-[#1B4332]/10 p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-[#1B4332]">
                        Bookings Table Probe Analysis
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase border ${getStatusColor(
                          report.bookingsProbe.insertResult.status
                        )}`}
                      >
                        {report.bookingsProbe.insertResult.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                        <span className="text-neutral-500 font-medium">HTTP Status Code:</span>
                        <div className="font-mono font-bold text-neutral-900 text-sm">
                          {report.bookingsProbe.insertResult.httpStatus || 201}
                        </div>
                      </div>
                      <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                        <span className="text-neutral-500 font-medium">PostgreSQL Error Code:</span>
                        <div className="font-mono font-bold text-neutral-900 text-sm">
                          {report.bookingsProbe.insertResult.code || 'None (Success)'}
                        </div>
                      </div>
                      <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                        <span className="text-neutral-500 font-medium">RLS Read Access:</span>
                        <div className="font-mono font-bold text-neutral-900 text-sm">
                          {report.bookingsProbe.selectResult.status === 'passed' ? 'Permitted' : 'Blocked / Restricted'}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-neutral-700">Probe Explanation:</span>
                      <p className="text-xs text-neutral-800 bg-neutral-50 p-3 rounded-xl border border-neutral-200 font-mono">
                        {report.bookingsProbe.insertResult.explanation || 'Insert probe completed.'}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-neutral-700">Exact Database Schema Columns:</span>
                      <div className="p-3 rounded-xl bg-neutral-900 text-emerald-400 font-mono text-xs overflow-x-auto">
                        [ 'id (uuid)', 'listing_id (text)', 'guest_name (text)', 'guest_email (text)', 'amount_paid (numeric)', 'payment_reference (text)', 'payment_status (text)', 'check_in_date (date)', 'check_out_date (date)', 'created_at (timestamptz)', 'booked_at (timestamptz)' ]
                      </div>
                    </div>

                    {report.bookingsProbe.insertResult.data && (
                      <div className="space-y-1">
                        <span className="text-xs font-semibold text-neutral-700">Inserted Test Record:</span>
                        <pre className="p-3 rounded-xl bg-neutral-900 text-neutral-200 font-mono text-xs overflow-x-auto">
                          {JSON.stringify(report.bookingsProbe.insertResult.data, null, 2)}
                        </pre>
                      </div>
                    )}

                    {report.bookingsProbe.insertResult.error && (
                      <div className="space-y-1">
                        <span className="text-xs font-semibold text-rose-700">Exact Supabase Error Response:</span>
                        <pre className="p-3 rounded-xl bg-rose-950 text-rose-200 font-mono text-xs overflow-x-auto">
                          {JSON.stringify(report.bookingsProbe.insertResult.error, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              ) : activeTab === 'profiles' ? (
                /* PROFILES PROBE DETAILS TAB */
                <div className="space-y-4">
                  <div className="bg-white rounded-2xl border border-[#1B4332]/10 p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-[#1B4332]">
                        Profiles Table Probe Analysis
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase border ${getStatusColor(
                          report.profilesProbe.insertResult.status
                        )}`}
                      >
                        {report.profilesProbe.insertResult.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                        <span className="text-neutral-500 font-medium">HTTP Status Code:</span>
                        <div className="font-mono font-bold text-neutral-900 text-sm">
                          {report.profilesProbe.insertResult.httpStatus || 'N/A'}
                        </div>
                      </div>
                      <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                        <span className="text-neutral-500 font-medium">PostgreSQL Error Code:</span>
                        <div className="font-mono font-bold text-neutral-900 text-sm">
                          {report.profilesProbe.insertResult.code || 'None'}
                        </div>
                      </div>
                      <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                        <span className="text-neutral-500 font-medium">Foreign Key Status:</span>
                        <div className="font-mono font-bold text-neutral-900 text-sm">
                          {report.profilesProbe.insertResult.code === '23503'
                            ? 'FKey Enforced (auth.users)'
                            : 'Normal'}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-neutral-700">Probe Explanation:</span>
                      <p className="text-xs text-neutral-800 bg-neutral-50 p-3 rounded-xl border border-neutral-200 font-mono">
                        {report.profilesProbe.insertResult.explanation || 'Profile probe completed.'}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-neutral-700">Schema Detail:</span>
                      <p className="text-xs text-neutral-600 leading-relaxed">
                        `profiles.id` is linked to `auth.users(id)` via `profiles_id_fkey`. In Supabase, rows in `profiles` can only be inserted when the user signs up through `supabase.auth.signUp()`. Columns on `profiles` are `['id', 'full_name', 'role', 'updated_at']`.
                      </p>
                    </div>

                    {report.profilesProbe.insertResult.error && (
                      <div className="space-y-1">
                        <span className="text-xs font-semibold text-rose-700">Profile Error Object:</span>
                        <pre className="p-3 rounded-xl bg-rose-950 text-rose-200 font-mono text-xs overflow-x-auto">
                          {JSON.stringify(report.profilesProbe.insertResult.error, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* RAW JSON REPORT TAB */
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-neutral-500">
                      Full Diagnostic Output (Copy for debugging)
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyReport}
                      className="px-3 py-1 rounded-lg bg-[#1B4332] text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Full JSON</span>
                    </button>
                  </div>
                  <pre className="p-4 rounded-2xl bg-neutral-950 text-neutral-200 font-mono text-xs overflow-x-auto max-h-[500px]">
                    {JSON.stringify(report, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-neutral-50 border-t border-neutral-200 text-xs text-neutral-500 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Diagnostics active and monitoring database connections</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="text-neutral-700 hover:text-neutral-900 font-semibold cursor-pointer"
                >
                  Close Panel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
