import React, { useState, useEffect } from 'react';
import {
  loadStoredData,
  saveStoredData,
  loadSavedAuthUserId,
  saveAuthUserId,
  AppStateData,
  DEFAULT_USERS,
  DEFAULT_PRODUCTS,
  DEFAULT_STORE_DATA
} from './data/initialData';
import { User, Product, Order, OrderItem, Expense, ClientPartner, StoreData, BannerSlide } from './types';
import { RunningText } from './components/RunningText';
import { BannerSlider } from './components/BannerSlider';
import { ClientSlider } from './components/ClientSlider';
import { OrderDetailModal } from './components/OrderDetailModal';
import { AdminTokoSliderManager } from './components/AdminTokoSliderManager';
import { AdminBannerManager } from './components/AdminBannerManager';
import { AdminExpenseModal } from './components/AdminExpenseModal';
import { GasCodeModal } from './components/GasCodeModal';
import { AdminAddProductModal } from './components/AdminAddProductModal';
import { AdminNewOrderModal } from './components/AdminNewOrderModal';
import { LoginPortalModal } from './components/LoginPortalModal';
import { AdminStoreBrandingManager } from './components/AdminStoreBrandingManager';
import { AdminGasSyncManager } from './components/AdminGasSyncManager';
import { AdminWhatsAppConfigManager } from './components/AdminWhatsAppConfigManager';
import {
  pushAllDatabaseToGas,
  fetchAllDataFromGas,
  syncGasNewOrder,
  syncGasUpdateOrderStatus,
  syncGasUpdateOrderBayar,
  syncGasDeleteOrder,
  syncGasNewCustomer,
  syncGasProduct,
  syncGasDeleteProduct,
  syncGasExpense,
  syncGasDeleteExpense
} from './services/gasSyncService';

import {
  findCustomerPhone,
  formatOrderWhatsAppConfirmation,
  cleanWhatsAppPhone
} from './utils/whatsappFormatter';

import {
  Home,
  ShoppingCart,
  Store,
  User as UserIcon,
  PieChart,
  Receipt,
  Users,
  Boxes,
  Settings,
  Plus,
  Minus,
  Search,
  CheckCircle2,
  AlertCircle,
  FileCode,
  LogOut,
  ChevronRight,
  Phone,
  MapPin,
  CreditCard,
  Trash2,
  Edit,
  ExternalLink,
  Info,
  Calendar,
  Layers,
  ArrowRight,
  Sparkles,
  DollarSign,
  Eye,
  EyeOff,
  Gauge,
  Sliders,
  Wallet,
  Check,
  LogIn,
  Shield,
  Building2,
  Database
} from 'lucide-react';

export default function App() {
  const [appData, setAppData] = useState<AppStateData>(() => loadStoredData());
  
  // Single active user per session, restored from localStorage
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const loaded = loadStoredData();
    const savedUserId = loadSavedAuthUserId();
    if (savedUserId === 'LOGGED_OUT') {
      return null;
    }
    if (savedUserId) {
      const found = loaded.users.find((u) => u.ID === savedUserId);
      if (found) return found;
    }
    return null;
  });

  const [currentRole, setCurrentRole] = useState<'admin' | 'customer'>(() => {
    const loaded = loadStoredData();
    const savedUserId = loadSavedAuthUserId();
    if (savedUserId && savedUserId !== 'LOGGED_OUT') {
      const found = loaded.users.find((u) => u.ID === savedUserId);
      if (found) return found.Role;
    }
    return 'customer';
  });

  const [activeCustMenu, setActiveCustMenu] = useState<'home' | 'order' | 'products' | 'profile'>('home');
  const [activeAdminMenu, setActiveAdminMenu] = useState<'dashboard' | 'transaksi' | 'customer' | 'produk' | 'toko' | 'profil'>('dashboard');

  // Modals & popups
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<Order | null>(null);
  const [showGasModal, setShowGasModal] = useState(false);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState<string | null>(null);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [showAdminNewOrderModal, setShowAdminNewOrderModal] = useState(false);
  const [showAdminExpenseModal, setShowAdminExpenseModal] = useState(false);
  const [adminTransaksiTab, setAdminTransaksiTab] = useState<'orders' | 'expenses'>('orders');

  // Unified Login Portal State (Customer vs Admin selection, single active session)
  const [showLoginPortal, setShowLoginPortal] = useState(false);
  const [portalInitialRole, setPortalInitialRole] = useState<'customer' | 'admin'>('customer');

  // Customer order form DP state
  const [orderNominalDP, setOrderNominalDP] = useState<number | ''>('');

  // Customer Profile Edit State
  const [isEditingCustProfile, setIsEditingCustProfile] = useState(false);
  const [editCustNama, setEditCustNama] = useState('');
  const [editCustAlamat, setEditCustAlamat] = useState('');
  const [editCustPassword, setEditCustPassword] = useState('');
  const [editCustNoWA, setEditCustNoWA] = useState('');
  const [showCustPassword, setShowCustPassword] = useState(false);

  // Admin Profile Edit State
  const [editAdminNama, setEditAdminNama] = useState('Admin Alinea');
  const [editAdminNoWA, setEditAdminNoWA] = useState('081234567890');
  const [editAdminPassword, setEditAdminPassword] = useState('admin123');
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  // Admin filters
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Search in products
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState<'all' | 'meteran' | 'satuan'>('all');
  const [showAllHomeProducts, setShowAllHomeProducts] = useState(false);

  // Customer order form items state
  interface OrderFormItem {
    id: string;
    productId: string;
    qty: number;
    panjang: number;
    lebar: number;
    finishing: string;
    withDesain: boolean;
    withCutting: boolean;
    withLaminating: boolean;
  }

  const [orderItems, setOrderItems] = useState<OrderFormItem[]>([
    {
      id: 'item_1',
      productId: appData.products[0]?.ID || 'P1',
      qty: 1,
      panjang: 0,
      lebar: 0,
      finishing: 'Simkel',
      withDesain: false,
      withCutting: false,
      withLaminating: false
    }
  ]);
  const [orderCatatan, setOrderCatatan] = useState('');

  // Sync to localStorage whenever appData updates
  useEffect(() => {
    saveStoredData(appData);
  }, [appData]);

  // Sync admin form defaults when currentUser changes
  useEffect(() => {
    if (currentUser?.Role === 'admin') {
      setEditAdminNama(currentUser.Nama);
      setEditAdminNoWA(currentUser.NoWA || '081234567890');
      setEditAdminPassword(currentUser.Password);
    }
  }, [currentUser]);

  const showToast = (msg: string) => {
    setShowSuccessToast(msg);
    setTimeout(() => setShowSuccessToast(null), 3500);
  };

  const formatRp = (num: number) => {
    return 'Rp ' + (num || 0).toLocaleString('id-ID');
  };

  // Helper calculation for individual order item (synced precisely with Spreadsheet rates)
  const calculateItemTotal = (item: OrderFormItem) => {
    const prod = appData.products.find((p) => p.ID === item.productId);
    if (!prod) return 0;

    let basePrice = 0;
    if (prod.Kategori === 'meteran') {
      const p = item.panjang || 0;
      const l = item.lebar || 0;
      if (p <= 0 || l <= 0) {
        basePrice = 0;
      } else {
        const luasM2 = Math.max(1, (p / 100) * (l / 100));
        basePrice = prod.Harga * luasM2 * item.qty;
      }
    } else {
      basePrice = prod.Harga * item.qty;
    }

    const dsn = item.withDesain
      ? (prod.HargaDesain !== undefined && prod.HargaDesain !== null ? Number(prod.HargaDesain) : 15000)
      : 0;
    const cut = item.withCutting
      ? ((prod.HargaCutting !== undefined && prod.HargaCutting !== null ? Number(prod.HargaCutting) : 0) * item.qty)
      : 0;
    const lam = item.withLaminating
      ? ((prod.HargaLaminating !== undefined && prod.HargaLaminating !== null ? Number(prod.HargaLaminating) : 0) * item.qty)
      : 0;

    return Math.round(basePrice + dsn + cut + lam);
  };

  // Grand total of active customer order form
  const orderGrandTotal = orderItems.reduce((acc, curr) => acc + calculateItemTotal(curr), 0);

  // Handle Customer Order Submission (with multi-item & DP support)
  const handleSubmitCustomerOrder = () => {
    if (!currentUser) return;
    if (orderItems.length === 0) {
      alert('Pilih minimal 1 produk pesanan!');
      return;
    }

    const builtItems: OrderItem[] = orderItems.map((item) => {
      const prod = appData.products.find((p) => p.ID === item.productId)!;
      const isMet = prod.Kategori === 'meteran';
      return {
        id: item.id,
        productId: prod.ID,
        namaProduk: prod.Nama,
        kategori: prod.Kategori,
        harga: prod.Harga,
        qty: item.qty,
        panjang: isMet ? item.panjang : 0,
        lebar: isMet ? item.lebar : 0,
        finishing: isMet ? item.finishing : '-',
        withDesain: item.withDesain,
        withCutting: item.withCutting,
        withLaminating: item.withLaminating,
        jasaDesain: item.withDesain ? (prod.HargaDesain !== undefined && prod.HargaDesain !== null ? Number(prod.HargaDesain) : 15000) : 0,
        jasaCutting: item.withCutting ? ((prod.HargaCutting !== undefined && prod.HargaCutting !== null ? Number(prod.HargaCutting) : 0) * item.qty) : 0,
        jasaLaminating: item.withLaminating ? ((prod.HargaLaminating !== undefined && prod.HargaLaminating !== null ? Number(prod.HargaLaminating) : 0) * item.qty) : 0,
        subtotal: calculateItemTotal(item)
      };
    });

    if (!currentUser) {
      setPortalInitialRole('customer');
      setShowLoginPortal(true);
      showToast('Silakan masuk atau daftar akun customer terlebih dahulu sebelum mengirim order!');
      return;
    }

    const firstProd = appData.products.find((p) => p.ID === orderItems[0].productId)!;
    const totalQty = orderItems.reduce((acc, curr) => acc + curr.qty, 0);
    const summaryNama =
      orderItems.length > 1
        ? orderItems
            .map((it) => {
              const p = appData.products.find((x) => x.ID === it.productId);
              return `${p?.Nama || 'Produk'} (${it.qty}x)`;
            })
            .join(' + ')
        : firstProd.Nama;

    const dpAmount = typeof orderNominalDP === 'number' ? orderNominalDP : 0;
    let finalBayar: Order['StatusBayar'] = 'Belum Lunas';
    if (dpAmount >= orderGrandTotal && orderGrandTotal > 0) {
      finalBayar = 'Lunas';
    } else if (dpAmount > 0) {
      finalBayar = 'DP';
    }

    const unifiedOrder: Order = {
      ID: 'ORD-' + Math.floor(100000 + Math.random() * 900000),
      Tgl: new Date().toISOString(),
      KodeCustomer: currentUser.KodeKhusus,
      NamaCustomer: currentUser.Nama,
      NoCustomer: currentUser.NoWA,
      IDProduk: firstProd.ID,
      NamaProduk: summaryNama,
      Kategori: firstProd.Kategori,
      Qty: totalQty,
      Panjang: firstProd.Kategori === 'meteran' ? orderItems[0].panjang : 0,
      Lebar: firstProd.Kategori === 'meteran' ? orderItems[0].lebar : 0,
      Finishing: firstProd.Kategori === 'meteran' ? orderItems[0].finishing : '-',
      JasaCutting: builtItems.reduce((s, it) => s + (it.jasaCutting || 0), 0),
      JasaLaminating: builtItems.reduce((s, it) => s + (it.jasaLaminating || 0), 0),
      JasaDesain: builtItems.reduce((s, it) => s + (it.jasaDesain || 0), 0),
      TotalHarga: orderGrandTotal,
      NominalDP: dpAmount > 0 ? dpAmount : undefined,
      DP: dpAmount,
      SisaTagihan: Math.max(0, orderGrandTotal - dpAmount),
      StatusBayar: finalBayar,
      StatusOrder: 'Order Masuk',
      Catatan: orderCatatan.trim() || undefined,
      Items: builtItems
    };

    // Update state & product terjual
    const updatedProducts = appData.products.map((p) => {
      const matchingItems = orderItems.filter((it) => it.productId === p.ID);
      const addedQty = matchingItems.reduce((sum, it) => sum + it.qty, 0);
      return { ...p, Terjual: (p.Terjual || 0) + addedQty };
    });

    setAppData((prev) => ({
      ...prev,
      products: updatedProducts,
      orders: [unifiedOrder, ...prev.orders]
    }));

    // Otomatis sinkronkan pesanan baru ke Google Apps Script Spreadsheet
    if (appData.storeData.gas_web_app_url) {
      syncGasNewOrder(appData.storeData.gas_web_app_url, unifiedOrder).catch((e) =>
        console.warn('Sync order ke GAS:', e)
      );
    }

    showToast(`Sukses! Pesanan ${unifiedOrder.ID} (${orderItems.length} produk) berhasil dikirim.`);
    setOrderCatatan('');
    setOrderNominalDP('');
    // Reset to 1 item with 0 dimensions
    setOrderItems([
      {
        id: 'item_' + Date.now(),
        productId: appData.products[0]?.ID || 'P1',
        qty: 1,
        panjang: 0,
        lebar: 0,
        finishing: 'Simkel',
        withDesain: false,
        withCutting: false,
        withLaminating: false
      }
    ]);

    // Switch to profile to see the new order
    setActiveCustMenu('profile');
    setSelectedOrderForDetail(unifiedOrder);
  };

  // Update order status in admin
  const handleUpdateOrderStatus = (orderId: string, newStatus: Order['StatusOrder']) => {
    setAppData((prev) => ({
      ...prev,
      orders: prev.orders.map((o) => (o.ID === orderId ? { ...o, StatusOrder: newStatus } : o))
    }));

    // Otomatis sinkronkan perubahan status ke Google Spreadsheet
    if (appData.storeData.gas_web_app_url) {
      const ord = appData.orders.find((o) => o.ID === orderId);
      if (ord) {
        // Ambil nomor tujuan customer langsung dari data sheet users
        const customerPhone = findCustomerPhone(ord, appData.users);
        const orderSummary = formatOrderWhatsAppConfirmation(
          { ...ord, StatusOrder: newStatus },
          appData.storeData
        );

        syncGasUpdateOrderStatus(
          appData.storeData.gas_web_app_url,
          orderId,
          newStatus,
          customerPhone,
          orderSummary
        ).catch((e) => console.warn('Sync status ke GAS:', e));
      }
    }

    showToast(`Status pesanan ${orderId} diubah ke: ${newStatus}`);
  };

  const handleUpdateOrderBayar = (orderId: string, newBayar: Order['StatusBayar']) => {
    setAppData((prev) => ({
      ...prev,
      orders: prev.orders.map((o) => (o.ID === orderId ? { ...o, StatusBayar: newBayar } : o))
    }));

    // Otomatis sinkronkan status bayar ke Google Spreadsheet
    if (appData.storeData.gas_web_app_url) {
      syncGasUpdateOrderBayar(appData.storeData.gas_web_app_url, orderId, newBayar).catch((e) =>
        console.warn('Sync bayar ke GAS:', e)
      );
    }

    showToast(`Status bayar pesanan ${orderId} diubah ke: ${newBayar}`);
  };

  // Hapus pesanan (Admin)
  const handleDeleteOrder = (orderId: string) => {
    const ord = appData.orders.find((o) => o.ID === orderId);
    if (!ord) return;
    if (window.confirm(`Yakin ingin menghapus pesanan ${orderId} (${ord.NamaProduk})?`)) {
      setAppData((prev) => ({
        ...prev,
        orders: prev.orders.filter((o) => o.ID !== orderId)
      }));

      // Otomatis sinkronkan penghapusan pesanan ke Google Spreadsheet
      if (appData.storeData.gas_web_app_url) {
        syncGasDeleteOrder(appData.storeData.gas_web_app_url, orderId).catch((e) =>
          console.warn('Sync hapus pesanan ke GAS:', e)
        );
      }
      showToast(`Pesanan ${orderId} berhasil dihapus.`);
    }
  };

  // Expense Handlers
  const handleSaveExpense = (newExp: Expense) => {
    setAppData((prev) => ({
      ...prev,
      expenses: [newExp, ...prev.expenses]
    }));

    // Otomatis sinkronkan pengeluaran ke Google Spreadsheet
    if (appData.storeData.gas_web_app_url) {
      syncGasExpense(appData.storeData.gas_web_app_url, newExp).catch((e) =>
        console.warn('Sync pengeluaran ke GAS:', e)
      );
    }

    showToast(`Pengeluaran ${formatRp(newExp.Total)} (${newExp.Toko}) berhasil dicatat!`);
  };

  const handleDeleteExpense = (expId: string) => {
    const exp = appData.expenses.find((e) => e.ID === expId);
    if (!exp) return;
    if (window.confirm(`Hapus catatan pengeluaran "${exp.Toko}" senilai ${formatRp(exp.Total)}?`)) {
      setAppData((prev) => ({
        ...prev,
        expenses: prev.expenses.filter((e) => e.ID !== expId)
      }));

      // Otomatis sinkronkan hapus pengeluaran ke Google Spreadsheet
      if (appData.storeData.gas_web_app_url) {
        syncGasDeleteExpense(appData.storeData.gas_web_app_url, expId).catch((e) =>
          console.warn('Sync hapus pengeluaran ke GAS:', e)
        );
      }

      showToast('Catatan pengeluaran berhasil dihapus.');
    }
  };

  // Banner Updates Handler
  const handleUpdateBanners = (updated: BannerSlide[]) => {
    setAppData((prev) => ({
      ...prev,
      storeData: {
        ...prev.storeData,
        banners: updated
      }
    }));
    showToast('Banner beranda berhasil diperbarui!');
  };

  // Customer Profile Edit Handlers
  const handleStartEditCustProfile = () => {
    if (!currentUser) return;
    setEditCustNama(currentUser.Nama);
    setEditCustAlamat(currentUser.Alamat || '');
    setEditCustPassword(currentUser.Password);
    setEditCustNoWA(currentUser.NoWA || '');
    setIsEditingCustProfile(true);
  };

  const handleSaveCustProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!editCustNama.trim()) {
      alert('Nama tidak boleh kosong!');
      return;
    }
    if (!editCustPassword.trim()) {
      alert('Password tidak boleh kosong!');
      return;
    }

    const updatedUser: User = {
      ...currentUser,
      Nama: editCustNama.trim(),
      Alamat: editCustAlamat.trim(),
      Password: editCustPassword.trim(),
      NoWA: editCustNoWA.trim()
    };

    setCurrentUser(updatedUser);
    setAppData((prev) => ({
      ...prev,
      users: prev.users.map((u) => (u.ID === currentUser.ID ? updatedUser : u))
    }));
    setIsEditingCustProfile(false);
    showToast('Profil customer berhasil diperbarui!');
  };

  // Admin Profile Edit Handlers
  const handleSaveAdminProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAdminNama.trim() || !editAdminPassword.trim()) {
      alert('Nama dan Password admin tidak boleh kosong!');
      return;
    }

    setAppData((prev) => {
      const updatedUsers = prev.users.map((u) => {
        if (u.Role === 'admin') {
          return {
            ...u,
            Nama: editAdminNama.trim(),
            Password: editAdminPassword.trim(),
            NoWA: editAdminNoWA.trim()
          };
        }
        return u;
      });
      return { ...prev, users: updatedUsers };
    });

    if (currentUser?.Role === 'admin') {
      setCurrentUser((prev) =>
        prev
          ? {
              ...prev,
              Nama: editAdminNama.trim(),
              Password: editAdminPassword.trim(),
              NoWA: editAdminNoWA.trim()
            }
          : null
      );
    }
    showToast('Profil akun Admin berhasil diperbarui!');
  };

  // Product Management Handlers
  const handleSaveProduct = (product: Product) => {
    setAppData((prev) => {
      const exists = prev.products.some((p) => p.ID === product.ID);
      let updatedProducts: Product[];
      if (exists) {
        updatedProducts = prev.products.map((p) => (p.ID === product.ID ? product : p));
      } else {
        updatedProducts = [product, ...prev.products];
      }
      return { ...prev, products: updatedProducts };
    });

    // Otomatis sinkronkan produk ke Google Spreadsheet
    if (appData.storeData.gas_web_app_url) {
      syncGasProduct(appData.storeData.gas_web_app_url, product).catch((e) =>
        console.warn('Sync produk ke GAS:', e)
      );
    }

    showToast(`Produk "${product.Nama}" berhasil disimpan!`);
  };

  const handleDeleteProduct = (productId: string) => {
    const prod = appData.products.find((p) => p.ID === productId);
    if (!prod) return;
    if (window.confirm(`Yakin ingin menghapus produk "${prod.Nama}"?`)) {
      setAppData((prev) => ({
        ...prev,
        products: prev.products.filter((p) => p.ID !== productId)
      }));

      // Otomatis sinkronkan hapus produk ke Google Spreadsheet
      if (appData.storeData.gas_web_app_url) {
        syncGasDeleteProduct(appData.storeData.gas_web_app_url, productId).catch((e) =>
          console.warn('Sync hapus produk ke GAS:', e)
        );
      }

      showToast(`Produk "${prod.Nama}" berhasil dihapus.`);
    }
  };

  // Admin New Order Handler (supports new customer creation or existing customer)
  const handleSaveAdminOrder = (order: Order, newCustomer?: User) => {
    // Pastikan nilai SisaTagihan selalu terhitung akurat
    const orderTotal = Number(order.TotalHarga || 0);
    const orderDp = Number(order.DP !== undefined && order.DP !== null ? order.DP : (order.NominalDP || 0));
    const calculatedSisa = order.SisaTagihan !== undefined && order.SisaTagihan !== null
      ? Number(order.SisaTagihan)
      : Math.max(0, orderTotal - orderDp);

    const readyOrder: Order = {
      ...order,
      TotalHarga: orderTotal,
      DP: orderDp,
      NominalDP: orderDp,
      SisaTagihan: calculatedSisa
    };

    setAppData((prev) => {
      let updatedUsers = prev.users;
      if (newCustomer) {
        const cleanNewPhone = cleanWhatsAppPhone(newCustomer.NoWA);
        const exists = prev.users.some(
          (u) =>
            u.ID === newCustomer.ID ||
            (u.NoWA && cleanNewPhone && cleanWhatsAppPhone(u.NoWA) === cleanNewPhone)
        );
        if (!exists) {
          updatedUsers = [newCustomer, ...prev.users];
        }
      }
      const updatedProducts = prev.products.map((p) => {
        let addedQty = 0;
        if (readyOrder.Items && readyOrder.Items.length > 0) {
          const match = readyOrder.Items.filter((it) => it.productId === p.ID);
          addedQty = match.reduce((s, it) => s + it.qty, 0);
        } else if (p.ID === readyOrder.IDProduk) {
          addedQty = readyOrder.Qty;
        }
        return addedQty > 0 ? { ...p, Terjual: (p.Terjual || 0) + addedQty } : p;
      });
      return {
        ...prev,
        users: updatedUsers,
        products: updatedProducts,
        orders: [readyOrder, ...prev.orders]
      };
    });

    // Otomatis sinkronkan pesanan admin & customer baru ke Google Spreadsheet
    if (appData.storeData.gas_web_app_url) {
      if (newCustomer) {
        syncGasNewCustomer(appData.storeData.gas_web_app_url, newCustomer)
          .then((res) => console.log('Sync customer baru admin ke GAS sukses:', res))
          .catch((e) => console.warn('Sync customer baru ke GAS error:', e));
      }
      syncGasNewOrder(appData.storeData.gas_web_app_url, readyOrder)
        .then((res) => console.log('Sync pesanan admin ke GAS sukses:', res))
        .catch((e) => console.warn('Sync pesanan admin ke GAS error:', e));
    }

    showToast(
      newCustomer
        ? `Customer "${newCustomer.Nama}" & Pesanan ${readyOrder.ID} tersimpan!`
        : `Pesanan ${readyOrder.ID} untuk ${readyOrder.NamaCustomer} tersimpan!`
    );
  };

  // Save store identity (Name, Tagline, Logo)
  const handleSaveBranding = (branding: { nama_toko: string; tagline: string; logo_url: string }) => {
    setAppData((prev) => ({
      ...prev,
      storeData: {
        ...prev.storeData,
        ...branding
      }
    }));
    showToast('Identitas & Logo Toko berhasil diperbarui!');
  };

  // Update partial store data (GAS Web App URL, Sync timestamp, WA configs)
  const handleUpdateStoreDataPartial = (partial: Partial<StoreData>) => {
    setAppData((prev) => ({
      ...prev,
      storeData: {
        ...prev.storeData,
        ...partial
      }
    }));
  };

  // Trigger Sync Now for Google Apps Script Web App URL (Tarik Data dari Spreadsheet)
  const handleTriggerGasSyncNow = async (url: string): Promise<{ success: boolean; message: string }> => {
    // 1. If running inside Google Apps Script (iframe or GAS runtime)
    if (typeof (window as any).google !== 'undefined' && (window as any).google.script?.run) {
      return new Promise<{ success: boolean; message: string }>((resolve) => {
        (window as any).google.script.run
          .withSuccessHandler((remoteData: any) => {
            if (remoteData && (remoteData.users || remoteData.orders || remoteData.products)) {
              setAppData((prev) => ({
                ...prev,
                users: (remoteData.users && remoteData.users.length > 0) ? remoteData.users : prev.users,
                products: (remoteData.products && remoteData.products.length > 0) ? remoteData.products : prev.products,
                orders: remoteData.orders || prev.orders,
                expenses: remoteData.expenses || prev.expenses,
                storeData: {
                  ...prev.storeData,
                  ...(remoteData.storeData || {}),
                  gas_web_app_url: url,
                  last_synced_at: new Date().toISOString()
                }
              }));
              resolve({
                success: true,
                message: `Sinkronisasi Live GAS Berhasil! (${remoteData.orders?.length || 0} Pesanan & ${remoteData.products?.length || 0} Produk diperbarui dari Google Sheets).`
              });
            } else {
              resolve({
                success: true,
                message: 'Sinkronisasi selesai! Google Apps Script siap digunakan.'
              });
            }
          })
          .withFailureHandler((err: any) => {
            resolve({
              success: false,
              message: `Gagal sinkron GAS: ${err?.message || 'Periksa izin deployment'}`
            });
          })
          .fetchAllData();
      });
    }

    // 2. If running on Web / Dev server: using fetchAllDataFromGas
    const res = await fetchAllDataFromGas(url);
    if (res.success && res.data) {
      const remoteData = res.data;
      setAppData((prev) => ({
        ...prev,
        users: (remoteData.users && remoteData.users.length > 0)
          ? remoteData.users.map((u: any) => ({
              ...u,
              ID: String(u.ID || `U-${Date.now()}`),
              Role: (u.Role === 'admin' ? 'admin' : 'customer') as 'admin' | 'customer',
              KodeKhusus: String(u.KodeKhusus ?? '-'),
              Nama: String(u.Nama ?? ''),
              NoWA: String(u.NoWA ?? ''),
              Alamat: String(u.Alamat ?? ''),
              Password: String(u.Password ?? ''),
              Email: u.Email ? String(u.Email) : undefined,
              TglDaftar: u.TglDaftar ? String(u.TglDaftar) : new Date().toISOString()
            }))
          : prev.users,
        products: (remoteData.products && remoteData.products.length > 0)
          ? remoteData.products.map((p: any) => ({
              ...p,
              ID: String(p.ID),
              Harga: Number(p.Harga || 0),
              Terjual: Number(p.Terjual || 0),
              HargaDesain: p.HargaDesain !== undefined && p.HargaDesain !== null && p.HargaDesain !== '' ? Number(p.HargaDesain) : 15000,
              HargaCutting: p.HargaCutting !== undefined && p.HargaCutting !== null && p.HargaCutting !== '' ? Number(p.HargaCutting) : 0,
              HargaLaminating: p.HargaLaminating !== undefined && p.HargaLaminating !== null && p.HargaLaminating !== '' ? Number(p.HargaLaminating) : 0
            }))
          : prev.products,
        orders: (remoteData.orders && remoteData.orders.length > 0)
          ? remoteData.orders.map((o: any) => {
              const total = Number(o.TotalHarga || 0);
              const dp = Number(o.DP !== undefined && o.DP !== null && o.DP !== '' ? o.DP : (o.NominalDP || 0));
              const rawSisa = o['Sisa Tagihan'] !== undefined && o['Sisa Tagihan'] !== null && o['Sisa Tagihan'] !== ''
                ? o['Sisa Tagihan']
                : (o.SisaTagihan !== undefined && o.SisaTagihan !== null && o.SisaTagihan !== ''
                  ? o.SisaTagihan
                  : (o.sisaTagihan !== undefined && o.sisaTagihan !== null && o.sisaTagihan !== '' ? o.sisaTagihan : undefined));
              const sisa = rawSisa !== undefined ? Number(rawSisa) : Math.max(0, total - dp);
              return {
                ...o,
                ID: String(o.ID),
                Qty: Number(o.Qty || 1),
                Panjang: Number(o.Panjang || 0),
                Lebar: Number(o.Lebar || 0),
                JasaCutting: Number(o.JasaCutting || 0),
                JasaLaminating: Number(o.JasaLaminating || 0),
                JasaDesain: Number(o.JasaDesain || 0),
                TotalHarga: total,
                DP: dp,
                NominalDP: dp,
                SisaTagihan: sisa,
                StatusBayar: o.StatusBayar || (dp >= total && total > 0 ? 'Lunas' : (dp > 0 ? 'DP' : 'Belum Lunas')),
                StatusOrder: o.StatusOrder || 'Order Masuk'
              };
            })
          : prev.orders,
        expenses: (remoteData.expenses && remoteData.expenses.length > 0)
          ? remoteData.expenses.map((ex: any) => ({
              ...ex,
              ID: String(ex.ID),
              Total: Number(ex.Total || 0),
              Toko: String(ex.Toko || ''),
              Detail: String(ex.Detail || ''),
              Tgl: ex.Tgl ? String(ex.Tgl).split('T')[0] : new Date().toISOString().split('T')[0]
            }))
          : prev.expenses,
        storeData: {
          ...prev.storeData,
          ...(remoteData.storeData || {}),
          gas_web_app_url: url,
          last_synced_at: new Date().toISOString()
        }
      }));
      return {
        success: true,
        message: `Koneksi Google Sheets Terhubung! Berhasil menyinkronkan ${remoteData.orders?.length || 0} Pesanan & ${remoteData.products?.length || 0} Produk.`
      };
    }

    // Still persist the URL even if fetch didn't return data (e.g. initial empty sheet)
    setAppData((prev) => ({
      ...prev,
      storeData: {
        ...prev.storeData,
        gas_web_app_url: url,
        last_synced_at: new Date().toISOString()
      }
    }));

    return {
      success: true,
      message: 'Web App URL berhasil disimpan! Gunakan tombol "Kirim Semua ke Sheet" untuk mengunggah seluruh database yang ada.'
    };
  };

  // Push / Unggah Seluruh Database Lokal Langsung ke Google Spreadsheet Sekaligus
  const handlePushAllDatabaseToGas = async (url: string): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await pushAllDatabaseToGas(url, {
        users: appData.users,
        products: appData.products,
        orders: appData.orders,
        expenses: appData.expenses,
        storeData: appData.storeData
      });

      setAppData((prev) => ({
        ...prev,
        storeData: {
          ...prev.storeData,
          gas_web_app_url: url,
          last_synced_at: new Date().toISOString()
        }
      }));

      if (res.success) {
        return {
          success: true,
          message: `Berhasil mengekspor seluruh data ke Google Sheets! (${appData.orders.length} Pesanan, ${appData.products.length} Produk, ${appData.users.length} Akun, dan ${appData.expenses.length} Catatan Kas terunggah).`
        };
      } else {
        return {
          success: false,
          message: res.message || 'Gagal mengirim data ke Google Sheets.'
        };
      }
    } catch (err: any) {
      return {
        success: false,
        message: `Kendala pengiriman data: ${err?.message || 'Koneksi terputus'}`
      };
    }
  };

  // Handle successful login or registration from LoginPortalModal
  const handleAuthLoginSuccess = (user: User, isNewRegistration?: boolean) => {
    const cleanUserPhone = cleanWhatsAppPhone(user.NoWA);
    const existingIndex = appData.users.findIndex(
      (u) =>
        (u.ID && u.ID === user.ID) ||
        (cleanUserPhone && u.NoWA && cleanWhatsAppPhone(u.NoWA) === cleanUserPhone) ||
        (user.Email && u.Email && u.Email.toLowerCase().trim() === user.Email.toLowerCase().trim())
    );

    const isNew = isNewRegistration !== undefined ? isNewRegistration : (existingIndex === -1);

    setAppData((prev) => {
      if (existingIndex === -1) {
        return { ...prev, users: [user, ...prev.users] };
      }
      return {
        ...prev,
        users: prev.users.map((u, i) => (i === existingIndex ? { ...u, ...user } : u))
      };
    });

    // Otomatis sinkronkan pendaftaran customer baru ke Google Spreadsheet
    if (isNew && user.Role === 'customer' && appData.storeData.gas_web_app_url) {
      syncGasNewCustomer(appData.storeData.gas_web_app_url, user)
        .then((res) => console.log('Sync customer baru ke Sheet Users sukses:', res))
        .catch((e) => console.warn('Sync customer baru ke GAS error:', e));
    }
    setCurrentUser(user);
    setCurrentRole(user.Role);
    saveAuthUserId(user.ID); // Persist login session to localStorage
    setShowLoginPortal(false);
    if (user.Role === 'admin') {
      setActiveAdminMenu('dashboard');
    } else {
      setActiveCustMenu('home');
    }
    showToast(`Berhasil masuk sebagai ${user.Nama} (${user.Role === 'admin' ? 'Administrator' : 'Customer'})`);
  };

  // Logout current user (Single active login: must logout first to switch account)
  const handleLogout = () => {
    saveAuthUserId('LOGGED_OUT'); // Clear persisted session
    setCurrentUser(null);
    setCurrentRole('customer');
    setActiveCustMenu('home');
    setPortalInitialRole('customer');
    setShowLoginPortal(true);
    showToast('Anda telah keluar dari akun. Silakan login kembali.');
  };

  // Update store clients slider
  const handleUpdateClients = (updated: ClientPartner[]) => {
    setAppData((prev) => ({
      ...prev,
      storeData: {
        ...prev.storeData,
        clients_slider: updated
      }
    }));
    showToast('Slider instansi / customer berhasil diperbarui!');
  };

  // Filtered orders for dashboard
  const filteredOrders = appData.orders.filter((o) => {
    if (!filterStartDate && !filterEndDate) return true;
    const orderDate = o.Tgl.split('T')[0];
    if (filterStartDate && orderDate < filterStartDate) return false;
    if (filterEndDate && orderDate > filterEndDate) return false;
    return true;
  });

  const totalPemasukan = filteredOrders.reduce((sum, o) => sum + (o.TotalHarga || 0), 0);
  const totalPengeluaran = appData.expenses.reduce((sum, e) => sum + (e.Total || 0), 0);
  const saldoBersih = totalPemasukan - totalPengeluaran;

  // Filtered products
  const displayedProducts = appData.products.filter((p) => {
    const matchSearch = p.Nama.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.Deskripsi.toLowerCase().includes(productSearch.toLowerCase());
    const matchCat = productCategoryFilter === 'all' ? true : p.Kategori === productCategoryFilter;
    return matchSearch && matchCat;
  });

  // Customer orders
  const customerOrders = currentUser
    ? appData.orders.filter((o) => String(o.KodeCustomer) === String(currentUser.KodeKhusus))
    : [];

  // JIKA BELUM LOGIN: Arahkan LANGSUNG ke tampilan portal login sebelum semua user masuk ke aplikasi!
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-3 selection:bg-teal-600 selection:text-white">
        {showSuccessToast && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold backdrop-blur-sm border border-slate-700 animate-in fade-in slide-in-from-top-3">
            <CheckCircle2 className="w-4 h-4 text-teal-400" />
            <span>{showSuccessToast}</span>
          </div>
        )}
        <LoginPortalModal
          isOpen={true}
          canClose={false}
          storeData={appData.storeData}
          existingUsers={appData.users}
          onLoginSuccess={handleAuthLoginSuccess}
          initialRole={portalInitialRole}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex justify-center selection:bg-teal-600 selection:text-white">
      {/* Mobile-first App Shell */}
      <div className="w-full max-w-md min-h-screen bg-white shadow-2xl flex flex-col relative border-x border-slate-200">
        {/* Toast Notification */}
        {showSuccessToast && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold backdrop-blur-sm border border-slate-700 animate-in fade-in slide-in-from-top-3">
            <CheckCircle2 className="w-4 h-4 text-teal-400" />
            <span>{showSuccessToast}</span>
          </div>
        )}

        {/* Global Top Navigation Bar */}
        <header className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-md">
          <div className="flex items-center gap-2.5">
            {appData.storeData.logo_url ? (
              <img
                src={appData.storeData.logo_url}
                alt={appData.storeData.nama_toko || 'Alinea Desain'}
                className="w-8 h-8 rounded-xl object-cover border border-teal-500/50 shadow-xs"
              />
            ) : (
              <div className="w-8 h-8 rounded-xl bg-teal-600 flex items-center justify-center font-extrabold text-xs text-white shadow-xs">
                {((appData.storeData.nama_toko || 'Alinea Desain')
                  .split(' ')
                  .map((w) => w[0])
                  .join('')
                  .slice(0, 2) || 'AD').toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-bold text-xs tracking-tight text-white line-clamp-1 max-w-[130px]">
                  {appData.storeData.nama_toko || 'Alinea Desain'}
                </h1>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded uppercase bg-teal-800/80 text-teal-200 border border-teal-600/60 shrink-0">
                  {currentUser ? (currentRole === 'admin' ? 'Admin' : 'Customer') : 'Tamu'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-none mt-0.5 truncate max-w-[150px]">
                {currentUser ? (
                  <>
                    {currentUser.Nama} {currentUser.KodeKhusus !== '-' && `• ID: ${currentUser.KodeKhusus}`}
                  </>
                ) : (
                  'Belum Masuk'
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Single Active Login: No Switch Allowed. Must Logout to use another account */}
            {currentUser ? (
              <button
                type="button"
                onClick={handleLogout}
                className="bg-rose-950/60 hover:bg-rose-900 text-rose-200 hover:text-white px-2.5 py-1.5 rounded-xl text-[11px] font-bold border border-rose-800/60 transition flex items-center gap-1.5 active:scale-95"
                title="Keluar dari akun aktif"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-300" />
                <span>Keluar</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setPortalInitialRole('customer');
                  setShowLoginPortal(true);
                }}
                className="bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-xl text-[11px] font-bold transition flex items-center gap-1.5 shadow-xs active:scale-95"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Masuk</span>
              </button>
            )}
          </div>
        </header>

        {/* MAIN BODY CONTENT */}
        <main className="flex-1 pb-24 overflow-y-auto">
          {/* ================= CUSTOMER PORTAL ================= */}
          {currentRole === 'customer' && (
            <div>
              {/* 1. HOME TAB */}
              {activeCustMenu === 'home' && (
                <div className="p-4 space-y-4">
                  {/* Banner Slider Otomatis */}
                  <BannerSlider
                    banners={appData.storeData.banners || []}
                    onActionClick={(target) => {
                      if (target === 'order') setActiveCustMenu('order');
                      else if (target === 'products') setActiveCustMenu('products');
                      else if (target === 'contact') {
                        const raw = (appData.storeData.kontak || '081234567890').replace(/[^0-9]/g, '');
                        const phone = raw.startsWith('0') ? '62' + raw.slice(1) : raw;
                        window.open(`https://wa.me/${phone}?text=Halo%20Alinea%20Desain,%20saya%20ingin%20konsultasi%20desain%20dan%20cetak`, '_blank');
                      }
                    }}
                  />

                  {/* Running Text Marquee Otomatis */}
                  <RunningText
                    text={appData.storeData.running_text}
                    speed={appData.storeData.running_text_speed || 22}
                  />

                  {/* Produk Terpopuler Section */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                          Produk Terpopuler
                        </h3>
                        <p className="text-[10px] text-slate-400">
                          Paling sering dipesan pelanggan
                        </p>
                      </div>
                      <button
                        onClick={() => setShowAllHomeProducts(!showAllHomeProducts)}
                        className="text-xs font-bold text-teal-700 hover:underline"
                      >
                        {showAllHomeProducts ? 'Tampilkan 4 Saja' : 'Lihat Semua'}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      {(showAllHomeProducts
                        ? appData.products
                        : appData.products.slice(0, 4)
                      ).map((p) => (
                        <div
                          key={p.ID}
                          onClick={() => setSelectedProductForDetail(p)}
                          className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-teal-400 cursor-pointer transition flex flex-col justify-between group"
                        >
                          <div className="relative overflow-hidden rounded-xl bg-slate-100 aspect-4/3 mb-2">
                            <img
                              src={p.Thumbnail}
                              alt={p.Nama}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                (e.target as HTMLElement).setAttribute('src', 'https://placehold.co/400x300?text=Alinea+Desain');
                              }}
                            />
                            <span className="absolute top-1.5 left-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-slate-900/80 text-white backdrop-blur-xs uppercase">
                              {p.Kategori}
                            </span>
                            {p.Terjual > 0 && (
                              <span className="absolute bottom-1.5 right-1.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-md bg-teal-600/90 text-white backdrop-blur-xs">
                                {p.Terjual} terjual
                              </span>
                            )}
                          </div>

                          <div>
                            <h4 className="font-bold text-xs text-slate-800 line-clamp-1 group-hover:text-teal-700 transition">
                              {p.Nama}
                            </h4>
                            <div className="flex items-baseline justify-between mt-1">
                              <span className="font-extrabold text-xs text-teal-700">
                                {formatRp(p.Harga)}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                /{p.Kategori === 'meteran' ? 'm²' : 'pcs'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Slider Otomatis Logo Instansi / Customer Pernah Order */}
                  <ClientSlider clients={appData.storeData.clients_slider || []} />

                  {/* Footer Info Toko */}
                  <div className="bg-gradient-to-br from-slate-900 to-teal-950 text-white p-4 rounded-2xl shadow-md space-y-2.5 text-xs">
                    <div className="flex items-center gap-2 text-teal-400 font-bold border-b border-slate-800 pb-2">
                      <Store className="w-4 h-4" />
                      <span>Percetakan Alinea Desain</span>
                    </div>

                    <div className="flex items-start gap-2 text-slate-300">
                      <MapPin className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" />
                      <span className="text-[11px] leading-relaxed">
                        {appData.storeData.alamat}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-300">
                      <Phone className="w-4 h-4 text-teal-500 flex-shrink-0" />
                      <span className="text-[11px] font-mono font-semibold">
                        {appData.storeData.kontak}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-300">
                      <CreditCard className="w-4 h-4 text-teal-500 flex-shrink-0" />
                      <span className="text-[11px] font-mono">
                        {appData.storeData.rekening}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. ORDER FORM TAB (MULTI-ITEM CAPABLE) */}
              {activeCustMenu === 'order' && (
                <div className="p-4 space-y-4">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                    <div className="border-b border-slate-100 pb-2">
                      <h2 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                        <ShoppingCart className="w-4 h-4 text-teal-600" />
                        <span>Form Pemesanan Cetak</span>
                      </h2>
                      <p className="text-[11px] text-slate-500">
                        Isi spesifikasi pesanan Anda. Bisa order beberapa produk sekaligus.
                      </p>
                    </div>

                    {/* Customer identity readonly indicator */}
                    <div className="p-3 bg-teal-50/70 border border-teal-100 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-teal-800 font-semibold uppercase block">
                          Pemesan Terdaftar:
                        </span>
                        <span className="font-bold text-slate-800">
                          {currentUser?.Nama}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-teal-800 font-semibold uppercase block">
                          Kode Khusus:
                        </span>
                        <span className="font-mono font-bold text-teal-700 bg-white px-2 py-0.5 rounded border border-teal-200">
                          {currentUser?.KodeKhusus}
                        </span>
                      </div>
                    </div>

                    {/* Dynamic Order Item Cards */}
                    <div className="space-y-4 pt-1">
                      {orderItems.map((item, index) => {
                        const selectedProd = appData.products.find((p) => p.ID === item.productId);
                        const isMeteran = selectedProd?.Kategori === 'meteran';
                        const itemSubtotal = calculateItemTotal(item);

                        return (
                          <div
                            key={item.id}
                            className="bg-slate-50/90 border border-slate-200 rounded-2xl p-4 space-y-3 relative"
                          >
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                              <span className="font-bold text-xs text-teal-800 flex items-center gap-1">
                                <Layers className="w-3.5 h-3.5 text-teal-600" />
                                <span>Produk #{index + 1}</span>
                              </span>

                              {orderItems.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setOrderItems(orderItems.filter((it) => it.id !== item.id))
                                  }
                                  className="text-rose-600 hover:text-rose-700 text-[11px] font-bold flex items-center gap-1"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Hapus</span>
                                </button>
                              )}
                            </div>

                            {/* Select Product */}
                            <div>
                              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                                Pilih Produk Cetak
                              </label>
                              <select
                                value={item.productId}
                                onChange={(e) => {
                                  const newProdId = e.target.value;
                                  setOrderItems(
                                    orderItems.map((it) =>
                                      it.id === item.id ? { ...it, productId: newProdId } : it
                                    )
                                  );
                                }}
                                className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                              >
                                {appData.products.map((p) => (
                                  <option key={p.ID} value={p.ID}>
                                    {p.Nama} - {formatRp(p.Harga)} ({p.Kategori})
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Meteran inputs if meteran */}
                            {isMeteran && (
                              <div className="bg-teal-50/60 border border-teal-100 rounded-xl p-3 space-y-2">
                                <div className="text-[10px] text-teal-800 font-bold">
                                  Ukuran Spanduk / MMT (Min 100 x 100 cm = 1 m²)
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-[10px] font-semibold text-slate-600 block mb-0.5">
                                      Panjang (cm)
                                    </label>
                                    <input
                                      type="number"
                                      value={item.panjang}
                                      onChange={(e) => {
                                        const val = Number(e.target.value);
                                        setOrderItems(
                                          orderItems.map((it) =>
                                            it.id === item.id ? { ...it, panjang: val } : it
                                          )
                                        );
                                      }}
                                      className="w-full p-2 text-xs text-center font-bold bg-white border border-slate-200 rounded-lg"
                                      placeholder="cm"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] font-semibold text-slate-600 block mb-0.5">
                                      Lebar (cm)
                                    </label>
                                    <input
                                      type="number"
                                      value={item.lebar}
                                      onChange={(e) => {
                                        const val = Number(e.target.value);
                                        setOrderItems(
                                          orderItems.map((it) =>
                                            it.id === item.id ? { ...it, lebar: val } : it
                                          )
                                        );
                                      }}
                                      className="w-full p-2 text-xs text-center font-bold bg-white border border-slate-200 rounded-lg"
                                      placeholder="cm"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="text-[10px] font-semibold text-slate-600 block mb-0.5">
                                    Finishing MMT
                                  </label>
                                  <select
                                    value={item.finishing}
                                    onChange={(e) => {
                                      const fin = e.target.value;
                                      setOrderItems(
                                        orderItems.map((it) =>
                                          it.id === item.id ? { ...it, finishing: fin } : it
                                        )
                                      );
                                    }}
                                    className="w-full p-2 text-xs bg-white border border-slate-200 rounded-lg"
                                  >
                                    <option value="Simkel">Simkel (Mata ayam keliling)</option>
                                    <option value="Siming">Siming (Mata ayam pojok 4 sisi)</option>
                                    <option value="Kolong">Kolong (Selongsong bambu atas/bawah)</option>
                                    <option value="Sibah">Sibah (Lipat keliling bersih)</option>
                                    <option value="-">Tanpa Finishing (Potong Pas Gambar)</option>
                                  </select>
                                </div>
                              </div>
                            )}

                            {/* Qty */}
                            <div>
                              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                                Jumlah (Qty)
                              </label>
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOrderItems(
                                      orderItems.map((it) =>
                                        it.id === item.id
                                          ? { ...it, qty: Math.max(1, it.qty - 1) }
                                          : it
                                      )
                                    );
                                  }}
                                  className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="font-extrabold text-sm w-12 text-center">
                                  {item.qty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOrderItems(
                                      orderItems.map((it) =>
                                        it.id === item.id ? { ...it, qty: it.qty + 1 } : it
                                      )
                                    );
                                  }}
                                  className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Jasa Tambahan Toggles */}
                            <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2 text-xs">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block border-b border-slate-100 pb-1">
                                Layanan Tambahan (Opsional)
                              </span>

                              {/* Jasa Desain */}
                              <label className="flex items-center justify-between cursor-pointer">
                                <div>
                                  <span className="font-semibold text-slate-700 block">
                                    Jasa Desain Setting
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    +{formatRp(selectedProd?.HargaDesain || 15000)}
                                  </span>
                                </div>
                                <input
                                  type="checkbox"
                                  checked={item.withDesain}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    setOrderItems(
                                      orderItems.map((it) =>
                                        it.id === item.id ? { ...it, withDesain: checked } : it
                                      )
                                    );
                                  }}
                                  className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                                />
                              </label>

                              {/* Jasa Cutting */}
                              <label className="flex items-center justify-between cursor-pointer">
                                <div>
                                  <span className="font-semibold text-slate-700 block">
                                    Jasa Cutting Presisi
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    +{formatRp((selectedProd?.HargaCutting || 0) * item.qty)}
                                  </span>
                                </div>
                                <input
                                  type="checkbox"
                                  checked={item.withCutting}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    setOrderItems(
                                      orderItems.map((it) =>
                                        it.id === item.id ? { ...it, withCutting: checked } : it
                                      )
                                    );
                                  }}
                                  className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                                />
                              </label>

                              {/* Jasa Laminating */}
                              <label className="flex items-center justify-between cursor-pointer">
                                <div>
                                  <span className="font-semibold text-slate-700 block">
                                    Jasa Laminating Doff/Glossy
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    +{formatRp((selectedProd?.HargaLaminating || 0) * item.qty)}
                                  </span>
                                </div>
                                <input
                                  type="checkbox"
                                  checked={item.withLaminating}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    setOrderItems(
                                      orderItems.map((it) =>
                                        it.id === item.id ? { ...it, withLaminating: checked } : it
                                      )
                                    );
                                  }}
                                  className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                                />
                              </label>
                            </div>

                            {/* Subtotal of this card */}
                            <div className="flex justify-between items-center pt-1 border-t border-slate-200 text-xs">
                              <span className="text-slate-500 font-medium">
                                Subtotal Produk #{index + 1}:
                              </span>
                              <span className="font-bold text-teal-700">
                                {formatRp(itemSubtotal)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Button to add another item */}
                    <button
                      type="button"
                      onClick={() =>
                        setOrderItems([
                          ...orderItems,
                          {
                            id: 'item_' + Date.now(),
                            productId: appData.products[0]?.ID || 'P1',
                            qty: 1,
                            panjang: 0,
                            lebar: 0,
                            finishing: 'Simkel',
                            withDesain: false,
                            withCutting: false,
                            withLaminating: false
                          }
                        ])
                      }
                      className="w-full py-2.5 rounded-xl border-2 border-dashed border-teal-300 text-teal-700 hover:bg-teal-50 text-xs font-bold transition flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Tambah Produk Lain dalam 1 Transaksi</span>
                    </button>

                    {/* Catatan / Keterangan Tambahan */}
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">
                        Catatan Khusus Pesanan (Opsional)
                      </label>
                      <textarea
                        value={orderCatatan}
                        onChange={(e) => setOrderCatatan(e.target.value)}
                        placeholder="Contoh: Tulisan di spanduk 'Warung Berkah', background warna biru muda..."
                        className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl h-18 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      />
                    </div>

                    {/* Nominal DP (Uang Muka) */}
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                          <DollarSign className="w-3.5 h-3.5 text-teal-600" />
                          <span>Nominal Uang Muka / DP (Opsional)</span>
                        </label>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => setOrderNominalDP(Math.round(orderGrandTotal / 2))}
                            className="text-[10px] font-bold px-2 py-0.5 bg-teal-50 text-teal-700 border border-teal-200 rounded hover:bg-teal-100 transition"
                          >
                            50% DP
                          </button>
                          <button
                            type="button"
                            onClick={() => setOrderNominalDP(orderGrandTotal)}
                            className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded hover:bg-emerald-100 transition"
                          >
                            Lunas (100%)
                          </button>
                        </div>
                      </div>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={orderNominalDP}
                        onChange={(e) =>
                          setOrderNominalDP(e.target.value === '' ? '' : Number(e.target.value))
                        }
                        placeholder="Contoh: 50000 (kosongkan jika belum bayar DP)"
                        className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl font-bold text-teal-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      />
                    </div>

                    {/* Grand Total Bar & Submit Button */}
                    <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl space-y-3">
                      <div className="flex justify-between items-center text-slate-600">
                        <span className="text-xs font-medium">
                          Total Seluruh Pesanan ({orderItems.length} item):
                        </span>
                        <span className="text-base font-extrabold text-teal-900">
                          {formatRp(orderGrandTotal)}
                        </span>
                      </div>

                      {typeof orderNominalDP === 'number' && orderNominalDP > 0 && (
                        <div className="pt-2 border-t border-teal-200/80 space-y-1 text-xs">
                          <div className="flex justify-between items-center text-teal-700 font-semibold">
                            <span>Uang Muka (DP):</span>
                            <span>- {formatRp(orderNominalDP)}</span>
                          </div>
                          <div className="flex justify-between items-center text-rose-700 font-bold">
                            <span>Sisa Tagihan Belum Lunas:</span>
                            <span className="font-extrabold text-sm">
                              {formatRp(Math.max(0, orderGrandTotal - orderNominalDP))}
                            </span>
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleSubmitCustomerOrder}
                        className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-4 rounded-xl text-xs shadow-lg shadow-teal-600/30 transition flex items-center justify-center gap-2 active:scale-95"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        <span>Kirim & Simpan Pesanan Sekarang</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. PRODUCTS CATALOG TAB */}
              {activeCustMenu === 'products' && (
                <div className="p-4 space-y-4">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Cari nama produk cetak..."
                      className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none shadow-2xs"
                    />
                  </div>

                  {/* Filter Pills */}
                  <div className="flex gap-1.5">
                    {(['all', 'meteran', 'satuan'] as const).map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setProductCategoryFilter(cat)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                          productCategoryFilter === cat
                            ? 'bg-teal-600 text-white shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {cat === 'all' ? 'Semua Produk' : cat === 'meteran' ? 'Meteran (MMT)' : 'Satuan (Stiker/Box)'}
                      </button>
                    ))}
                  </div>

                  {/* Products Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {displayedProducts.map((p) => (
                      <div
                        key={p.ID}
                        onClick={() => setSelectedProductForDetail(p)}
                        className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-teal-400 cursor-pointer transition flex flex-col justify-between group"
                      >
                        <div className="relative overflow-hidden rounded-xl bg-slate-100 aspect-4/3 mb-2">
                          <img
                            src={p.Thumbnail}
                            alt={p.Nama}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLElement).setAttribute('src', 'https://placehold.co/400x300?text=Produk');
                            }}
                          />
                          <span className="absolute top-1.5 left-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-slate-900/80 text-white backdrop-blur-xs uppercase">
                            {p.Kategori}
                          </span>
                        </div>

                        <div>
                          <h4 className="font-bold text-xs text-slate-800 line-clamp-1 group-hover:text-teal-700 transition">
                            {p.Nama}
                          </h4>
                          <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5 leading-tight">
                            {p.Deskripsi}
                          </p>
                          <div className="flex items-baseline justify-between mt-2 pt-2 border-t border-slate-100">
                            <span className="font-extrabold text-xs text-teal-700">
                              {formatRp(p.Harga)}
                            </span>
                            <span className="text-[9px] text-slate-400">
                              /{p.Kategori === 'meteran' ? 'm²' : 'item'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. CUSTOMER PROFILE & RIWAYAT PESANAN TAB */}
              {activeCustMenu === 'profile' && (
                <div className="p-4 space-y-4">
                  {!currentUser ? (
                    <div className="bg-white p-6 rounded-3xl border border-slate-200/80 text-center shadow-xs space-y-4">
                      <div className="w-16 h-16 bg-teal-50 border border-teal-200 text-teal-700 rounded-3xl flex items-center justify-center font-extrabold text-2xl mx-auto shadow-inner">
                        <UserIcon className="w-8 h-8" />
                      </div>
                      <div>
                        <h2 className="font-bold text-base text-slate-800">
                          Belum Masuk ke Akun
                        </h2>
                        <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1 leading-relaxed">
                          Daftar langsung menggunakan akun <strong>Gmail</strong> maupun <strong>formulir manual</strong> untuk melacak pesanan dan memperoleh kode customer.
                        </p>
                      </div>

                      <div className="space-y-2 pt-2 max-w-xs mx-auto">
                        <button
                          onClick={() => {
                            setPortalInitialRole('customer');
                            setShowLoginPortal(true);
                          }}
                          className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-2xl text-xs transition shadow-md shadow-teal-700/20 flex items-center justify-center gap-2 active:scale-95"
                        >
                          <Sparkles className="w-4 h-4 text-teal-200" />
                          <span>Masuk / Daftar Akun Customer</span>
                        </button>

                        <button
                          onClick={() => {
                            setPortalInitialRole('admin');
                            setShowLoginPortal(true);
                          }}
                          className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-2xl text-xs transition flex items-center justify-center gap-2 active:scale-95"
                        >
                          <Shield className="w-4 h-4 text-rose-600" />
                          <span>Masuk Sebagai Administrator</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Profile Header Card */}
                      <div className="bg-gradient-to-br from-teal-700 via-teal-800 to-slate-900 text-white p-5 rounded-3xl text-center shadow-lg relative overflow-hidden">
                        {currentUser.Avatar ? (
                          <img
                            src={currentUser.Avatar}
                            alt={currentUser.Nama}
                            className="w-16 h-16 rounded-full object-cover mx-auto mb-2 border-2 border-white/30 shadow-inner"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center font-extrabold text-2xl mx-auto mb-2 border border-white/20 shadow-inner">
                            {currentUser.Nama.charAt(0)}
                          </div>
                        )}
                        <h2 className="font-bold text-base">{currentUser.Nama}</h2>
                        <p className="text-xs text-teal-200">{currentUser.Email || currentUser.NoWA}</p>
                        <div className="mt-2 inline-flex items-center gap-1.5 bg-teal-900/80 px-3 py-1 rounded-full text-xs font-mono font-bold border border-teal-500/50">
                          <span>Kode Khusus:</span>
                          <span className="text-teal-300">{currentUser.KodeKhusus}</span>
                        </div>

                        {/* Fast Actions inside header card */}
                        <div className="mt-4 pt-3 border-t border-teal-800/80">
                          <button
                            type="button"
                            onClick={handleLogout}
                            className="w-full bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 hover:text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition border border-rose-500/30"
                          >
                            <LogOut className="w-3.5 h-3.5 text-rose-300" />
                            <span>Keluar dari Akun (Logout)</span>
                          </button>
                          <p className="text-[10px] text-teal-300/80 mt-1.5">
                            Keluar akun jika ingin masuk dengan akun lain
                          </p>
                        </div>
                      </div>

                  {/* Profile Information List / Edit Form */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                        Informasi Akun Customer
                      </h3>
                      {!isEditingCustProfile ? (
                        <button
                          type="button"
                          onClick={handleStartEditCustProfile}
                          className="text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded-lg border border-teal-200 transition flex items-center gap-1"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Ubah Profil & Password</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsEditingCustProfile(false)}
                          className="text-xs font-bold text-slate-500 hover:text-slate-700"
                        >
                          Batal
                        </button>
                      )}
                    </div>

                    {!isEditingCustProfile ? (
                      <div className="space-y-2">
                        <div className="flex justify-between py-1 border-b border-slate-50">
                          <span className="text-slate-500">Nama Lengkap:</span>
                          <span className="font-semibold text-slate-800">{currentUser?.Nama}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-50">
                          <span className="text-slate-500">No. WhatsApp:</span>
                          <span className="font-mono font-semibold text-slate-800">
                            {currentUser?.NoWA}
                          </span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-50">
                          <span className="text-slate-500">Alamat:</span>
                          <span className="font-semibold text-slate-800 text-right max-w-[60%]">
                            {currentUser?.Alamat || '-'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span className="text-slate-500">Password:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold text-slate-800">
                              {showCustPassword ? currentUser?.Password : '••••••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => setShowCustPassword(!showCustPassword)}
                              className="text-slate-400 hover:text-slate-600"
                              title="Tampilkan / Sembunyikan Password"
                            >
                              {showCustPassword ? (
                                <EyeOff className="w-3.5 h-3.5" />
                              ) : (
                                <Eye className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleSaveCustProfile} className="space-y-3 pt-1">
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-1">
                            Nama Lengkap *
                          </label>
                          <input
                            type="text"
                            value={editCustNama}
                            onChange={(e) => setEditCustNama(e.target.value)}
                            required
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-1">
                            No. WhatsApp *
                          </label>
                          <input
                            type="tel"
                            value={editCustNoWA}
                            onChange={(e) => setEditCustNoWA(e.target.value)}
                            required
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-1">
                            Alamat Lengkap *
                          </label>
                          <textarea
                            rows={2}
                            value={editCustAlamat}
                            onChange={(e) => setEditCustAlamat(e.target.value)}
                            required
                            placeholder="Masukkan alamat pengiriman / domisili..."
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[10px] font-bold text-slate-600">
                              Password Baru *
                            </label>
                            <button
                              type="button"
                              onClick={() => setShowCustPassword(!showCustPassword)}
                              className="text-[10px] text-teal-600 hover:text-teal-800 flex items-center gap-1"
                            >
                              {showCustPassword ? (
                                <>
                                  <EyeOff className="w-3 h-3" /> Sembunyikan
                                </>
                              ) : (
                                <>
                                  <Eye className="w-3 h-3" /> Lihat
                                </>
                              )}
                            </button>
                          </div>
                          <input
                            type={showCustPassword ? 'text' : 'password'}
                            value={editCustPassword}
                            onChange={(e) => setEditCustPassword(e.target.value)}
                            required
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                          />
                        </div>

                        <div className="flex gap-2 pt-2">
                          <button
                            type="submit"
                            className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 rounded-xl text-xs shadow-xs transition"
                          >
                            Simpan Perubahan
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsEditingCustProfile(false)}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
                          >
                            Batal
                          </button>
                        </div>
                      </form>
                    )}
                  </div>

                  {/* Riwayat Pesanan Section */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <div>
                        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                          Riwayat Pesanan Saya ({customerOrders.length})
                        </h3>
                        <p className="text-[10px] text-teal-700 font-medium">
                          Klik pesanan untuk melihat rincian lengkap & nota
                        </p>
                      </div>
                    </div>

                    {customerOrders.length === 0 ? (
                      <div className="text-center py-8 bg-white rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400">
                        Belum ada riwayat pesanan. Silakan buat pesanan di menu Order.
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {customerOrders.map((ord) => (
                          <div
                            key={ord.ID}
                            onClick={() => setSelectedOrderForDetail(ord)}
                            className="bg-white p-3.5 rounded-2xl border border-slate-200/80 hover:border-teal-400 hover:shadow-xs transition cursor-pointer space-y-2 group"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                                  <span>{ord.ID}</span>
                                  <span>•</span>
                                  <span>{new Date(ord.Tgl).toLocaleDateString('id-ID')}</span>
                                </div>
                                <h4 className="font-bold text-xs text-slate-800 group-hover:text-teal-700 transition mt-0.5">
                                  {ord.NamaProduk}
                                </h4>
                              </div>

                              {/* Badges */}
                              <div className="flex flex-col items-end gap-1">
                                <span
                                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                                    ord.StatusOrder === 'Selesai'
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : ord.StatusOrder === 'Proses'
                                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                                      : 'bg-blue-50 text-blue-700 border-blue-200'
                                  }`}
                                >
                                  {ord.StatusOrder}
                                </span>
                                <span
                                  className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${
                                    ord.StatusBayar === 'Lunas'
                                      ? 'bg-teal-50 text-teal-700 border-teal-200'
                                      : 'bg-rose-50 text-rose-700 border-rose-200'
                                  }`}
                                >
                                  {ord.StatusBayar}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                              <span className="text-[11px] text-slate-500">
                                {ord.Qty} item {ord.Kategori === 'meteran' ? `(${ord.Panjang}x${ord.Lebar} cm)` : ''}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span className="font-extrabold text-teal-700">
                                  {formatRp(ord.TotalHarga)}
                                </span>
                                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600 transition" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ================= ADMIN PORTAL ================= */}
          {currentRole === 'admin' && (
            <div>
              {/* 1. DASHBOARD LAPORAN */}
              {activeAdminMenu === 'dashboard' && (
                <div className="p-4 space-y-4">
                  {/* Filter Rentang Tanggal */}
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
                    <h3 className="font-bold text-xs text-slate-700 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-teal-600" />
                      <span>Filter Rentang Tanggal Laporan</span>
                    </h3>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={filterStartDate}
                        onChange={(e) => setFilterStartDate(e.target.value)}
                        className="flex-1 p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                      />
                      <input
                        type="date"
                        value={filterEndDate}
                        onChange={(e) => setFilterEndDate(e.target.value)}
                        className="flex-1 p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                      />
                      {(filterStartDate || filterEndDate) && (
                        <button
                          onClick={() => {
                            setFilterStartDate('');
                            setFilterEndDate('');
                          }}
                          className="text-xs text-rose-600 font-bold px-2 hover:underline"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-teal-700 text-white p-4 rounded-2xl shadow-md">
                      <span className="text-[10px] text-teal-200 uppercase font-bold tracking-wider">
                        Total Pemasukan
                      </span>
                      <h3 className="text-base font-extrabold mt-1">
                        {formatRp(totalPemasukan)}
                      </h3>
                      <p className="text-[10px] text-teal-100 mt-0.5">
                        {filteredOrders.length} transaksi masuk
                      </p>
                    </div>

                    <div className="bg-rose-700 text-white p-4 rounded-2xl shadow-md">
                      <span className="text-[10px] text-rose-200 uppercase font-bold tracking-wider">
                        Total Pengeluaran
                      </span>
                      <h3 className="text-base font-extrabold mt-1">
                        {formatRp(totalPengeluaran)}
                      </h3>
                      <p className="text-[10px] text-rose-100 mt-0.5">
                        {appData.expenses.length} pengeluaran toko
                      </p>
                    </div>
                  </div>

                  {/* Saldo Bersih Card */}
                  <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-md flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                        Saldo Bersih Kas
                      </span>
                      <h3
                        className={`text-lg font-extrabold mt-0.5 ${
                          saldoBersih >= 0 ? 'text-teal-400' : 'text-rose-400'
                        }`}
                      >
                        {formatRp(saldoBersih)}
                      </h3>
                    </div>
                    <div className="text-right text-xs text-slate-300">
                      <div>Pemasukan - Pengeluaran</div>
                      <span className="text-[10px] text-teal-400 font-semibold">
                        Alinea Desain
                      </span>
                    </div>
                  </div>

                  {/* Analisis Performa */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">
                      Analisis Performa Penjualan
                    </h3>

                    <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold block">
                          Produk Terlaris
                        </span>
                        <span className="font-bold text-slate-800">
                          {appData.products.sort((a, b) => b.Terjual - a.Terjual)[0]?.Nama}
                        </span>
                      </div>
                      <span className="font-bold text-teal-700 bg-teal-50 px-2 py-1 rounded border border-teal-200">
                        {appData.products.sort((a, b) => b.Terjual - a.Terjual)[0]?.Terjual} terjual
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold block">
                          Customer Paling Sering Order
                        </span>
                        <span className="font-bold text-slate-800">
                          Budi Santoso (88392011)
                        </span>
                      </div>
                      <span className="font-bold text-teal-700 bg-teal-50 px-2 py-1 rounded border border-teal-200">
                        Loyal Customer
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. TRANSAKSI (ORDERS & EXPENSES) */}
              {activeAdminMenu === 'transaksi' && (
                <div className="p-4 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="font-bold text-sm text-slate-800">
                        Manajemen Transaksi & Keuangan
                      </h2>
                      <p className="text-[10px] text-slate-400">
                        Kelola pesanan customer dan pencatatan arus kas pengeluaran
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowAdminExpenseModal(true)}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition active:scale-95"
                      >
                        <Wallet className="w-3.5 h-3.5 text-rose-600" />
                        <span>+ Pengeluaran</span>
                      </button>
                      <button
                        onClick={() => setShowAdminNewOrderModal(true)}
                        className="bg-teal-600 hover:bg-teal-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Order Baru</span>
                      </button>
                    </div>
                  </div>

                  {/* Sub-tabs: Pesanan vs Pengeluaran */}
                  <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                    <button
                      onClick={() => setAdminTransaksiTab('orders')}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                        adminTransaksiTab === 'orders'
                          ? 'bg-white text-teal-800 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Daftar Pesanan ({appData.orders.length})
                    </button>
                    <button
                      onClick={() => setAdminTransaksiTab('expenses')}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                        adminTransaksiTab === 'expenses'
                          ? 'bg-white text-rose-800 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Catatan Pengeluaran ({appData.expenses.length})
                    </button>
                  </div>

                  {/* Tab Content: ORDERS */}
                  {adminTransaksiTab === 'orders' && (
                    <div className="space-y-3">
                      {appData.orders.length === 0 ? (
                        <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400">
                          Belum ada pesanan masuk.
                        </div>
                      ) : (
                        appData.orders.map((ord) => {
                          const sisaTagihan =
                            ord.NominalDP && ord.NominalDP > 0
                              ? Math.max(0, ord.TotalHarga - ord.NominalDP)
                              : 0;

                          return (
                            <div
                              key={ord.ID}
                              className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3"
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
                                    <span>{ord.ID}</span>
                                    <span>•</span>
                                    <span>{new Date(ord.Tgl).toLocaleDateString('id-ID')}</span>
                                  </div>
                                  <h4 className="font-bold text-xs text-slate-800 mt-0.5">
                                    {ord.NamaCustomer} ({ord.KodeCustomer})
                                  </h4>
                                  <p className="text-[11px] text-slate-600 font-medium">
                                    {ord.NamaProduk} ({ord.Qty} pcs)
                                  </p>
                                </div>

                                <div className="text-right">
                                  <span className="font-extrabold text-sm text-teal-700 block">
                                    {formatRp(ord.TotalHarga)}
                                  </span>
                                  {ord.NominalDP && ord.NominalDP > 0 && (
                                    <div className="text-[10px] text-amber-700 font-medium">
                                      DP: {formatRp(ord.NominalDP)}
                                      {sisaTagihan > 0 && (
                                        <span className="text-rose-600 font-bold block">
                                          Sisa: {formatRp(sisaTagihan)}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Interactive Status Selectors */}
                              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                                <div>
                                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                                    Status Order:
                                  </label>
                                  <select
                                    value={ord.StatusOrder}
                                    onChange={(e) =>
                                      handleUpdateOrderStatus(
                                        ord.ID,
                                        e.target.value as Order['StatusOrder']
                                      )
                                    }
                                    className="w-full p-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold"
                                  >
                                    <option value="Order Masuk">Order Masuk</option>
                                    <option value="Proses">Proses Pengerjaan</option>
                                    <option value="Selesai">Selesai (Kirim WA)</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                                    Status Bayar:
                                  </label>
                                  <select
                                    value={ord.StatusBayar}
                                    onChange={(e) =>
                                      handleUpdateOrderBayar(
                                        ord.ID,
                                        e.target.value as Order['StatusBayar']
                                      )
                                    }
                                    className="w-full p-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold"
                                  >
                                    <option value="Belum Lunas">Belum Lunas</option>
                                    <option value="DP">DP</option>
                                    <option value="Lunas">Lunas</option>
                                  </select>
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-1">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteOrder(ord.ID)}
                                  className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg border border-transparent hover:border-rose-200 transition flex items-center gap-1"
                                  title="Hapus pesanan ini"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Hapus</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSelectedOrderForDetail(ord)}
                                  className="text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg border border-teal-200 transition flex items-center gap-1"
                                >
                                  <span>Lihat Rincian Pesanan</span>
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

                  {/* Tab Content: EXPENSES */}
                  {adminTransaksiTab === 'expenses' && (
                    <div className="space-y-3">
                      {/* Total Expense Summary */}
                      <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 block">
                            Total Pengeluaran Tercatat
                          </span>
                          <span className="text-xl font-black text-rose-800">
                            {formatRp(appData.expenses.reduce((acc, curr) => acc + curr.Total, 0))}
                          </span>
                        </div>
                        <button
                          onClick={() => setShowAdminExpenseModal(true)}
                          className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs transition active:scale-95 flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Catat Baru</span>
                        </button>
                      </div>

                      {appData.expenses.length === 0 ? (
                        <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400">
                          Belum ada catatan pengeluaran. Klik tombol &ldquo;+ Pengeluaran&rdquo; untuk mencatat.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {appData.expenses.map((exp) => (
                            <div
                              key={exp.ID}
                              className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between text-xs"
                            >
                              <div className="space-y-0.5">
                                <div className="text-[10px] text-slate-400 font-mono">
                                  {exp.ID} • {new Date(exp.Tgl).toLocaleDateString('id-ID')}
                                </div>
                                <h4 className="font-bold text-xs text-slate-800">{exp.Toko}</h4>
                                <p className="text-[11px] text-slate-600">{exp.Keperluan}</p>
                              </div>

                              <div className="flex items-center gap-3">
                                <span className="font-black text-sm text-rose-700">
                                  {formatRp(exp.Total)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteExpense(exp.ID)}
                                  className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition"
                                  title="Hapus Pengeluaran"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 3. CUSTOMER DATA */}
              {activeAdminMenu === 'customer' && (
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="font-bold text-sm text-slate-800">
                      Data Customer Terdaftar ({appData.users.filter((u) => u.Role === 'customer').length})
                    </h2>
                  </div>

                  <div className="space-y-2">
                    {appData.users
                      .filter((u) => u.Role === 'customer')
                      .map((u) => {
                        const countOrders = appData.orders.filter(
                          (o) => String(o.KodeCustomer) === String(u.KodeKhusus)
                        ).length;
                        return (
                          <div
                            key={u.ID}
                            className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1.5 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-800">{u.Nama}</span>
                              <span className="font-mono text-teal-700 bg-teal-50 px-2 py-0.5 rounded font-bold">
                                {u.KodeKhusus}
                              </span>
                            </div>
                            <div className="text-slate-500 text-[11px]">
                              WA: {u.NoWA} • Alamat: {u.Alamat}
                            </div>
                            <div className="flex justify-between items-center pt-1 text-[11px] text-slate-400">
                              <span>Password: {u.Password}</span>
                              <span className="font-bold text-teal-700">
                                {countOrders} Transaksi
                              </span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* 4. PRODUK MANAGEMENT */}
              {activeAdminMenu === 'produk' && (
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-bold text-sm text-slate-800">
                        Kelola Produk Cetak ({appData.products.length})
                      </h2>
                      <p className="text-[10px] text-slate-400">
                        Atur harga dasar, spesifikasi, dan tarif jasa cetak
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setProductToEdit(null);
                        setShowAddProductModal(true);
                      }}
                      className="bg-teal-600 hover:bg-teal-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Produk</span>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {appData.products.map((p) => (
                      <div
                        key={p.ID}
                        className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2"
                      >
                        <div className="flex gap-3 items-start">
                          <img
                            src={p.Thumbnail}
                            alt={p.Nama}
                            className="w-16 h-16 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=Produk';
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <h4 className="font-bold text-xs text-slate-800 truncate">
                                {p.Nama}
                              </h4>
                              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-100 flex-shrink-0">
                                {p.Kategori}
                              </span>
                            </div>
                            <div className="text-teal-700 font-extrabold text-sm mt-0.5">
                              {formatRp(p.Harga)}{' '}
                              <span className="text-[10px] font-normal text-slate-400">
                                /{p.Kategori === 'meteran' ? 'm²' : 'item'}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                              {p.Deskripsi}
                            </p>
                          </div>
                        </div>

                        {/* Additional details: tariffs & actions */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                          <div className="flex flex-wrap gap-2">
                            <span>Desain: <strong>{formatRp(p.HargaDesain || 0)}</strong></span>
                            <span>•</span>
                            <span>Cutting: <strong>{formatRp(p.HargaCutting || 0)}</strong></span>
                            <span>•</span>
                            <span>Laminating: <strong>{formatRp(p.HargaLaminating || 0)}</strong></span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                setProductToEdit(p);
                                setShowAddProductModal(true);
                              }}
                              className="p-1 text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition"
                              title="Edit Produk"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p.ID)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Hapus Produk"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. TOKO & PENGATURAN SLIDER */}
              {activeAdminMenu === 'toko' && (
                <div className="p-4 space-y-4">
                  {/* HEADER MENU TOKO */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shrink-0">
                        <Store className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="font-bold text-sm text-slate-800">Manajemen Toko & Outlet</h2>
                        <p className="text-[11px] text-slate-500">Kelola identitas, info kontak, tampilan beranda, dan integrasi sistem</p>
                      </div>
                    </div>
                  </div>

                  {/* 1. PENGATURAN LOGO DAN NAMA TOKO (BRANDING) */}
                  <AdminStoreBrandingManager
                    storeData={appData.storeData}
                    onSaveBranding={handleSaveBranding}
                  />

                  {/* 2. PENGATURAN INFORMASI OUTLET & KONTAK */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3 text-xs">
                    <h3 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-teal-600" />
                      <span>Informasi Outlet & Rekening Pembayaran</span>
                    </h3>

                    <div>
                      <label className="font-bold text-slate-600 block mb-1">
                        Alamat Percetakan
                      </label>
                      <input
                        type="text"
                        value={appData.storeData.alamat}
                        onChange={(e) =>
                          setAppData((prev) => ({
                            ...prev,
                            storeData: { ...prev.storeData, alamat: e.target.value }
                          }))
                        }
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                        placeholder="Alamat fisik workshop / outlet"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-600 block mb-1">
                        Kontak WhatsApp CS Toko
                      </label>
                      <input
                        type="text"
                        value={appData.storeData.kontak}
                        onChange={(e) =>
                          setAppData((prev) => ({
                            ...prev,
                            storeData: { ...prev.storeData, kontak: e.target.value }
                          }))
                        }
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                        placeholder="08xxxxxxxxxx"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-600 block mb-1">
                        Rekening Bank Toko (BCA / Mandiri / BRI)
                      </label>
                      <input
                        type="text"
                        value={appData.storeData.rekening}
                        onChange={(e) =>
                          setAppData((prev) => ({
                            ...prev,
                            storeData: { ...prev.storeData, rekening: e.target.value }
                          }))
                        }
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                        placeholder="BCA 1234567890 a/n Alinea Percetakan"
                      />
                    </div>

                    <button
                      onClick={() => showToast('Pengaturan informasi toko berhasil disimpan!')}
                      className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Simpan Informasi Toko</span>
                    </button>
                  </div>

                  {/* 3. PENGATURAN RUNNING TEXT & KECEPATAN */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3 text-xs">
                    <h3 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1.5">
                      <Settings className="w-4 h-4 text-teal-600" />
                      <span>Teks Berjalan Beranda (Running Text)</span>
                    </h3>

                    <div>
                      <label className="font-bold text-slate-600 block mb-1">
                        Isi Teks Pengumuman / Promo Berjalan
                      </label>
                      <textarea
                        value={appData.storeData.running_text}
                        onChange={(e) =>
                          setAppData((prev) => ({
                            ...prev,
                            storeData: { ...prev.storeData, running_text: e.target.value }
                          }))
                        }
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl h-18 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      />
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-slate-700 flex items-center gap-1.5">
                          <Gauge className="w-3.5 h-3.5 text-teal-600" />
                          <span>Kecepatan Animasi Teks</span>
                        </label>
                        <span className="font-mono font-bold text-teal-700 text-xs">
                          {appData.storeData.running_text_speed || 22}s
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="8"
                          max="40"
                          step="2"
                          value={appData.storeData.running_text_speed || 22}
                          onChange={(e) =>
                            setAppData((prev) => ({
                              ...prev,
                              storeData: {
                                ...prev.storeData,
                                running_text_speed: Number(e.target.value)
                              }
                            }))
                          }
                          className="flex-1 accent-teal-600 cursor-pointer"
                        />
                        <div className="flex gap-1">
                          {[
                            { label: 'Cepat', val: 12 },
                            { label: 'Normal', val: 22 },
                            { label: 'Santai', val: 32 }
                          ].map((preset) => (
                            <button
                              key={preset.val}
                              type="button"
                              onClick={() =>
                                setAppData((prev) => ({
                                  ...prev,
                                  storeData: {
                                    ...prev.storeData,
                                    running_text_speed: preset.val
                                  }
                                }))
                              }
                              className={`text-[10px] px-2 py-0.5 rounded font-bold border transition ${
                                (appData.storeData.running_text_speed || 22) === preset.val
                                  ? 'bg-teal-600 text-white border-teal-600'
                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        * Angka lebih kecil = teks bergerak lebih cepat.
                      </p>
                    </div>

                    <button
                      onClick={() => showToast('Teks berjalan berhasil diperbarui!')}
                      className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-xs"
                    >
                      Perbarui Teks Berjalan
                    </button>
                  </div>

                  {/* 4. BANNER PROMO BERANDA CUSTOMER */}
                  <AdminBannerManager
                    banners={appData.storeData.banners || []}
                    onUpdateBanners={handleUpdateBanners}
                  />

                  {/* 5. SLIDER PORTOFOLIO / KLIEN CUSTOMER */}
                  <AdminTokoSliderManager
                    clients={appData.storeData.clients_slider || []}
                    onUpdateClients={handleUpdateClients}
                  />

                  {/* 6. PENGATURAN PROFIL & PASSWORD ADMIN */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                        <UserIcon className="w-4 h-4 text-teal-600" />
                        <span>Ubah Profil Akun Admin</span>
                      </h3>
                      <span className="text-[10px] bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded font-bold">
                        Administrator
                      </span>
                    </div>

                    <form onSubmit={handleSaveAdminProfile} className="space-y-3">
                      <div>
                        <label className="font-bold text-slate-600 block mb-1">Nama Admin *</label>
                        <input
                          type="text"
                          value={editAdminNama}
                          onChange={(e) => setEditAdminNama(e.target.value)}
                          required
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-600 block mb-1">No. WhatsApp Admin *</label>
                        <input
                          type="tel"
                          value={editAdminNoWA}
                          onChange={(e) => setEditAdminNoWA(e.target.value)}
                          required
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-bold text-slate-600">Password Akun Admin *</label>
                          <button
                            type="button"
                            onClick={() => setShowAdminPassword(!showAdminPassword)}
                            className="text-[10px] text-teal-600 hover:text-teal-800 flex items-center gap-1"
                          >
                            {showAdminPassword ? (
                              <>
                                <EyeOff className="w-3 h-3" /> Sembunyikan
                              </>
                            ) : (
                              <>
                                <Eye className="w-3 h-3" /> Lihat
                              </>
                            )}
                          </button>
                        </div>
                        <input
                          type={showAdminPassword ? 'text' : 'password'}
                          value={editAdminPassword}
                          onChange={(e) => setEditAdminPassword(e.target.value)}
                          required
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-xs flex items-center justify-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Simpan Perubahan Akun Admin</span>
                      </button>
                    </form>

                    <div className="pt-3 mt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold py-2.5 px-3 rounded-xl text-xs transition border border-rose-200 flex items-center justify-center gap-1.5"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Keluar dari Akun Admin</span>
                      </button>
                    </div>
                  </div>

                  {/* ======================================================== */}
                  {/* 7. INTEGRASI SISTEM & DATABASE EKSTERNAL (DI PALING BAWAH) */}
                  {/* ======================================================== */}
                  <div className="pt-4 border-t-2 border-dashed border-slate-200 space-y-4">
                    <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-md flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-mono tracking-wider uppercase text-teal-400 font-bold block">
                          Backend & Otomatisasi
                        </span>
                        <h3 className="font-extrabold text-sm text-white flex items-center gap-2 mt-0.5">
                          <Database className="w-4 h-4 text-teal-400" />
                          <span>Integrasi Google Sheets & WhatsApp API</span>
                        </h3>
                        <p className="text-[11px] text-slate-300 mt-0.5">
                          Konfigurasi sinkronisasi spreadsheet dan notifikasi pesan otomatis
                        </p>
                      </div>
                      <span className="bg-teal-500/20 text-teal-300 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-teal-500/30">
                        Integrasi
                      </span>
                    </div>

                    {/* INTEGRASI WEB APP URL GOOGLE SHEETS & SYNC NOW */}
                    <AdminGasSyncManager
                      storeData={appData.storeData}
                      onUpdateStoreData={handleUpdateStoreDataPartial}
                      onOpenGasModal={() => setShowGasModal(true)}
                      onTriggerSyncNow={handleTriggerGasSyncNow}
                      onPushAllToGas={handlePushAllDatabaseToGas}
                      counts={{
                        users: appData.users.length,
                        products: appData.products.length,
                        orders: appData.orders.length,
                        expenses: appData.expenses.length
                      }}
                    />

                    {/* KONFIGURASI API WHATSAPP (FONNTE / FONTE / FLOWKIRIM / DSB) */}
                    <AdminWhatsAppConfigManager
                      storeData={appData.storeData}
                      onSaveConfig={handleUpdateStoreDataPartial}
                      showToast={showToast}
                    />
                  </div>
                </div>
              )}

              {/* 6. ADMIN PROFIL */}
              {activeAdminMenu === 'profil' && (
                <div className="p-4 space-y-4">
                  <div className="bg-white p-6 rounded-3xl border border-slate-200/80 text-center shadow-xs space-y-3">
                    <div className="w-16 h-16 bg-slate-900 text-teal-400 rounded-full flex items-center justify-center font-extrabold text-2xl mx-auto shadow-inner">
                      {currentUser?.Nama.charAt(0) || 'A'}
                    </div>
                    <div>
                      <h2 className="font-bold text-base text-slate-800">
                        {currentUser?.Nama}
                      </h2>
                      <p className="text-xs text-slate-400">Administrator Utama Alinea Desain</p>
                      <p className="text-xs text-teal-600 font-mono mt-0.5">{currentUser?.NoWA}</p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                      <button
                        onClick={() => setShowGasModal(true)}
                        className="w-full bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-1.5"
                      >
                        <FileCode className="w-4 h-4 text-teal-600" />
                        <span>Lihat & Salin Kode Apps Script</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold py-2.5 rounded-xl text-xs transition border border-rose-200 flex items-center justify-center gap-1.5"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Keluar dari Akun Admin (Logout)</span>
                      </button>
                    </div>
                  </div>

                  {/* Admin Profile & Password Editor inside Profil Tab as well */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                        <Edit className="w-4 h-4 text-teal-600" />
                        <span>Ubah Nama & Password Admin</span>
                      </h3>
                    </div>

                    <form onSubmit={handleSaveAdminProfile} className="space-y-3">
                      <div>
                        <label className="font-bold text-slate-600 block mb-1">Nama Admin *</label>
                        <input
                          type="text"
                          value={editAdminNama}
                          onChange={(e) => setEditAdminNama(e.target.value)}
                          required
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-600 block mb-1">No. WhatsApp Admin *</label>
                        <input
                          type="tel"
                          value={editAdminNoWA}
                          onChange={(e) => setEditAdminNoWA(e.target.value)}
                          required
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-bold text-slate-600">Password Baru Admin *</label>
                          <button
                            type="button"
                            onClick={() => setShowAdminPassword(!showAdminPassword)}
                            className="text-[10px] text-teal-600 hover:text-teal-800 flex items-center gap-1"
                          >
                            {showAdminPassword ? (
                              <>
                                <EyeOff className="w-3 h-3" /> Sembunyikan
                              </>
                            ) : (
                              <>
                                <Eye className="w-3 h-3" /> Lihat
                              </>
                            )}
                          </button>
                        </div>
                        <input
                          type={showAdminPassword ? 'text' : 'password'}
                          value={editAdminPassword}
                          onChange={(e) => setEditAdminPassword(e.target.value)}
                          required
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-xs flex items-center justify-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Simpan Perubahan Profil Admin</span>
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>

        {/* Global Bottom Navigation Bar */}
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-2 flex justify-around items-center z-30 shadow-lg">
          {currentRole === 'customer' ? (
            <>
              <button
                onClick={() => setActiveCustMenu('home')}
                className={`flex flex-col items-center flex-1 py-1 transition ${
                  activeCustMenu === 'home' ? 'text-teal-700 font-bold' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Home className="w-4 h-4 mb-0.5" />
                <span className="text-[10px]">Home</span>
              </button>

              <button
                onClick={() => setActiveCustMenu('order')}
                className={`flex flex-col items-center flex-1 py-1 transition ${
                  activeCustMenu === 'order' ? 'text-teal-700 font-bold' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <ShoppingCart className="w-4 h-4 mb-0.5" />
                <span className="text-[10px]">Order</span>
              </button>

              <button
                onClick={() => setActiveCustMenu('products')}
                className={`flex flex-col items-center flex-1 py-1 transition ${
                  activeCustMenu === 'products' ? 'text-teal-700 font-bold' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Boxes className="w-4 h-4 mb-0.5" />
                <span className="text-[10px]">Produk</span>
              </button>

              <button
                onClick={() => setActiveCustMenu('profile')}
                className={`flex flex-col items-center flex-1 py-1 transition ${
                  activeCustMenu === 'profile' ? 'text-teal-700 font-bold' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <UserIcon className="w-4 h-4 mb-0.5" />
                <span className="text-[10px]">Profil</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setActiveAdminMenu('dashboard')}
                className={`flex flex-col items-center flex-1 py-1 transition ${
                  activeAdminMenu === 'dashboard' ? 'text-teal-700 font-bold' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <PieChart className="w-4 h-4 mb-0.5" />
                <span className="text-[10px]">Laporan</span>
              </button>

              <button
                onClick={() => setActiveAdminMenu('transaksi')}
                className={`flex flex-col items-center flex-1 py-1 transition ${
                  activeAdminMenu === 'transaksi' ? 'text-teal-700 font-bold' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Receipt className="w-4 h-4 mb-0.5" />
                <span className="text-[10px]">Transaksi</span>
              </button>

              <button
                onClick={() => setActiveAdminMenu('customer')}
                className={`flex flex-col items-center flex-1 py-1 transition ${
                  activeAdminMenu === 'customer' ? 'text-teal-700 font-bold' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Users className="w-4 h-4 mb-0.5" />
                <span className="text-[10px]">Customer</span>
              </button>

              <button
                onClick={() => setActiveAdminMenu('produk')}
                className={`flex flex-col items-center flex-1 py-1 transition ${
                  activeAdminMenu === 'produk' ? 'text-teal-700 font-bold' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Boxes className="w-4 h-4 mb-0.5" />
                <span className="text-[10px]">Produk</span>
              </button>

              <button
                onClick={() => setActiveAdminMenu('toko')}
                className={`flex flex-col items-center flex-1 py-1 transition ${
                  activeAdminMenu === 'toko' ? 'text-teal-700 font-bold' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Store className="w-4 h-4 mb-0.5" />
                <span className="text-[10px]">Toko</span>
              </button>
            </>
          )}
        </nav>

        {/* Modal Detail Pesanan Customer */}
        <OrderDetailModal
          order={selectedOrderForDetail}
          storeData={appData.storeData}
          onClose={() => setSelectedOrderForDetail(null)}
        />

        {/* Modal Product Quick Detail */}
        {selectedProductForDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-slate-100 p-5 space-y-3 animate-in zoom-in-95">
              <img
                src={selectedProductForDetail.Thumbnail}
                alt={selectedProductForDetail.Nama}
                className="w-full h-44 object-cover rounded-2xl"
                referrerPolicy="no-referrer"
              />
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                  {selectedProductForDetail.Kategori}
                </span>
                <h3 className="font-bold text-sm text-slate-800 mt-1">
                  {selectedProductForDetail.Nama}
                </h3>
                <div className="font-extrabold text-base text-teal-700 mt-0.5">
                  {formatRp(selectedProductForDetail.Harga)}
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {selectedProductForDetail.Deskripsi}
              </p>

              <div className="pt-2 flex gap-2">
                <button
                  onClick={() => {
                    const prod = selectedProductForDetail;
                    setSelectedProductForDetail(null);
                    setActiveCustMenu('order');
                    setOrderItems([
                      {
                        id: 'item_' + Date.now(),
                        productId: prod.ID,
                        qty: 1,
                        panjang: 200,
                        lebar: 100,
                        finishing: 'Simkel',
                        withDesain: false,
                        withCutting: false,
                        withLaminating: false
                      }
                    ]);
                  }}
                  className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-xs transition"
                >
                  Pesan Produk Ini
                </button>
                <button
                  onClick={() => setSelectedProductForDetail(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl text-xs transition"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Tambah/Edit Produk Admin */}
        <AdminAddProductModal
          isOpen={showAddProductModal}
          onClose={() => {
            setShowAddProductModal(false);
            setProductToEdit(null);
          }}
          onSave={handleSaveProduct}
          initialProduct={productToEdit}
        />

        {/* Modal Order Baru Admin (Pilih Customer / Tambah Customer Baru) */}
        <AdminNewOrderModal
          isOpen={showAdminNewOrderModal}
          onClose={() => setShowAdminNewOrderModal(false)}
          onSaveOrder={handleSaveAdminOrder}
          customers={appData.users.filter((u) => u.Role === 'customer')}
          products={appData.products}
        />

        {/* Modal Catat Pengeluaran Admin */}
        <AdminExpenseModal
          isOpen={showAdminExpenseModal}
          onClose={() => setShowAdminExpenseModal(false)}
          onSaveExpense={handleSaveExpense}
        />

        {/* Modal Lihat Kode GAS */}
        <GasCodeModal
          isOpen={showGasModal}
          onClose={() => setShowGasModal(false)}
        />

        {/* Modal Portal Login & Pendaftaran Akun (Pilihan Customer atau Admin) */}
        <LoginPortalModal
          isOpen={showLoginPortal}
          onClose={() => setShowLoginPortal(false)}
          canClose={true}
          storeData={appData.storeData}
          existingUsers={appData.users}
          onLoginSuccess={handleAuthLoginSuccess}
          initialRole={portalInitialRole}
        />
      </div>
    </div>
  );
}
