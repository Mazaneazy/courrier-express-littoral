import React, { useState, useMemo } from "react";
import Navbar from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { MailType, MailStats } from "@/types/mail";

// Fonctions utilitaires pour lire les courriers du localStorage
function getAllIncomingMails() {
  const key = "incomingMails";
  const existing = localStorage.getItem(key);
  if (!existing) return [];
  return JSON.parse(existing).map((mail: any) => ({
    ...mail,
    date: mail.date ? new Date(mail.date) : undefined,
  }));
}
function getAllOutgoingMails() {
  const key = "outgoingMails";
  const existing = localStorage.getItem(key);
  if (!existing) return [];
  return JSON.parse(existing).map((mail: any) => ({
    ...mail,
    date: mail.date ? new Date(mail.date) : undefined,
  }));
}

// Tableau des noms de mois (français)
const monthNames = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

// Préparer les statistiques mensuelles et annuelles à partir des courriers stockés
function computeMonthlyStats(incomings: any[], outgoings: any[]): MailStats[] {
  const statsMap: { [key: string]: MailStats } = {};

  incomings.forEach((mail) => {
    if (!mail.date) return;
    const d = new Date(mail.date);
    const year = d.getFullYear();
    const monthIdx = d.getMonth();
    const month = monthNames[monthIdx];
    const key = `${year}-${month}`;

    if (!statsMap[key]) {
      statsMap[key] = {
        month,
        year,
        incomingCount: 0,
        outgoingCount: 0,
        byType: {
          Administrative: 0,
          Technical: 0,
          Commercial: 0,
          Financial: 0,
          Other: 0
        }
      };
    }
    statsMap[key].incomingCount += 1;
    const type = mail.mailType || "Other";
    statsMap[key].byType[type] = (statsMap[key].byType[type] || 0) + 1;
  });

  outgoings.forEach((mail) => {
    if (!mail.date) return;
    const d = new Date(mail.date);
    const year = d.getFullYear();
    const monthIdx = d.getMonth();
    const month = monthNames[monthIdx];
    const key = `${year}-${month}`;

    if (!statsMap[key]) {
      statsMap[key] = {
        month,
        year,
        incomingCount: 0,
        outgoingCount: 0,
        byType: {
          Administrative: 0,
          Technical: 0,
          Commercial: 0,
          Financial: 0,
          Other: 0
        }
      };
    }
    statsMap[key].outgoingCount += 1;
  });

  return Object.values(statsMap).sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return monthNames.indexOf(a.month) - monthNames.indexOf(b.month);
  });
}

const prepareBarChartData = (stats: MailStats[]) => {
  return stats.map((stat) => ({
    name: `${stat.month} ${stat.year}`,
    "Courriers Entrants": stat.incomingCount,
    "Courriers Départs": stat.outgoingCount,
  }));
};

const preparePieChartData = (stat: MailStats | undefined) => {
  if (!stat) return [];
  return [
    {
      name: "Administratif",
      value: stat.byType.Administrative,
      color: "#3b82f6", // blue
    },
    {
      name: "Technique",
      value: stat.byType.Technical,
      color: "#10b981", // green
    },
    {
      name: "Commercial",
      value: stat.byType.Commercial,
      color: "#f59e0b", // yellow
    },
    {
      name: "Financier",
      value: stat.byType.Financial,
      color: "#ef4444", // red
    },
    {
      name: "Autre",
      value: stat.byType.Other,
      color: "#8b5cf6", // purple
    },
  ].filter((item) => item.value > 0);
};

const StatisticsPage: React.FC = () => {
  const incomingMails = getAllIncomingMails();
  const outgoingMails = getAllOutgoingMails();
  const monthlyStats = useMemo(() => computeMonthlyStats(incomingMails, outgoingMails), [incomingMails, outgoingMails]);

  const years = Array.from(new Set(monthlyStats.map((s) => s.year))).sort((a, b) => b - a);
  const months = monthNames.filter((m) => monthlyStats.find((s) => s.month === m)) as string[];

  const [selectedYear, setSelectedYear] = useState<number>(years[0] || new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<string>(months[months.length - 1] || monthNames[new Date().getMonth()]);

  const monthlyStat = monthlyStats.find((stat) => stat.year === selectedYear && stat.month === selectedMonth);

  const barChartData = prepareBarChartData(monthlyStats.filter(stat => stat.year === selectedYear));
  const pieChartData = preparePieChartData(monthlyStat);

  const hasBarData = barChartData.length > 0 && barChartData.some(d => d["Courriers Entrants"] > 0 || d["Courriers Départs"] > 0);
  const hasPieData = pieChartData.length > 0;
  const hasDetailData = monthlyStat && Object.values(monthlyStat.byType).some(count => count > 0);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <div className="page-container flex-1">
        <h1 className="page-title">Statistiques</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filtres</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Mois</label>
                  <Select
                    value={selectedMonth}
                    onValueChange={setSelectedMonth}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un mois" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month) => (
                        <SelectItem key={month} value={month}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="form-group">
                  <label className="form-label">Année</label>
                  <Select
                    value={selectedYear.toString()}
                    onValueChange={(value) => setSelectedYear(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez une année" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Résumé, n'affiche que s'il y a des courriers pour la période */}
          {(monthlyStat && (monthlyStat.incomingCount > 0 || monthlyStat.outgoingCount > 0)) ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Résumé {selectedMonth} {selectedYear}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-500">Courriers Entrants</p>
                    <p className="text-2xl font-bold text-agency-blue">
                      {monthlyStat.incomingCount}
                    </p>
                  </div>
                  <div className="border rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-500">Courriers Départs</p>
                    <p className="text-2xl font-bold text-green-600">
                      {monthlyStat.outgoingCount}
                    </p>
                  </div>
                  <div className="border rounded-lg p-4 text-center col-span-2">
                    <p className="text-sm text-gray-500">Total Courriers</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {monthlyStat.incomingCount + monthlyStat.outgoingCount}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Résumé {selectedMonth} {selectedYear}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center text-gray-400 h-32">
                  Aucune donnée à afficher
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Évolution Mensuelle</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              {hasBarData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Courriers Entrants" fill="#3b82f6" />
                    <Bar dataKey="Courriers Départs" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-80 flex items-center justify-center text-gray-400">Aucune donnée à afficher</div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Types de Courriers - {selectedMonth} {selectedYear}</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              {hasPieData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-80 flex items-center justify-center text-gray-400">Aucune donnée à afficher</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Détails par Type - {selectedMonth} {selectedYear}</CardTitle>
            </CardHeader>
            <CardContent>
              {hasDetailData ? (
                <div className="space-y-4">
                  {monthlyStat && Object.entries(monthlyStat.byType).map(([type, count]) => (
                    count > 0 && (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div
                            className="w-3 h-3 rounded-full mr-2"
                            style={{
                              backgroundColor:
                                type === "Administrative" ? "#3b82f6" :
                                type === "Technical" ? "#10b981" :
                                type === "Commercial" ? "#f59e0b" :
                                type === "Financial" ? "#ef4444" :
                                  "#8b5cf6"
                            }}
                          ></div>
                          <span>{
                            type === "Administrative" ? "Administratif" :
                              type === "Technical" ? "Technique" :
                                type === "Commercial" ? "Commercial" :
                                  type === "Financial" ? "Financier" :
                                    "Autre"
                          }</span>
                        </div>
                        <div className="font-bold">{count}</div>
                      </div>
                    )
                  ))}
                  <div className="mt-6 pt-4 border-t">
                    <div className="flex items-center justify-between font-bold">
                      <span>Total</span>
                      <span>{
                        monthlyStat ?
                          Object.values(monthlyStat.byType).reduce((sum, count) => sum + count, 0) :
                          0
                      }</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center text-gray-400 h-32">
                  Aucune donnée à afficher
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <footer className="bg-white border-t py-6 mt-8">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} Antenne du Littoral de l'Agence des Normes et de la Qualité. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
};

export default StatisticsPage;
