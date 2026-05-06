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
        // Sample initial data
        bookings = [
            { id: 1, date: '2026-01-15', agency: 'EXO Travel', guest: 'Mr. & Mrs. Johnson', pax: 2, child: 0, service: 'Set Menu', amount: 1500000, status: 'confirmed', note: 'Allergy: Shellfish' },
            { id: 2, date: '2026-01-16', agency: 'Discova', guest: 'Tour Group A - 15 Pax', pax: 15, child: 2, service: 'Buffet', amount: 7500000, status: 'confirmed', note: 'Vegetarian: 3 pax' },
            { id: 3, date: '2026-01-20', agency: 'Khách lẻ', guest: 'Nguyễn Văn A', pax: 4, child: 1, service: 'A La Carte', amount: 2000000, status: 'pending', note: '' }
        ];
        saveData();
    }
    
    updateStats();
    renderDashboard();
    renderTable();
    populateAgencyFilter();
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
        'reports': { main: 'Báo cáo', sub: 'Phân tích hiệu suất kinh doanh' }
    };
    
    document.getElementById('page-title').innerText = titles[view].main;
    document.getElementById('page-subtitle').innerText = titles[view].sub;

    if (view === 'dashboard') renderDashboard();
    if (view === 'bookings') renderTable();
    
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
                <div class="font-semibold text-slate-900">${b.agency}</div>
                <div class="text-xs text-slate-500">${b.guest}</div>
            </td>
            <td class="px-6 py-4">
                <div class="text-sm font-medium">${formatDate(b.date)}</div>
            </td>
            <td class="px-6 py-4">
                <div class="text-sm">${b.pax} Pax</div>
            </td>
            <td class="px-6 py-4">
                <span class="badge badge-${b.status}">${translateStatus(b.status)}</span>
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
    const filterAgency = document.getElementById('filter-agency').value;
    const filterStatus = document.getElementById('filter-status').value;
    const search = document.getElementById('search-input').value.toLowerCase();
    
    list.innerHTML = '';
    
    let filtered = bookings.filter(b => {
        const matchAgency = filterAgency === '' || b.agency === filterAgency;
        const matchStatus = filterStatus === '' || b.status === filterStatus;
        const matchSearch = b.agency.toLowerCase().includes(search) || b.guest.toLowerCase().includes(search);
        return matchAgency && matchStatus && matchSearch;
    });
    
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    filtered.forEach(b => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="px-6 py-4 font-medium">${formatDate(b.date)}</td>
            <td class="px-6 py-4">
                <div class="font-bold text-slate-800">${b.agency}</div>
            </td>
            <td class="px-6 py-4 text-slate-600">${b.guest}</td>
            <td class="px-6 py-4 text-slate-500 italic">${b.service}</td>
            <td class="px-6 py-4 text-center font-semibold text-amber-700">${b.pax}</td>
            <td class="px-6 py-4">
                <span class="badge badge-${b.status}">${translateStatus(b.status)}</span>
            </td>
            <td class="px-6 py-4 text-right">
                <div class="flex justify-end gap-2">
                    <button onclick="editBooking(${b.id})" class="btn-icon" title="Sửa"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
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
function showAddModal() {
    document.getElementById('modal-title').innerText = 'Tạo mới Booking';
    document.getElementById('booking-form').reset();
    document.getElementById('booking-id').value = '';
    
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
    const newBooking = {
        id: id ? parseInt(id) : Date.now(),
        agency: document.getElementById('form-agency').value,
        date: document.getElementById('form-date').value,
        guest: document.getElementById('form-guest').value,
        pax: parseInt(document.getElementById('form-pax').value),
        child: parseInt(document.getElementById('form-child').value),
        service: document.getElementById('form-service').value,
        status: document.getElementById('form-status').value,
        amount: parseInt(document.getElementById('form-amount').value || 0),
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
    document.getElementById('form-agency').value = b.agency;
    document.getElementById('form-date').value = b.date;
    document.getElementById('form-guest').value = b.guest;
    document.getElementById('form-pax').value = b.pax;
    document.getElementById('form-child').value = b.child;
    document.getElementById('form-service').value = b.service;
    document.getElementById('form-status').value = b.status;
    document.getElementById('form-amount').value = b.amount;
    document.getElementById('form-note').value = b.note;
    
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
    const agencies = [...new Set(bookings.map(b => b.agency))];
    
    filter.innerHTML = '<option value="">Tất cả Đại lý</option>';
    agencies.forEach(a => {
        const opt = document.createElement('option');
        opt.value = a;
        opt.innerText = a;
        filter.appendChild(opt);
    });
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
    const map = { 'confirmed': 'Xác nhận', 'pending': 'Chờ xử lý', 'cancelled': 'Đã hủy' };
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
