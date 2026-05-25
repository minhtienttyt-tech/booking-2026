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

    // Các cột trong Sheet (0-indexed):
    // 0:Ngày, 1:Điều hành, 2:Công ty, 3:Code, 4:Pax, 5:Giá Pax, 6:TT Pax
    // 7:Xe đạp, 8:Giá xe, 9:TT Xe, 10:Nước, 11:Giá nước, 12:TT Nước
    // 13:Tổng tiền, 14:Hóa đơn, 15:Ghi chú (Tên khách), 16:Trừ FOC
    
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
        const rowGuest = values[i][15] ? values[i][15].toString().trim() : '';
        
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
          // Update 17 cột
          sheet.getRange(rowIndex, 1, 1, 17).setValues([updatedRow]);
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
  const total = (data.amount !== undefined && data.amount !== null) ? data.amount : (ttPax + ttBike + ttWater - (data.foc || 0));

  return [
    formatDateForSheet(data.date) || '', // 0
    data.operator || '', // 1
    data.agency || '', // 2
    data.code || '', // 3
    data.pax || 0, // 4
    data.price || 0, // 5
    ttPax, // 6
    data.bike_sl || 0, // 7
    data.bike_price || 0, // 8
    ttBike, // 9
    data.water_sl || 0, // 10
    data.water_price || 0, // 11
    ttWater, // 12
    total, // 13
    data.invoice || '', // 14
    data.guest || data.note || '', // 15
    data.foc || 0 // 16
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
      sheet.getRange(rowIndex, 15).setValue(update.invoice); // Cột Hóa Đơn
      updatedCount++;
    }
  }

  return ContentService.createTextOutput(JSON.stringify({ 
    status: "success", 
    updated: updatedCount,
    errors: errors 
  })).setMimeType(ContentService.MimeType.JSON);
}

// Hàm DoGet để Test API đang chạy
function doGet(e) {
  return ContentService.createTextOutput("API Booking 2026 đang hoạt động!").setMimeType(ContentService.MimeType.TEXT);
}
