/**
 * 光貿電子發票 API 原始呼叫範例 - Node.js (使用 axios)
 *
 * ⚠️  此範例展示原始 API 呼叫方式，僅供參考。
 *     建議使用 SDK 進行開發，請參考：
 *     - examples/basic.ts    - 基礎範例
 *     - examples/advanced.ts - 進階範例
 *
 * B2C - 開立發票
 *
 * 安裝依賴: npm install axios
 */

const crypto = require('crypto');
const axios = require('axios');
const querystring = require('querystring');

const APP_KEY = 'sHeq7t8G1wiQvhAuIM27';
const INVOICE_NO = '12345678'; // 統編

// B2C - 開立發票
const API_URL = 'https://invoice-api.amego.tw/json/f0401';

/**
 * 計算 API 簽名
 * @param {string} data - JSON 字串
 * @param {number} time - Unix 時間戳記
 * @param {string} appKey - APP KEY
 * @returns {string} MD5 簽名
 */
function calculateSign(data, time, appKey) {
  const hashText = data + time.toString() + appKey;
  return crypto.createHash('md5').update(hashText, 'utf8').digest('hex');
}

/**
 * 開立發票
 */
async function createInvoice() {
  // Unix Timestamp 10位數，不含毫秒
  const currentTime = Math.floor(Date.now() / 1000);

  const invoiceData = {
    OrderId: 'A20200817105934',
    BuyerIdentifier: '28080623',
    BuyerName: '光貿科技有限公司',
    NPOBAN: '',
    ProductItem: [
      {
        Description: '測試商品1',
        Quantity: '1',
        UnitPrice: '170',
        Amount: '170',
        Remark: '',
        TaxType: '1'
      },
      {
        Description: '會員折抵',
        Quantity: '1',
        UnitPrice: '-2',
        Amount: '-2',
        Remark: '',
        TaxType: '1'
      }
    ],
    SalesAmount: '160',
    FreeTaxSalesAmount: '0',
    ZeroTaxSalesAmount: '0',
    TaxType: '1',
    TaxRate: '0.05',
    TaxAmount: '8',
    TotalAmount: '168'
  };

  // 轉換為 JSON 字串
  const dataString = JSON.stringify(invoiceData);

  // 計算簽名
  const sign = calculateSign(dataString, currentTime, APP_KEY);

  // POST 資料
  const postData = querystring.stringify({
    invoice: INVOICE_NO,
    data: dataString,
    time: currentTime,
    sign: sign
  });

  console.log('統編:', INVOICE_NO);
  console.log('時間戳記:', currentTime);
  console.log('簽名:', sign);
  console.log('發送請求中...\n');

  try {
    const response = await axios.post(API_URL, postData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    console.log('回應結果:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error('API 錯誤:', error.response.data);
    } else {
      console.error('請求錯誤:', error.message);
    }
    throw error;
  }
}

// 執行
createInvoice();
