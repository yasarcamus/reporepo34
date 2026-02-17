"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Profile, Package, Sale } from "@/lib/types";
import { motion } from "framer-motion";
import { 
  Wifi, 
  Users, 
  DollarSign, 
  ShoppingCart, 
  TrendingUp,
  LogOut,
  Plus,
  Search,
  Loader2,
  Package as PackageIcon,
  Activity,
  BarChart3,
  Building2
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [partners, setPartners] = useState<Profile[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddCredit, setShowAddCredit] = useState<string | null>(null);
  const [creditAmount, setCreditAmount] = useState("");
  const [addingCredit, setAddingCredit] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/login");
        return;
      }

      // Get current admin profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (profileData?.role !== "admin") {
        router.push("/dashboard");
        return;
      }

      setProfile(profileData);

      // Get all partners
      const { data: partnersData } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "partner")
        .order("created_at", { ascending: false });

      if (partnersData) {
        setPartners(partnersData);
      }

      // Get all packages
      const { data: packagesData } = await supabase
        .from("packages")
        .select("*")
        .order("price_usd", { ascending: true });

      if (packagesData) {
        setPackages(packagesData);
      }

      // Get all sales
      const { data: salesData } = await supabase
        .from("sales")
        .select("*, package:packages(*), user:profiles(*)")
        .order("created_at", { ascending: false })
        .limit(50);

      if (salesData) {
        setSales(salesData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCredit = async (partnerId: string) => {
    if (!creditAmount || parseFloat(creditAmount) <= 0) return;

    setAddingCredit(true);
    try {
      const partner = partners.find(p => p.id === partnerId);
      if (!partner) return;

      const newBalance = partner.balance + parseFloat(creditAmount);

      await supabase
        .from("profiles")
        .update({ balance: newBalance })
        .eq("id", partnerId);

      setShowAddCredit(null);
      setCreditAmount("");
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setAddingCredit(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // Calculate stats
  const totalRevenue = sales.reduce((sum, s) => sum + s.price_sold, 0);
  const totalPartners = partners.length;
  const topPackage = packages.find(p => 
    sales.filter(s => s.package_id === p.id).length > 0
  );

  const filteredPartners = partners.filter(p => 
    p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.business_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                Admin
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Çıkış
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Toplam Ciro</p>
                <p className="text-2xl font-bold text-slate-900">${totalRevenue.toFixed(2)}</p>
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
                <Users className="w-6 h-6 text-cyan-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Partner Sayısı</p>
                <p className="text-2xl font-bold text-slate-900">{totalPartners}</p>
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
                <ShoppingCart className="w-6 h-6 text-orange-600" />
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
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <PackageIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">En Çok Satan</p>
                <p className="text-lg font-bold text-slate-900">{topPackage?.name || "-"}</p>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Partner Management */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-teal-600" />
                Partner Yönetimi
              </h2>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Partner ara..."
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
              />
            </div>

            {/* Partner List */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredPartners.map((partner) => (
                <div
                  key={partner.id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-xl"
                >
                  <div>
                    <p className="font-medium text-slate-900">
                      {partner.business_name || "İşletme Adı Yok"}
                    </p>
                    <p className="text-sm text-slate-500">{partner.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-900">${partner.balance.toFixed(2)}</p>
                      <p className="text-xs text-slate-500">bakiye</p>
                    </div>
                    {showAddCredit === partner.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={creditAmount}
                          onChange={(e) => setCreditAmount(e.target.value)}
                          placeholder="Tutar"
                          className="w-20 px-2 py-1 border border-slate-200 rounded-lg text-sm"
                        />
                        <button
                          onClick={() => handleAddCredit(partner.id)}
                          disabled={addingCredit}
                          className="p-1 bg-teal-600 text-white rounded-lg text-sm"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setShowAddCredit(null);
                            setCreditAmount("");
                          }}
                          className="p-1 text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowAddCredit(partner.id)}
                        className="px-3 py-1.5 bg-teal-100 text-teal-700 rounded-lg text-sm font-medium hover:bg-teal-200 transition-colors"
                      >
                        Kredi Ekle
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Log */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-teal-600" />
              Son Aktiviteler
            </h2>

            {sales.length === 0 ? (
              <p className="text-slate-500 text-center py-8">Henüz aktivite yok</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {sales.slice(0, 20).map((sale) => (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-xl"
                  >
                    <div>
                      <p className="font-medium text-slate-900">
                        {sale.user?.business_name || sale.user?.email || "Bilinmiyor"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {sale.package?.name} • {new Date(sale.created_at).toLocaleString("tr-TR")}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-teal-600">
                      ${sale.price_sold}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
