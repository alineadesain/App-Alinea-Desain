import React, { useState, useMemo } from 'react';
import { User, Product, Order, OrderItem } from '../types';
import {
  X,
  Plus,
  Minus,
  Trash2,
  Search,
  ShoppingCart,
  UserCheck,
  UserPlus,
  Layers,
  Sparkles,
  Calculator,
  RefreshCw,
  CreditCard,
  DollarSign
} from 'lucide-react';

interface AdminNewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveOrder: (order: Order, newCustomer?: User) => void;
  customers: User[];
  products: Product[];
}

interface AdminOrderItemState {
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

export const AdminNewOrderModal: React.FC<AdminNewOrderModalProps> = ({
  isOpen,
  onClose,
  onSaveOrder,
  customers,
  products
}) => {
  if (!isOpen) return null;

  // Customer Mode: 'existing' | 'new'
  const [customerMode, setCustomerMode] = useState<'existing' | 'new'>('existing');

  // Existing Customer Search & Selection
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.ID || '');

  // New Customer Form State
  const [newCustNama, setNewCustNama] = useState('');
  const [newCustNoWA, setNewCustNoWA] = useState('');
  const [newCustAlamat, setNewCustAlamat] = useState('');
  const [newCustKode, setNewCustKode] = useState(() =>
    Math.floor(10000000 + Math.random() * 90000000).toString()
  );
  const [newCustPassword, setNewCustPassword] = useState('cust123');

  // Multi-Product Order Items State
  const [items, setItems] = useState<AdminOrderItemState[]>([
    {
      id: 'admin_item_' + Date.now(),
      productId: products[0]?.ID || 'P1',
      qty: 1,
      panjang: 0,
      lebar: 0,
      finishing: 'Simkel',
      withDesain: false,
      withCutting: false,
      withLaminating: false
    }
  ]);

  // Status, DP & Notes
  const [statusBayar, setStatusBayar] = useState<Order['StatusBayar']>('Belum Lunas');
  const [nominalDP, setNominalDP] = useState<number | ''>('');
  const [statusOrder, setStatusOrder] = useState<Order['StatusOrder']>('Order Masuk');
  const [catatan, setCatatan] = useState('');

  // Filtered customer list
  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers;
    const term = customerSearch.toLowerCase();
    return customers.filter(
      (c) =>
        String(c.Nama || '').toLowerCase().includes(term) ||
        String(c.KodeKhusus || '').toLowerCase().includes(term) ||
        String(c.NoWA || '').includes(term)
    );
  }, [customers, customerSearch]);

  const selectedCustomer = customers.find((c) => c.ID === selectedCustomerId) || customers[0];

  const formatRp = (num: number) => 'Rp ' + (num || 0).toLocaleString('id-ID');

  // Calculate individual item subtotal
  const calculateItemSubtotal = (item: AdminOrderItemState) => {
    const prod = products.find((p) => p.ID === item.productId);
    if (!prod) return 0;

    let base = 0;
    if (prod.Kategori === 'meteran') {
      const p = item.panjang || 0;
      const l = item.lebar || 0;
      if (p <= 0 || l <= 0) {
        base = 0;
      } else {
        const luasM2 = Math.max(1, (p / 100) * (l / 100));
        base = prod.Harga * luasM2 * (item.qty || 1);
      }
    } else {
      base = prod.Harga * (item.qty || 1);
    }

    const dsn = item.withDesain ? (prod.HargaDesain !== undefined ? Number(prod.HargaDesain) : 15000) : 0;
    const cut = item.withCutting ? (prod.HargaCutting !== undefined ? Number(prod.HargaCutting) : 0) * (item.qty || 1) : 0;
    const lam = item.withLaminating ? (prod.HargaLaminating !== undefined ? Number(prod.HargaLaminating) : 0) * (item.qty || 1) : 0;

    return Math.round(base + dsn + cut + lam);
  };

  const grandTotal = items.reduce((sum, item) => sum + calculateItemSubtotal(item), 0);
  const dpAmount = typeof nominalDP === 'number' ? nominalDP : 0;
  const sisaTagihan = Math.max(0, grandTotal - dpAmount);

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: 'admin_item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        productId: products[0]?.ID || 'P1',
        qty: 1,
        panjang: 0,
        lebar: 0,
        finishing: 'Simkel',
        withDesain: false,
        withCutting: false,
        withLaminating: false
      }
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) {
      alert('Order minimal harus memiliki 1 produk!');
      return;
    }
    setItems(items.filter((it) => it.id !== id));
  };

  const handleRerollKode = () => {
    setNewCustKode(Math.floor(10000000 + Math.random() * 90000000).toString());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      alert('Tambahkan minimal 1 produk pesanan!');
      return;
    }

    let customerInfo: { kode: string; nama: string; noWA: string };
    let newCustomerObj: User | undefined;

    if (customerMode === 'new') {
      if (!newCustNama.trim()) {
        alert('Nama customer baru tidak boleh kosong!');
        return;
      }
      if (!newCustNoWA.trim()) {
        alert('Nomor WhatsApp customer baru tidak boleh kosong!');
        return;
      }

      newCustomerObj = {
        ID: 'C' + Date.now(),
        Role: 'customer',
        KodeKhusus: newCustKode,
        Nama: newCustNama.trim(),
        NoWA: newCustNoWA.trim(),
        Alamat: newCustAlamat.trim() || 'Yogyakarta',
        Password: newCustPassword.trim() || 'cust123',
        TglDaftar: new Date().toISOString()
      };

      customerInfo = {
        kode: newCustomerObj.KodeKhusus,
        nama: newCustomerObj.Nama,
        noWA: newCustomerObj.NoWA
      };
    } else {
      if (!selectedCustomer) {
        alert('Pilih customer terdaftar!');
        return;
      }
      customerInfo = {
        kode: selectedCustomer.KodeKhusus,
        nama: selectedCustomer.Nama,
        noWA: selectedCustomer.NoWA
      };
    }

    const orderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);

    // Build OrderItem array
    const orderItemsBuilt: OrderItem[] = items.map((it) => {
      const prod = products.find((p) => p.ID === it.productId) || products[0];
      const isMet = prod.Kategori === 'meteran';
      return {
        id: it.id,
        productId: prod.ID,
        namaProduk: prod.Nama,
        kategori: prod.Kategori,
        harga: prod.Harga,
        qty: it.qty,
        panjang: isMet ? it.panjang : 0,
        lebar: isMet ? it.lebar : 0,
        finishing: isMet ? it.finishing : '-',
        withDesain: it.withDesain,
        withCutting: it.withCutting,
        withLaminating: it.withLaminating,
        jasaDesain: it.withDesain ? (prod.HargaDesain !== undefined ? Number(prod.HargaDesain) : 15000) : 0,
        jasaCutting: it.withCutting ? (prod.HargaCutting !== undefined ? Number(prod.HargaCutting) : 0) * it.qty : 0,
        jasaLaminating: it.withLaminating ? (prod.HargaLaminating !== undefined ? Number(prod.HargaLaminating) : 0) * it.qty : 0,
        subtotal: calculateItemSubtotal(it)
      };
    });

    // Determine representative single fields for backward compatibility
    const firstItem = orderItemsBuilt[0];
    const totalQty = orderItemsBuilt.reduce((acc, it) => acc + it.qty, 0);

    let summaryNamaProduk = firstItem.namaProduk;
    if (orderItemsBuilt.length > 1) {
      summaryNamaProduk = orderItemsBuilt
        .map((it) => `${it.namaProduk} (${it.qty}x)`)
        .join(' + ');
    }

    // Auto update status bayar if DP is filled
    let finalStatusBayar = statusBayar;
    if (dpAmount > 0 && dpAmount < grandTotal) {
      finalStatusBayar = 'DP';
    } else if (dpAmount >= grandTotal && grandTotal > 0) {
      finalStatusBayar = 'Lunas';
    }

    const newOrder: Order = {
      ID: orderId,
      Tgl: new Date().toISOString(),
      KodeCustomer: customerInfo.kode,
      NamaCustomer: customerInfo.nama,
      NoCustomer: customerInfo.noWA,
      IDProduk: firstItem.productId,
      NamaProduk: summaryNamaProduk,
      Kategori: firstItem.kategori,
      Qty: totalQty,
      Panjang: firstItem.panjang || 0,
      Lebar: firstItem.lebar || 0,
      Finishing: firstItem.finishing || '-',
      JasaCutting: orderItemsBuilt.reduce((s, it) => s + (it.jasaCutting || 0), 0),
      JasaLaminating: orderItemsBuilt.reduce((s, it) => s + (it.jasaLaminating || 0), 0),
      JasaDesain: orderItemsBuilt.reduce((s, it) => s + (it.jasaDesain || 0), 0),
      TotalHarga: grandTotal,
      NominalDP: dpAmount > 0 ? dpAmount : undefined,
      DP: dpAmount,
      SisaTagihan: sisaTagihan,
      StatusBayar: finalStatusBayar,
      StatusOrder: statusOrder,
      Catatan: catatan.trim() || undefined,
      Items: orderItemsBuilt
    };

    onSaveOrder(newOrder, newCustomerObj);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="p-4 bg-gradient-to-r from-teal-700 to-teal-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 text-teal-200" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Input Order Baru (Multi-Produk)</h3>
              <p className="text-[10px] text-teal-200">
                Catat pesanan cetak & multi-item dengan uang muka (DP)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-4 text-xs">
          {/* 1. CUSTOMER SELECTION SECTION */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-teal-600" />
                Data Pemesan / Customer
              </span>
              <div className="flex bg-slate-200/80 p-0.5 rounded-lg text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setCustomerMode('existing')}
                  className={`px-2.5 py-1 rounded-md transition ${
                    customerMode === 'existing'
                      ? 'bg-white text-teal-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Customer Terdaftar
                </button>
                <button
                  type="button"
                  onClick={() => setCustomerMode('new')}
                  className={`px-2.5 py-1 rounded-md transition flex items-center gap-1 ${
                    customerMode === 'new'
                      ? 'bg-white text-teal-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <UserPlus className="w-3 h-3" />
                  + Baru
                </button>
              </div>
            </div>

            {/* Mode: Existing Customer */}
            {customerMode === 'existing' && (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    placeholder="Cari nama / kode customer..."
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                >
                  {filteredCustomers.map((c, idx) => (
                    <option key={`${c.ID || 'c'}-${idx}`} value={c.ID}>
                      {c.Nama} ({c.KodeKhusus}) - WA: {c.NoWA}
                    </option>
                  ))}
                </select>

                {selectedCustomer && (
                  <div className="text-[11px] text-slate-500 bg-white p-2 rounded-lg border border-slate-200/60 flex justify-between">
                    <span>
                      Alamat: <strong>{selectedCustomer.Alamat}</strong>
                    </span>
                    <span className="text-teal-700 font-mono font-bold">
                      {selectedCustomer.KodeKhusus}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Mode: New Customer Creation */}
            {customerMode === 'new' && (
              <div className="space-y-2 pt-1">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                      Nama Lengkap *
                    </label>
                    <input
                      type="text"
                      value={newCustNama}
                      onChange={(e) => setNewCustNama(e.target.value)}
                      placeholder="Contoh: Bu Ratna Catering"
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                      required={customerMode === 'new'}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                      No. WhatsApp *
                    </label>
                    <input
                      type="tel"
                      value={newCustNoWA}
                      onChange={(e) => setNewCustNoWA(e.target.value)}
                      placeholder="0812xxxxxxxx"
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                      required={customerMode === 'new'}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                    Alamat Lengkap
                  </label>
                  <input
                    type="text"
                    value={newCustAlamat}
                    onChange={(e) => setNewCustAlamat(e.target.value)}
                    placeholder="Contoh: Jl. Kaliurang Km 5, Sleman"
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="text-[10px] font-bold text-slate-600">Kode Khusus</label>
                      <button
                        type="button"
                        onClick={handleRerollKode}
                        className="text-[10px] text-teal-600 hover:text-teal-800 flex items-center gap-0.5"
                      >
                        <RefreshCw className="w-2.5 h-2.5" /> Acak
                      </button>
                    </div>
                    <input
                      type="text"
                      value={newCustKode}
                      onChange={(e) => setNewCustKode(e.target.value)}
                      className="w-full p-1.5 bg-white border border-slate-200 rounded-lg font-mono font-bold text-teal-700 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                      Password Login
                    </label>
                    <input
                      type="text"
                      value={newCustPassword}
                      onChange={(e) => setNewCustPassword(e.target.value)}
                      className="w-full p-1.5 bg-white border border-slate-200 rounded-lg font-mono text-xs"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. MULTI-PRODUCT ITEMS LIST */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-teal-600" />
                Daftar Produk Pesanan ({items.length} Item)
              </span>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2.5 py-1 rounded-lg flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Produk Lain</span>
              </button>
            </div>

            {/* Render Each Product Item */}
            {items.map((item, idx) => {
              const currentProd = products.find((p) => p.ID === item.productId) || products[0];
              const isMet = currentProd?.Kategori === 'meteran';
              const subtotal = calculateItemSubtotal(item);

              return (
                <div
                  key={item.id}
                  className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2.5 relative"
                >
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                    <span className="font-bold text-teal-800 text-xs flex items-center gap-1">
                      <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px]">
                        {idx + 1}
                      </span>
                      <span>Item #{idx + 1}</span>
                    </span>

                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1 rounded-lg transition"
                        title="Hapus item ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Product Selector */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                      Pilih Produk Cetak
                    </label>
                    <select
                      value={item.productId}
                      onChange={(e) => {
                        const newProdId = e.target.value;
                        setItems(
                          items.map((it) =>
                            it.id === item.id ? { ...it, productId: newProdId } : it
                          )
                        );
                      }}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                    >
                      {products.map((p, idx) => (
                        <option key={`${p.ID || 'p'}-${idx}`} value={p.ID}>
                          {p.Nama} ({p.Kategori === 'meteran' ? 'Meteran' : 'Satuan'}) - {formatRp(p.Harga)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Meteran Dimensions (Panjang & Lebar) */}
                  {isMet && (
                    <div className="grid grid-cols-3 gap-2 bg-white p-2.5 rounded-xl border border-slate-200/70">
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                          Panjang (cm)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={item.panjang}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : Number(e.target.value);
                            setItems(
                              items.map((it) =>
                                it.id === item.id ? { ...it, panjang: val } : it
                              )
                            );
                          }}
                          placeholder="0"
                          className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-center"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                          Lebar (cm)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={item.lebar}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : Number(e.target.value);
                            setItems(
                              items.map((it) =>
                                it.id === item.id ? { ...it, lebar: val } : it
                              )
                            );
                          }}
                          placeholder="0"
                          className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-center"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                          Finishing MMT
                        </label>
                        <select
                          value={item.finishing}
                          onChange={(e) => {
                            const val = e.target.value;
                            setItems(
                              items.map((it) =>
                                it.id === item.id ? { ...it, finishing: val } : it
                              )
                            );
                          }}
                          className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                        >
                          <option value="Simkel">Simkel (Mata ayam)</option>
                          <option value="Siming">Siming (4 pojok)</option>
                          <option value="Kolong">Kolong (Bambu)</option>
                          <option value="Sibah">Sibah (Lipat rapi)</option>
                          <option value="-">Tanpa Finishing</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Quantity & Add-on Checkboxes */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                        Jumlah (Qty)
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setItems(
                              items.map((it) =>
                                it.id === item.id ? { ...it, qty: Math.max(1, it.qty - 1) } : it
                              )
                            );
                          }}
                          className="w-7 h-7 rounded bg-white border border-slate-200 flex items-center justify-center font-bold"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-extrabold w-8 text-center">{item.qty}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setItems(
                              items.map((it) =>
                                it.id === item.id ? { ...it, qty: it.qty + 1 } : it
                              )
                            );
                          }}
                          className="w-7 h-7 rounded bg-white border border-slate-200 flex items-center justify-center font-bold"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Services toggles */}
                    <div className="bg-white p-2 rounded-xl border border-slate-200/70 space-y-1.5">
                      <label className="flex items-center justify-between text-[11px] cursor-pointer">
                        <div>
                          <span className="text-slate-700 font-medium block">Desain Setting</span>
                          <span className="text-[9px] text-slate-400">+{formatRp(currentProd?.HargaDesain || 15000)}</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={item.withDesain}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setItems(
                              items.map((it) =>
                                it.id === item.id ? { ...it, withDesain: checked } : it
                              )
                            );
                          }}
                          className="rounded text-teal-600"
                        />
                      </label>

                      <label className="flex items-center justify-between text-[11px] cursor-pointer">
                        <div>
                          <span className="text-slate-700 font-medium block">Cutting Presisi</span>
                          <span className="text-[9px] text-slate-400">+{formatRp((currentProd?.HargaCutting || 0) * (item.qty || 1))}</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={item.withCutting}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setItems(
                              items.map((it) =>
                                it.id === item.id ? { ...it, withCutting: checked } : it
                              )
                            );
                          }}
                          className="rounded text-teal-600"
                        />
                      </label>

                      <label className="flex items-center justify-between text-[11px] cursor-pointer">
                        <div>
                          <span className="text-slate-700 font-medium block">Laminating</span>
                          <span className="text-[9px] text-slate-400">+{formatRp((currentProd?.HargaLaminating || 0) * (item.qty || 1))}</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={item.withLaminating}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setItems(
                              items.map((it) =>
                                it.id === item.id ? { ...it, withLaminating: checked } : it
                              )
                            );
                          }}
                          className="rounded text-teal-600"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Subtotal of item */}
                  <div className="flex justify-between items-center pt-1.5 border-t border-slate-200 text-xs">
                    <span className="text-slate-500 font-medium">Subtotal Item #{idx + 1}:</span>
                    <span className="font-extrabold text-teal-700">{formatRp(subtotal)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 3. STATUS ORDER, PEMBAYARAN & NOMINAL DP */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-3">
            <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-teal-600" />
              Status & Pembayaran (DP)
            </span>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                  Status Order
                </label>
                <select
                  value={statusOrder}
                  onChange={(e) => setStatusOrder(e.target.value as Order['StatusOrder'])}
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                >
                  <option value="Order Masuk">Order Masuk</option>
                  <option value="Proses">Proses Pengerjaan</option>
                  <option value="Selesai">Selesai</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                  Status Bayar
                </label>
                <select
                  value={statusBayar}
                  onChange={(e) => setStatusBayar(e.target.value as Order['StatusBayar'])}
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                >
                  <option value="Belum Lunas">Belum Lunas</option>
                  <option value="DP">DP (Uang Muka)</option>
                  <option value="Lunas">Lunas</option>
                </select>
              </div>
            </div>

            {/* Input Nominal DP */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-teal-600" />
                  <span>Nominal DP / Pembayaran Masuk (Rp)</span>
                </label>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      const half = Math.round(grandTotal / 2);
                      setNominalDP(half);
                      setStatusBayar('DP');
                    }}
                    className="text-[10px] font-bold px-2 py-0.5 bg-teal-50 text-teal-700 border border-teal-200 rounded hover:bg-teal-100"
                  >
                    50% DP
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNominalDP(grandTotal);
                      setStatusBayar('Lunas');
                    }}
                    className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded hover:bg-emerald-100"
                  >
                    Lunas (100%)
                  </button>
                </div>
              </div>

              <input
                type="number"
                min="0"
                step="1000"
                value={nominalDP}
                onChange={(e) => {
                  const val = e.target.value === '' ? '' : Number(e.target.value);
                  setNominalDP(val);
                  if (typeof val === 'number') {
                    if (val > 0 && val < grandTotal) setStatusBayar('DP');
                    else if (val >= grandTotal && grandTotal > 0) setStatusBayar('Lunas');
                    else if (val === 0) setStatusBayar('Belum Lunas');
                  }
                }}
                placeholder="Contoh: 50000 (kosongkan bila belum ada DP)"
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-teal-800"
              />
            </div>

            {/* Catatan Tambahan */}
            <div>
              <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                Catatan Khusus Pesanan
              </label>
              <textarea
                rows={2}
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Contoh: Desain dari customer via WA, font warna kuning..."
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* 4. TOTAL RECAP & BREAKDOWN */}
          <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-600">
              <span>Total Tagihan ({items.length} Item):</span>
              <span className="font-extrabold text-sm text-teal-900">{formatRp(grandTotal)}</span>
            </div>

            {dpAmount > 0 && (
              <>
                <div className="flex justify-between items-center text-teal-700 font-semibold">
                  <span>Nominal DP Masuk:</span>
                  <span>- {formatRp(dpAmount)}</span>
                </div>
                <div className="flex justify-between items-center pt-1.5 border-t border-teal-200 text-rose-700 font-bold">
                  <span>Sisa Tagihan yang Belum Dibayar:</span>
                  <span className="font-extrabold text-sm">{formatRp(sisaTagihan)}</span>
                </div>
              </>
            )}

            <button
              type="submit"
              className="w-full mt-2 bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl shadow-md shadow-teal-600/20 transition flex items-center justify-center gap-2 active:scale-95 text-xs"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Simpan Pesanan ({items.length} Produk)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
