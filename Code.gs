const SPREADSHEET_ID = '1YbmJS4SAlTmDoiydxoTQ8Qkm_RmxL9BqwCzb-4GRrFg';
const PRODUCTS_SHEET_NAME = 'منتجات';
const SALES_SHEET_NAME = 'المبيعات';
const PRODUCTS_DATA_RANGE = 'A4:C';
const SALES_DATA_RANGE = 'A4:D';

/**
 * Handles GET requests to the web app.
 */
function doGet(e) {
  try {
    const action = e.parameter.action;

    if (action === 'getProducts') {
      return getProducts();
    } else if (action === 'getSales') {
      return getSales();
    } else if (action === 'appendSale') {
      return appendSale(e);
    } else {
      return createJsonResponse({ success: false, error: 'Invalid action specified.' });
    }
  } catch (error) {
    Logger.log('Error in doGet: ' + error);
    return createJsonResponse({ success: false, error: 'An unexpected error occurred: ' + error.message });
  }
}

/**
 * Fetches product data from the spreadsheet.
 */
function getProducts() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(PRODUCTS_SHEET_NAME);
    if (!sheet) {
      return createJsonResponse({ success: false, error: `Sheet '${PRODUCTS_SHEET_NAME}' not found.` });
    }

    const range = sheet.getRange(PRODUCTS_DATA_RANGE + sheet.getLastRow());
    const values = range.getValues().filter(row => row[0] && String(row[0]).trim() !== '');

    const products = values.map(row => ({
      name: String(row[0]).trim(),
      price: parseFloat(row[1]) || 0,
      qty: parseInt(row[2]) || 0
    }));

    return createJsonResponse({ success: true, data: products });
  } catch (error) {
    Logger.log('Error fetching products: ' + error);
    return createJsonResponse({ success: false, error: 'Failed to fetch products: ' + error.message });
  }
}

/**
 * Appends a sale record into a fixed range A4:D100.
 */
function appendSale(e) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SALES_SHEET_NAME);
    if (!sheet) {
      return createJsonResponse({ success: false, error: `Sheet '${SALES_SHEET_NAME}' not found.` });
    }

    // Validate parameters
    const date = e.parameter.date;
    const product = e.parameter.product;
    const total = e.parameter.total;
    const soldQty = e.parameter.soldQty;

    if (!date || !product || !total || !soldQty) {
        return createJsonResponse({ success: false, error: 'Missing required sale parameters.' });
    }

    // Define fixed range for sales: A4:D100
    const START_ROW = 4;
    const MAX_ROWS = 97;
    const dataRange = sheet.getRange(START_ROW, 1, MAX_ROWS, 4);
    const data = dataRange.getValues();

    // Find first empty row
    let targetRow = -1;
    for (let i = 0; i < data.length; i++) {
      if (!data[i][0]) {
        targetRow = START_ROW + i;
        break;
      }
    }

    if (targetRow === -1) {
      return createJsonResponse({ success: false, error: 'Sales range (A4:D100) is full. Cannot add more records.' });
    }

    // Write the data to the target row
    const targetRange = sheet.getRange(targetRow, 1, 1, 4);
    targetRange.setValues([[date, product, parseFloat(total), parseInt(soldQty)]]);

    return createJsonResponse({ success: true, message: `Sale saved at row ${targetRow}.` });

  } catch (error) {
    Logger.log('Error appending sale: ' + error);
    return createJsonResponse({ success: false, error: 'Failed to append sale: ' + error.message });
  }
}

/**
 * Fetches sales data from the spreadsheet.
 */
function getSales() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SALES_SHEET_NAME);
    if (!sheet) {
      return createJsonResponse({ success: false, error: `Sheet '${SALES_SHEET_NAME}' not found.` });
    }

    const range = sheet.getRange(SALES_DATA_RANGE + '100'); // A4:D100
    const values = range.getValues().filter(row => row[0]);

    const sales = values.map(row => ({
      date: row[0],
      product: String(row[1]).trim(),
      total: parseFloat(row[2]) || 0,
      soldQty: parseInt(row[3]) || 0
    }));

    return createJsonResponse({ success: true, data: sales });
  } catch (error) {
    Logger.log('Error fetching sales: ' + error);
    return createJsonResponse({ success: false, error: 'Failed to fetch sales: ' + error.message });
  }
}

/**
 * Helper to return JSON response.
 */
function createJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
