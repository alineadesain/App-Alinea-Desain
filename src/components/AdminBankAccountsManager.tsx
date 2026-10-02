import React, { useState } from 'react';
import {
  CreditCard,
  Plus,
  Trash2,
  Edit2,
  Check,
  Star,
  Copy,
  Building2,
  Wallet,
  X,
  ShieldCheck
} from 'lucide-react';
import { BankAccount, StoreData } from '../types';

interface AdminBankAccountsManagerProps {
  storeData: StoreData;
  onUpdateStoreDataPartial: (partial: Partial<StoreData>) => void;
  showToast: (msg: string) => void;
}

const POPULAR_BANKS = [
  { name: 'BCA', type: 'bank' },
  { name: 'Mandiri', type: 'bank' },
  { name: 'BRI', type: 'bank' },
  { name: 'BNI', type: 'bank' },
  { name: 'BSI (Bank Syariah Indonesia)', type: 'bank' },
  { name: 'CIMB Niaga', type: 'bank' },
  { name: 'Permata Bank', type: 'bank' },
  { name: 'Bank Danamon', type: 'bank' },
  { name: 'Bank Jago', type: 'bank' },
  { name: 'SeaBank', type: 'bank' },
  { name: 'DANA', type: 'ewallet' },
  { name: 'OVO', type: 'ewallet' },
  { name: 'GoPay', type: 'ewallet' },
  { name: 'ShopeePay', type: 'ewallet' },
  { name: 'QRIS All Payment', type: 'ewallet' },
  { name: 'Lainnya / Bank Lain', type: 'other' }
];

export const AdminBankAccountsManager: React.FC<AdminBankAccountsManagerProps> = ({
  storeData,
  onUpdateStoreDataPartial,
  showToast
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [bankSelect, setBankSelect] = useState('BCA');
  const [customBankName, setCustomBankName] = useState('');
  const [nomorRekening, setNomorRekening] = useState('');
  const [atasNama, setAtasNama] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Normalize accounts from storeData
  const accounts: BankAccount[] = (Array.isArray(storeData.bank_accounts) && storeData.bank_accounts.length > 0)
    ? storeData.bank_accounts
    : [
        {
          id: 'bank-default',
          bank: 'CIMB Niaga',
          nomor: '763568966600',
          atasNama: 'Muhammad Rosyid Ridlo',
          isPrimary: true
        }
      ];

  // Helper untuk generate string rekening gabungan agar kompatibel dengan sistem lama
  const formatCombinedRekening = (accList: BankAccount[]): string => {
    return accList
      .map((acc) => `${acc.bank} ${acc.nomor} a.n ${acc.atasNama}`)
      .join('; ');
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    setBankSelect('BCA');
    setCustomBankName('');
    setNomorRekening('');
    setAtasNama(accounts[0]?.atasNama || 'Muhammad Rosyid Ridlo');
    setIsPrimary(accounts.length === 0);
    setShowModal(true);
  };

  const handleOpenEditModal = (acc: BankAccount) => {
    setEditingId(acc.id);
    const matched = POPULAR_BANKS.find((b) => b.name.toLowerCase() === acc.bank.toLowerCase());
    if (matched && matched.name !== 'Lainnya / Bank Lain') {
      setBankSelect(matched.name);
      setCustomBankName('');
    } else {
      setBankSelect('Lainnya / Bank Lain');
      setCustomBankName(acc.bank);
    }
    setNomorRekening(acc.nomor);
    setAtasNama(acc.atasNama);
    setIsPrimary(!!acc.isPrimary);
    setShowModal(true);
  };

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();

    const finalBank = bankSelect === 'Lainnya / Bank Lain'
      ? (customBankName.trim() || 'Bank')
      : bankSelect;

    if (!finalBank || !nomorRekening.trim() || !atasNama.trim()) {
      alert('Mohon lengkapi nama bank, nomor rekening, dan atas nama pemilik.');
      return;
    }

    let updatedList: BankAccount[] = [];

    if (editingId) {
      // Edit existing
      updatedList = accounts.map((acc) => {
        if (acc.id === editingId) {
          return {
            ...acc,
            bank: finalBank,
            nomor: nomorRekening.trim(),
            atasNama: atasNama.trim(),
            isPrimary: isPrimary
          };
        }
        return isPrimary ? { ...acc, isPrimary: false } : acc;
      });
    } else {
      // Add new
      const newAcc: BankAccount = {
        id: 'bank_' + Date.now(),
        bank: finalBank,
        nomor: nomorRekening.trim(),
        atasNama: atasNama.trim(),
        isPrimary: isPrimary || accounts.length === 0
      };

      if (newAcc.isPrimary) {
        updatedList = accounts.map((a) => ({ ...a, isPrimary: false }));
        updatedList.push(newAcc);
      } else {
        updatedList = [...accounts, newAcc];
      }
    }

    // Pastikan minimal 1 rekening menjadi primary
    if (!updatedList.some((a) => a.isPrimary) && updatedList.length > 0) {
      updatedList[0].isPrimary = true;
    }

    const combinedStr = formatCombinedRekening(updatedList);

    onUpdateStoreDataPartial({
      bank_accounts: updatedList,
      rekening: combinedStr
    });

    setShowModal(false);
    showToast(editingId ? 'Rekening berhasil diperbarui!' : 'Rekening baru berhasil ditambahkan!');
  };

  const handleDeleteAccount = (accId: string, bankName: string) => {
    if (accounts.length <= 1) {
      alert('Toko harus memiliki minimal 1 nomor rekening bank untuk pembayaran.');
      return;
    }

    if (window.confirm(`Yakin ingin menghapus rekening ${bankName}?`)) {
      const remaining = accounts.filter((a) => a.id !== accId);
      if (!remaining.some((a) => a.isPrimary) && remaining.length > 0) {
        remaining[0].isPrimary = true;
      }

      const combinedStr = formatCombinedRekening(remaining);

      onUpdateStoreDataPartial({
        bank_accounts: remaining,
        rekening: combinedStr
      });

      showToast(`Rekening ${bankName} berhasil dihapus.`);
    }
  };

  const handleSetPrimary = (accId: string) => {
    const updated = accounts.map((a) => ({
      ...a,
      isPrimary: a.id === accId
    }));

    const combinedStr = formatCombinedRekening(updated);

    onUpdateStoreDataPartial({
      bank_accounts: updated,
      rekening: combinedStr
    });

    showToast('Rekening utama berhasil diubah.');
  };

  const handleCopy = (nomor: string, id: string) => {
    navigator.clipboard.writeText(nomor);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4 text-xs">
      {/* Header Pengaturan Rekening */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 pb-3">
        <div>
          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-teal-600" />
            <span>Rekening Bank & E-Wallet Toko ({accounts.length})</span>
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Dapat ditambahkan beberapa rekening (BCA, Mandiri, BRI, CIMB, DANA, dll). Muncul otomatis di nota cetak & pesan konfirmasi WA.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition shadow-xs self-start sm:self-center cursor-pointer active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah Rekening</span>
        </button>
      </div>

      {/* List Rekening Terdaftar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {accounts.map((acc) => {
          const isEWallet = ['dana', 'ovo', 'gopay', 'shopeepay', 'qris'].some((w) =>
            acc.bank.toLowerCase().includes(w)
          );

          return (
            <div
              key={acc.id}
              className={`p-3.5 rounded-2xl border transition relative flex flex-col justify-between gap-3 ${
                acc.isPrimary
                  ? 'bg-teal-50/60 border-teal-200 shadow-2xs'
                  : 'bg-slate-50/70 border-slate-200/80 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    {isEWallet ? (
                      <span className="p-1.5 bg-sky-100 text-sky-700 rounded-lg">
                        <Wallet className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="p-1.5 bg-teal-100 text-teal-700 rounded-lg">
                        <Building2 className="w-3.5 h-3.5" />
                      </span>
                    )}
                    <span className="font-extrabold text-xs text-slate-900">{acc.bank}</span>
                  </div>

                  {acc.isPrimary ? (
                    <span className="inline-flex items-center gap-1 bg-teal-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-2xs">
                      <Star className="w-2.5 h-2.5 fill-current" />
                      <span>Utama</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(acc.id)}
                      className="text-[10px] text-slate-500 hover:text-teal-700 hover:bg-teal-50 px-2 py-0.5 rounded-md font-semibold transition"
                      title="Set sebagai rekening utama"
                    >
                      Jadikan Utama
                    </button>
                  )}
                </div>

                {/* Nomor Rekening & Salin */}
                <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                      No. Rekening / No. HP
                    </span>
                    <span className="font-mono font-bold text-sm text-slate-800 tracking-wide">
                      {acc.nomor}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy(acc.nomor, acc.id)}
                    className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-teal-700 rounded-lg transition"
                    title="Salin Nomor Rekening"
                  >
                    {copiedId === acc.id ? (
                      <Check className="w-3.5 h-3.5 text-teal-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <div className="mt-2 text-[11px] text-slate-600 flex items-center justify-between">
                  <span>Atas Nama:</span>
                  <span className="font-bold text-slate-800">{acc.atasNama}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-200/50">
                <button
                  type="button"
                  onClick={() => handleOpenEditModal(acc)}
                  className="px-2.5 py-1 text-slate-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg font-bold text-[11px] flex items-center gap-1 transition"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Ubah</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteAccount(acc.id, acc.bank)}
                  className="px-2.5 py-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg font-bold text-[11px] flex items-center gap-1 transition"
                  title="Hapus Rekening"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Hapus</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Ringkas */}
      <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-100/70 text-[11px] text-teal-800 flex items-start gap-2">
        <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
        <div>
          Semua rekening di atas otomatis disertakan pada <strong>Rincian Pesanan Pelanggan</strong>, <strong>Cetak Nota Kasir</strong>, serta <strong>Pesan Konfirmasi WhatsApp</strong> agar pelanggan dapat memilih bank pembayaran yang paling hemat biaya admin.
        </div>
      </div>

      {/* Modal Tambah / Edit Rekening */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col">
            <div className="bg-gradient-to-r from-teal-800 to-teal-700 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CreditCard className="w-4 h-4" />
                <span>{editingId ? 'Edit Rekening Bank Toko' : 'Tambah Rekening Bank / E-Wallet'}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-teal-100 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAccount} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Pilih Bank atau Dompet Digital
                </label>
                <select
                  value={bankSelect}
                  onChange={(e) => setBankSelect(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  {POPULAR_BANKS.map((b) => (
                    <option key={b.name} value={b.name}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {bankSelect === 'Lainnya / Bank Lain' && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Nama Bank / E-Wallet Kustom
                  </label>
                  <input
                    type="text"
                    required
                    value={customBankName}
                    onChange={(e) => setCustomBankName(e.target.value)}
                    placeholder="Contoh: Bank Jateng, Bank DKI, dll"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none font-bold"
                  />
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Nomor Rekening / No. HP E-Wallet
                </label>
                <input
                  type="text"
                  required
                  value={nomorRekening}
                  onChange={(e) => setNomorRekening(e.target.value)}
                  placeholder="Contoh: 763568966600 atau 085815950700"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Atas Nama Pemilik Rekening (a.n)
                </label>
                <input
                  type="text"
                  required
                  value={atasNama}
                  onChange={(e) => setAtasNama(e.target.value)}
                  placeholder="Contoh: Muhammad Rosyid Ridlo / Alinea Desain"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isPrimary}
                    onChange={(e) => setIsPrimary(e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                  />
                  <span className="font-bold text-slate-700">Jadikan Rekening Utama</span>
                </label>
                <p className="text-[10px] text-slate-400 ml-6 mt-0.5">
                  Rekening utama akan ditampilkan di urutan paling atas.
                </p>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold transition shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{editingId ? 'Simpan Perubahan' : 'Tambah Rekening'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
