"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Profile, Package, Sale } from "@/lib/types";
import { motion } from "framer-motion";
import { 
  Wifi, 
  Wallet, 
  ShoppingCart, 
  History, 
  CreditCard,
  Check,
  X,
  QrCode,
  LogOut,
  TrendingUp,
  AlertCircle,
  Loader2
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [packages, setPackages] = useState<Package[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [qrData, setQrData] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Get current user
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/login");
        return;
      }

      // Get profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      // Get packages
      const { data: packagesData } = await supabase
        .from("packages")
        .select("*")
        .eq("is_active", true)
        .order("price_usd", { ascending: true });

      if (packagesData) {
        setPackages(packagesData);
      }

      // Get sales
      const { data: salesData } = await supabase
        .from("sales")
        .select("*, package:packages(*)")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (salesData) {
        setSales(salesData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (pkg: Package) => {
    if (!profile) return;

    setSelectedPackage(pkg);
    setPurchasing(true);
    setError("");

    try {
      // Check balance
      if (profile.balance < pkg.price_usd) {
        setError("Yetersiz bakiye! Admin ile iletişime geçin.");
        setPurchasing(false);
        return;
      }

      // Deduct balance
      const newBalance = profile.balance - pkg.price_usd;
      
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ balance: newBalance })
        .eq("id", profile.id);

      if (updateError) throw updateError;

      // Create sale record (mock QR for now)
      const mockQR = `TNT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const { error: saleError } = await supabase
        .from("sales")
        .insert({
          user_id: profile.id,
          package_id: pkg.id,
          price_sold: pkg.price_usd,
          qr_code_data: mockQR,
        });

      if (saleError) throw saleError;

      // Show QR
      setQrData(mockQR);
      setShowQR(true);
      
      // Refresh data
      fetchData();
    } catch (err) {
      console.error(err);
      setError("Satın alma sırasında bir hata oluştu.");
    } finally {
      setPurchasing(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center">
                <Wifi className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">TouristNetTR</span>
              <span className="px-2 py-1 bg-teal-100 text-teal-700 text-xs font-medium rounded-full">
                Partner
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-slate-500">{profile?.business_name}</p>
                <p className="text-sm font-medium text-slate-900">{profile?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-red-600 transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                <Wallet className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Mevcut Bakiye</p>
                <p className="text-2xl font-bold text-slate-900">${profile?.balance?.toFixed(2)}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-cyan-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Toplam Satış</p>
                <p className="text-2xl font-bold text-slate-900">{sales.length}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Toplam Harcama</p>
                <p className="text-2xl font-bold text-slate-900">
                  ${sales.reduce((sum, s) => sum + s.price_sold, 0).toFixed(2)}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Package Selection */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-teal-600" />
              Paket Satın Al
            </h2>
            
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-sm mb-4">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <div className="space-y-3">
              {packages.map((pkg) => (
                <motion.div
                  key={pkg.id}
                  whileHover={{ scale: 1.01 }}
                  className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-teal-500 transition-colors"
                >
                  <div>
                    <h3 className="font-semibold text-slate-900">{pkg.name}</h3>
                    <p className="text-sm text-slate-500">
                      {pkg.data_amount} GB • {pkg.duration_days} gün
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-teal-600">${pkg.price_usd}</span>
                    <button
                      onClick={() => handlePurchase(pkg)}
                      disabled={purchasing}
                      className="px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg font-medium text-sm hover:shadow-lg transition-all disabled:opacity-50"
                    >
                      Satın Al
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Sales History */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <History className="w-5 h-5 text-teal-600" />
              Son Satışlar
            </h2>

            {sales.length === 0 ? (
              <p className="text-slate-500 text-center py-8">Henüz satış yapılmamış</p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {sales.map((sale) => (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-xl"
                  >
                    <div>
                      <p className="font-medium text-slate-900">
                        {sale.package?.name || "Paket"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(sale.created_at).toLocaleDateString("tr-TR")}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-teal-600">
                      -${sale.price_sold}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* QR Modal */}
      {showQR && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full text-center"
          >
            <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-teal-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Satın Alma Başarılı!</h3>
            <p className="text-slate-600 mb-6">QR kodu aşağıdadır:</p>

            <div className="bg-slate-100 rounded-2xl p-6 mb-6">
              <QrCode className="w-32 h-32 mx-auto text-slate-900" />
              <p className="mt-4 text-xs text-slate-500 font-mono">{qrData}</p>
            </div>

            <p className="text-sm text-slate-500 mb-6">
              Bu QR kodu müşterinize gösterin veya paylaşın.
            </p>

            <button
              onClick={() => setShowQR(false)}
              className="w-full py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl font-semibold"
            >
              Kapat
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
