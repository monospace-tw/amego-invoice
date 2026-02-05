# 光貿電子發票 API 範例程式碼

## 目錄

- [PHP](#php)
- [Python](#python)
- [Node.js](#nodejs)
- [Java](#java)
- [C#](#c)

---

## PHP

```php
<?php
// B2C - 開立發票
$sUrl = 'https://invoice-api.amego.tw/json/f0401';

// 統編
$sInvoice = '12345678';

// APP KEY
$sApp_Key = 'sHeq7t8G1wiQvhAuIM27';

// 時間戳記，Unix Timesatmp 10位數，不含毫秒
$nTime = time();

// 發票資料
$aData = array(
    'OrderId' => 'A20231115-001',
    'BuyerIdentifier' => '28080623',
    'BuyerName' => '光貿科技股份有限公司',
    'NPOBAN' => '',
    'ProductItem' => array(
        array(
            'Description' => '測試商品1',
            'Quantity' => '1',
            'UnitPrice' => '170',
            'Amount' => '170',
            'Remark' => '',
            'TaxType' => '1'
        ),
        array(
            'Description' => '會員折抵',
            'Quantity' => '1',
            'UnitPrice' => '-2',
            'Amount' => '-2',
            'Remark' => '',
            'TaxType' => '1'
        )
    ),
    'SalesAmount' => '160',
    'FreeTaxSalesAmount' => '0',
    'ZeroTaxSalesAmount' => '0',
    'TaxType' => '1',
    'TaxRate' => '0.05',
    'TaxAmount' => '8',
    'TotalAmount' => '168'
);

// 編成 JSON 字串
$sData_String = json_encode($aData, JSON_UNESCAPED_UNICODE);

// md5(發票資料+時間戳記+APP KEY)
$sSign = md5($sData_String . ((string) $nTime) . $sApp_Key);

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $sUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query(array(
    'invoice' => $sInvoice,
    'data' => $sData_String,
    'time' => $nTime,
    'sign' => $sSign,
)));

$sOutput = curl_exec($ch);
curl_close($ch);

$aReturn = json_decode($sOutput, true);
var_dump($aReturn);
exit;
?>
```

---

## Python

```python
import hashlib
import requests
import time
import urllib
import json

APP_KEY = "sHeq7t8G1wiQvhAuIM27"

# B2C - 開立發票 + 列印
sUrl = "https://invoice-api.amego.tw/json/f0401"

# Unix Timesatmp 10位數，不含毫秒
nCurrent_Now_Time = int(time.time())  # 1628136135

invoice_data = {
    "OrderId": "A20200817105934",
    "BuyerIdentifier": "28080623",
    "BuyerName": "光貿科技有限公司",
    "NPOBAN": "",
    "ProductItem": [
        {
            "Description": "測試商品1",
            "Quantity": "1",
            "UnitPrice": "170",
            "Amount": "170",
            "Remark": "",
            "TaxType": "1"
        },
        {
            "Description": "會員折抵",
            "Quantity": "1",
            "UnitPrice": "-2",
            "Amount": "-2",
            "Remark": "",
            "TaxType": "1"
        }
    ],
    "SalesAmount": "160",
    "FreeTaxSalesAmount": "0",
    "ZeroTaxSalesAmount": "0",
    "TaxType": "1",
    "TaxRate": "0.05",
    "TaxAmount": "8",
    "TotalAmount": "168"
}

# Convert Python to JSON
sApi_Data = json.dumps(invoice_data, indent=0)
# print(sApi_Data)

# 此範例 md5 結果為 f53a336934b2af0589b845638d1495cc，請自檢測是否相符
sHash_Text = sApi_Data + str(nCurrent_Now_Time) + APP_KEY
# print(sHash_Text)

m = hashlib.md5()
m.update(sHash_Text.encode("utf-8"))
sSign = m.hexdigest()
# print(sSign)

aPost_Data = {
    "invoice": '12345678',  # 統編
    "data": sApi_Data,
    "time": nCurrent_Now_Time,
    "sign": sSign,
}
# print(aPost_Data)

# 將資料內容進行 url encode
payload = urllib.parse.urlencode(aPost_Data, doseq=True)
# print(payload)

headers = {
    'Content-Type': 'application/x-www-form-urlencoded'
}

response = requests.request("POST", sUrl, headers=headers, data=payload)

print(json.loads(response.text))
```

---

## Node.js

```javascript
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
```

---

## Java

```java
import java.security.MessageDigest;
import java.io.*;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLEncoder;

public class HelloWorld {
    public static void main(String[] args) {
        String APP_KEY = "sHeq7t8G1wiQvhAuIM27";

        // B2C - 開立發票 + 列印
        String sUrl = "https://invoice-api.amego.tw/json/f0401";

        // Unix Timesatmp 10位數，不含毫秒
        long nCurrent_Now_Time = System.currentTimeMillis() / 1000;
        // 1628136135
        // long nCurrent_Now_Time = 1628136135;
        // System.out.println(nCurrent_Now_Time);

        String sApi_Data = "{\"OrderId\":\"A20200817105934\",\"BuyerIdentifier\":\"28080623\",\"BuyerName\":\"光貿科技有限公司\",\"NPOBAN\":\"\",\"ProductItem\":[{\"Description\":\"測試商品1\",\"Quantity\":\"1\",\"UnitPrice\":\"170\",\"Amount\":\"170\",\"Remark\":\"\",\"TaxType\":\"1\"},{\"Description\":\"會員折抵\",\"Quantity\":\"1\",\"UnitPrice\":\"-2\",\"Amount\":\"-2\",\"Remark\":\"\",\"TaxType\":\"1\"}],\"SalesAmount\":\"160\",\"FreeTaxSalesAmount\":\"0\",\"ZeroTaxSalesAmount\":\"0\",\"TaxType\":\"1\",\"TaxRate\":\"0.05\",\"TaxAmount\":\"8\",\"TotalAmount\":\"168\"}";

        // 此範例 md5 結果為 efe84e2b95153a09df64a36e04e8ae1c，請自檢測是否相符
        String sHash_Text = sApi_Data + nCurrent_Now_Time + APP_KEY;
        // System.out.println(sHash_Text);

        String sSign = "";
        try {
            // Node.js md5 加密前，加密內容請先轉 UTF-8
            byte[] bytesOfMessage = sHash_Text.getBytes("UTF-8");
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] theMD5digest = md.digest(bytesOfMessage);
            StringBuilder strBuilder = new StringBuilder();
            for (byte b : theMD5digest) {
                strBuilder.append(String.format("%02x", b));
            }
            sSign = strBuilder.toString();
            // System.out.println("The MD5 hash: " + sSign);
        } catch (Exception e) {
            e.printStackTrace();
        }

        String sPost_Data = "";
        sPost_Data += "invoice=12345678";
        try {
            sPost_Data += "&data=" + URLEncoder.encode(sApi_Data, "UTF-8");
        } catch (UnsupportedEncodingException e) {
            e.printStackTrace();
        }
        sPost_Data += "&time=" + nCurrent_Now_Time;
        sPost_Data += "&sign=" + sSign;

        try {
            URL dummyUrl = new URL(sUrl);
            HttpURLConnection httpUrlConnection = (HttpURLConnection) dummyUrl.openConnection();
            httpUrlConnection.setRequestMethod("POST");
            httpUrlConnection.setDoOutput(true);
            httpUrlConnection.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");
            httpUrlConnection.setRequestProperty("charset", "utf-8");
            httpUrlConnection.setRequestProperty("Content-Length", Integer.toString(sPost_Data.length()));
            DataOutputStream dataOutputStream = new DataOutputStream(httpUrlConnection.getOutputStream());
            dataOutputStream.writeBytes(sPost_Data);
            InputStream inputStream = httpUrlConnection.getInputStream();
            BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(inputStream));
            String stringLine;
            while ((stringLine = bufferedReader.readLine()) != null) {
                System.out.println(stringLine);
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
```

---

## C#

```csharp
using System;
using System.Security.Cryptography;
using System.Text;
using System.Collections.Generic;
using System.Net.Http;
using System.Threading.Tasks;

public class HelloWorld
{
    public static async Task Main(string[] args)
    {
        string url = "https://invoice-api.amego.tw/json/f0401";
        string invoice = "12345678";
        // string data = "{\"barCode\": \"/TRM+O+P\"}";
        string data = @"{
            ""OrderId"": ""A20200817105934"",
            ""BuyerIdentifier"": ""28080623"",
            ""BuyerName"": ""光貿科技有限公司"",
            ""NPOBAN"": """",
            ""ProductItem"": [
                {
                    ""Description"": ""測試商品1"",
                    ""Quantity"": ""1"",
                    ""UnitPrice"": ""170"",
                    ""Amount"": ""170"",
                    ""Remark"": """",
                    ""TaxType"": ""1""
                },
                {
                    ""Description"": ""會員折抵"",
                    ""Quantity"": ""1"",
                    ""UnitPrice"": ""-2"",
                    ""Amount"": ""-2"",
                    ""Remark"": """",
                    ""TaxType"": ""1""
                }
            ],
            ""SalesAmount"": ""160"",
            ""FreeTaxSalesAmount"": ""0"",
            ""ZeroTaxSalesAmount"": ""0"",
            ""TaxType"": ""1"",
            ""TaxRate"": ""0.05"",
            ""TaxAmount"": ""8"",
            ""TotalAmount"": ""168""
        }";

        string time = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();
        string signBefore = data + time + "sHeq7t8G1wiQvhAuIM27";
        string sign = "";

        MD5 md5 = MD5.Create();
        byte[] inputBytes = Encoding.UTF8.GetBytes(signBefore);
        byte[] hashBytes = md5.ComputeHash(inputBytes);
        sign = ToHexString(hashBytes).ToLower();

        Console.WriteLine("invoice: {0}", invoice);
        Console.WriteLine("data: {0}", data);
        Console.WriteLine("time: {0}", time);
        Console.WriteLine("sign: {0}", sign);

        var client = new HttpClient();
        var form = new Dictionary<string, string>();
        form.Add("invoice", invoice);
        form.Add("data", data);
        form.Add("time", time);
        form.Add("sign", sign);

        var content = new FormUrlEncodedContent(form);
        var response = await client.PostAsync(url, content);
        var responseBody = await response.Content.ReadAsStringAsync();

        Console.WriteLine("responseBody: {0}", System.Text.RegularExpressions.Regex.Unescape(responseBody));
    }

    public static string ToHexString(byte[] bytes)
    {
        var sb = new StringBuilder();
        foreach (var t in bytes)
        {
            sb.Append(t.ToString("X2"));
        }
        return sb.ToString();
    }
}
```

---

## 簽名計算說明

所有 API 請求都需要進行簽名驗證，簽名規則如下：

```
sign = md5(data + time + APP_KEY)
```

其中：
- `data`：JSON 格式字串的發票資料
- `time`：Unix Timestamp 10位數（秒），不含毫秒
- `APP_KEY`：您的應用程式金鑰

### 注意事項

1. 時間戳記必須與伺服器時間誤差在 ±60 秒內
2. POST 的 Content-Type 應為 `application/x-www-form-urlencoded`
3. data 欄位內容需進行 URL encode
4. MD5 加密前，加密內容請先轉 UTF-8 編碼

### 測試環境

- 統編：`12345678`
- APP KEY：`sHeq7t8G1wiQvhAuIM27`
- 後台：https://invoice.amego.tw/
- 帳號：test@amego.tw
- 密碼：12345678
