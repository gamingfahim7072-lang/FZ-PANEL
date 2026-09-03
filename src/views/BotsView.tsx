import React, { useState } from 'react';
import {
  Bot,
  Plus,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Trash2,
  RefreshCw,
  ExternalLink,
  Sliders,
  Copy,
  Radio,
  Loader2
} from 'lucide-react';
import { TelegramBot } from '../types';
import { api } from '../api';

interface BotsViewProps {
  bots: TelegramBot[];
  selectedBotId: string;
  onSelectBotId: (id: string) => void;
  onOpenConnectBot: () => void;
  onOpenLiveSimulator: () => void;
  onNavigateToEditor: (botId: string) => void;
  onRefreshBots: () => void;
}

export const BotsView: React.FC<BotsViewProps> = ({
  bots,
  selectedBotId,
  onSelectBotId,
  onOpenConnectBot,
  onOpenLiveSimulator,
  onNavigateToEditor,
  onRefreshBots
}) => {
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; msg: string; success: boolean } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleTestConnection = async (botId: string) => {
    setTestingId(botId);
    setTestResult(null);
    try {
      const res = await api.testBotConnection(botId);
      setTestResult({ id: botId, msg: res.message || 'Bot online and responsive!', success: true });
    } catch (err: any) {
      setTestResult({ id: botId, msg: err.message || 'Connection test failed', success: false });
    } finally {
      setTestingId(null);
    }
  };

  const handleDeleteBot = async (botId: string) => {
    if (!confirm('Are you sure you want to disconnect and delete this bot?')) return;
    setDeletingId(botId);
    try {
      await api.deleteBot(botId);
      onRefreshBots();
    } catch (err: any) {
      alert(err.message || 'Failed to delete bot');
    } finally {
      setDeletingId(null);
    }
  };

  const copyWebhookUrl = (botId: string) => {
    const url = `${window.location.origin}/api/telegram/webhook/${botId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(botId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white">Connected Telegram Store Bots</h1>
          <p className="text-xs md:text-sm text-slate-400">
            Manage your bot instances, webhooks, and live interactive simulators.
          </p>
        </div>
        <button
          onClick={onOpenConnectBot}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-cyan-500/20 flex items-center space-x-2 shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Connect New Telegram Bot</span>
        </button>
      </div>

      {/* Bots Grid */}
      {bots.length === 0 ? (
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-12 text-center max-w-md mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto">
            <Bot className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">No Telegram Bots Connected</h3>
            <p className="text-xs text-slate-400 mt-1">
              Connect your first bot in less than 30 seconds using your @BotFather token.
            </p>
          </div>
          <button
            onClick={onOpenConnectBot}
            className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-cyan-500/20 inline-flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Connect Telegram Bot</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bots.map(bot => {
            const isSelected = bot.id === selectedBotId;
            return (
              <div
                key={bot.id}
                className={`bg-[#0f172a] border rounded-2xl p-5 flex flex-col justify-between transition-all relative ${
                  isSelected ? 'border-cyan-500 ring-1 ring-cyan-500 shadow-lg shadow-cyan-500/5' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Status Pill */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
                      <Bot className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{bot.first_name}</h3>
                      <p className="text-xs text-cyan-400 font-mono">@{bot.username}</p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>ONLINE</span>
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-2 py-3 border-y border-slate-800/80 text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Telegram Bot ID:</span>
                    <span className="font-mono text-slate-300">{bot.bot_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Connected Since:</span>
                    <span>{new Date(bot.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Test Feedback banner */}
                {testResult && testResult.id === bot.id && (
                  <div
                    className={`mt-3 p-2.5 rounded-xl text-xs flex items-center space-x-1.5 ${
                      testResult.success
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-red-500/10 text-red-400 border border-red-500/30'
                    }`}
                  >
                    {testResult.success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    <span>{testResult.msg}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        onSelectBotId(bot.id);
                        onNavigateToEditor(bot.id);
                      }}
                      className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors"
                    >
                      <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Edit Buttons</span>
                    </button>

                    <button
                      onClick={() => {
                        onSelectBotId(bot.id);
                        onOpenLiveSimulator();
                      }}
                      className="py-2 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Live Tester</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => handleTestConnection(bot.id)}
                      disabled={testingId === bot.id}
                      className="text-[11px] text-slate-400 hover:text-cyan-400 flex items-center space-x-1"
                    >
                      <RefreshCw className={`w-3 h-3 ${testingId === bot.id ? 'animate-spin' : ''}`} />
                      <span>Ping getMe</span>
                    </button>

                    <button
                      onClick={() => copyWebhookUrl(bot.id)}
                      className="text-[11px] text-slate-400 hover:text-cyan-400 flex items-center space-x-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedId === bot.id ? 'Copied!' : 'Copy Webhook URL'}</span>
                    </button>

                    <button
                      onClick={() => handleDeleteBot(bot.id)}
                      disabled={deletingId === bot.id}
                      className="text-[11px] text-red-400 hover:text-red-300 flex items-center space-x-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Disconnect</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
