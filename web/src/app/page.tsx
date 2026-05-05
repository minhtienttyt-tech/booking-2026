"use client";

import {
  ArrowDownToLine,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  FileInput,
  FileSpreadsheet,
  Filter,
  HandCoins,
  Plus,
  ReceiptText,
  Search,
  Send,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type InvoiceStatus = "Đã thu" | "Chưa thu" | "Quá hạn" | "Chờ xuất VAT";

type BookingInvoice = {
  id: string;
  date: string;
  operator: string;
  company: string;
  code: string;
  guests: number;        // Cột SL (Ăn uống)
  unitPrice: number;     // Cột Giá Tiền (Ăn uống)
  foodAmount: number;    // Cột Thành Tiền (Ăn uống)
  bikeQty: number;       // Cột SL (Xe đạp)
  bikeUnitPrice: number; // Cột Giá Tiền (Xe đạp)
  bikeAmount: number;    // Cột Thành Tiền (Xe đạp)
  waterQty: number;      // Cột SL (Nước lọc)
  waterUnitPrice: number;// Cột Đơn giá (Nước lọc)
  waterAmount: number;   // Cột Thành Tiền (Nước lọc)
  total: number;         // Cột Tổng Tiền
  invoiceNo: string;     // Cột Hóa Đơn
  note: string;          // Cột Ghi chú
  foocNote: string;      // Cột Trừ FOOC
  status: InvoiceStatus;
  dueInDays: number;
};

const invoices: BookingInvoice[] = [
  {
    id: "BK-1009",
    date: "29/04/2026",
    operator: "Tự động",
    company: "EXO Tissimo",
    code: "SGUK433232",
    guests: 2,
    unitPrice: 210000,
    foodAmount: 420000,
    bikeQty: 0,
    bikeUnitPrice: 50000,
    bikeAmount: 0,
    waterQty: 0,
    waterUnitPrice: 10000,
    waterAmount: 0,
    total: 420000,
    invoiceNo: "00001009",
    note: "Mr HOANG MANH TAN / 0399341571",
    foocNote: "",
    status: "Đã thu",
    dueInDays: 0,
  },
  {
    id: "BK-1014",
    date: "29/04/2026",
    operator: "Tự động",
    company: "Aurora",
    code: "SL98369A",
    guests: 15,
    unitPrice: 200000,
    foodAmount: 3000000,
    bikeQty: 37,
    bikeUnitPrice: 50000,
    bikeAmount: 1850000,
    waterQty: 0,
    waterUnitPrice: 10000,
    waterAmount: 0,
    total: 4850000,
    invoiceNo: "00001014",
    note: "Ms. Bella / 0397419084",
    foocNote: "Đã trừ 2 FOOC",
    status: "Chưa thu",
    dueInDays: 7,
  },
  {
    id: "BK-1015",
    date: "29/04/2026",
    operator: "Huy Võ",
    company: "Discova",
    code: "S1S1OE3931",
    guests: 2,
    unitPrice: 270000,
    foodAmount: 540000,
    bikeQty: 0,
    bikeUnitPrice: 0,
    bikeAmount: 0,
    waterQty: 0,
    waterUnitPrice: 0,
    waterAmount: 0,
    total: 540000,
    invoiceNo: "00001015",
    note: "Booking ăn uống đoàn nhỏ",
    foocNote: "",
    status: "Chờ xuất VAT",
    dueInDays: 5,
  },
  {
    id: "BK-1016",
    date: "29/04/2026",
    operator: "Tự động",
    company: "Indochina Voyages",
    code: "260426-Sonsoles-Indika-M",
    guests: 2,
    unitPrice: 216000,
    foodAmount: 432000,
    bikeQty: 0,
    bikeUnitPrice: 0,
    bikeAmount: 0,
    waterQty: 0,
    waterUnitPrice: 0,
    waterAmount: 0,
    total: 432000,
    invoiceNo: "00001016",
    note: "Anh Trường 096 158 7379",
    foocNote: "",
    status: "Quá hạn",
    dueInDays: -3,
  },
  {
    id: "BK-1017",
    date: "29/04/2026",
    operator: "Tự động",
    company: "Asiatica Travel",
    code: "AS2604003",
    guests: 4,
    unitPrice: 216000,
    foodAmount: 864000,
    bikeQty: 0,
    bikeUnitPrice: 0,
    bikeAmount: 0,
    waterQty: 0,
    waterUnitPrice: 0,
    waterAmount: 0,
    total: 864000,
    invoiceNo: "00001017",
    note: "Đặng Hoàng Đức: 0844672678",
    foocNote: "",
    status: "Chưa thu",
    dueInDays: 12,
  },
  {
    id: "BK-0784",
    date: "01/04/2026",
    operator: "Tự động",
    company: "EXO Tissimo",
    code: "SGUK436264",
    guests: 2,
    unitPrice: 210000,
    foodAmount: 420000,
    bikeQty: 0,
    bikeUnitPrice: 0,
    bikeAmount: 0,
    waterQty: 0,
    waterUnitPrice: 0,
    waterAmount: 0,
    total: 420000,
    invoiceNo: "00000784",
    note: "NGUYEN ANH PHUONG / 0886510686",
    foocNote: "",
    status: "Đã thu",
    dueInDays: 0,
  },
  {
    id: "BK-0793",
    date: "02/04/2026",
    operator: "Tự động",
    company: "EXO Tissimo",
    code: "HNAV429425 FP",
    guests: 8,
    unitPrice: 210000,
    foodAmount: 1680000,
    bikeQty: 0,
    bikeUnitPrice: 0,
    bikeAmount: 0,
    waterQty: 0,
    waterUnitPrice: 0,
    waterAmount: 0,
    total: 1680000,
    invoiceNo: "00000793",
    note: "Le Mai Nhat Hai / 0908554554",
    foocNote: "",
    status: "Quá hạn",
    dueInDays: -11,
  },
];

const statusStyles: Record<InvoiceStatus, "success" | "warning" | "error" | "info"> = {
  "Đã thu": "success",
  "Chưa thu": "warning",
  "Quá hạn": "error",
  "Chờ xuất VAT": "info",
};

const formatMoney = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);

const companies = Array.from(new Set(invoices.map((invoice) => invoice.company)));

export default function Home() {
  const [invoiceList, setInvoiceList] = useState<BookingInvoice[]>(invoices);
  const [isImporting, setIsImporting] = useState(false);
  const [sheetUrl, setSheetUrl] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [query, setQuery] = useState("");
  const [company, setCompany] = useState("Tất cả");
  const [status, setStatus] = useState<InvoiceStatus | "Tất cả">("Tất cả");

  const handleImport = async () => {
    if (!sheetUrl) return;
    setIsImporting(true);
    try {
      const match = sheetUrl.match(/\/d\/(.*?)(\/|$)/);
      const id = match ? match[1] : null;
      if (!id) throw new Error("Link không hợp lệ. Vui lòng kiểm tra lại link Google Sheets.");

      const response = await fetch(`https://docs.google.com/spreadsheets/d/${id}/export?format=csv`);
      if (!response.ok) throw new Error("Không thể tải dữ liệu. Hãy đảm bảo Sheet ở chế độ 'Bất kỳ ai có liên kết đều có thể xem'.");
      
      const csvText = await response.text();
      const lines = csvText.split(/\r?\n/);
      const rows = lines.map(line => {
        const matches = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g);
        return matches ? matches.map(m => m.replace(/^"|"$/g, '').trim()) : [];
      });

      if (rows.length < 2) throw new Error("Sheet không có dữ liệu hoặc định dạng không đúng.");

      // Mapping dựa trên cấu trúc file Excel "Booking Xuất VAT 2026"
      // 0: Ngày, 1: Điều hành, 2: Công ty, 3: Code, 4: SL, 5: Giá tiền, 6: Thành tiền ăn
      // 7: Xe đạp SL, 8: Xe đạp Đơn giá, 9: Xe đạp Thành tiền
      // 10: Nước lọc SL, 11: Nước lọc Đơn giá, 12: Nước lọc Thành tiền
      // 13: Tổng tiền, 14: Hóa đơn, 15: Ghi chú, 16: Trừ FOOC
      const newInvoices: BookingInvoice[] = rows.slice(1)
        .filter(row => row[0]) // Chỉ cần có ngày ở cột đầu tiên là chấp nhận
        .map((row, idx) => {
          const guests = parseInt(row[4]?.toString().replace(/\D/g, "") || "0") || 0;
          const unitPrice = parseInt(row[5]?.toString().replace(/\D/g, "") || "0") || 0;
          const foodAmount = parseInt(row[6]?.toString().replace(/\D/g, "") || "0") || (guests * unitPrice);
          
          const bikeQty = parseInt(row[7]?.toString().replace(/\D/g, "") || "0") || 0;
          const bikeUnitPrice = parseInt(row[8]?.toString().replace(/\D/g, "") || "0") || 0;
          const bikeAmount = parseInt(row[9]?.toString().replace(/\D/g, "") || "0") || (bikeQty * bikeUnitPrice);
          
          const waterQty = parseInt(row[10]?.toString().replace(/\D/g, "") || "0") || 0;
          const waterUnitPrice = parseInt(row[11]?.toString().replace(/\D/g, "") || "0") || 0;
          const waterAmount = parseInt(row[12]?.toString().replace(/\D/g, "") || "0") || (waterQty * waterUnitPrice);
          
          const total = parseInt(row[13]?.toString().replace(/\D/g, "") || "0") || (foodAmount + bikeAmount + waterAmount);
          
          return {
            id: `GS-${Date.now()}-${idx}`,
            date: row[0]?.toString() || "",
            operator: row[1]?.toString() || "",
            company: row[2]?.toString() || "",
            code: row[3]?.toString() || "",
            guests: guests,
            unitPrice: unitPrice,
            foodAmount: foodAmount,
            bikeQty: bikeQty,
            bikeUnitPrice: bikeUnitPrice,
            bikeAmount: bikeAmount,
            waterQty: waterQty,
            waterUnitPrice: waterUnitPrice,
            waterAmount: waterAmount,
            total: total,
            invoiceNo: row[14]?.toString() || "",
            note: row[15]?.toString() || "",
            foocNote: row[16]?.toString() || "",
            status: "Chưa thu",
            dueInDays: 0,
          };
        });

      if (newInvoices.length === 0) throw new Error("Không tìm thấy dòng dữ liệu hợp lệ nào.");

      setInvoiceList(newInvoices);
      setIsDialogOpen(false);
      setSheetUrl("");
      alert(`Đã import thành công ${newInvoices.length} dòng dữ liệu!`);
    } catch (error: any) {
      alert("Lỗi: " + error.message);
    } finally {
      setIsImporting(false);
    }
  };

  const filteredInvoices = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return invoiceList.filter((invoice) => {
      const matchesQuery =
        !normalizedQuery ||
        [invoice.company, invoice.code, invoice.invoiceNo, invoice.note]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      const matchesCompany = company === "Tất cả" || invoice.company === company;
      const matchesStatus = status === "Tất cả" || invoice.status === status;

      return matchesQuery && matchesCompany && matchesStatus;
    });
  }, [company, query, status]);

  const summary = useMemo(() => {
    const totalRevenue = invoiceList.reduce((sum, invoice) => sum + invoice.total, 0);
    const receivable = invoiceList
      .filter((invoice) => invoice.status !== "Đã thu")
      .reduce((sum, invoice) => sum + invoice.total, 0);
    const overdue = invoiceList
      .filter((invoice) => invoice.status === "Quá hạn")
      .reduce((sum, invoice) => sum + invoice.total, 0);
    const waitingVat = invoiceList.filter((invoice) => invoice.status === "Chờ xuất VAT").length;

    return { overdue, receivable, totalRevenue, waitingVat };
  }, [invoiceList]);

  const companyDebt = useMemo(() => {
    return companies
      .map((name) => {
        const companyInvoices = invoiceList.filter((invoice) => invoice.company === name);
        const amount = companyInvoices
          .filter((invoice) => invoice.status !== "Đã thu")
          .reduce((sum, invoice) => sum + invoice.total, 0);
        const overdue = companyInvoices
          .filter((invoice) => invoice.status === "Quá hạn")
          .reduce((sum, invoice) => sum + invoice.total, 0);

        return {
          amount,
          invoiceCount: companyInvoices.length,
          name,
          overdue,
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [invoiceList]);

  const maxDebt = Math.max(...companyDebt.map((item) => item.amount), 1);

  return (
    <main className="min-h-screen bg-[#f6f7f4] text-[#20231f]">
      <section className="border-b border-[#d9ded3] bg-[#fbfcf8]">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-[#236a5b] text-white">
                  <ReceiptText className="size-5" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold tracking-normal text-[#18201c]">
                    Quản lý xuất hóa đơn nhà hàng
                  </h1>
                  <p className="mt-1 text-sm text-[#667066]">
                    Theo dõi booking, hóa đơn VAT và công nợ từ cấu trúc file Excel 2026.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger render={<Button variant="outline" className="border-[#cfd8cb] bg-white text-[#26302a]" />}>
                  <FileSpreadsheet className="size-4" />
                  Google Sheets
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Import từ Google Sheets</DialogTitle>
                    <DialogDescription>
                      Nhập link Google Sheets của bạn. Hãy đảm bảo sheet đã được chia sẻ ở chế độ "Bất kỳ ai có liên kết đều có thể xem".
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <label className="mb-2 block text-sm font-medium">Link Google Sheets</label>
                    <Input 
                      placeholder="https://docs.google.com/spreadsheets/d/..." 
                      value={sheetUrl}
                      onChange={(e) => setSheetUrl(e.target.value)}
                      nativeInput
                    />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Hủy</Button>
                    <Button 
                      className="bg-[#236a5b] text-white" 
                      onClick={handleImport}
                      disabled={isImporting || !sheetUrl}
                    >
                      {isImporting ? "Đang xử lý..." : "Import ngay"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button variant="outline" className="border-[#cfd8cb] bg-white text-[#26302a]">
                <ArrowDownToLine className="size-4" />
                Xuất báo cáo
              </Button>
              <Button className="border-[#236a5b] bg-[#236a5b] text-white hover:bg-[#1d584c]">
                <Plus className="size-4" />
                Tạo hóa đơn
              </Button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <Metric
              icon={<TrendingUp className="size-4" />}
              label="Doanh thu tháng 04"
              value={formatMoney(summary.totalRevenue)}
              note="7 booking đã ghi nhận"
            />
            <Metric
              icon={<CircleDollarSign className="size-4" />}
              label="Công nợ cần thu"
              value={formatMoney(summary.receivable)}
              note="Theo hạn thanh toán đại lý"
            />
            <Metric
              icon={<Bell className="size-4" />}
              label="Quá hạn"
              value={formatMoney(summary.overdue)}
              note="Cần nhắc thanh toán"
            />
            <Metric
              icon={<ShieldCheck className="size-4" />}
              label="Chờ xuất VAT"
              value={`${summary.waitingVat} phiếu`}
              note="Đủ thông tin khách hàng"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
        <div className="space-y-5">
          <div className="rounded-lg border border-[#d9ded3] bg-white">
            <div className="flex flex-col gap-3 border-b border-[#e4e8df] p-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-base font-semibold text-[#20231f]">Sổ booking và hóa đơn</h2>
                <p className="mt-1 text-sm text-[#6b746b]">
                  Luồng dữ liệu tương ứng sheet "TH booking theo ngày" và từng sheet khách hàng.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative min-w-64">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#758075]" />
                  <Input
                    className="rounded-lg border-[#cfd8cb] bg-[#fbfcf8] pl-8"
                    nativeInput
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Tìm công ty, code, số hóa đơn"
                    value={query}
                  />
                </div>
                <SelectLike
                  icon={<Filter className="size-4" />}
                  label={company}
                  options={["Tất cả", ...companies]}
                  onSelect={setCompany}
                />
                <SelectLike
                  icon={<ChevronDown className="size-4" />}
                  label={status}
                  options={["Tất cả", "Đã thu", "Chưa thu", "Quá hạn", "Chờ xuất VAT"]}
                  onSelect={(value) => setStatus(value as InvoiceStatus | "Tất cả")}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="bg-[#eef2e9] text-xs uppercase text-[#596259]">
                  <tr>
                    <th className="px-4 py-3 font-medium">Ngày</th>
                    <th className="px-4 py-3 font-medium">Công ty</th>
                    <th className="px-4 py-3 font-medium">Code</th>
                    <th className="px-4 py-3 text-right font-medium">SL</th>
                    <th className="px-4 py-3 text-right font-medium">Đơn giá</th>
                    <th className="px-4 py-3 text-right font-medium">Phụ thu</th>
                    <th className="px-4 py-3 text-right font-medium">Tổng tiền</th>
                    <th className="px-4 py-3 font-medium">Hóa đơn</th>
                    <th className="px-4 py-3 font-medium">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf0ea]">
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-[#fbfcf8]">
                      <td className="whitespace-nowrap px-4 py-3 text-[#394239]">{invoice.date}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-[#20231f]">{invoice.company}</div>
                        <div className="mt-1 flex flex-col gap-0.5">
                          <div className="max-w-56 truncate text-xs text-[#788178]">
                            {invoice.note}
                          </div>
                          {invoice.foocNote && (
                            <div className="text-[10px] font-medium text-[#b33f2f]">
                              {invoice.foocNote}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[#364037]">{invoice.code}</td>
                      <td className="px-4 py-3 text-right">{invoice.guests}</td>
                      <td className="px-4 py-3 text-right">{formatMoney(invoice.unitPrice)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-col items-end">
                          <span>{formatMoney(invoice.bikeAmount + invoice.waterAmount)}</span>
                          {(invoice.bikeQty > 0 || invoice.waterQty > 0) && (
                            <div className="text-[10px] text-[#788178]">
                              {invoice.bikeQty > 0 && `${invoice.bikeQty} xe`}
                              {invoice.bikeQty > 0 && invoice.waterQty > 0 && " + "}
                              {invoice.waterQty > 0 && `${invoice.waterQty} nước`}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {formatMoney(invoice.total)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{invoice.invoiceNo}</td>
                      <td className="px-4 py-3">
                        <Badge variant={statusStyles[invoice.status]}>{invoice.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
            <div className="rounded-lg border border-[#d9ded3] bg-white p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold">Công nợ theo khách hàng</h2>
                  <p className="mt-1 text-sm text-[#6b746b]">
                    Tổng hợp từ các sheet khách hàng như EXO, Aurora, Discova.
                  </p>
                </div>
                <Button variant="outline" size="sm" className="border-[#cfd8cb]">
                  <CalendarDays className="size-4" />
                  Tháng 04
                </Button>
              </div>

              <div className="space-y-4">
                {companyDebt.map((item) => (
                  <div key={item.name}>
                    <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                      <div>
                        <span className="font-medium text-[#222821]">{item.name}</span>
                        <span className="ml-2 text-xs text-[#788178]">
                          {item.invoiceCount} booking
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{formatMoney(item.amount)}</div>
                        {item.overdue > 0 ? (
                          <div className="text-xs text-[#b33f2f]">
                            Quá hạn {formatMoney(item.overdue)}
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-[#edf0ea]">
                      <div
                        className="h-2 rounded-full bg-[#236a5b]"
                        style={{ width: `${Math.max((item.amount / maxDebt) * 100, 3)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-[#d9ded3] bg-white p-4">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-[#f0c36a] text-[#3d2c09]">
                  <HandCoins className="size-4" />
                </div>
                <div>
                  <h2 className="text-base font-semibold">Ghi nhận thanh toán</h2>
                  <p className="text-sm text-[#6b746b]">Đối soát chuyển khoản theo hóa đơn.</p>
                </div>
              </div>

              <div className="space-y-3">
                <Field label="Số hóa đơn" value="00001014" />
                <Field label="Khách hàng" value="Aurora" />
                <Field label="Số tiền thu" value="3.000.000" />
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase text-[#687268]">
                    Ghi chú thu tiền
                  </label>
                  <textarea
                    className="min-h-24 w-full rounded-lg border border-[#cfd8cb] bg-[#fbfcf8] px-3 py-2 text-sm outline-none focus:border-[#236a5b] focus:ring-2 focus:ring-[#236a5b]/15"
                    defaultValue="Khớp booking SL98369A, chờ kế toán xác nhận sao kê."
                  />
                </div>
                <Button className="w-full border-[#236a5b] bg-[#236a5b] text-white hover:bg-[#1d584c]">
                  <CheckCircle2 className="size-4" />
                  Xác nhận đã thu
                </Button>
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-5">
          <div className="rounded-lg border border-[#d9ded3] bg-white p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold">Quy trình VAT</h2>
              <Badge variant="info">4 bước</Badge>
            </div>
            <div className="space-y-3">
              {[
                ["Nhập booking", "Đọc từ sheet ngày hoặc nhập thủ công"],
                ["Kiểm tra MST", "Gắn hồ sơ công ty, địa chỉ, email nhận hóa đơn"],
                ["Xuất hóa đơn", "Sinh số hóa đơn và khóa dữ liệu tính tiền"],
                ["Theo dõi công nợ", "Tự chuyển trạng thái sau khi ghi nhận thu tiền"],
              ].map(([title, description], index) => (
                <div className="flex gap-3" key={title}>
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-[#eef2e9] text-xs font-semibold text-[#236a5b]">
                    {index + 1}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{title}</div>
                    <div className="mt-0.5 text-xs leading-5 text-[#6f786f]">{description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-[#d9ded3] bg-white p-4">
            <div className="mb-4 flex items-center gap-3">
              <FileSpreadsheet className="size-5 text-[#236a5b]" />
              <h2 className="text-base font-semibold">Mẫu dữ liệu</h2>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {[
                "Ngày",
                "Điều hành",
                "Công ty",
                "Code",
                "SL",
                "Giá tiền",
                "Xe đạp",
                "Nước lọc",
                "Tổng tiền",
                "Hóa đơn",
              ].map((column) => (
                <div className="rounded-md border border-[#e2e7dd] bg-[#fbfcf8] px-3 py-2" key={column}>
                  {column}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-[#d9ded3] bg-[#26302a] p-4 text-white">
            <div className="mb-4">
              <h2 className="text-base font-semibold">Nhắc nợ tự động</h2>
              <p className="mt-1 text-sm text-white/70">
                Gom công nợ theo công ty, đính kèm bảng kê và danh sách hóa đơn.
              </p>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between rounded-md bg-white/8 px-3 py-2">
                <span>Indochina Voyages</span>
                <span>{formatMoney(432000)}</span>
              </div>
              <div className="flex items-center justify-between rounded-md bg-white/8 px-3 py-2">
                <span>EXO Tissimo</span>
                <span>{formatMoney(1680000)}</span>
              </div>
            </div>
            <Button className="mt-4 w-full border-white bg-white text-[#26302a] hover:bg-[#eef2e9]">
              <Send className="size-4" />
              Gửi bảng kê
            </Button>
          </div>
        </aside>
      </section>
    </main>
  );
}

function Metric({
  icon,
  label,
  note,
  value,
}: {
  icon: ReactNode;
  label: string;
  note: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-[#d9ded3] bg-white p-4">
      <div className="mb-3 flex items-center gap-2 text-sm text-[#687268]">
        <span className="flex size-7 items-center justify-center rounded-md bg-[#eef2e9] text-[#236a5b]">
          {icon}
        </span>
        {label}
      </div>
      <div className="text-xl font-semibold tracking-normal text-[#1e241f]">{value}</div>
      <div className="mt-1 text-xs text-[#788178]">{note}</div>
    </div>
  );
}

function SelectLike({
  icon,
  label,
  onSelect,
  options,
}: {
  icon: ReactNode;
  label: string;
  onSelect: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="relative inline-flex min-w-40 items-center">
      <span className="pointer-events-none absolute left-3 text-[#758075]">{icon}</span>
      <select
        className="h-8.5 w-full appearance-none rounded-lg border border-[#cfd8cb] bg-[#fbfcf8] py-1 pl-9 pr-8 text-sm outline-none focus:border-[#236a5b] focus:ring-2 focus:ring-[#236a5b]/15 sm:h-7.5"
        onChange={(event) => onSelect(event.target.value)}
        value={label}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase text-[#687268]">{label}</span>
      <Input
        className="rounded-lg border-[#cfd8cb] bg-[#fbfcf8]"
        defaultValue={value}
        nativeInput
      />
    </label>
  );
}
