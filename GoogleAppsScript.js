/**
 * GOOGLE APPS SCRIPT CHO BOOKING MANAGEMENT 2026
 * Tính năng: API Backend để đồng bộ 2 chiều (Webapp <-> Google Sheets)
 * 
 * HƯỚNG DẪN CÀI ĐẶT:
 * 1. Mở file Google Sheets của bạn.
 * 2. Chọn Tiện ích mở rộng (Extensions) > Apps Script.
 * 3. Xóa code cũ và dán toàn bộ đoạn code dưới đây vào.
 * 4. Bấm Lưu (biểu tượng đĩa mềm).
 * 5. Bấm Triển khai (Deploy) > Tùy chọn triển khai mới (New deployment).
 * 6. Chọn loại: Ứng dụng web (Web app).
 *    - Quyền truy cập: Bất kỳ ai (Anyone).
 * 7. Bấm Triển khai, sau đó cấp quyền (Authorize) nếu được hỏi.
 * 8. Copy URL Ứng dụng web (Web app URL) và dán vào file `app.js` trong Webapp của bạn (biến `APPS_SCRIPT_URL`).
 */

// ĐIỀN ID GOOGLE SHEETS CỦA BẠN VÀO ĐÂY:
const SHEET_ID = '1ck7dyliLdDdhcmRiuwgo-ahUx1JtIhApYR_uArXwTVk'; 

function doPost(e) {
  // CORS Headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };

  try {
    const payload = JSON.parse(e.postData.contents);
    
    // Nếu là dạng cập nhật Hóa Đơn (syncBackToSheets cũ)
    if (payload.updates && Array.isArray(payload.updates)) {
      return handleLegacyBatchUpdate(payload.updates);
    }

    const action = payload.action;
    const data = payload.data;
    
    if (!action || !data) {
      throw new Error("Dữ liệu không hợp lệ: Thiếu action hoặc data");
    }

    const sheetName = data.sheetName || data.agency;
    if (!sheetName) throw new Error("Thiếu Tên Đại lý (sheetName/agency)");

    const ss = SpreadsheetApp.openById(SHEET_ID);
    let sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      throw new Error("Không tìm thấy Sheet Đại lý: " + sheetName);
    }

    // 0:Ngày, 1:Điều hành, 2:Công ty, 3:Code, 
    // 4:Pax (SL), 5:Giá Pax, 6:TT Pax, 
    // 7:Xe máy SL, 8:Giá Xe máy, 9:TT Xe máy,
    // 10:Xe đạp SL, 11:Giá Xe đạp, 12:TT Xe đạp, 
    // 13:Đồ uống SL, 14:Giá Đồ uống, 15:TT Đồ uống,
    // 16:Tổng tiền, 17:Hóa đơn, 18:Ghi chú, 19:Trừ FOC
    
    if (action === 'CREATE') {
      const newRow = calculateRowArray(data);
      sheet.appendRow(newRow);
      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Đã tạo mới thành công trên Sheet", row: newRow }))
                           .setMimeType(ContentService.MimeType.JSON);
    } 
    else if (action === 'UPDATE' || action === 'DELETE') {
      const dataRange = sheet.getDataRange();
      const values = dataRange.getValues();
      let rowIndex = -1;
      
      // Bắt đầu từ dòng 5 (index 4) - Bỏ qua 4 dòng tiêu đề
      for (let i = 4; i < values.length; i++) {
        const rowCode = values[i][3] ? values[i][3].toString().trim() : '';
        const rowDate = values[i][0] ? values[i][0].toString().trim() : '';
        const rowGuest = values[i][18] ? values[i][18].toString().trim() : '';
        
        // Ưu tiên tìm theo Code
        if (data.code && data.code.trim() !== '' && rowCode === data.code.trim()) {
            rowIndex = i + 1; // getRange dùng 1-based index
            break;
        }
        // Nếu không có code, tìm theo Ngày và Tên khách
        const dataDateApp = formatDateForSheet(data.date);
        if ((!data.code || data.code.trim() === '') && rowDate === dataDateApp && rowGuest === (data.guest || '')) {
            rowIndex = i + 1;
            break;
        }
      }

      if (rowIndex > -1) {
        if (action === 'DELETE') {
          sheet.deleteRow(rowIndex);
          return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Đã xóa booking trên Sheet" }))
                               .setMimeType(ContentService.MimeType.JSON);
        } else if (action === 'UPDATE') {
          const updatedRow = calculateRowArray(data);
          // Update 20 cột
          sheet.getRange(rowIndex, 1, 1, 20).setValues([updatedRow]);
          return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Đã cập nhật booking trên Sheet" }))
                               .setMimeType(ContentService.MimeType.JSON);
        }
      } else {
         return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Không tìm thấy booking cũ trên Sheet để " + action }))
                              .setMimeType(ContentService.MimeType.JSON);
      }
    }

  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: e.toString() }))
                         .setMimeType(ContentService.MimeType.JSON);
  }
}

function calculateRowArray(data) {
  const ttPax = (data.pax || 0) * (data.price || 0);
  const ttBike = (data.bike_sl || 0) * (data.bike_price || 0);
  const ttWater = (data.water_sl || 0) * (data.water_price || 0);
  const ttMoto = (data.moto_sl || 0) * (data.moto_price || 0);
  const total = (data.amount !== undefined && data.amount !== null) ? data.amount : (ttPax + ttBike + ttWater + ttMoto - (data.foc || 0));

  return [
    formatDateForSheet(data.date) || '', // 0
    data.operator || '', // 1 (Điều Hành)
    data.agency || '', // 2
    data.code || '', // 3
    data.pax || 0, // 4 (SL)
    data.price || 0, // 5
    ttPax, // 6
    data.moto_sl || 0, // 7 (Xe máy SL)
    data.moto_price || 0, // 8
    ttMoto, // 9
    data.bike_sl || 0, // 10 (Xe đạp SL)
    data.bike_price || 0, // 11
    ttBike, // 12
    data.water_sl || 0, // 13 (Đồ uống SL)
    data.water_price || 0, // 14
    ttWater, // 15
    total, // 16 (Tổng Tiền)
    data.invoice || '', // 17 (Hóa đơn)
    data.guest || data.note || '', // 18 (Ghi chú)
    data.foc || 0 // 19 (Trừ FOC)
  ];
}

function formatDateForSheet(str) {
    // Chuyển YYYY-MM-DD sang DD/MM/YYYY
    if (!str) return '';
    if (str.includes('-')) {
        const parts = str.split('-');
        if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return str;
}

// Xử lý hàm cập nhật cũ
function handleLegacyBatchUpdate(updates) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let updatedCount = 0;
  let errors = [];

  for (let i = 0; i < updates.length; i++) {
    const update = updates[i];
    const sheet = ss.getSheetByName(update.sheetName);
    if (!sheet) continue;

    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();

    let rowIndex = -1;
    for (let j = 4; j < values.length; j++) {
      if (values[j][3] == update.code) {
        rowIndex = j + 1;
        break;
      }
    }

    if (rowIndex > -1) {
      // Hóa đơn ở cột R (index 17, column 18 in getRange)
      sheet.getRange(rowIndex, 18).setValue(update.invoice); 
      updatedCount++;
    }
  }

  return ContentService.createTextOutput(JSON.stringify({ 
    status: "success", 
    updated: updatedCount,
    errors: errors 
  })).setMimeType(ContentService.MimeType.JSON);
}

// Hàm DoGet trả về toàn bộ dữ liệu (Thay thế cơ chế đọc CSV cũ)
function doGet(e) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS"
  };
  
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheets = ss.getSheets();
    let allBookings = [];
    
    for (let i = 0; i < sheets.length; i++) {
        const sheet = sheets[i];
        const sheetName = sheet.getName();
        
        // Bỏ qua các sheet không phải là dữ liệu (như Tổng Hợp, Data...) hoặc bị ẩn
        if (sheet.isSheetHidden() || sheetName.toLowerCase().includes("tổng hợp")) continue;
        
        const values = sheet.getDataRange().getDisplayValues();
        // Dữ liệu bắt đầu từ dòng 5 (index 4)
        for (let r = 4; r < values.length; r++) {
            const dateStr = values[r][0];
            const code = values[r][3];
            
            // Bỏ qua dòng trống hoặc dòng tiêu đề
            const dateString = dateStr ? dateStr.toString().trim().toLowerCase() : '';
            if (!dateString || dateString.includes('ngày') || dateString === 'date') continue;
            
            allBookings.push({
                id: Date.now() + Math.floor(Math.random() * 1000000) + r,
                date: formatDateForApp(dateStr),
                agency: sheetName,
                code: code ? code.toString().trim() : '',
                operator: values[r][1] ? values[r][1].toString() : '',
                pax: parseInt(values[r][4]) || 0,
                price: parseInt(values[r][5]) || 0,
                moto_sl: parseInt(values[r][7]) || 0,
                moto_price: parseInt(values[r][8]) || 150000,
                bike_sl: parseInt(values[r][10]) || 0,
                bike_price: parseInt(values[r][11]) || 100000,
                water_sl: parseInt(values[r][13]) || 0,
                water_price: parseInt(values[r][14]) || 10000,
                amount: parseInt(values[r][16]) || 0,
                invoice: values[r][17] ? values[r][17].toString() : '',
                guest: values[r][18] ? values[r][18].toString() : 'Khách đoàn',
                foc: parseInt(values[r][19]) || 0,
                status: (values[r][17] && values[r][17].toString().trim() !== '') ? 'invoiced' : 'confirmed',
                note: 'Đồng bộ từ Google Sheets'
            });
        }
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success", data: allBookings })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function formatDateForApp(dateObj) {
  if (dateObj instanceof Date) {
     const y = dateObj.getFullYear();
     const m = String(dateObj.getMonth() + 1).padStart(2, '0');
     const d = String(dateObj.getDate()).padStart(2, '0');
     return `${y}-${m}-${d}`;
  }
  
  if (typeof dateObj === 'string' && dateObj.includes('/')) {
      const parts = dateObj.split('/');
      if(parts.length === 3) return `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`;
  }
  return dateObj ? dateObj.toString() : '';
}
