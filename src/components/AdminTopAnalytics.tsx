import React, { useState, useMemo } from 'react';
import {
  Trophy,
  Users,
  Package,
  TrendingUp,
  Award,
  Crown,
  Sparkles,
  ShoppingBag,
  DollarSign,
  ChevronRight
} from 'lucide-react';
import { Order, Product, User } from '../types';

interface AdminTopAnalyticsProps {
  orders: Order[];
  allOrders: Order[];
  products: Product[];
  users: User[];
  hasDateFilter: boolean;
  filterStartDate?: string;
  filterEndDate?: string;
}

export const AdminTopAnalytics: React.FC<AdminTopAnalyticsProps> = ({
  orders,
  allOrders,
  products,
  users,
  hasDateFilter,
  filterStartDate,
  filterEndDate
}) => {
  // Toggle scope: 'filtered' (sesuai filter tanggal jika ada) vs 'all' (semua waktu)
  const [scope, setScope] = useState<'filtered' | 'all'>('filtered');
  const [activeTab, setActiveTab] = useState<'products' | 'custOrders' | 'custSpent'>('products');

  const effectiveOrders = (hasDateFilter && scope === 'filtered') ? orders : allOrders;

  // Format Rupiah
  const formatRp = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num);
  };

  // 1. TOP 5 PRODUK UNGGULAN PALING BANYAK DIPESAN
  const topProducts = useMemo(() => {
    const productStats: Record<
      string,
      {
        id: string;
        nama: string;
        kategori: string;
        totalQty: number;
        totalRevenue: number;
        orderCount: number;
      }
    > = {};

    // Inisialisasi dari katalog produk toko
    products.forEach((p) => {
      productStats[p.ID] = {
        id: p.ID,
        nama: p.Nama,
        kategori: p.Kategori || 'satuan',
        totalQty: 0,
        totalRevenue: 0,
        orderCount: 0
      };
    });

    // Hitung kemunculan dari pesanan
    effectiveOrders.forEach((ord) => {
      if (ord.Items && Array.isArray(ord.Items) && ord.Items.length > 0) {
        ord.Items.forEach((it) => {
          const key = it.productId || it.namaProduk || 'UNKNOWN';
          if (!productStats[key]) {
            productStats[key] = {
              id: key,
              nama: it.namaProduk,
              kategori: it.kategori || 'satuan',
              totalQty: 0,
              totalRevenue: 0,
              orderCount: 0
            };
          }
          productStats[key].totalQty += Number(it.qty || 1);
          productStats[key].totalRevenue += Number(it.subtotal || (it.harga * (it.qty || 1)));
          productStats[key].orderCount += 1;
        });
      } else {
        const key = ord.IDProduk || ord.NamaProduk || 'UNKNOWN';
        if (!productStats[key]) {
          productStats[key] = {
            id: key,
            nama: ord.NamaProduk,
            kategori: ord.Kategori || 'satuan',
            totalQty: 0,
            totalRevenue: 0,
            orderCount: 0
          };
        }
        productStats[key].totalQty += Number(ord.Qty || 1);
        productStats[key].totalRevenue += Number(ord.TotalHarga || 0);
        productStats[key].orderCount += 1;
      }
    });

    // Urutkan berdasarkan totalQty descending, fallback ke totalRevenue
    const list = Object.values(productStats);
    list.sort((a, b) => {
      if (b.totalQty !== a.totalQty) {
        return b.totalQty - a.totalQty;
      }
      return b.totalRevenue - a.totalRevenue;
    });

    return list.slice(0, 5);
  }, [effectiveOrders, products]);

  // 2 & 3. DATA AGREGASI CUSTOMER (ORDER COUNT & TOTAL SPENT)
  const { topCustomerByOrders, topCustomerBySpent } = useMemo(() => {
    const custMap: Record<
      string,
      {
        key: string;
        nama: string;
        kode: string;
        noWA: string;
        totalOrders: number;
        totalSpent: number;
        lastOrderDate: string;
      }
    > = {};

    effectiveOrders.forEach((ord) => {
      const cleanPhone = String(ord.NoCustomer || '').replace(/[^0-9]/g, '');
      const custKey = ord.KodeCustomer && ord.KodeCustomer !== '-'
        ? `KODE_${ord.KodeCustomer}`
        : cleanPhone ? `WA_${cleanPhone}` : `NAME_${ord.NamaCustomer.toLowerCase()}`;

      if (!custMap[custKey]) {
        // Cari di daftar users untuk detail lebih lengkap
        const userMatch = users.find(
          (u) =>
            (ord.KodeCustomer && u.KodeKhusus === ord.KodeCustomer) ||
            (cleanPhone && u.NoWA && u.NoWA.replace(/[^0-9]/g, '') === cleanPhone)
        );

        custMap[custKey] = {
          key: custKey,
          nama: userMatch?.Nama || ord.NamaCustomer || 'Customer',
          kode: userMatch?.KodeKhusus || ord.KodeCustomer || '-',
          noWA: userMatch?.NoWA || ord.NoCustomer || '-',
          totalOrders: 0,
          totalSpent: 0,
          lastOrderDate: ord.Tgl
        };
      }

      custMap[custKey].totalOrders += 1;
      custMap[custKey].totalSpent += Number(ord.TotalHarga || 0);

      if (new Date(ord.Tgl) > new Date(custMap[custKey].lastOrderDate)) {
        custMap[custKey].lastOrderDate = ord.Tgl;
      }
    });

    const custList = Object.values(custMap);

    // Top Customer berdasarkan Frekuensi Order terbanyak
    const byOrders = [...custList].sort((a, b) => {
      if (b.totalOrders !== a.totalOrders) {
        return b.totalOrders - a.totalOrders;
      }
      return b.totalSpent - a.totalSpent;
    }).slice(0, 5);

    // Top Customer berdasarkan Total Nominal Pembelian terbanyak
    const bySpent = [...custList].sort((a, b) => {
      if (b.totalSpent !== a.totalSpent) {
        return b.totalSpent - a.totalSpent;
      }
      return b.totalOrders - a.totalOrders;
    }).slice(0, 5);

    return {
      topCustomerByOrders: byOrders,
      topCustomerBySpent: bySpent
    };
  }, [effectiveOrders, users]);

  // Helper badge peringkat juara 1, 2, 3
  const renderRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-white font-black text-xs flex items-center justify-center shadow-md shadow-amber-500/30 shrink-0">
            <Crown className="w-4 h-4 fill-white" />
          </div>
        );
      case 2:
        return (
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-slate-400 to-slate-200 text-slate-800 font-black text-xs flex items-center justify-center shadow-sm shrink-0">
            2
          </div>
        );
      case 3:
        return (
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-amber-700 to-amber-600 text-amber-100 font-black text-xs flex items-center justify-center shadow-sm shrink-0">
            3
          </div>
        );
      default:
        return (
          <div className="w-7 h-7 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center border border-slate-200 shrink-0">
            {rank}
          </div>
        );
    }
  };

  return (
    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
      {/* Header & Filter Scope */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-100 text-amber-700 rounded-xl">
              <Trophy className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-sm text-slate-900 tracking-tight">
              Peringkat & Analisis Unggulan Toko
            </h3>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            5 Produk paling laris & 5 Customer terbaik berdasarkan frekuensi serta omset
          </p>
        </div>

        {/* Toggle Range Scope */}
        {hasDateFilter && (
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-[11px] font-bold self-start sm:self-center">
            <button
              type="button"
              onClick={() => setScope('filtered')}
              className={`px-2.5 py-1 rounded-lg transition ${
                scope === 'filtered'
                  ? 'bg-white text-teal-800 shadow-2xs font-extrabold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Rentang Filter
            </button>
            <button
              type="button"
              onClick={() => setScope('all')}
              className={`px-2.5 py-1 rounded-lg transition ${
                scope === 'all'
                  ? 'bg-white text-teal-800 shadow-2xs font-extrabold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Semua Waktu
            </button>
          </div>
        )}
      </div>

      {/* Sub Tabs Pemilihan Tampilan */}
      <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100/90 rounded-xl text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className={`py-2 px-1 rounded-lg transition flex items-center justify-center gap-1.5 ${
            activeTab === 'products'
              ? 'bg-white text-teal-900 shadow-2xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package className="w-3.5 h-3.5 text-teal-600" />
          <span className="truncate">5 Produk Unggulan</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('custOrders')}
          className={`py-2 px-1 rounded-lg transition flex items-center justify-center gap-1.5 ${
            activeTab === 'custOrders'
              ? 'bg-white text-teal-900 shadow-2xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-teal-600" />
          <span className="truncate">5 Customer Terbanyak</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('custSpent')}
          className={`py-2 px-1 rounded-lg transition flex items-center justify-center gap-1.5 ${
            activeTab === 'custSpent'
              ? 'bg-white text-teal-900 shadow-2xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5 text-teal-600" />
          <span className="truncate">5 Customer Omset Tertinggi</span>
        </button>
      </div>

      {/* 1. KONTEN TAB: 5 PRODUK UNGGULAN */}
      {activeTab === 'products' && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span className="font-bold text-slate-700">Top 5 Produk Paling Banyak Dipesan</span>
            <span>Total Transaksi: {effectiveOrders.length}</span>
          </div>

          {topProducts.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              Belum ada riwayat pesanan produk pada rentang ini.
            </div>
          ) : (
            topProducts.map((p, idx) => (
              <div
                key={p.id || idx}
                className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 ${
                  idx === 0
                    ? 'bg-gradient-to-r from-amber-50/70 to-yellow-50/40 border-amber-200 shadow-2xs'
                    : 'bg-white border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {renderRankBadge(idx + 1)}

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-extrabold text-xs text-slate-900 truncate">
                        {p.nama}
                      </h4>
                      <span className="text-[9px] uppercase px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded font-bold">
                        {p.kategori}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                      <span>Muncul di <strong>{p.orderCount}</strong> pesanan</span>
                      <span>•</span>
                      <span>Omset: <strong className="text-teal-700">{formatRp(p.totalRevenue)}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-black text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-xl inline-block shadow-2xs">
                    {p.totalQty} {p.kategori === 'meteran' ? 'm² / item' : 'pcs'}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Total Dipesan</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 2. KONTEN TAB: 5 CUSTOMER PALING BANYAK PESAN */}
      {activeTab === 'custOrders' && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span className="font-bold text-slate-700">Top 5 Customer dengan Frekuensi Order Terbanyak</span>
            <span className="text-teal-700 font-semibold">Pelanggan Paling Loyal</span>
          </div>

          {topCustomerByOrders.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              Belum ada riwayat pesanan customer pada rentang ini.
            </div>
          ) : (
            topCustomerByOrders.map((cust, idx) => (
              <div
                key={cust.key || idx}
                className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 ${
                  idx === 0
                    ? 'bg-gradient-to-r from-teal-50/80 to-emerald-50/40 border-teal-200 shadow-2xs'
                    : 'bg-white border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {renderRankBadge(idx + 1)}

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-extrabold text-xs text-slate-900 truncate">
                        {cust.nama}
                      </h4>
                      {cust.kode && cust.kode !== '-' && (
                        <span className="text-[10px] font-mono text-teal-700 bg-teal-100/60 px-1.5 py-0.2 rounded font-bold">
                          {cust.kode}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                      <span>WA: {cust.noWA}</span>
                      <span>•</span>
                      <span>Total Belanja: <strong className="text-teal-700">{formatRp(cust.totalSpent)}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-black text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-xl inline-block shadow-2xs">
                    {cust.totalOrders}x Order
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Frekuensi</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 3. KONTEN TAB: 5 CUSTOMER TOTAL NOMINAL PEMBELIAN PALING BANYAK */}
      {activeTab === 'custSpent' && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span className="font-bold text-slate-700">Top 5 Customer dengan Total Nominal Pembelian Terbesar</span>
            <span className="text-amber-700 font-semibold">VIP / Top Contributor</span>
          </div>

          {topCustomerBySpent.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              Belum ada riwayat nominal belanja customer pada rentang ini.
            </div>
          ) : (
            topCustomerBySpent.map((cust, idx) => (
              <div
                key={cust.key || idx}
                className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 ${
                  idx === 0
                    ? 'bg-gradient-to-r from-emerald-50/80 to-teal-50/40 border-emerald-200 shadow-2xs'
                    : 'bg-white border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {renderRankBadge(idx + 1)}

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-extrabold text-xs text-slate-900 truncate">
                        {cust.nama}
                      </h4>
                      {cust.kode && cust.kode !== '-' && (
                        <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100/60 px-1.5 py-0.2 rounded font-bold">
                          {cust.kode}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                      <span>WA: {cust.noWA}</span>
                      <span>•</span>
                      <span>{cust.totalOrders} Transaksi Selesai</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-black text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl inline-block shadow-2xs">
                    {formatRp(cust.totalSpent)}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Total Omset</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
