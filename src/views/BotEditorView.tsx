import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Sparkles,
  Save,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  Bot,
  MessageSquare,
  LayoutGrid,
  Check,
  AlertCircle,
  Loader2,
  HelpCircle,
  CreditCard,
  History,
  RotateCcw,
  Send,
  ExternalLink,
  QrCode,
  ShieldCheck,
  FolderTree,
  CornerDownRight,
  ArrowLeft,
  Home,
  Layers,
  Edit3,
  Image as ImageIcon,
  Terminal
} from 'lucide-react';
import {
  TelegramBot,
  BotSettings,
  BotMenu,
  BotButton,
  BotFaq,
  BotVersion,
  BotPaymentConfig,
  BotCommand,
  Product,
  ProductCategory,
  ProductPackage
} from '../types';
import { api } from '../api';
import { BotCommandBuilder } from '../components/BotCommandBuilder';

interface BotEditorViewProps {
  bot: TelegramBot | null;
  onOpenLiveSimulator: () => void;
}

export const BotEditorView: React.FC<BotEditorViewProps> = ({ bot, onOpenLiveSimulator }) => {
  const [activeTab, setActiveTab] = useState<'SETTINGS' | 'START_MSG' | 'MENUS' | 'BUTTONS' | 'COMMANDS' | 'FAQS' | 'PAYMENTS' | 'VERSIONS'>('MENUS');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Settings State
  const [settings, setSettings] = useState<Partial<BotSettings>>({
    display_name: '',
    description: '',
    support_username: '',
    support_url: '',
    support_message: '',
    currency: 'INR',
    timezone: 'UTC',
    start_text: '',
    start_banner_url: '',
    start_video_url: '',
    promo_message: '',
    business_hours: '24/7 Automated Delivery',
    auto_delivery: true,
    notify_admin_on_order: true
  });

  // Multi-Level Menus State
  const [menus, setMenus] = useState<BotMenu[]>([]);
  const [selectedMenuId, setSelectedMenuId] = useState<string>('main');

  // Buttons State
  const [buttons, setButtons] = useState<BotButton[]>([]);

  // Commands State (Command Builder)
  const [commands, setCommands] = useState<BotCommand[]>([]);

  // FAQs State
  const [faqs, setFaqs] = useState<BotFaq[]>([]);

  // Payment Config State
  const [paymentConfig, setPaymentConfig] = useState<Partial<BotPaymentConfig>>({
    enable_sandbox: true,
    enable_manual_upi: true,
    upi_id: '',
    upi_name: '',
    business_name: '',
    enable_dynamic_qr: true,
    manual_instructions: 'Transfer exact order amount and submit payment proof for instant verification.',
    bank_account_number: '',
    bank_ifsc: '',
    bank_name: ''
  });

  // Versions History State
  const [versions, setVersions] = useState<BotVersion[]>([]);

  // Context Data for Target Pickers
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);

  // Mockup Interactive State
  const [previewCurrentMenuId, setPreviewCurrentMenuId] = useState<string>('main');
  const [isPhoneCmdMenuOpen, setIsPhoneCmdMenuOpen] = useState(false);
  const [qrTestPreview, setQrTestPreview] = useState<{ qrImageUrl?: string; upiUri?: string } | null>(null);
  const [qrTestLoading, setQrTestLoading] = useState(false);

  useEffect(() => {
    if (bot) {
      loadBotConfig();
    }
  }, [bot?.id]);

  const loadBotConfig = async () => {
    if (!bot) return;
    setLoading(true);
    setError(null);
    try {
      const [settingsRes, menusRes, prodRes, catRes, verRes] = await Promise.all([
        api.getBotSettings(bot.id),
        api.getBotMenus(bot.id),
        api.getProducts({ bot_id: bot.id }),
        api.getCategories(bot.id),
        api.getBotVersions(bot.id)
      ]);

      if (settingsRes.settings) {
        setSettings(settingsRes.settings);
      } else {
        setSettings({
          display_name: bot.first_name,
          description: 'Automated digital storefront',
          currency: 'INR',
          timezone: 'UTC',
          start_text: `Welcome to ${bot.first_name}! 🚀\n\nInstant digital keys, licenses, and downloads delivered 24/7.`,
          auto_delivery: true,
          notify_admin_on_order: true
        });
      }

      // Menus
      if (menusRes.menus && menusRes.menus.length > 0) {
        setMenus(menusRes.menus);
        setSelectedMenuId(menusRes.menus[0].id || 'main');
      } else {
        const defaultMainMenu: BotMenu = {
          id: 'main',
          bot_id: bot.id,
          title: 'Main Menu',
          slug: 'main',
          message_text: `Welcome to ${bot.first_name}! 🚀\n\nSelect an option below to browse categories and products:`,
          auto_back_button: false,
          auto_home_button: false,
          columns_per_row: 2
        };
        setMenus([defaultMainMenu]);
        setSelectedMenuId('main');
      }

      if (settingsRes.buttons && settingsRes.buttons.length > 0) {
        setButtons(settingsRes.buttons);
      } else {
        // Initialize default starter buttons
        setButtons([
          {
            id: `btn-1`,
            bot_id: bot.id,
            menu_id: 'main',
            label: '🛍️ Browse Products',
            emoji: '🛍️',
            button_type: 'PRODUCTS_LIST',
            target_value: 'ALL',
            row_order: 0,
            col_order: 0
          },
          {
            id: `btn-2`,
            bot_id: bot.id,
            menu_id: 'main',
            label: '🧾 My Orders',
            emoji: '🧾',
            button_type: 'MY_ORDERS',
            target_value: 'MY_ORDERS',
            row_order: 1,
            col_order: 0
          },
          {
            id: `btn-3`,
            bot_id: bot.id,
            menu_id: 'main',
            label: '❓ FAQ & Help',
            emoji: '❓',
            button_type: 'FAQS',
            target_value: 'FAQS',
            row_order: 2,
            col_order: 0
          },
          {
            id: `btn-4`,
            bot_id: bot.id,
            menu_id: 'main',
            label: '💬 Support',
            emoji: '💬',
            button_type: 'SUPPORT_CONTACT',
            target_value: 'support',
            row_order: 2,
            col_order: 1
          }
        ]);
      }

      if (settingsRes.faqs) setFaqs(settingsRes.faqs);
      if (settingsRes.paymentConfig) setPaymentConfig(settingsRes.paymentConfig);
      if (settingsRes.commands && settingsRes.commands.length > 0) {
        setCommands(settingsRes.commands);
      } else {
        const cmdRes = await api.getBotCommands(bot.id);
        if (cmdRes.commands) setCommands(cmdRes.commands);
      }
      if (prodRes.products) setProducts(prodRes.products);
      if (catRes.categories) setCategories(catRes.categories);
      if (verRes.versions) setVersions(verRes.versions);
    } catch (err: any) {
      setError(err.message || 'Failed to load bot configuration.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = async (deployToTelegram: boolean = false) => {
    if (!bot) return;
    setError(null);
    setSuccessMessage(null);

    if (deployToTelegram) {
      setDeploying(true);
    } else {
      setSaving(true);
    }

    try {
      // Perform atomic full save across settings, menus, buttons, faqs, commands, and payment config
      await api.fullSaveBot(bot.id, {
        settings,
        menus,
        buttons,
        faqs,
        commands,
        paymentConfig
      });

      if (deployToTelegram) {
        const deployRes = await api.deployBot(bot.id, {
          createVersionSnapshot: true,
          versionLabel: `Live Deploy (${new Date().toLocaleTimeString()})`
        });
        setSuccessMessage(deployRes.message || 'Bot settings saved and synchronized live with Telegram API!');
        // Refresh versions
        const verRes = await api.getBotVersions(bot.id);
        if (verRes.versions) setVersions(verRes.versions);
      } else {
        setSuccessMessage('Bot configuration, submenus, and buttons saved successfully!');
      }

      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to save configuration. Please check your inputs.');
    } finally {
      setSaving(false);
      setDeploying(false);
    }
  };

  // Menu Handlers
  const handleAddSubmenu = () => {
    const newMenuId = `menu-${Date.now()}`;
    const newMenu: BotMenu = {
      id: newMenuId,
      bot_id: bot?.id || '',
      title: 'New Submenu',
      slug: `submenu-${menus.length}`,
      parent_menu_id: selectedMenuId !== 'main' ? selectedMenuId : 'main',
      message_text: `📂 *New Submenu*\nSelect a product tier or option below:`,
      auto_back_button: true,
      auto_home_button: true,
      columns_per_row: 2
    };
    setMenus([...menus, newMenu]);
    setSelectedMenuId(newMenuId);
  };

  const handleUpdateMenu = (menuId: string, field: keyof BotMenu, value: any) => {
    setMenus(menus.map(m => (m.id === menuId || (m.slug === menuId && menuId === 'main')) ? { ...m, [field]: value } : m));
  };

  const handleDeleteMenu = (menuId: string) => {
    if (menuId === 'main' || menus.find(m => m.id === menuId)?.slug === 'main') {
      alert('Cannot delete the default Main Menu.');
      return;
    }
    if (!confirm('Are you sure you want to delete this submenu? Its buttons will also be removed.')) return;

    setMenus(menus.filter(m => m.id !== menuId));
    setButtons(buttons.filter(b => b.menu_id !== menuId));
    setSelectedMenuId('main');
  };

  // Button Handlers
  const currentMenuButtons = buttons.filter(b => (b.menu_id || 'main') === selectedMenuId || (selectedMenuId === 'main' && !b.menu_id));

  const handleAddButton = () => {
    const newBtn: BotButton = {
      id: `btn-${Date.now()}`,
      bot_id: bot?.id || '',
      menu_id: selectedMenuId || 'main',
      label: 'New Button',
      emoji: '👉',
      button_type: 'PRODUCTS_LIST',
      target_value: 'ALL',
      row_order: currentMenuButtons.length,
      col_order: 0
    };
    setButtons([...buttons, newBtn]);
  };

  const handleUpdateButton = (btnId: string, field: keyof BotButton, value: any) => {
    setButtons(buttons.map(b => b.id === btnId ? { ...b, [field]: value } : b));
  };

  const handleDeleteButton = (btnId: string) => {
    setButtons(buttons.filter(b => b.id !== btnId));
  };

  const moveButton = (btnId: string, direction: 'UP' | 'DOWN') => {
    const menuBtns = [...currentMenuButtons];
    const index = menuBtns.findIndex(b => b.id === btnId);
    if (index === -1) return;
    if (direction === 'UP' && index === 0) return;
    if (direction === 'DOWN' && index === menuBtns.length - 1) return;

    const targetIdx = direction === 'UP' ? index - 1 : index + 1;
    const temp = menuBtns[index];
    menuBtns[index] = menuBtns[targetIdx];
    menuBtns[targetIdx] = temp;

    // Update orders
    const otherBtns = buttons.filter(b => (b.menu_id || 'main') !== selectedMenuId);
    setButtons([...otherBtns, ...menuBtns.map((b, i) => ({ ...b, row_order: i }))]);
  };

  // FAQ Handlers
  const handleAddFaq = () => {
    const newFaq: BotFaq = {
      id: `faq-${Date.now()}`,
      bot_id: bot?.id || '',
      question: 'How do I receive my product?',
      answer: 'After payment confirmation, your digital license key or download link is delivered instantly here in the chat.',
      order: faqs.length
    };
    setFaqs([...faqs, newFaq]);
  };

  const handleUpdateFaq = (index: number, field: keyof BotFaq, value: any) => {
    const updated = [...faqs];
    updated[index] = { ...updated[index], [field]: value };
    setFaqs(updated);
  };

  const handleDeleteFaq = (index: number) => {
    setFaqs(faqs.filter((_, i) => i !== index));
  };

  // Version Restore Handler
  const handleRestoreVersion = async (versionId: string) => {
    if (!bot) return;
    if (!window.confirm('Restore this previous version? Current unsaved changes will be replaced.')) return;

    setLoading(true);
    setError(null);
    try {
      const res = await api.restoreBotVersion(bot.id, versionId);
      setSuccessMessage(res.message || 'Restored version successfully!');
      if (res.settings) setSettings(res.settings);
      if (res.buttons) setButtons(res.buttons);
      loadBotConfig();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to restore version.');
    } finally {
      setLoading(false);
    }
  };

  // Test Dynamic QR Generator
  const handleTestQrGeneration = async () => {
    if (!paymentConfig.upi_id) {
      alert('Please enter a Merchant UPI ID first.');
      return;
    }
    setQrTestLoading(true);
    try {
      const res = await api.generatePaymentQr({
        upi_id: paymentConfig.upi_id,
        upi_name: paymentConfig.upi_name || settings.display_name,
        business_name: paymentConfig.business_name || settings.display_name,
        amount: 499,
        order_id: `TEST-${Date.now().toString().slice(-4)}`,
        note: 'Live Store Test QR',
        currency: settings.currency || 'INR'
      });
      if (res.success) {
        setQrTestPreview({
          qrImageUrl: res.qrImageUrl,
          upiUri: res.upiUri
        });
      }
    } catch (err: any) {
      alert(err.message || 'Failed to generate test QR');
    } finally {
      setQrTestLoading(false);
    }
  };

  const insertPlaceholder = (tag: string) => {
    setSettings(prev => ({
      ...prev,
      start_text: (prev.start_text || '') + ` ${tag}`
    }));
  };

  if (!bot) {
    return (
      <div className="p-12 text-center text-slate-400">
        Please select or connect a Telegram Bot from the Bots page to customize.
      </div>
    );
  }

  const currentMenu = menus.find(m => m.id === selectedMenuId || (m.slug === selectedMenuId && selectedMenuId === 'main')) || menus[0];

  // Preview Navigation Helper
  const previewMenu = menus.find(m => m.id === previewCurrentMenuId || (m.slug === previewCurrentMenuId && previewCurrentMenuId === 'main')) || menus[0];
  const previewButtons = buttons.filter(b => (b.menu_id || 'main') === previewCurrentMenuId || (previewCurrentMenuId === 'main' && !b.menu_id));

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl md:text-2xl font-black text-white">Bot No-Code Builder & Flow Studio</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 font-mono font-bold">
              @{bot.username}
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-400">
            Build multi-level nested menus, custom packages, payment QR codes, and instant digital fulfillment.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenLiveSimulator}
            className="px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Simulator</span>
          </button>

          <button
            onClick={() => handleSaveAll(false)}
            disabled={saving || deploying}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all border border-slate-700 flex items-center space-x-1.5 disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save All Changes</span>
              </>
            )}
          </button>

          <button
            onClick={() => handleSaveAll(true)}
            disabled={saving || deploying}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs transition-all shadow-md shadow-cyan-500/20 flex items-center space-x-2 disabled:opacity-50"
          >
            {deploying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Deploying to Telegram...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Save & Deploy to Live Bot</span>
              </>
            )}
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center space-x-2 font-bold animate-in fade-in">
          <Check className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid: Left Config Panel vs Right Interactive Live Phone Mockup */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Tabs and Editor Forms */}
        <div className="lg:col-span-7 bg-[#0f172a] border border-slate-800 rounded-2xl overflow-hidden flex flex-col shadow-xl">
          {/* Tab Navigation */}
          <div className="flex border-b border-slate-800 bg-slate-900/80 overflow-x-auto">
            <button
              onClick={() => setActiveTab('MENUS')}
              className={`py-3 px-3.5 text-xs font-bold flex items-center space-x-1.5 whitespace-nowrap transition-colors ${
                activeTab === 'MENUS'
                  ? 'text-cyan-400 border-b-2 border-cyan-400 bg-slate-900'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FolderTree className="w-3.5 h-3.5" />
              <span>Menus & Submenus ({menus.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('BUTTONS')}
              className={`py-3 px-3.5 text-xs font-bold flex items-center space-x-1.5 whitespace-nowrap transition-colors ${
                activeTab === 'BUTTONS'
                  ? 'text-cyan-400 border-b-2 border-cyan-400 bg-slate-900'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Inline Buttons ({buttons.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('COMMANDS')}
              className={`py-3 px-3.5 text-xs font-bold flex items-center space-x-1.5 whitespace-nowrap transition-colors ${
                activeTab === 'COMMANDS'
                  ? 'text-cyan-400 border-b-2 border-cyan-400 bg-slate-900'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Commands ({commands.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('START_MSG')}
              className={`py-3 px-3.5 text-xs font-bold flex items-center space-x-1.5 whitespace-nowrap transition-colors ${
                activeTab === 'START_MSG'
                  ? 'text-cyan-400 border-b-2 border-cyan-400 bg-slate-900'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Welcome Message</span>
            </button>
            <button
              onClick={() => setActiveTab('PAYMENTS')}
              className={`py-3 px-3.5 text-xs font-bold flex items-center space-x-1.5 whitespace-nowrap transition-colors ${
                activeTab === 'PAYMENTS'
                  ? 'text-cyan-400 border-b-2 border-cyan-400 bg-slate-900'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Payment QR & Gateways</span>
            </button>
            <button
              onClick={() => setActiveTab('FAQS')}
              className={`py-3 px-3.5 text-xs font-bold flex items-center space-x-1.5 whitespace-nowrap transition-colors ${
                activeTab === 'FAQS'
                  ? 'text-cyan-400 border-b-2 border-cyan-400 bg-slate-900'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>FAQs ({faqs.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('SETTINGS')}
              className={`py-3 px-3.5 text-xs font-bold flex items-center space-x-1.5 whitespace-nowrap transition-colors ${
                activeTab === 'SETTINGS'
                  ? 'text-cyan-400 border-b-2 border-cyan-400 bg-slate-900'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>General Settings</span>
            </button>
            <button
              onClick={() => setActiveTab('VERSIONS')}
              className={`py-3 px-3.5 text-xs font-bold flex items-center space-x-1.5 whitespace-nowrap transition-colors ${
                activeTab === 'VERSIONS'
                  ? 'text-cyan-400 border-b-2 border-cyan-400 bg-slate-900'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Revisions</span>
            </button>
          </div>

          {/* Tab 1: Menus & Submenus Hierarchy */}
          {activeTab === 'MENUS' && (
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <span>Navigation Structure & Submenus</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Create nested menu screens for product categories, service plans, support, or direct checkout tiers.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddSubmenu}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs rounded-xl transition-all flex items-center space-x-1 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Submenu</span>
                </button>
              </div>

              {/* Menu List Selection Chips */}
              <div className="flex flex-wrap gap-2 p-2.5 bg-slate-900/90 border border-slate-800 rounded-xl">
                {menus.map(m => {
                  const isMain = m.id === 'main' || m.slug === 'main';
                  const isSelected = selectedMenuId === m.id || (isMain && selectedMenuId === 'main');
                  const count = buttons.filter(b => (b.menu_id || 'main') === m.id || (isMain && (!b.menu_id || b.menu_id === 'main'))).length;

                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setSelectedMenuId(m.id);
                        setPreviewCurrentMenuId(m.id);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                        isSelected
                          ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-bold'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <span>{isMain ? '🏠' : '📂'}</span>
                      <span>{m.title}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-cyan-900/60 text-cyan-200' : 'bg-slate-900 text-slate-400'}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Selected Menu Editor */}
              {currentMenu && (
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center space-x-2">
                      <Edit3 className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-bold text-white">
                        Editing: <span className="text-cyan-400">{currentMenu.title}</span> ({currentMenu.slug})
                      </span>
                    </div>

                    {currentMenu.slug !== 'main' && (
                      <button
                        type="button"
                        onClick={() => handleDeleteMenu(currentMenu.id)}
                        className="text-xs text-red-400 hover:text-red-300 flex items-center space-x-1 font-semibold"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Submenu</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Menu Display Title</label>
                      <input
                        type="text"
                        value={currentMenu.title}
                        onChange={e => handleUpdateMenu(currentMenu.id, 'title', e.target.value)}
                        placeholder="e.g. Netflix Subscriptions"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:border-cyan-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Menu Identifier / Slug</label>
                      <input
                        type="text"
                        value={currentMenu.slug}
                        disabled={currentMenu.slug === 'main'}
                        onChange={e => handleUpdateMenu(currentMenu.id, 'slug', e.target.value)}
                        placeholder="e.g. netflix-plans"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:border-cyan-500 outline-none font-mono disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                      Screen Text / Description (Telegram Markdown)
                    </label>
                    <textarea
                      rows={3}
                      value={currentMenu.message_text || ''}
                      onChange={e => handleUpdateMenu(currentMenu.id, 'message_text', e.target.value)}
                      placeholder="Select your preferred package duration below for instant activation:"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:border-cyan-500 outline-none font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Banner Image URL (Optional)</label>
                      <input
                        type="url"
                        value={currentMenu.banner_url || ''}
                        onChange={e => handleUpdateMenu(currentMenu.id, 'banner_url', e.target.value)}
                        placeholder="https://example.com/banner.jpg"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:border-cyan-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Buttons Per Row</label>
                      <select
                        value={currentMenu.columns_per_row || 2}
                        onChange={e => handleUpdateMenu(currentMenu.id, 'columns_per_row', Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-cyan-500"
                      >
                        <option value={1}>1 Button Per Row (Full Width Stack)</option>
                        <option value={2}>2 Buttons Per Row (Balanced Grid)</option>
                        <option value={3}>3 Buttons Per Row (Compact Grid)</option>
                      </select>
                    </div>
                  </div>

                  {currentMenu.slug !== 'main' && (
                    <div className="pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={currentMenu.auto_back_button !== false}
                          onChange={e => handleUpdateMenu(currentMenu.id, 'auto_back_button', e.target.checked)}
                          className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-400 accent-cyan-500"
                        />
                        <span>Auto-insert 🔙 Back button</span>
                      </label>

                      <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={currentMenu.auto_home_button !== false}
                          onChange={e => handleUpdateMenu(currentMenu.id, 'auto_home_button', e.target.checked)}
                          className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-400 accent-cyan-500"
                        />
                        <span>Auto-insert 🏠 Main Menu button</span>
                      </label>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Inline Buttons Builder (Multi-level aware) */}
          {activeTab === 'BUTTONS' && (
            <div className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                    <span>Menu Scope:</span>
                    <select
                      value={selectedMenuId}
                      onChange={e => {
                        setSelectedMenuId(e.target.value);
                        setPreviewCurrentMenuId(e.target.value);
                      }}
                      className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-cyan-400 font-bold outline-none focus:border-cyan-500"
                    >
                      {menus.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.title} ({buttons.filter(b => (b.menu_id || 'main') === m.id || (m.slug === 'main' && !b.menu_id)).length} buttons)
                        </option>
                      ))}
                    </select>
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Configure inline buttons for the selected screen.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddButton}
                  className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg transition-all flex items-center space-x-1 self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Button</span>
                </button>
              </div>

              <div className="space-y-2.5 max-h-[440px] overflow-y-auto pr-1">
                {currentMenuButtons.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                    No buttons attached to this menu. Click "Add Button" above to build this menu's actions.
                  </div>
                ) : (
                  currentMenuButtons.map((btn, idx) => (
                    <div
                      key={btn.id}
                      className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center gap-2.5 text-xs shadow-sm"
                    >
                      <div className="flex items-center space-x-2">
                        <div className="flex flex-col space-y-1 text-slate-500">
                          <button
                            type="button"
                            onClick={() => moveButton(btn.id, 'UP')}
                            disabled={idx === 0}
                            className="hover:text-cyan-400 disabled:opacity-20"
                          >
                            <MoveUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveButton(btn.id, 'DOWN')}
                            disabled={idx === currentMenuButtons.length - 1}
                            className="hover:text-cyan-400 disabled:opacity-20"
                          >
                            <MoveDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Emoji & Label */}
                        <div className="flex-1 min-w-[140px]">
                          <input
                            type="text"
                            value={btn.label}
                            onChange={e => handleUpdateButton(btn.id, 'label', e.target.value)}
                            placeholder="e.g. 🍿 Netflix Ultra 4K"
                            className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:border-cyan-500 outline-none font-semibold"
                          />
                        </div>
                      </div>

                      {/* Action Type */}
                      <div className="w-full md:w-44">
                        <select
                          value={btn.button_type}
                          onChange={e => {
                            const newType = e.target.value as any;
                            let defaultTarget = 'ALL';
                            if (newType === 'SUBMENU' && menus.length > 1) {
                              const otherMenu = menus.find(m => m.id !== selectedMenuId);
                              defaultTarget = otherMenu ? otherMenu.id : 'main';
                            }
                            if (newType === 'SINGLE_PRODUCT' && products.length > 0) defaultTarget = products[0].id;
                            if (newType === 'PRODUCT_PACKAGE' && products.length > 0) defaultTarget = products[0].id;
                            if (newType === 'CATEGORY' && categories.length > 0) defaultTarget = categories[0].id;
                            if (newType === 'EXTERNAL_URL') defaultTarget = 'https://';
                            if (newType === 'SUPPORT_CONTACT') defaultTarget = settings.support_username || 'support';

                            handleUpdateButton(btn.id, 'button_type', newType);
                            handleUpdateButton(btn.id, 'target_value', defaultTarget);
                          }}
                          className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white outline-none focus:border-cyan-500"
                        >
                          <option value="SUBMENU">📂 Open Submenu</option>
                          <option value="PRODUCTS_LIST">🛍️ Products Catalog</option>
                          <option value="SINGLE_PRODUCT">📦 View Single Product</option>
                          <option value="PRODUCT_PACKAGE">⚡ Direct Package Tier</option>
                          <option value="CATEGORY">🏷️ Category Filter</option>
                          <option value="PAYMENT_INFO">💳 Payment QR & Details</option>
                          <option value="MY_ORDERS">🧾 Customer Orders</option>
                          <option value="FAQS">❓ FAQ Menu</option>
                          <option value="SUPPORT_CONTACT">💬 Support Contact</option>
                          <option value="EXTERNAL_URL">🌐 External URL Link</option>
                          <option value="BACK">🔙 Back Button</option>
                          <option value="MAIN_MENU">🏠 Main Menu</option>
                        </select>
                      </div>

                      {/* Target Selector */}
                      <div className="flex-1">
                        {btn.button_type === 'SUBMENU' ? (
                          <select
                            value={btn.target_value}
                            onChange={e => handleUpdateButton(btn.id, 'target_value', e.target.value)}
                            className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-cyan-300 outline-none focus:border-cyan-500 font-semibold"
                          >
                            {menus.map(m => (
                              <option key={m.id} value={m.id}>
                                📂 {m.title} ({m.slug})
                              </option>
                            ))}
                          </select>
                        ) : btn.button_type === 'SINGLE_PRODUCT' ? (
                          <select
                            value={btn.target_value}
                            onChange={e => handleUpdateButton(btn.id, 'target_value', e.target.value)}
                            className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white outline-none focus:border-cyan-500"
                          >
                            {products.length === 0 && <option value="NONE">No Products Found</option>}
                            {products.map(p => (
                              <option key={p.id} value={p.id}>
                                📦 {p.name} ({p.currency} {p.price})
                              </option>
                            ))}
                          </select>
                        ) : btn.button_type === 'PRODUCT_PACKAGE' ? (
                          <div className="grid grid-cols-2 gap-1.5">
                            <select
                              value={btn.target_value}
                              onChange={e => {
                                handleUpdateButton(btn.id, 'target_value', e.target.value);
                                const selectedProd = products.find(p => p.id === e.target.value);
                                if (selectedProd?.packages && selectedProd.packages.length > 0) {
                                  handleUpdateButton(btn.id, 'target_package_id', selectedProd.packages[0].id);
                                }
                              }}
                              className="px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white outline-none focus:border-cyan-500"
                            >
                              {products.map(p => (
                                <option key={p.id} value={p.id}>
                                  {p.name}
                                </option>
                              ))}
                            </select>

                            <select
                              value={btn.target_package_id || ''}
                              onChange={e => handleUpdateButton(btn.id, 'target_package_id', e.target.value)}
                              className="px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-cyan-300 outline-none focus:border-cyan-500"
                            >
                              <option value="">Default Tier</option>
                              {products.find(p => p.id === btn.target_value)?.packages?.map(pkg => (
                                <option key={pkg.id} value={pkg.id}>
                                  {pkg.name} ({pkg.currency} {pkg.price})
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : btn.button_type === 'CATEGORY' ? (
                          <select
                            value={btn.target_value}
                            onChange={e => handleUpdateButton(btn.id, 'target_value', e.target.value)}
                            className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white outline-none focus:border-cyan-500"
                          >
                            {categories.length === 0 && <option value="NONE">No Categories</option>}
                            {categories.map(c => (
                              <option key={c.id} value={c.id}>
                                🏷️ {c.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={btn.target_value}
                            onChange={e => handleUpdateButton(btn.id, 'target_value', e.target.value)}
                            placeholder={btn.button_type === 'EXTERNAL_URL' ? 'https://...' : 'target parameter'}
                            className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-mono placeholder-slate-600 focus:border-cyan-500 outline-none"
                          />
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteButton(btn.id)}
                        className="text-red-400 hover:text-red-300 p-1 self-end md:self-center"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Tab: Telegram Command Builder */}
          {activeTab === 'COMMANDS' && (
            <BotCommandBuilder
              botId={bot.id}
              botUsername={bot.username}
              commands={commands}
              menus={menus}
              products={products}
              categories={categories}
              onCommandsChange={(newCmds) => setCommands(newCmds)}
              onPreviewCommand={(cmd) => {
                if (cmd.action_type === 'OPEN_MENU' || cmd.action_type === 'OPEN_SUBMENU') {
                  const targetMenuId = cmd.target_id || 'main';
                  setPreviewCurrentMenuId(targetMenuId);
                  setSelectedMenuId(targetMenuId);
                } else {
                  setPreviewCurrentMenuId('main');
                  setSelectedMenuId('main');
                }
              }}
            />
          )}

          {/* Tab 3: Start / Welcome Message */}
          {activeTab === 'START_MSG' && (
            <div className="p-6 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    /start Welcome Message (Markdown Supported)
                  </label>
                  <span className="text-[11px] text-slate-500">Insert Tag:</span>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-2">
                  <button
                    type="button"
                    onClick={() => insertPlaceholder('{name}')}
                    className="text-[10px] bg-slate-800 hover:bg-slate-700 text-cyan-300 px-2 py-0.5 rounded font-mono transition-colors"
                  >
                    + {'{name}'}
                  </button>
                  <button
                    type="button"
                    onClick={() => insertPlaceholder('{first_name}')}
                    className="text-[10px] bg-slate-800 hover:bg-slate-700 text-cyan-300 px-2 py-0.5 rounded font-mono transition-colors"
                  >
                    + {'{first_name}'}
                  </button>
                  <button
                    type="button"
                    onClick={() => insertPlaceholder('{store_name}')}
                    className="text-[10px] bg-slate-800 hover:bg-slate-700 text-cyan-300 px-2 py-0.5 rounded font-mono transition-colors"
                  >
                    + {'{store_name}'}
                  </button>
                  <button
                    type="button"
                    onClick={() => insertPlaceholder('{balance}')}
                    className="text-[10px] bg-slate-800 hover:bg-slate-700 text-cyan-300 px-2 py-0.5 rounded font-mono transition-colors"
                  >
                    + {'{balance}'}
                  </button>
                </div>

                <textarea
                  rows={6}
                  value={settings.start_text || ''}
                  onChange={e => setSettings({ ...settings, start_text: e.target.value })}
                  placeholder="Welcome to {store_name}! 🚀&#10;&#10;Hello {first_name}, select an option below to browse digital keys and licenses."
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:border-cyan-500 outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                  Start Banner Image URL (Optional)
                </label>
                <input
                  type="url"
                  value={settings.start_banner_url || ''}
                  onChange={e => setSettings({ ...settings, start_banner_url: e.target.value })}
                  placeholder="https://images.unsplash.com/... or https://example.com/banner.jpg"
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:border-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                  Promo Footer Message
                </label>
                <input
                  type="text"
                  value={settings.promo_message || ''}
                  onChange={e => setSettings({ ...settings, promo_message: e.target.value })}
                  placeholder="🔥 20% OFF this week with code FLASH20"
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:border-cyan-500 outline-none"
                />
              </div>
            </div>
          )}

          {/* Tab 4: Payments & Dynamic QR */}
          {activeTab === 'PAYMENTS' && (
            <div className="p-6 space-y-5">
              <div>
                <h3 className="text-xs font-bold text-slate-200 mb-1">Direct Merchant UPI & Dynamic QR Codes</h3>
                <p className="text-[11px] text-slate-400">
                  Accept 0% commission direct UPI payments via GPay, PhonePe, Paytm, and BHIM with automatic QR code generation.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Merchant UPI ID (VPA)</label>
                  <input
                    type="text"
                    value={paymentConfig.upi_id || ''}
                    onChange={e => setPaymentConfig({ ...paymentConfig, upi_id: e.target.value })}
                    placeholder="merchant@okhdfcbank"
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:border-cyan-500 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Registered Business / Payee Name</label>
                  <input
                    type="text"
                    value={paymentConfig.upi_name || ''}
                    onChange={e => setPaymentConfig({ ...paymentConfig, upi_name: e.target.value })}
                    placeholder="CyberStore Official"
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:border-cyan-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Customer Payment Instructions</label>
                <textarea
                  rows={2}
                  value={paymentConfig.manual_instructions || ''}
                  onChange={e => setPaymentConfig({ ...paymentConfig, manual_instructions: e.target.value })}
                  placeholder="Scan QR or pay to UPI ID. Then send the transaction screenshot for instant order fulfillment."
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:border-cyan-500 outline-none"
                />
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                    <QrCode className="w-4 h-4 text-emerald-400" />
                    <span>Dynamic Intent QR Code Generator</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Embeds the exact order amount and reference into the QR code automatically.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleTestQrGeneration}
                  disabled={qrTestLoading}
                  className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs rounded-xl border border-emerald-500/40 transition-all flex items-center space-x-1.5"
                >
                  {qrTestLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <QrCode className="w-3.5 h-3.5" />}
                  <span>Test QR Generation</span>
                </button>
              </div>

              {qrTestPreview && (
                <div className="p-4 bg-slate-900 border border-emerald-500/40 rounded-xl flex flex-col sm:flex-row items-center gap-4 animate-in fade-in">
                  <img
                    src={qrTestPreview.qrImageUrl}
                    alt="Test UPI QR"
                    referrerPolicy="no-referrer"
                    className="w-32 h-32 rounded-lg bg-white p-2 border border-slate-700 shadow-md"
                  />
                  <div className="space-y-1 text-xs">
                    <div className="text-emerald-400 font-bold">Standard NPCI UPI QR Verified:</div>
                    <div className="text-slate-300 font-mono text-[11px] break-all bg-slate-950 p-2 rounded border border-slate-800">
                      {qrTestPreview.upiUri}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Customers will scan this directly inside Google Pay, PhonePe, Paytm, or BHIM.
                    </div>
                  </div>
                </div>
              )}

              {/* Toggles */}
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <label className="flex items-center justify-between p-3 bg-slate-900 rounded-xl cursor-pointer hover:bg-slate-800/80 transition-colors">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    <div>
                      <div className="text-xs font-bold text-white">Instant Sandbox / Test Checkout Mode</div>
                      <div className="text-[11px] text-slate-400">Allows instant automated testing and order verification in bot simulator</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={paymentConfig.enable_sandbox ?? true}
                    onChange={e => setPaymentConfig({ ...paymentConfig, enable_sandbox: e.target.checked })}
                    className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-400 accent-cyan-500"
                  />
                </label>
              </div>
            </div>
          )}

          {/* Tab 5: FAQs */}
          {activeTab === 'FAQS' && (
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-xs font-bold text-slate-200">Interactive Bot FAQs</span>
                  <p className="text-[11px] text-slate-400">Telegram users can tap FAQ questions to read instant answers</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddFaq}
                  className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg transition-all flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add FAQ</span>
                </button>
              </div>

              <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1">
                {faqs.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                    No FAQs added. Add common questions to reduce customer support inquiries.
                  </div>
                ) : (
                  faqs.map((faq, idx) => (
                    <div key={idx} className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-cyan-400">Question #{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteFaq(idx)}
                          className="text-red-400 hover:text-red-300 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={faq.question}
                        onChange={e => handleUpdateFaq(idx, 'question', e.target.value)}
                        placeholder="e.g. How does automatic delivery work?"
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:border-cyan-500 outline-none font-semibold"
                      />
                      <textarea
                        rows={2}
                        value={faq.answer}
                        onChange={e => handleUpdateFaq(idx, 'answer', e.target.value)}
                        placeholder="e.g. Keys and downloads are delivered instantly in this chat right after payment verification."
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:border-cyan-500 outline-none leading-relaxed"
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Tab 6: General Settings */}
          {activeTab === 'SETTINGS' && (
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Store Display Name</label>
                  <input
                    type="text"
                    value={settings.display_name || ''}
                    onChange={e => setSettings({ ...settings, display_name: e.target.value })}
                    placeholder="e.g. CyberVault Digital Store"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:border-cyan-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Support Telegram Username</label>
                  <input
                    type="text"
                    value={settings.support_username || ''}
                    onChange={e => setSettings({ ...settings, support_username: e.target.value })}
                    placeholder="e.g. cyber_support (without @)"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:border-cyan-500 outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Store Description / Bio</label>
                <input
                  type="text"
                  value={settings.description || ''}
                  onChange={e => setSettings({ ...settings, description: e.target.value })}
                  placeholder="Automated digital software, license keys, and premium accounts 24/7."
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:border-cyan-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Currency</label>
                  <select
                    value={settings.currency || 'INR'}
                    onChange={e => setSettings({ ...settings, currency: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-cyan-500"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Timezone</label>
                  <select
                    value={settings.timezone || 'UTC'}
                    onChange={e => setSettings({ ...settings, timezone: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-cyan-500"
                  >
                    <option value="UTC">UTC (Universal)</option>
                    <option value="Asia/Kolkata">IST (India)</option>
                    <option value="America/New_York">EST (New York)</option>
                    <option value="Europe/London">GMT (London)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Operating Hours</label>
                  <input
                    type="text"
                    value={settings.business_hours || ''}
                    onChange={e => setSettings({ ...settings, business_hours: e.target.value })}
                    placeholder="24/7 Automated"
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 space-y-3">
                <label className="flex items-center justify-between p-3 bg-slate-900 rounded-xl cursor-pointer hover:bg-slate-800/80 transition-colors">
                  <div>
                    <div className="text-xs font-bold text-white">Instant Auto-Delivery Fulfillment</div>
                    <div className="text-[11px] text-slate-400">
                      Instantly deliver serial keys or file tokens right in the Telegram chat upon order confirmation.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.auto_delivery ?? true}
                    onChange={e => setSettings({ ...settings, auto_delivery: e.target.checked })}
                    className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-400 accent-cyan-500"
                  />
                </label>

                <label className="flex items-center justify-between p-3 bg-slate-900 rounded-xl cursor-pointer hover:bg-slate-800/80 transition-colors">
                  <div>
                    <div className="text-xs font-bold text-white">Admin Telegram Alerts</div>
                    <div className="text-[11px] text-slate-400">
                      Send order notification to your admin Telegram ID when customer purchases.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notify_admin_on_order ?? true}
                    onChange={e => setSettings({ ...settings, notify_admin_on_order: e.target.checked })}
                    className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-400 accent-cyan-500"
                  />
                </label>
              </div>
            </div>
          )}

          {/* Tab 7: Revisions History */}
          {activeTab === 'VERSIONS' && (
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-200 mb-1">Version History & Revisions</h3>
                <p className="text-[11px] text-slate-400 mb-4">
                  Every time you deploy to Telegram, a complete snapshot is preserved for 1-click instant rollback.
                </p>
              </div>

              <div className="space-y-2.5 max-h-[440px] overflow-y-auto pr-1">
                {versions.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                    No revisions yet. Click "Save & Deploy to Live Bot" to create your first version snapshot.
                  </div>
                ) : (
                  versions.map(ver => (
                    <div
                      key={ver.id}
                      className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-bold text-white flex items-center space-x-2">
                          <span>Revision #{ver.version_number}</span>
                          <span className="text-[10px] text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50">
                            {ver.label}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {new Date(ver.created_at).toLocaleString()} • {ver.buttons?.length || 0} buttons • {ver.menus?.length || 1} menus
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRestoreVersion(ver.id)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs rounded-lg transition-colors flex items-center space-x-1.5 border border-slate-700"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Rollback</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Live Interactive Phone Mockup */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full max-w-sm bg-[#080d1a] border-4 border-slate-700 rounded-[36px] shadow-2xl p-4 relative overflow-hidden flex flex-col h-[620px]">
            {/* Phone Speaker Notch */}
            <div className="w-24 h-4 bg-slate-800 rounded-full mx-auto mb-3 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-slate-950"></div>
            </div>

            {/* Telegram Header */}
            <div className="bg-[#1e293b] p-2.5 rounded-xl border border-slate-700/80 flex items-center space-x-2 mb-3">
              <div className="w-7 h-7 rounded-full bg-cyan-500 flex items-center justify-center text-white font-bold text-xs">
                <Bot className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-white truncate">
                  {settings.display_name || bot.first_name}
                </div>
                <div className="text-[10px] text-cyan-400 font-mono">
                  {previewMenu?.title ? `Screen: ${previewMenu.title}` : 'bot'}
                </div>
              </div>
              {previewCurrentMenuId !== 'main' && (
                <button
                  type="button"
                  onClick={() => setPreviewCurrentMenuId('main')}
                  className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white"
                  title="Return to Main Menu in Mockup"
                >
                  <Home className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Chat Bubble Area */}
            <div className="flex-1 overflow-y-auto space-y-2.5 p-2.5 bg-[#0b0f19] rounded-xl border border-slate-800/80">
              {/* Optional Banner */}
              {(previewMenu?.banner_url || (previewCurrentMenuId === 'main' && settings.start_banner_url)) && (
                <div className="rounded-lg overflow-hidden border border-slate-700">
                  <img
                    src={previewMenu?.banner_url || settings.start_banner_url}
                    alt="Banner"
                    referrerPolicy="no-referrer"
                    className="w-full h-24 object-cover"
                  />
                </div>
              )}

              {/* Bot Message Bubble */}
              <div className="bg-slate-800 border border-slate-700 p-3 rounded-xl rounded-bl-sm text-xs text-slate-200 shadow-md">
                <div className="whitespace-pre-wrap leading-relaxed text-[11px]">
                  {(previewCurrentMenuId === 'main' ? (settings.start_text || currentMenu?.message_text) : previewMenu?.message_text)
                    ?.replace('{store_name}', settings.display_name || bot.first_name)
                    ?.replace('{name}', 'Customer')
                    ?.replace('{first_name}', 'Alex')
                    ?.replace('{username}', '@alex_buyer')
                    ?.replace('{balance}', `${settings.currency || '₹'} 0.00`) ||
                    `Welcome to ${settings.display_name || bot.first_name}! 🚀\n\nInstant digital keys and files available.`}
                </div>
                {previewCurrentMenuId === 'main' && settings.promo_message && (
                  <div className="mt-2 text-[10px] font-bold text-amber-400 border-t border-slate-700/80 pt-1">
                    {settings.promo_message}
                  </div>
                )}
              </div>

              {/* Interactive Inline Buttons Preview */}
              <div className="space-y-1.5 pt-1">
                {previewButtons.length === 0 ? (
                  <div className="text-center text-[10px] text-slate-600 py-3">No buttons on this screen</div>
                ) : (
                  previewButtons.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        if (b.button_type === 'SUBMENU' && b.target_value) {
                          setPreviewCurrentMenuId(b.target_value);
                          setSelectedMenuId(b.target_value);
                        } else if (b.button_type === 'MAIN_MENU') {
                          setPreviewCurrentMenuId('main');
                          setSelectedMenuId('main');
                        } else if (b.button_type === 'BACK') {
                          setPreviewCurrentMenuId('main');
                          setSelectedMenuId('main');
                        }
                      }}
                      className="w-full p-2 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-cyan-950 border border-slate-700 text-center text-xs font-semibold text-cyan-300 shadow-sm transition-all flex items-center justify-center space-x-1"
                    >
                      <span>{b.label}</span>
                    </button>
                  ))
                )}

                {/* Auto Back & Home Preview for Submenus */}
                {previewCurrentMenuId !== 'main' && (
                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewCurrentMenuId('main');
                        setSelectedMenuId('main');
                      }}
                      className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold flex items-center justify-center space-x-1"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      <span>Back</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewCurrentMenuId('main');
                        setSelectedMenuId('main');
                      }}
                      className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold flex items-center justify-center space-x-1"
                    >
                      <Home className="w-3 h-3" />
                      <span>Main Menu</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Telegram Interactive Command Bar with [/] Menu */}
            <div className="relative mt-2">
              {/* Command Popover */}
              {isPhoneCmdMenuOpen && (
                <div className="absolute bottom-12 left-0 right-0 bg-[#141e30] border border-slate-700 rounded-xl p-2 shadow-2xl z-30 max-h-48 overflow-y-auto space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider flex justify-between items-center border-b border-slate-700/60 pb-1 mb-1">
                    <span>Telegram Commands</span>
                    <button
                      type="button"
                      onClick={() => setIsPhoneCmdMenuOpen(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>
                  {commands.filter(c => c.is_enabled).length === 0 ? (
                    <div className="p-2 text-center text-[10px] text-slate-500">No active commands</div>
                  ) : (
                    commands
                      .filter(c => c.is_enabled)
                      .map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            if (c.action_type === 'OPEN_MENU' || c.action_type === 'OPEN_SUBMENU') {
                              const targetMenuId = c.target_id || 'main';
                              setPreviewCurrentMenuId(targetMenuId);
                              setSelectedMenuId(targetMenuId);
                            } else {
                              setPreviewCurrentMenuId('main');
                              setSelectedMenuId('main');
                            }
                            setIsPhoneCmdMenuOpen(false);
                          }}
                          className="w-full px-2 py-1.5 rounded-lg hover:bg-slate-800 text-left text-[11px] flex items-center justify-between transition-colors"
                        >
                          <span className="font-mono font-bold text-cyan-400">{c.command}</span>
                          <span className="text-[10px] text-slate-300 truncate max-w-[130px]">{c.description}</span>
                        </button>
                      ))
                  )}
                </div>
              )}

              {/* Bottom Input Pill */}
              <div className="flex items-center space-x-1.5 bg-[#111827] border border-slate-700 rounded-2xl p-1.5 shadow-inner">
                <button
                  type="button"
                  onClick={() => setIsPhoneCmdMenuOpen(!isPhoneCmdMenuOpen)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-mono font-black transition-all flex items-center space-x-1 ${
                    isPhoneCmdMenuOpen
                      ? 'bg-cyan-500 text-slate-950 shadow-sm'
                      : 'bg-slate-800 hover:bg-slate-700 text-cyan-400'
                  }`}
                  title="Toggle Telegram Commands Menu"
                >
                  <span>/</span>
                  <span className="font-sans font-bold text-[10px]">Menu</span>
                </button>
                <div className="flex-1 text-[11px] text-slate-500 px-1 truncate">
                  Message {settings.display_name || bot.first_name}...
                </div>
              </div>
            </div>

            <div className="mt-2.5 text-center text-[10px] text-slate-500 font-medium">
              Interactive Navigation Mockup • Tap buttons or / Menu to test
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
