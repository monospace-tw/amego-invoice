"""
光貿電子發票 API 範例 - Python
B2C - 開立發票
"""

import hashlib
import requests
import time
import urllib.parse
import json

APP_KEY = "sHeq7t8G1wiQvhAuIM27"

# B2C - 開立發票 + 列印
sUrl = "https://invoice-api.amego.tw/json/f0401"

# Unix Timesatmp 10位數，不含毫秒
nCurrent_Now_Time = int(time.time())

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

# 計算簽名: md5(發票資料+時間戳記+APP KEY)
sHash_Text = sApi_Data + str(nCurrent_Now_Time) + APP_KEY

m = hashlib.md5()
m.update(sHash_Text.encode("utf-8"))
sSign = m.hexdigest()

aPost_Data = {
    "invoice": '12345678',  # 統編
    "data": sApi_Data,
    "time": nCurrent_Now_Time,
    "sign": sSign,
}

# 將資料內容進行 url encode
payload = urllib.parse.urlencode(aPost_Data, doseq=True)

headers = {
    'Content-Type': 'application/x-www-form-urlencoded'
}

response = requests.request("POST", sUrl, headers=headers, data=payload)

print(json.loads(response.text))
