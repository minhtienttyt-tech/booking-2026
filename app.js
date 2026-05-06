/**
 * Booking Management System 2026
 * Core Logic (app.js)
 */

// --- Constants & State ---
const STORAGE_KEY = 'booking_data_2026';
const AUTH_KEY = 'booking_auth_2026';
const DEFAULT_PIN = '2026';

let bookings = [];
let currentView = 'dashboard';

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    checkAuth();
    lucide.createIcons();
});

function initApp() {
    // Load data from LocalStorage
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
        bookings = JSON.parse(savedData);
    } else {
        // Sample initial data with new structure
        bookings = [
            { 
                id: 1, 
                date: '2026-05-01', 
                agency: 'EXO Tissimo', 
                code: 'SGUK438856', 
                operator: 'Thanh Vân', 
                guest: 'Mr. Smith', 
                pax: 2, 
                price: 750000, 
                bike_sl: 1, 
                bike_price: 100000,
                water_sl: 2, 
                water_price: 10000,
                foc: 0, 
                amount: 1620000, 
                invoice: '', 
                status: 'confirmed', 
                note: '' 
            }
        ];
        saveData();
    }
    
    updateStats();
    renderDashboard();
    renderTable();
    populateAgencyFilter();
    
    // Khởi tạo báo cáo công nợ
    if (typeof renderDebtMonthFilter === 'function') {
        renderDebtMonthFilter();
        renderDebtReport();
    }
    
    // Gắn sự kiện tìm kiếm
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            if (currentView === 'bookings') renderTable();
            // Nếu có chức năng tìm kiếm ở dashboard thì có thể gọi thêm
        });
    }
}

// --- Authentication ---
function checkAuth() {
    const isAuth = sessionStorage.getItem(AUTH_KEY);
    const authOverlay = document.getElementById('auth-overlay');
    if (!isAuth) {
        authOverlay.classList.remove('hidden');
    } else {
        authOverlay.classList.add('hidden');
    }
}

function handleLogin() {
    const pin = document.getElementById('login-code').value;
    if (pin === DEFAULT_PIN) {
        sessionStorage.setItem(AUTH_KEY, 'true');
        document.getElementById('auth-overlay').classList.add('hidden');
        showToast('Đăng nhập thành công!', 'check');
    } else {
        showToast('Mã PIN không chính xác', 'x');
        document.getElementById('login-code').value = '';
    }
}

function logout() {
    sessionStorage.removeItem(AUTH_KEY);
    location.reload();
}

// --- Navigation ---
function navigate(view) {
    currentView = view;
    
    // Update Nav UI
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.getElementById(`nav-${view}`).classList.add('active');
    
    // Update Page UI
    document.querySelectorAll('.page').forEach(page => page.classList.add('hidden'));
    document.getElementById(`page-${view}`).classList.remove('hidden');
    
    // Update Header
    const titles = {
        'dashboard': { main: 'Tổng quan', sub: 'Chào mừng bạn trở lại, Admin' },
        'bookings': { main: 'Danh sách đặt lịch', sub: 'Quản lý và cập nhật các booking' },
        'calendar': { main: 'Lịch trình', sub: 'Theo dõi dòng chảy booking theo thời gian' },
        'reports': { main: 'Báo cáo', sub: 'Phân tích hiệu suất kinh doanh' },
        'debt': { main: 'Công nợ', sub: 'Chi tiết công nợ theo tháng của từng đối tác' }
    };
    
    document.getElementById('page-title').innerText = titles[view].main;
    document.getElementById('page-subtitle').innerText = titles[view].sub;

    if (view === 'dashboard') renderDashboard();
    if (view === 'bookings') renderTable();
    if (view === 'debt') {
        renderDebtMonthFilter();
        renderDebtReport();
    }
    
    lucide.createIcons();
}

// --- Data Management ---
function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
    updateStats();
}

function updateStats() {
    const today = new Date().toISOString().split('T')[0];
    const todayBookings = bookings.filter(b => b.date === today);
    
    const totalPax = bookings.reduce((sum, b) => sum + parseInt(b.pax || 0), 0);
    const totalRev = bookings.reduce((sum, b) => sum + parseInt(b.amount || 0), 0);
    
    document.getElementById('stat-today-count').innerText = todayBookings.length;
    document.getElementById('stat-total-pax').innerText = totalPax;
    document.getElementById('stat-revenue').innerText = formatCurrency(totalRev);
}

// --- Rendering ---
function renderDashboard() {
    const recentList = document.getElementById('dashboard-recent-list');
    recentList.innerHTML = '';
    
    const sorted = [...bookings].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
    
    sorted.forEach(b => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50/50 transition-colors';
        tr.innerHTML = `
            <td class="px-6 py-4">
                <div class="font-bold text-slate-900">${b.agency}</div>
                <div class="text-[10px] text-slate-400 font-mono">${b.code || 'NO-CODE'}</div>
            </td>
            <td class="px-6 py-4">
                <div class="text-sm font-medium">${formatDate(b.date)}</div>
                <div class="text-[10px] text-slate-400">${b.operator || '-'}</div>
            </td>
            <td class="px-6 py-4">
                <div class="text-sm font-semibold text-amber-700">${b.pax} Pax</div>
                <div class="text-[10px] text-slate-500">${formatCurrency(b.amount)}</div>
            </td>
            <td class="px-6 py-4">
                <span class="badge badge-${b.status}">${translateStatus(b.status)}</span>
                <div class="text-[10px] text-slate-400 mt-1">${b.invoice ? 'HD: ' + b.invoice : ''}</div>
            </td>
            <td class="px-6 py-4 text-right">
                <div class="flex justify-end gap-2">
                    <button onclick="editBooking(${b.id})" class="btn-icon"><i data-lucide="edit-3" class="w-4 h-4"></i></button>
                    <button onclick="deleteBooking(${b.id})" class="btn-icon btn-delete"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </div>
            </td>
        `;
        recentList.appendChild(tr);
    });
    
    renderAgencyStats();
    lucide.createIcons();
}

function renderTable() {
    const list = document.getElementById('main-booking-list');
    if (!list) return;

    const filterAgency = document.getElementById('filter-agency').value;
    const filterStatus = document.getElementById('filter-status').value;
    const filterDate = document.getElementById('filter-date')?.value;
    const searchEl = document.getElementById('search-input');
    const search = searchEl ? searchEl.value.toLowerCase() : '';
    
    list.innerHTML = '';
    
    let filtered = bookings.filter(b => {
        const matchAgency = filterAgency === '' || b.agency === filterAgency;
        const matchStatus = filterStatus === '' || b.status === filterStatus;
        const matchDate = !filterDate || b.date === filterDate;
        
        const textToSearch = `${b.agency || ''} ${b.guest || ''} ${b.code || ''} ${b.operator || ''}`.toLowerCase();
        const matchSearch = search === '' || textToSearch.includes(search);
        
        return matchAgency && matchStatus && matchSearch && matchDate;
    });
    
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    filtered.forEach(b => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-50 transition-colors";
        
        // Tính toán các loại tiền nếu cần
        const pax = parseInt(b.pax) || 0;
        const price = parseInt(b.price) || 0;
        const ttPax = pax * price;
        const bike = parseInt(b.bike_sl) || 0;
        const bikePrice = parseInt(b.bike_price) || 0;
        const ttBike = bike * bikePrice;
        const water = parseInt(b.water_sl) || 0;
        const waterPrice = parseInt(b.water_price) || 0;
        const ttWater = water * waterPrice;
        const foc = parseInt(b.foc) || 0;
        const total = (b.amount !== undefined) ? parseInt(b.amount) : (ttPax + ttBike + ttWater - foc);
        const hasInvoice = (b.status === 'invoiced' || (b.invoice && b.invoice.trim() !== ''));

        tr.innerHTML = `
            <td class="px-4 py-4 whitespace-nowrap text-slate-700">${b.date ? b.date.split('-').reverse().join('/') : ''}</td>
            <td class="px-4 py-4 whitespace-nowrap font-bold text-slate-800">${b.agency || ''}</td>
            <td class="px-4 py-4 whitespace-nowrap truncate max-w-[120px]" title="${b.operator || ''}">${b.operator || ''}</td>
            <td class="px-4 py-4 whitespace-nowrap font-medium text-slate-700">${b.code || ''}</td>
            <td class="px-4 py-4 text-center text-amber-700 font-semibold">${pax}</td>
            <td class="px-4 py-4 text-right font-bold text-amber-600">${formatCurrency(total)}</td>
            <td class="px-4 py-4 text-center">
                ${hasInvoice ? `<span class="px-2 py-1 bg-emerald-50 text-emerald-600 rounded text-[10px] font-bold border border-emerald-200">${b.invoice}</span>` : '<span class="text-slate-300">-</span>'}
            </td>
            <td class="px-4 py-4 text-center">
                <span class="badge badge-${b.status}">${translateStatus(b.status)}</span>
            </td>
            <td class="px-4 py-4 text-right">
                <div class="flex justify-end gap-2">
                    <button onclick="editBooking(${b.id})" class="btn-icon" title="Sửa (Thêm HĐ)"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
                    <button onclick="deleteBooking(${b.id})" class="btn-icon btn-delete" title="Xóa"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </div>
            </td>
        `;
        list.appendChild(tr);
    });
    lucide.createIcons();
}

function renderAgencyStats() {
    const statsList = document.getElementById('agency-stats-list');
    statsList.innerHTML = '';
    
    const agencyData = {};
    bookings.forEach(b => {
        if (!agencyData[b.agency]) agencyData[b.agency] = { pax: 0, count: 0 };
        agencyData[b.agency].pax += parseInt(b.pax || 0);
        agencyData[b.agency].count += 1;
    });
    
    const sortedAgencies = Object.entries(agencyData).sort((a, b) => b[1].pax - a[1].pax).slice(0, 5);
    
    sortedAgencies.forEach(([name, data]) => {
        const totalPax = bookings.reduce((sum, b) => sum + parseInt(b.pax || 0), 0);
        const percentage = totalPax > 0 ? (data.pax / totalPax * 100).toFixed(0) : 0;
        
        const div = document.createElement('div');
        div.innerHTML = `
            <div class="flex justify-between items-center mb-2">
                <span class="text-sm font-semibold text-slate-700">${name}</span>
                <span class="text-xs font-bold text-slate-500">${data.pax} Pax (${data.count} bookings)</span>
            </div>
            <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div class="bg-amber-500 h-full rounded-full transition-all duration-1000" style="width: ${percentage}%"></div>
            </div>
        `;
        statsList.appendChild(div);
    });
}

// --- Form Handling ---
function calculateTotalForm() {
    const pax = parseInt(document.getElementById('form-pax').value) || 0;
    const price = parseInt(document.getElementById('form-price').value) || 0;
    const bike_sl = parseInt(document.getElementById('form-bike-sl').value) || 0;
    const bike_price = parseInt(document.getElementById('form-bike-price').value) || 0;
    const water_sl = parseInt(document.getElementById('form-water-sl').value) || 0;
    const water_price = parseInt(document.getElementById('form-water-price').value) || 0;
    const foc = parseInt(document.getElementById('form-foc').value) || 0;
    
    const total = (pax * price) + (bike_sl * bike_price) + (water_sl * water_price) - foc;
    document.getElementById('form-total-display').value = new Intl.NumberFormat('vi-VN').format(total);
}

function showAddModal() {
    document.getElementById('modal-title').innerText = 'Tạo mới Booking';
    document.getElementById('booking-form').reset();
    document.getElementById('booking-id').value = '';
    
    document.getElementById('form-bike-price').value = 100000;
    document.getElementById('form-water-price').value = 10000;
    calculateTotalForm();
    
    const modal = document.getElementById('booking-modal');
    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.add('active'), 10);
}

function hideAddModal() {
    const modal = document.getElementById('booking-modal');
    modal.classList.remove('active');
    setTimeout(() => modal.classList.add('hidden'), 300);
}

function handleFormSubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('booking-id').value;
    const pax = parseInt(document.getElementById('form-pax').value) || 0;
    const price = parseInt(document.getElementById('form-price').value) || 0;
    const bike_sl = parseInt(document.getElementById('form-bike-sl').value) || 0;
    const bike_price = parseInt(document.getElementById('form-bike-price').value) || 0;
    const water_sl = parseInt(document.getElementById('form-water-sl').value) || 0;
    const water_price = parseInt(document.getElementById('form-water-price').value) || 0;
    const foc = parseInt(document.getElementById('form-foc').value) || 0;
    
    // Calculate total amount: (Pax * Price) + (Bike * BikePrice) + (Water * WaterPrice) - FOC
    const calculatedAmount = (pax * price) + (bike_sl * bike_price) + (water_sl * water_price) - foc;

    const newBooking = {
        id: id ? parseInt(id) : Date.now(),
        agency: document.getElementById('form-agency').value,
        code: document.getElementById('form-code').value,
        date: document.getElementById('form-date').value,
        operator: document.getElementById('form-operator').value,
        guest: document.getElementById('form-guest').value,
        invoice: document.getElementById('form-invoice').value,
        pax: pax,
        price: price,
        bike_sl: bike_sl,
        bike_price: bike_price,
        water_sl: water_sl,
        water_price: water_price,
        foc: foc,
        amount: calculatedAmount,
        status: document.getElementById('form-status').value,
        note: document.getElementById('form-note').value
    };
    
    if (id) {
        const index = bookings.findIndex(b => b.id === parseInt(id));
        bookings[index] = newBooking;
        showToast('Đã cập nhật booking!', 'check');
    } else {
        bookings.push(newBooking);
        showToast('Đã thêm booking mới!', 'plus');
    }
    
    saveData();
    hideAddModal();
    renderDashboard();
    renderTable();
    populateAgencyFilter();
}

function editBooking(id) {
    const b = bookings.find(item => item.id === id);
    if (!b) return;
    
    document.getElementById('modal-title').innerText = 'Chỉnh sửa Booking';
    document.getElementById('booking-id').value = b.id;
    
    // Nếu tên công ty chưa có trong danh sách select, tạm thời thêm vào
    const formAgency = document.getElementById('form-agency');
    if (b.agency && ![...formAgency.options].map(o => o.value).includes(b.agency)) {
        const opt = document.createElement('option');
        opt.value = b.agency;
        opt.innerText = b.agency;
        formAgency.appendChild(opt);
    }
    formAgency.value = b.agency || '';

    document.getElementById('form-code').value = b.code || '';
    document.getElementById('form-date').value = b.date;
    document.getElementById('form-operator').value = b.operator || '';
    document.getElementById('form-guest').value = b.guest;
    document.getElementById('form-invoice').value = b.invoice || '';
    document.getElementById('form-pax').value = b.pax;
    document.getElementById('form-price').value = b.price || 0;
    document.getElementById('form-bike-sl').value = b.bike_sl || 0;
    document.getElementById('form-bike-price').value = b.bike_price !== undefined ? b.bike_price : 100000;
    document.getElementById('form-water-sl').value = b.water_sl || 0;
    document.getElementById('form-water-price').value = b.water_price !== undefined ? b.water_price : 10000;
    document.getElementById('form-status').value = b.status;
    document.getElementById('form-foc').value = b.foc || 0;
    document.getElementById('form-note').value = b.note;
    
    calculateTotalForm();
    
    const modal = document.getElementById('booking-modal');
    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.add('active'), 10);
}

function deleteBooking(id) {
    if (confirm('Bạn có chắc chắn muốn xóa booking này không?')) {
        bookings = bookings.filter(b => b.id !== id);
        saveData();
        renderDashboard();
        renderTable();
        showToast('Đã xóa booking', 'trash-2');
    }
}

// --- Helpers ---
function populateAgencyFilter() {
    const filter = document.getElementById('filter-agency');
    const formAgency = document.getElementById('form-agency');
    
    const agencies = [...new Set(bookings.map(b => b.agency).filter(Boolean))].sort();
    
    if (filter) {
        filter.innerHTML = '<option value="">Tất cả Đại lý</option>';
        agencies.forEach(a => {
            const opt = document.createElement('option');
            opt.value = a;
            opt.innerText = a;
            filter.appendChild(opt);
        });
    }

    if (formAgency) {
        const currentVal = formAgency.value;
        formAgency.innerHTML = '<option value="">-- Chọn đại lý --</option>';
        agencies.forEach(a => {
            const opt = document.createElement('option');
            opt.value = a;
            opt.innerText = a;
            formAgency.appendChild(opt);
        });
        
        if (currentVal && agencies.includes(currentVal)) {
            formAgency.value = currentVal;
        }
    }
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function translateStatus(status) {
    const map = { 
        'confirmed': 'Xác nhận', 
        'pending': 'Chờ xử lý', 
        'invoiced': 'Đã xuất HD', 
        'cancelled': 'Đã hủy' 
    };
    return map[status] || status;
}

function showToast(message, iconName) {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-message');
    const toastIcon = document.getElementById('toast-icon');
    
    toastMsg.innerText = message;
    toastIcon.innerHTML = `<i data-lucide="${iconName}" class="w-4 h-4 text-white"></i>`;
    lucide.createIcons();
    
    toast.classList.remove('opacity-0', 'translate-y-20');
    toast.classList.add('opacity-100', 'translate-y-0');
    
    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-20');
        toast.classList.remove('opacity-100', 'translate-y-0');
    }, 3000);
}

// --- Export Functions ---
function exportXlsx() {
    const data = bookings.map(b => ({
        'Ngày đến': formatDate(b.date),
        'Đại lý': b.agency,
        'Khách/Tour': b.guest,
        'Người lớn': b.pax,
        'Trẻ em': b.child,
        'Dịch vụ': b.service,
        'Giá trị': b.amount,
        'Trạng thái': translateStatus(b.status),
        'Ghi chú': b.note
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Bookings");
    XLSX.writeFile(wb, `Danh_sach_Booking_2026_${new Date().toLocaleDateString()}.xlsx`);
}

function exportPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4');
    
    // Add Unicode font for Vietnamese (Standard fonts don't support it well)
    // For simplicity, we'll use a standard font and hope for the best, or suggest user uses Excel
    // Professional implementation would require embedding a font like Roboto
    
    doc.setFontSize(18);
    doc.text("DANH SÁCH ĐẶT LỊCH - NHÀ HÀNG MEMORY 2026", 14, 20);
    
    const tableData = bookings.map(b => [
        formatDate(b.date),
        b.agency,
        b.guest,
        b.pax,
        b.service,
        formatCurrency(b.amount),
        translateStatus(b.status)
    ]);
    
    doc.autoTable({
        startY: 30,
        head: [['Ngày', 'Đại lý', 'Khách/Tour', 'Pax', 'Dịch vụ', 'Giá trị', 'Trạng thái']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [245, 158, 11] },
        styles: { font: 'helvetica', fontSize: 10 }
    });
    
    doc.save(`Booking_Report_2026.pdf`);
}
// --- Google Sheets Synchronization ---
async function syncGoogleSheets() {
    showToast('Đang quét và tải dữ liệu từ các sheet... Vui lòng đợi!', 'refresh-cw');
    
    const syncBtn = document.querySelector('button[onclick="syncGoogleSheets()"]');
    if (syncBtn) syncBtn.disabled = true;
    
    const SHEET_ID = '1ck7dyliLdDdhcmRiuwgo-ahUx1JtIhApYR_uArXwTVk';
    const SHEETS_TO_SYNC = {
        "EXO": "1737030180", "Aurora": "633018456", "Wideeydes": "1646090732",
        "Discova": "950090025", "Terra Indochina": "1836936009", "Vido tour": "1025372703",
        "Sen rừng": "1906466879", "Asia Exotica": "1094221168", "Avex Travel": "340619046",
        "Smile Travel": "1262719362", "Du lịch hồ gươm": "264948914", "Topas Travel": "590165919",
        "Asia Golf Trail": "654006445", "Saffrontravel": "169165853", "Indochina Travelland": "351205723",
        "Indochina Voyages": "87292317", "Vietnam Decouveter": "265493846", "Fantasea": "1342934234",
        "Threeland": "110451216", "4seasons Travel": "873149458", "Image Travel": "849443001",
        "Lily Travel (New)": "677915366", "EsyWays Travel ( New)": "519769478", "Asiatica Travel": "80709107",
        "Vietnamtourism": "1678726686", "Asam Travel (New)": "513845518", "Go Beyond": "759587261",
        "Asia Pacific Travel": "53955210", "ITS (NEW)": "1773904843", "Joy Mark": "158224769",
        "Desk Air": "1310105186", "Fine Asian Escapes": "313388583", "Vivu Travel (New)": "237711165",
        "Absolute Asia Travel": "2125010795", "Victoria Tour": "85652038", "G Plus": "1163648113",
        "Asia Pioneer": "1587350529", "Asean Link Travel": "190143606", "iLotus": "383860712",
        "Tiên phong Á Châu": "993483268", "FTrip Travel": "1275850616", "Glamour Adventures": "288361656",
        "Jacky Travel": "910519609", "Eviva Travel": "190428605", "New Orient Tour": "1466699628",
        "Vietnam Travel & Cruise": "126035614", "Tonkin Travel": "1753992483", "Hanoi Voyages": "1986248705",
        "Anasia Travel": "253150383", "Vietnam Travel Mart": "1085026967", "Anasia Link": "1910986182"
    };

    let newBookings = [];
    const entries = Object.entries(SHEETS_TO_SYNC);
    const batchSize = 5; 
    let successCount = 0;

    try {
        for (let i = 0; i < entries.length; i += batchSize) {
            const batch = entries.slice(i, i + batchSize);
            await Promise.all(batch.map(async ([sheetName, gid]) => {
                const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=${gid}`;
                try {
                    const res = await fetch(CSV_URL);
                    if (!res.ok) return;
                    const csvData = await res.text();
                    
                    const lines = csvData.split('\n');
                    
                    for (let j = 4; j < lines.length; j++) {
                        if (!lines[j] || lines[j].trim() === '') continue;
                        
                        const cols = lines[j].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^"|"$/g, '').trim());
                        if (cols.length < 5 || !cols[0]) continue; 

                        const dateStr = cols[0];
                        const operator = cols[1];
                        const agency = cols[2];
                        const code = cols[3];
                        const pax = parseInt(cols[4]) || 0;
                        const price = parseInt(cols[5]?.replace(/[^0-9]/g, '')) || 0;
                        const bike = parseInt(cols[7]) || 0;
                        const bikePrice = parseInt(cols[8]?.replace(/[^0-9]/g, '')) || 100000;
                        const water = parseInt(cols[10]) || 0;
                        const waterPrice = parseInt(cols[11]?.replace(/[^0-9]/g, '')) || 10000;
                        const foc = parseInt(cols[16]?.replace(/[^0-9]/g, '')) || 0;
                        const invoice = cols[14];
                        const note = cols[15];

                        if (!dateStr || dateStr === 'Ngày' || dateStr === '""') continue;

                        newBookings.push({
                            id: Date.now() + Math.floor(Math.random() * 1000000),
                            date: formatDateForApp(dateStr),
                            agency: agency || sheetName,
                            code: code || '',
                            operator: operator || '',
                            guest: note || 'Khách đoàn',
                            pax: pax,
                            price: price,
                            bike_sl: bike,
                            bike_price: bikePrice,
                            water_sl: water,
                            water_price: waterPrice,
                            foc: foc,
                            invoice: invoice || '',
                            amount: (pax * price) + (bike * bikePrice) + (water * waterPrice) - foc,
                            status: (invoice && invoice.trim() !== '') ? 'invoiced' : 'confirmed',
                            note: 'Đồng bộ từ Google Sheets'
                        });
                    }
                    successCount++;
                } catch (e) {
                    console.error("Lỗi khi tải sheet:", sheetName, e);
                }
            }));
            
            showToast(`Đang tải... (${Math.min(i + batchSize, entries.length)}/${entries.length} trang)`, 'refresh-cw');
        }

        if (syncBtn) syncBtn.disabled = false;

        if (newBookings.length > 0) {
            if (confirm(`Tìm thấy tổng cộng ${newBookings.length} booking. Ghi đè dữ liệu hiện tại?`)) {
                bookings = newBookings;
                saveData();
                renderDashboard();
                renderTable();
                renderDebtMonthFilter();
                renderDebtReport();
                showToast(`Đã đồng bộ ${newBookings.length} booking thành công!`, 'check');
            }
        } else {
            showToast('Không tìm thấy dữ liệu hợp lệ trên các sheet', 'x');
        }

    } catch (error) {
        console.error('Sync Error:', error);
        if (syncBtn) syncBtn.disabled = false;
        showToast('Lỗi đồng bộ. Hãy chắc chắn máy tính có kết nối mạng!', 'x');
    }
}

// --- Báo Cáo Công Nợ ---
function renderDebtMonthFilter() {
    const monthFilter = document.getElementById('debt-month-filter');
    const agencyFilter = document.getElementById('debt-agency-filter');
    if (!monthFilter || !agencyFilter) return;
    
    // Lấy danh sách các tháng (YYYY-MM) và công ty từ bookings
    const months = new Set();
    const agencies = new Set();
    
    bookings.forEach(b => {
        if(b.date) {
            const ym = b.date.substring(0, 7); // yyyy-mm
            months.add(ym);
        }
        if (b.agency) {
            agencies.add(b.agency);
        }
    });
    
    // Lưu lại giá trị đang chọn
    const currentMonth = monthFilter.value;
    const currentAgency = agencyFilter.value;

    const sortedMonths = Array.from(months).sort().reverse();
    monthFilter.innerHTML = '<option value="">Tất cả các tháng</option>';
    sortedMonths.forEach(ym => {
        const [year, month] = ym.split('-');
        monthFilter.innerHTML += `<option value="${ym}">Tháng ${month}/${year}</option>`;
    });

    const sortedAgencies = Array.from(agencies).sort();
    agencyFilter.innerHTML = '<option value="">Tất cả Công ty</option>';
    sortedAgencies.forEach(ag => {
        agencyFilter.innerHTML += `<option value="${ag}">${ag}</option>`;
    });

    // Phục hồi giá trị cũ
    if (currentMonth) monthFilter.value = currentMonth;
    if (currentAgency) agencyFilter.value = currentAgency;
}

function renderDebtReport() {
    const summaryTable = document.getElementById('debt-summary-table');
    const detailTable = document.getElementById('debt-detail-table');
    
    const monthFilter = document.getElementById('debt-month-filter').value;
    const agencyFilter = document.getElementById('debt-agency-filter').value;
    
    let filteredBookings = bookings;
    if (monthFilter) {
        filteredBookings = bookings.filter(b => b.date && b.date.startsWith(monthFilter));
    }
    if (agencyFilter) {
        filteredBookings = filteredBookings.filter(b => b.agency === agencyFilter);
    }
    
    if (agencyFilter) {
        // Hiển thị bảng chi tiết khi có chọn 1 công ty cụ thể
        if(summaryTable) summaryTable.classList.add('hidden');
        if(detailTable) detailTable.classList.remove('hidden');
        
        const list = document.getElementById('debt-detail-list');
        if(!list) return;
        list.innerHTML = '';
        
        filteredBookings.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        let sumPax = 0, sumAmount = 0, sumInvoices = 0;
        
        filteredBookings.forEach(b => {
            const pax = parseInt(b.pax) || 0;
            const price = parseInt(b.price) || 0;
            const ttPax = pax * price;
            
            const bike = parseInt(b.bike_sl) || 0;
            const bikePrice = parseInt(b.bike_price) || 0;
            const ttBike = bike * bikePrice;
            
            const water = parseInt(b.water_sl) || 0;
            const waterPrice = parseInt(b.water_price) || 0;
            const ttWater = water * waterPrice;
            
            const foc = parseInt(b.foc) || 0;
            const total = (b.amount !== undefined) ? parseInt(b.amount) : (ttPax + ttBike + ttWater - foc);
            
            sumPax += pax;
            sumAmount += total;
            const hasInvoice = (b.status === 'invoiced' || (b.invoice && b.invoice.trim() !== ''));
            if (hasInvoice) sumInvoices++;

            const tr = document.createElement('tr');
            tr.className = 'hover:bg-slate-50 transition-colors';
            tr.innerHTML = `
                <td class="px-3 py-3 border-b border-slate-100 whitespace-nowrap text-slate-700">${b.date ? b.date.split('-').reverse().join('/') : ''}</td>
                <td class="px-3 py-3 border-b border-slate-100 whitespace-nowrap truncate max-w-[150px]" title="${b.operator || ''}">${b.operator || ''}</td>
                <td class="px-3 py-3 border-b border-slate-100 whitespace-nowrap font-medium text-slate-700">${b.code || ''}</td>
                <td class="px-3 py-3 border-b border-slate-100 text-center">${pax}</td>
                <td class="px-3 py-3 border-b border-slate-100 text-right text-slate-600">${formatCurrency(ttPax)}</td>
                <td class="px-3 py-3 border-b border-slate-100 text-right text-slate-600">${formatCurrency(ttBike)}</td>
                <td class="px-3 py-3 border-b border-slate-100 text-right text-slate-600">${formatCurrency(ttWater)}</td>
                <td class="px-3 py-3 border-b border-slate-100 text-right text-rose-500">${foc > 0 ? '-' + formatCurrency(foc) : ''}</td>
                <td class="px-3 py-3 border-b border-slate-100 text-right font-bold text-amber-600">${formatCurrency(total)}</td>
                <td class="px-3 py-3 border-b border-slate-100 text-center">
                    ${hasInvoice ? `<span class="px-2 py-1 bg-emerald-50 text-emerald-600 rounded text-[10px] font-bold border border-emerald-200">${b.invoice}</span>` : '<span class="text-slate-300">-</span>'}
                </td>
            `;
            list.appendChild(tr);
        });
        
        document.getElementById('debt-detail-total-pax').innerText = sumPax;
        document.getElementById('debt-detail-total-amount').innerText = formatCurrency(sumAmount);
        document.getElementById('debt-detail-total-invoices').innerText = sumInvoices;
        
    } else {
        // Hiển thị bảng tổng hợp
        if(summaryTable) summaryTable.classList.remove('hidden');
        if(detailTable) detailTable.classList.add('hidden');
        
        const list = document.getElementById('debt-list');
        if (!list) return;
        list.innerHTML = '';
        
        const agencyDebt = {};
        filteredBookings.forEach(b => {
            const agency = b.agency || 'Khác';
            if (!agencyDebt[agency]) {
                agencyDebt[agency] = { count: 0, totalAmount: 0, invoices: 0 };
            }
            agencyDebt[agency].count += 1;
            agencyDebt[agency].totalAmount += (b.amount || 0);
            if (b.status === 'invoiced' || (b.invoice && b.invoice.trim() !== '')) {
                agencyDebt[agency].invoices += 1;
            }
        });
        
        const sortedAgencies = Object.entries(agencyDebt).sort((a, b) => b[1].totalAmount - a[1].totalAmount);
        
        let totalBookingsAll = 0, totalAmountAll = 0, totalInvoicesAll = 0;
        
        sortedAgencies.forEach(([agencyName, data]) => {
            totalBookingsAll += data.count;
            totalAmountAll += data.totalAmount;
            totalInvoicesAll += data.invoices;
            
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-slate-50 transition-colors';
            tr.innerHTML = `
                <td class="px-6 py-4 font-bold text-slate-900">${agencyName}</td>
                <td class="px-6 py-4 text-center font-medium">${data.count}</td>
                <td class="px-6 py-4 text-right font-bold text-slate-700">${formatCurrency(data.totalAmount)}</td>
                <td class="px-6 py-4 text-center">
                    <span class="inline-flex items-center gap-1 ${data.invoices === data.count ? 'text-emerald-600' : (data.invoices > 0 ? 'text-amber-500' : 'text-slate-400')}">
                        <i data-lucide="${data.invoices === data.count ? 'check-circle-2' : (data.invoices > 0 ? 'alert-circle' : 'circle')}" class="w-4 h-4"></i>
                        ${data.invoices}/${data.count} HĐ
                    </span>
                </td>
            `;
            list.appendChild(tr);
        });
        
        document.getElementById('debt-total-bookings').innerText = totalBookingsAll;
        document.getElementById('debt-total-amount').innerText = formatCurrency(totalAmountAll);
        document.getElementById('debt-total-invoices').innerText = totalInvoicesAll;
    }
    
    lucide.createIcons();
}

function exportDebtExcel() {
    const monthFilter = document.getElementById('debt-month-filter').value;
    const agencyFilter = document.getElementById('debt-agency-filter').value;
    
    let monthText = "Tất cả";
    if (monthFilter) {
        const [year, month] = monthFilter.split('-');
        monthText = `${month}/${year}`;
    }
    
    const companyText = agencyFilter || "Tất cả Công ty";

    // Lọc dữ liệu
    let dataToExport = bookings;
    if (monthFilter) {
        dataToExport = dataToExport.filter(b => b.date && b.date.startsWith(monthFilter));
    }
    if (agencyFilter) {
        dataToExport = dataToExport.filter(b => b.agency === agencyFilter);
    }
    
    dataToExport.sort((a, b) => new Date(a.date) - new Date(b.date));

    const aoa = [];
    
    aoa.push(["CÔNG TY TNHH MTV DU LỊCH VĂN HÓA ĐÔNG DƯƠNG", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""]);
    aoa.push(["", "", "", "", "TỔNG HỢP CÔNG NỢ THEO THÁNG", "", "", "", "", "", "", "", "", "", "", "", ""]);
    aoa.push(["Tháng", monthText, "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""]);
    aoa.push(["Công ty:", companyText, "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""]);
    aoa.push(["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""]);
    
    aoa.push([
        "Ngày", "Điều Hành", "Công Ty", "Code", "SL", "Giá Tiền", "Thành Tiền", 
        "Xe đạp", "", "", 
        "Nước lọc", "", "", 
        "Tổng Tiền", "Hóa Đơn", "Ghi chú", "Trừ FOOC"
    ]);
    
    aoa.push([
        "", "", "", "", "", "", "", 
        "SL", "Giá Tiền", "Thành Tiền", 
        "SL", "Đơn giá", "Thành Tiền", 
        "", "", "", ""
    ]);

    let sumThanhTienPax = 0;
    let sumThanhTienXe = 0;
    let sumThanhTienNuoc = 0;
    let sumTongTien = 0;

    dataToExport.forEach(b => {
        const pax = parseInt(b.pax) || 0;
        const price = parseInt(b.price) || 0;
        const ttPax = pax * price;
        
        const bike = parseInt(b.bike_sl) || 0;
        const bikePrice = parseInt(b.bike_price) || 0;
        const ttBike = bike * bikePrice;
        
        const water = parseInt(b.water_sl) || 0;
        const waterPrice = parseInt(b.water_price) || 0;
        const ttWater = water * waterPrice;
        
        const foc = parseInt(b.foc) || 0;
        const total = (b.amount !== undefined) ? parseInt(b.amount) : (ttPax + ttBike + ttWater - foc);
        
        sumThanhTienPax += ttPax;
        sumThanhTienXe += ttBike;
        sumThanhTienNuoc += ttWater;
        sumTongTien += total;

        aoa.push([
            b.date ? b.date.split('-').reverse().join('/') : '',
            b.operator || '',
            b.agency || '',
            b.code || '',
            pax || '',
            price || '',
            ttPax || '',
            bike || '',
            bikePrice || '',
            ttBike || '',
            water || '',
            waterPrice || '',
            ttWater || '',
            total || '',
            b.invoice || '',
            b.note || '',
            foc || ''
        ]);
    });

    aoa.push([
        "TỔNG CỘNG", "", "", "", "", "", sumThanhTienPax || "",
        "", "", sumThanhTienXe || "",
        "", "", sumThanhTienNuoc || "",
        sumTongTien || "", "", "", ""
    ]);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(aoa);

    ws['!merges'] = [
        { s: {r:0, c:0}, e: {r:0, c:3} },
        { s: {r:1, c:4}, e: {r:1, c:12} },
        { s: {r:5, c:0}, e: {r:6, c:0} },
        { s: {r:5, c:1}, e: {r:6, c:1} },
        { s: {r:5, c:2}, e: {r:6, c:2} },
        { s: {r:5, c:3}, e: {r:6, c:3} },
        { s: {r:5, c:4}, e: {r:6, c:4} },
        { s: {r:5, c:5}, e: {r:6, c:5} },
        { s: {r:5, c:6}, e: {r:6, c:6} },
        { s: {r:5, c:7}, e: {r:5, c:9} },
        { s: {r:5, c:10}, e: {r:5, c:12} },
        { s: {r:5, c:13}, e: {r:6, c:13} },
        { s: {r:5, c:14}, e: {r:6, c:14} },
        { s: {r:5, c:15}, e: {r:6, c:15} },
        { s: {r:5, c:16}, e: {r:6, c:16} },
        { s: {r: aoa.length - 1, c:0}, e: {r: aoa.length - 1, c:5} }
    ];

    ws['!cols'] = [
        { wch: 12 }, { wch: 15 }, { wch: 20 }, { wch: 15 },
        { wch: 5 },  { wch: 12 }, { wch: 12 }, { wch: 5 },
        { wch: 10 }, { wch: 12 }, { wch: 5 },  { wch: 10 },
        { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 30 },
        { wch: 12 }
    ];

    // Áp dụng style (màu sắc, viền, font, pageSetup) cho file Excel đẹp mắt
    const range = XLSX.utils.decode_range(ws['!ref']);
    for(let R = 0; R <= range.e.r; ++R) {
        for(let C = 0; C <= range.e.c; ++C) {
            const cell_address = {c:C, r:R};
            const cell_ref = XLSX.utils.encode_cell(cell_address);
            if(!ws[cell_ref]) ws[cell_ref] = { t: "s", v: "" }; 
            
            let cell = ws[cell_ref];
            if (!cell.s) cell.s = {};
            
            // Default border and alignment cho dữ liệu (R >= 5)
            if (R >= 5) {
                cell.s.border = {
                    top: { style: 'thin', color: { auto: 1 } },
                    bottom: { style: 'thin', color: { auto: 1 } },
                    left: { style: 'thin', color: { auto: 1 } },
                    right: { style: 'thin', color: { auto: 1 } }
                };
                cell.s.alignment = { vertical: 'center' };
                // Thêm wrap text cho ghi chú
                if (C === 15) cell.s.alignment.wrapText = true;
            }
            
            // Header chính
            if (R === 0 && C === 0) {
                cell.s.font = { bold: true, sz: 12, color: { rgb: "1F497D" } };
            }
            if (R === 1 && C === 4) {
                cell.s.font = { bold: true, sz: 16 };
                cell.s.alignment = { horizontal: "center", vertical: "center" };
            }
            if (R === 2 || R === 3) {
                cell.s.font = { bold: true };
            }
            
            // Header Bảng
            if (R === 5 || R === 6) {
                cell.s.font = { bold: true };
                cell.s.fill = { fgColor: { rgb: "EFEFEF" } };
                cell.s.alignment = { horizontal: "center", vertical: "center", wrapText: true };
            }
            
            // Dòng TỔNG CỘNG
            if (R === range.e.r) {
                cell.s.font = { bold: true };
                cell.s.fill = { fgColor: { rgb: "FFF2CC" } }; // Màu vàng nhẹ
                if (C === 0) {
                    cell.s.alignment = { horizontal: "center", vertical: "center" };
                }
            }
            
            // Căn lề số tiền và số lượng
            if (R > 6 && R <= range.e.r && (C >= 4 && C <= 13 || C === 16)) {
                if (C !== 15 && C !== 14) {
                    cell.s.alignment = { horizontal: "right", vertical: "center" };
                    if (typeof cell.v === 'number' || (typeof cell.v === 'string' && !isNaN(cell.v) && cell.v !== '')) {
                        cell.t = 'n'; // Ép kiểu số
                        cell.z = '#,##0'; // Định dạng số có dấu phẩy
                    }
                }
            }
        }
    }

    // Set page orientation to landscape for A4
    ws['!pageSetup'] = { orientation: 'landscape', paperSize: 9, fitToWidth: 1 };

    XLSX.utils.book_append_sheet(wb, ws, "CongNo");

    const fileNameDate = monthFilter ? monthFilter : 'TatCa';
    const fileNameAgency = agencyFilter ? agencyFilter.replace(/[^a-zA-Z0-9]/g, '') : 'TatCaCTY';
    
    XLSX.writeFile(wb, `Bao_Cao_Cong_No_${fileNameAgency}_${fileNameDate}.xlsx`);
}

function formatDateForApp(str) {
    // Convert DD/MM/YYYY to YYYY-MM-DD
    const parts = str.split('/');
    if (parts.length === 3) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    return str;
}

// --- Sync Back to Sheets (via Apps Script) ---
async function syncBackToSheets() {
    const list = document.getElementById('main-booking-list');
    if (!list) return;

    // Tìm tất cả các booking đã có hóa đơn để đồng bộ
    const updates = bookings.filter(b => b.invoice && b.invoice.trim() !== '').map(b => ({
        sheetName: b.agency,
        code: b.code,
        date: b.date,
        invoice: b.invoice
    }));

    if (updates.length === 0) {
        showToast('Không có Hóa Đơn nào cần đồng bộ.', 'alert-circle');
        return;
    }

    showToast('Đang đẩy dữ liệu lên Google Sheets... Vui lòng đợi!', 'refresh-cw');
    
    const syncBtn = document.querySelector('button[onclick="syncBackToSheets()"]');
    if(syncBtn) syncBtn.disabled = true;

    // URL Web App của Google Apps Script
    const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby-QEyUxfMPBpqx7f55juKrvQH28iACZ8VdJ_b_0VP1dinlVNbUc4oP9EEGq2P0Evs/exec";

    try {
        const res = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({ updates: updates })
            // Không set Content-Type để tránh lỗi CORS Preflight
        });
        
        const result = await res.json();
        
        if (result.status === "success") {
            showToast(`Tuyệt vời! Đã cập nhật thành công ${result.updated} dòng vào Google Sheets.`, 'check-circle-2');
        } else {
            console.error('Apps Script Error:', result);
            showToast('Lỗi từ Google: ' + (result.message || 'Không xác định'), 'x');
        }
    } catch (error) {
        console.error('Sync Back Error:', error);
        showToast('Lỗi mạng! Không thể kết nối tới Google Sheets. Vui lòng thử lại.', 'x');
    } finally {
        if(syncBtn) syncBtn.disabled = false;
        lucide.createIcons();
    }
}
