/**
 * 光貿電子發票 API 範例 - Node.js
 * B2C - 開立發票
 */

const crypto = require('crypto');
const https = require('https');
const querystring = require('querystring');

const APP_KEY = 'sHeq7t8G1wiQvhAuIM27';

// B2C - 開立發票
const apiUrl = 'https://invoice-api.amego.tw/json/f0401';

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

// 計算簽名: md5(發票資料+時間戳記+APP KEY)
const hashText = dataString + currentTime.toString() + APP_KEY;
const sign = crypto.createHash('md5').update(hashText, 'utf8').digest('hex');

// POST 資料
const postData = querystring.stringify({
  invoice: '12345678', // 統編
  data: dataString,
  time: currentTime,
  sign: sign
});

// 請求選項
const url = new URL(apiUrl);
const options = {
  hostname: url.hostname,
  port: 443,
  path: url.pathname,
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(postData)
  }
};

// 發送請求
const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      console.log('回應結果:', JSON.stringify(result, null, 2));
    } catch (e) {
      console.log('回應內容:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('請求錯誤:', error);
});

// 寫入資料並結束請求
req.write(postData);
req.end();

console.log('統編:', '12345678');
console.log('時間戳記:', currentTime);
console.log('簽名:', sign);
console.log('發送請求中...');
