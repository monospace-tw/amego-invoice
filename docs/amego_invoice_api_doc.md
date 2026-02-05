# 光貿電子發票加值中心 API 文件

> 版本: 1.0.0
> API 網址: https://invoice-api.amego.tw

## 目錄

- [基本說明](#基本說明)
- [發票](#發票)
  - [開立發票(自動配號)](#開立發票自動配號)
  - [作廢發票](#作廢發票)
  - [發票狀態](#發票狀態)
  - [發票查詢](#發票查詢)
  - [發票列表](#發票列表)
  - [發票檔案](#發票檔案)
  - [發票列印](#發票列印)
- [折讓](#折讓)
  - [開立折讓](#開立折讓)
  - [作廢折讓](#作廢折讓)
  - [折讓狀態](#折讓狀態)
  - [折讓查詢](#折讓查詢)
  - [折讓列表](#折讓列表)
  - [折讓檔案](#折讓檔案)
  - [折讓列印](#折讓列印)
- [中獎](#中獎)
  - [獎項定義](#獎項定義)
  - [中獎發票](#中獎發票)
- [其他](#其他)
  - [手機條碼查詢](#手機條碼查詢)
  - [公司名稱查詢](#公司名稱查詢)
  - [所有字軌資料](#所有字軌資料)
  - [伺服器時間](#伺服器時間)
- [自行配號專用](#自行配號專用)
  - [字軌取號](#字軌取號)
  - [字軌狀態](#字軌狀態)
  - [開立發票(API配號)](#開立發票api配號)

---

## 基本說明

### API 網址

- API 網址：`https://invoice-api.amego.tw`
- 目前測試或正式都請用同一個 API 網址
- 測試請用測試公司的統編與 App Key，進行測試。正式上線時再切換為貴公司的統編與 App Key。

### API 必備資料

| 項目 | 測試公司 | 正式公司 |
|------|----------|----------|
| 統編 | 12345678 | 公司統編 |
| App Key | sHeq7t8G1wiQvhAuIM27 | 請與客服聯絡 |

### 測試帳號後台

- 網址：https://invoice.amego.tw/
- 帳號：test@amego.tw
- 密碼：12345678
- 統編：12345678
- 公司：測試環境有限公司

### 基本傳入參數說明

- 每支 API 必須帶入這些參數，B2C 及 B2B API 的欄位內容則需編碼成 JSON 格式字串，放置於 data 欄位內傳送
- 每支 API 接收到的 POST 資料會先自動進行一次 url decode，所以 POST 的 data 欄位內容請進行 url encode 動作
- POST API 的 Header Content-Type 應為 `application/x-www-form-urlencoded`，請勿使用 `Content-Type: application/json`

### 基本參數

| 欄位 | 類型 | 描述 |
|------|------|------|
| invoice | String | 統一編號 |
| data | String | API 的 JSON 格式字串 |
| time | Number | 時間戳記，僅接受與伺服器時間誤差±60秒 |
| sign | String | 簽名，md5加密，加密規則：`md5(data 轉 json 格式字串 + time + APP Key)` |

### 範例程式

- [PHP 範例](https://invoice.amego.tw/api_doc/example#language-php)
- [Python 範例](https://invoice.amego.tw/api_doc/example#language-python)
- [Java 範例](https://invoice.amego.tw/api_doc/example#language-java)
- [C# 範例](https://invoice.amego.tw/api_doc/example#language-csharp)

### 補充說明

- [API 錯誤代碼](https://invoice.amego.tw/info_detail?mid=71)
- [開立發票(自動配號) 與 開立發票(API 配號) 說明](https://invoice.amego.tw/info_detail?mid=70)
- [光貿會員載具規則](https://invoice.amego.tw/info_detail?mid=73)
- [統一編號、載具、捐贈碼檢查](https://invoice.amego.tw/info_detail?mid=74)

### 2025年重要異動

財政部公告的電子發票資料交換標準訊息建置指引(MIG) 3.2.1 版本將於115年1月1日停止使用，本加值中已於2025年1月1月升級為 MIG 4.0，以下為本文件主要異動：

- 開立發票(自動配號) `/json/c0401` 改為 `/json/f0401`
- 作廢發票 `/json/c0501` 改為 `/json/f0501`
- 開立折讓 `/json/d0401` 改為 `/json/g0401`
- 作廢折讓 `/json/d0501` 改為 `/json/g0501`
- 開立發票(API 配號) `/json/c0401_custom` 改為 `/json/f0401_custom`
- 舊版 API 目前尚可繼續使用

---

## 發票

### 開立發票(自動配號)

開立發票後，回傳發票號碼、發票時間及隨機碼，若有傳入熱感應機型號代碼，則會多輸出列印格式字串。

**POST** `/json/f0401`

#### 參數

| 欄位 | 必填 | 類型 | 描述 |
|------|------|------|------|
| OrderId | 必填 | String | 訂單編號，不可重複，不可超過40字 |
| TrackApiCode | 選填 | String | 指定字軌開立，需要在後台 發票作業 > 發票字軌列表 設定 API指定代碼。若不指定字軌，則依照後台發票字軌列表的排序去開立 |
| BuyerIdentifier | 必填 | String | 買方統一編號，沒有則填入 `0000000000` |
| BuyerName | 必填 | String | 買方名稱。1. 不打統編：可以填寫客人、消費者 2. 打統編：如不能填入買方公司名稱，請填買方統一編號 3. 不可填0、00、000及0000 |
| BuyerAddress | 選填 | String | 買方地址 |
| BuyerTelephoneNumber | 選填 | String | 買方電話 |
| BuyerEmailAddress | 選填 | String | 買方電子信箱，寄送通知信用，若不希望寄送，留空即可。測試環境不會主動發送信件 |
| MainRemark | 選填 | String | 總備註，不可超過200字 |
| CarrierType | 選填 | String | 載具類別。手機條碼 `3J0002`，自然人憑證條碼 `CQ0001`，光貿會員載具 `amego` |
| CarrierId1 | 選填 | String | 載具顯碼 |
| CarrierId2 | 選填 | String | 載具隱碼 |
| NPOBAN | 選填 | String | 捐贈碼 |
| ProductItem | 必填 | Object[] | 商品陣列，最多 9999 筆 |
| ProductItem.Description | 必填 | String | 品名，不可超過256字 |
| ProductItem.Quantity | 必填 | Number | 數量，小數精準度到7位數 |
| ProductItem.Unit | 選填 | String | 單位，不可超過6字 |
| ProductItem.UnitPrice | 必填 | Number | 單價，預設含稅，小數精準度到7位數 |
| ProductItem.Amount | 必填 | Number | 小計，小數精準度到7位數 |
| ProductItem.Remark | 選填 | String | 備註，不可超過40字 |
| ProductItem.TaxType | 必填 | Number | 課稅別。1：應稅 2：零稅率 3：免稅 |
| SalesAmount | 必填 | Number | 應稅銷售額合計 |
| FreeTaxSalesAmount | 必填 | Number | 免稅銷售額合計 |
| ZeroTaxSalesAmount | 必填 | Number | 零稅率銷售額合計 |
| TaxType | 必填 | Number | 課稅別。1：應稅 2：零稅率 3：免稅 4：應稅(特種稅率) 9：混合應稅與免稅或零稅率 |
| TaxRate | 必填 | String | 稅率，為5%時本欄位值為 `0.05` |
| TaxAmount | 必填 | Number | 營業稅額。有打統編才需計算5%稅額，沒打統編發票一律帶0 |
| TotalAmount | 必填 | Number | 總計 |
| CustomsClearanceMark | 選填 | Number | 通關方式註記。1:非經海關出口 2:經海關出口 |
| ZeroTaxRateReason | 選填 | Number | 零稅率原因（71-79） |
| BrandName | 選填 | String | 品牌名稱 |
| DetailVat | 選填 | Number | 明細單價為含稅或未稅。0:未稅價 1：含稅價(預設) |
| DetailAmountRound | 選填 | Number | 明細小計處理方式。0:小數精準度到7位數 1:一律四捨五入到整數 |
| PrinterType | 選填 | Number | 熱感應機型號代碼 |
| PrinterLang | 選填 | Number | 熱感應機編碼。1：BIG5 2：GBK 3：UTF-8 |
| PrintDetail | 選填 | Number | 是否列印明細。1:列印(預設) 0:不列印 |

#### 請求範例（一般開立需列印）

```json
{
  "OrderId": "A20200817101021",
  "BuyerIdentifier": "0000000000",
  "BuyerName": "客人",
  "BuyerAddress": "",
  "BuyerTelephoneNumber": "",
  "BuyerEmailAddress": "",
  "MainRemark": "",
  "CarrierType": "",
  "CarrierId1": "",
  "CarrierId2": "",
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
  "SalesAmount": "168",
  "FreeTaxSalesAmount": "0",
  "ZeroTaxSalesAmount": "0",
  "TaxType": "1",
  "TaxRate": "0.05",
  "TaxAmount": "0",
  "TotalAmount": "168"
}
```

#### 回應參數

| 欄位 | 必填 | 類型 | 描述 |
|------|------|------|------|
| code | 必填 | Number | 0 代表正確，其他代碼請參考錯誤代碼 |
| msg | 必填 | String | 錯誤訊息 |
| invoice_number | 選填 | String | 發票號碼，正確才會回傳 |
| invoice_time | 選填 | Number | 發票開立時間，Unix 時間戳記 |
| random_number | 選填 | String | 隨機碼 |
| barcode | 選填 | String | 電子發票的條碼內容 |
| qrcode_left | 選填 | String | 電子發票的左側 QRCODE 內容 |
| qrcode_right | 選填 | String | 電子發票的右側 QRCODE 內容 |
| base64_data | 選填 | String | base64編碼的列印格式字串 |

#### 金額計算邏輯（含稅商品）

```
DetailVat = 1
SalesAmount = Round(所有 ProductItem TaxType=1 的 Amount 加總)
FreeTaxSalesAmount = Round(所有 ProductItem TaxType=3 的 Amount 加總)
ZeroTaxSalesAmount = Round(所有 ProductItem TaxType=2 的 Amount 加總)

不打統編(不須分拆稅額)
TaxAmount = 0

打統編(須要分拆稅額)
TaxAmount = SalesAmount - Round(SalesAmount / 1.05)
SalesAmount = SalesAmount - TaxAmount

總計
TotalAmount = SalesAmount + FreeTaxSalesAmount + ZeroTaxSalesAmount + TaxAmount
```

---

### 作廢發票

作廢已開立的發票

**POST** `/json/f0501`

#### 參數

| 欄位 | 必填 | 類型 | 描述 |
|------|------|------|------|
| array | 必填 | Object[] | 物件陣列 |
| CancelInvoiceNumber | 必填 | String | 發票號碼 |

#### 請求範例

```json
[
  { "CancelInvoiceNumber": "AB00001111" }
]
```

#### 回應參數

| 欄位 | 必填 | 類型 | 描述 |
|------|------|------|------|
| code | 必填 | Number | 0 代表正確 |
| msg | 必填 | String | 錯誤訊息 |

---

### 發票狀態

發票的上傳狀態

**POST** `/json/invoice_status`

#### 參數

| 欄位 | 必填 | 類型 | 描述 |
|------|------|------|------|
| array | 必填 | Object[] | 物件陣列 |
| InvoiceNumber | 必填 | String | 發票號碼 |

#### 請求範例

```json
[
  { "InvoiceNumber": "AB00001111" }
]
```

#### 回應參數

| 欄位 | 類型 | 描述 |
|------|------|------|
| code | Number | 0 代表正確 |
| msg | String | 錯誤訊息 |
| data | Object | 發票號碼的對應上傳狀態 |
| data.invoice_number | String | 發票號碼 |
| data.type | String | 發票類型。NOT_FOUND：查無發票 C0401：發票開立 C0501：發票作廢 C0701：發票註銷 TYPE_ERROR：類型錯誤 |
| data.status | Number | 發票狀態。1：待處理 2：上傳中 3：已上傳 31：處理中 32：處理完成／待確認 91：錯誤 99：完成 |
| data.total_amount | Number | 發票金額 |

#### 回應範例

```json
{
  "code": 0,
  "msg": "",
  "data": [
    { "invoice_number": "AB00001111", "type": "NOT_FOUND", "status": -1, "total_amount": 0 },
    { "invoice_number": "AB00001112", "type": "C0401", "status": 99, "total_amount": 1580 },
    { "invoice_number": "AB00001113", "type": "C0401", "status": 99, "total_amount": 199 }
  ]
}
```

---

### 發票查詢

查詢發票內容

**POST** `/json/invoice_query`

#### 參數

| 欄位 | 必填 | 類型 | 描述 |
|------|------|------|------|
| type | 必填 | String | 查詢類型。order：訂單編號 invoice：發票號碼，擇一查詢 |
| order_id | 必填 | String | 訂單編號，不可超過40字。以發票日期為主，只能查詢180天內的發票 |
| invoice_number | 必填 | String | 發票號碼，不可超過10字。以發票日期為主，只能查詢180天內的發票 |

#### 請求範例

```json
{ "type": "order", "order_id": "P202212010001" }
```

#### 回應參數

| 欄位 | 類型 | 描述 |
|------|------|------|
| code | Number | 0 代表正確 |
| msg | String | 錯誤訊息 |
| data | Object | 正確才會回傳 |
| data.invoice_number | String | 發票號碼 |
| data.invoice_type | String | 發票類型 |
| data.invoice_status | Number | 上傳至財政部的狀態 |
| data.invoice_date | String | 發票日期 YYYYMMDD |
| data.invoice_time | String | 發票時間 HH:mm:ss |
| data.buyer_identifier | String | 買方統一編號 |
| data.buyer_name | String | 買方名稱 |
| data.sales_amount | Number | 應稅銷售額合計 |
| data.free_tax_sales_amount | Number | 免稅銷售額合計 |
| data.zero_tax_sales_amount | Number | 零稅率銷售額合計 |
| data.tax_type | Number | 課稅別 |
| data.tax_rate | String | 稅率 |
| data.tax_amount | Number | 營業稅額 |
| data.total_amount | Number | 總計 |
| data.random_number | String | 隨機碼 |
| data.carrier_type | String | 載具類別 |
| data.carrier_id1 | String | 載具明碼 |
| data.carrier_id2 | String | 載具隱碼 |
| data.npoban | String | 捐贈碼 |
| data.cancel_date | Number | 作廢時間，Unix 時間戳記 |
| data.invoice_lottery | Number | 獎項代碼 |
| data.order_id | String | 訂單編號 |
| data.product_item | Object[] | 商品陣列 |
| data.wait | Object[] | 未處理的排程陣列 |
| data.allowance | Object[] | 折讓單陣列 |

---

### 發票列表

發票的主檔資料

**POST** `/json/invoice_list`

#### 參數

| 欄位 | 必填 | 類型 | 描述 |
|------|------|------|------|
| date_select | 必填 | Number | 日期條件。1:發票日期 2:建立日期 |
| date_start | 必填 | String | 開始日期，格式：YYYYMMDD |
| date_end | 必填 | String | 結束日期，格式：YYYYMMDD |
| limit | 選填 | Number | 每頁顯示資料筆數 20~500，預設 20 筆 |
| page | 選填 | Number | 目前頁數，預設第1頁 |

#### 請求範例

```json
{
  "date_select": 1,
  "date_start": 20230101,
  "date_end": 20230228,
  "limit": 20,
  "page": 1
}
```

#### 回應參數

| 欄位 | 類型 | 描述 |
|------|------|------|
| code | Number | 0 代表正確 |
| msg | String | 錯誤訊息 |
| page_total | Number | 總共頁數 |
| page_now | Number | 目前頁數 |
| data_total | Number | 總資料數 |
| data | Object[] | 資料陣列 |

---

### 發票檔案

下載發票檔案(PDF格式)。載具發票中獎後才可下載，非載具發票可無限次下載。

**POST** `/json/invoice_file`

#### 參數

| 欄位 | 必填 | 類型 | 描述 |
|------|------|------|------|
| type | 必填 | String | 查詢類型。order：訂單編號 invoice：發票號碼 |
| order_id | 必填 | String | 訂單編號，只能查詢180天內的發票 |
| invoice_number | 必填 | String | 發票號碼，只能查詢180天內的發票 |
| download_style | 選填 | Number | 下載樣式，預設為 0。有打統編：0：A4整張 1：A4(地址+A5) 2：A4(A5x2) 3：A5。沒有打統編：0：A4整張(背面兌獎聯，需雙面列印) |

#### 回應參數

| 欄位 | 類型 | 描述 |
|------|------|------|
| code | Number | 0 代表正確 |
| msg | String | 錯誤訊息 |
| data.file_url | String | 檔案連結，連結僅10分鐘有效 |

---

### 發票列印

產出列印格式字串。0元發票無法產生熱感應紙上的 QRcode，所以0元發票無法列印發票正本及補印。

**POST** `/json/invoice_print`

#### 參數

| 欄位 | 必填 | 類型 | 描述 |
|------|------|------|------|
| type | 必填 | String | 查詢類型。order：訂單編號 invoice：發票號碼 |
| order_id | 必填 | String | 訂單編號 |
| invoice_number | 必填 | String | 發票號碼 |
| printer_type | 必填 | Number | 熱感應機型號代碼 |
| printer_lang | 選填 | Number | 熱感應機編碼。1：BIG5 2：GBK 3：UTF-8 |
| print_invoice_type | 必填 | Number | 列印格式。1：發票正本 2：發票補印 3：單印明細 |
| print_invoice_detail | 選填 | Number | 是否列印明細。1:列印(預設) 0:不列印 |

#### 回應參數

| 欄位 | 類型 | 描述 |
|------|------|------|
| code | Number | 0 代表正確 |
| msg | String | 錯誤訊息 |
| data.base64_data | String | base64編碼的列印格式字串 |

---

## 折讓

### 開立折讓

折讓已開立的發票

**POST** `/json/g0401`

#### 參數

| 欄位 | 必填 | 類型 | 描述 |
|------|------|------|------|
| AllowanceNumber | 必填 | String | 折讓單編號，不可重複，不可超過16字 |
| AllowanceDate | 必填 | String | 折讓單日期，Ymd |
| AllowanceType | 必填 | Number | 折讓單種類。1:買方開立折讓證明單 2:賣方折讓證明通知單 |
| BuyerIdentifier | 必填 | String | 買方統一編號，沒有則填入 0000000000 |
| BuyerName | 必填 | String | 買方名稱 |
| BuyerAddress | 選填 | String | 買方地址 |
| BuyerTelephoneNumber | 選填 | String | 買方電話 |
| BuyerEmailAddress | 選填 | String | 買方電子信箱 |
| ProductItem | 必填 | Object[] | 商品陣列，最多 9999 筆 |
| ProductItem.OriginalInvoiceNumber | 必填 | String | 原發票號碼 |
| ProductItem.OriginalInvoiceDate | 必填 | Number | 原發票日期，Ymd |
| ProductItem.OriginalDescription | 必填 | String | 原品名，不可超過256字 |
| ProductItem.Quantity | 必填 | Number | 數量 |
| ProductItem.UnitPrice | 必填 | Number | 單價(不含稅) |
| ProductItem.Amount | 必填 | Number | 小計(不含稅) |
| ProductItem.Tax | 必填 | Number | 稅金 |
| ProductItem.TaxType | 必填 | Number | 課稅別。1：應稅 2：零稅率 3：免稅 |
| TaxAmount | 必填 | Number | 營業稅額 |
| TotalAmount | 必填 | Number | 金額合計(不含稅) |

#### 請求範例

```json
[
  {
    "AllowanceNumber": "3821061800001",
    "AllowanceDate": "20210618",
    "AllowanceType": "2",
    "BuyerIdentifier": "0000000000",
    "BuyerName": "蕭XX",
    "BuyerAddress": "",
    "BuyerTelephoneNumber": "",
    "BuyerEmailAddress": "",
    "ProductItem": [{
      "OriginalInvoiceDate": 20210520,
      "OriginalInvoiceNumber": "NW93016392",
      "OriginalDescription": "超聲波清洗機",
      "Quantity": 2,
      "UnitPrice": "2180",
      "Amount": "4360",
      "Tax": 218,
      "TaxType": 1
    }],
    "TaxAmount": "218",
    "TotalAmount": "4360"
  }
]
```

---

### 作廢折讓

作廢已開立的折讓單

**POST** `/json/g0501`

#### 參數

| 欄位 | 必填 | 類型 | 描述 |
|------|------|------|------|
| array | 必填 | Object[] | 物件陣列 |
| CancelAllowanceNumber | 必填 | String | 折讓單編號 |

#### 請求範例

```json
[
  { "CancelAllowanceNumber": "3821061800001" }
]
```

---

### 折讓狀態

折讓單的上傳狀態

**POST** `/json/allowance_status`

#### 參數

| 欄位 | 必填 | 類型 | 描述 |
|------|------|------|------|
| array | 必填 | Object[] | 物件陣列 |
| AllowanceNumber | 必填 | String | 折讓單編號 |

#### 回應參數

| 欄位 | 類型 | 描述 |
|------|------|------|
| code | Number | 0 代表正確 |
| msg | String | 錯誤訊息 |
| data.type | String | 折讓單類型。NOT_FOUND：查無折讓單 D0401：折讓單開立 D0501：折讓單作廢 |
| data.status | Number | 折讓單狀態。1：待處理 2：上傳中 3：已上傳 31：處理中 32：處理完成／待確認 91：錯誤 99：完成 |
| data.tax_amount | Number | 營業稅額 |
| data.total_amount | Number | 未稅總計 |

---

### 折讓查詢

查詢折讓內容

**POST** `/json/allowance_query`

#### 參數

| 欄位 | 必填 | 類型 | 描述 |
|------|------|------|------|
| allowance_number | 必填 | String | 折讓單編號，不可超過16字 |

---

### 折讓列表

折讓單的主檔資料

**POST** `/json/allowance_list`

#### 參數

| 欄位 | 必填 | 類型 | 描述 |
|------|------|------|------|
| date_select | 必填 | Number | 日期條件。1:折讓單日期 2:建立日期 |
| date_start | 必填 | String | 開始日期，格式：YYYYMMDD |
| date_end | 必填 | String | 結束日期，格式：YYYYMMDD |
| limit | 選填 | Number | 每頁顯示資料筆數 20~500，預設 20 筆 |
| page | 選填 | Number | 目前頁數，預設第1頁 |

---

### 折讓檔案

下載折讓單檔案(PDF格式)。可無限次下載。

**POST** `/json/allowance_file`

#### 參數

| 欄位 | 必填 | 類型 | 描述 |
|------|------|------|------|
| allowance_number | 必填 | String | 折讓單編號，不可超過16字 |
| download_style | 選填 | Number | 下載樣式，預設為 0。0：A4整張 1：A4(地址+A5) 3：A5 |

---

### 折讓列印

產出列印格式字串。

**POST** `/json/allowance_print`

#### 參數

| 欄位 | 必填 | 類型 | 描述 |
|------|------|------|------|
| allowance_number | 必填 | String | 折讓單編號，不可超過16字 |
| printer_type | 必填 | Number | 熱感應機型號代碼 |
| printer_lang | 選填 | Number | 熱感應機編碼。1：BIG5 2：GBK 3：UTF-8 |

---

## 中獎

### 獎項定義

中獎的發票類型定義。data 欄位不需要傳入資料。

**POST** `/json/lottery_type`

#### 回應範例

```json
{
  "code": 0,
  "msg": "",
  "data": [
    { "type": 11, "name": "特別獎(1,000萬)" },
    { "type": 12, "name": "特獎(200萬元)" }
  ]
}
```

---

### 中獎發票

中獎的發票，建議雙月1號才查詢。9-10月的發票，11/25 開獎，建議 12/1 再透過 API 查詢。

**POST** `/json/lottery_status`

#### 參數

| 欄位 | 必填 | 類型 | 描述 |
|------|------|------|------|
| Year | 必填 | Number | 西元年 |
| Period | 必填 | Number | 期別。0:01-02月 1:03-04月 2:05-06月 3:07-08月 4:09-10月 5:11-12月 |

#### 請求範例

```json
{ "Year": 2022, "Period": 3 }
```

#### 回應範例

```json
{
  "code": 0,
  "msg": "",
  "data": [
    { "invoice_date": 20220819, "invoice_number": "DF73530001", "type": 22 },
    { "invoice_date": 20220819, "invoice_number": "DF73530002", "type": 18 }
  ]
}
```

---

## 其他

### 手機條碼查詢

查詢手機條碼是否正確

**POST** `/json/barcode`

#### 參數

| 欄位 | 必填 | 類型 | 描述 |
|------|------|------|------|
| barCode | 必填 | String | 手機條碼 |

#### 請求範例

```json
{ "barCode": "/TRM+O+P" }
```

---

### 公司名稱查詢

查詢統一編號對應的公司名稱。資料來源：[財政部財政資訊中心](https://eip.fia.gov.tw/OAI/swagger-ui.html)

**POST** `/json/ban_query`

#### 參數

| 欄位 | 必填 | 類型 | 描述 |
|------|------|------|------|
| ban | 必填 | String | 統一編號，數字8碼 |

#### 請求範例

```json
[
  { "ban": "28080623" },
  { "ban": "85101991" }
]
```

#### 回應範例

```json
{
  "code": 0,
  "msg": "",
  "data": [
    { "ban": "28080623", "name": "光貿科技股份有限公司" },
    { "ban": "85101991", "name": "紅磚數位有限公司" }
  ]
}
```

---

### 所有字軌資料

該公司在加值中心的所有字軌資料。一共三層：1:財政部配給的字軌 2:給光貿用的字軌 3:發票字軌列表的內容

**POST** `/json/track_all`

#### 參數

| 欄位 | 必填 | 類型 | 描述 |
|------|------|------|------|
| Year | 必填 | Number | 西元年 |
| Period | 必填 | Number | 期別。0:01-02月 1:03-04月 2:05-06月 3:07-08月 4:09-10月 5:11-12月 |

#### 回應參數

| 欄位 | 類型 | 描述 |
|------|------|------|
| layer | Number | 層級 1/2/3 |
| category | Number | 1:自動配號 2:API配號 |
| code | String | 字軌名稱，英文兩碼 |
| start | String | 字軌起號 |
| end | String | 字軌訖號 |
| now | String | 目前配號 |
| total_booklet | Number | 總本數 |
| remark | String | 字軌別名 |
| TrackApiCode | String | API指定代碼 |
| source | Number | 字軌來源。1:系統匯入 2:人工輸入 |
| status | Number | 字軌狀態。1:使用 2:停用 3:過期 9:用畢 |

---

### 伺服器時間

查詢目前伺服器時間。不需要帶入 invoice、data、time 也不須要計算 sign，直接進入網址就可以看到伺服器時間。

**GET** `/json/time`

#### 回應範例

```json
{
  "timestamp": 1683776130,
  "text": "2023/05/11 11:35:30",
  "year": 2023,
  "month": 5,
  "day": 11,
  "hour": 11,
  "minute": 35,
  "second": 30
}
```

---

## 自行配號專用

### 字軌取號

取發票字軌，只能取用字軌類型為「API 配號」的字軌

**POST** `/json/track_get`

#### 參數

| 欄位 | 必填 | 類型 | 描述 |
|------|------|------|------|
| Year | 必填 | Number | 西元年 |
| Period | 必填 | Number | 期別。0:01-02月 1:03-04月 2:05-06月 3:07-08月 4:09-10月 5:11-12月 |
| Book | 必填 | Number | 本數，1本為50張發票 |

#### 請求範例

```json
{ "Year": 2022, "Period": 0, "Book": 2 }
```

#### 回應範例

```json
{
  "code": 0,
  "msg": "",
  "data": {
    "code": "MQ",
    "start": "00000000",
    "end": "00000099"
  }
}
```

---

### 字軌狀態

發票字軌配號狀態，只會回傳字軌類型為「API 配號」的字軌

**POST** `/json/track_status`

#### 參數

| 欄位 | 必填 | 類型 | 描述 |
|------|------|------|------|
| Year | 必填 | Number | 西元年 |
| Period | 必填 | Number | 期別。0:01-02月 1:03-04月 2:05-06月 3:07-08月 4:09-10月 5:11-12月 |

#### 回應參數

| 欄位 | 類型 | 描述 |
|------|------|------|
| code | String | 字軌名稱，英文兩碼 |
| start | String | 字軌起號 |
| end | String | 字軌訖號 |
| now | String | 目前配號 |
| total_booklet | Number | 總本數 |
| used_booklet | Number | 已使用本數 |
| status | Number | 字軌狀態。1:使用 2:停用 3:過期 9:用畢 |

---

### 開立發票(API配號)

需自行指定發票號碼、發票日期時間及隨機碼。上傳發票資訊後，會回傳是否成功。若有傳入熱感應機型號代碼，則會回傳的 base64_data 列印格式字串數值。若有傳入熱感應機型號代碼，一次只限制上傳一張。

**POST** `/json/f0401_custom`

#### 參數

| 欄位 | 必填 | 類型 | 描述 |
|------|------|------|------|
| InvoiceNumber | 必填 | String | 發票號碼 |
| InvoiceDate | 必填 | String | 發票日期，格式：YYYYMMDD |
| InvoiceTime | 必填 | String | 發票時間，格式：hh:mm:ss |
| BuyerIdentifier | 必填 | String | 買方統一編號，沒有則填入 0000000000 |
| BuyerName | 必填 | String | 買方名稱 |
| BuyerAddress | 選填 | String | 買方地址 |
| BuyerTelephoneNumber | 選填 | String | 買方電話 |
| BuyerEmailAddress | 選填 | String | 買方電子信箱 |
| MainRemark | 選填 | String | 總備註，不可超過200字 |
| CarrierType | 選填 | String | 載具類別 |
| CarrierId1 | 選填 | String | 載具顯碼 |
| CarrierId2 | 選填 | String | 載具隱碼 |
| PrintMark | 必填 | String | 列印註記，Y:列印 N:不列印 |
| NPOBAN | 選填 | String | 捐贈碼 |
| RandomNumber | 必填 | String | 隨機碼 |
| ProductItem | 必填 | Object[] | 商品陣列，最多 9999 筆 |
| ProductItem.Description | 必填 | String | 品名，不可超過256字 |
| ProductItem.Quantity | 必填 | Number | 數量 |
| ProductItem.Unit | 選填 | String | 單位，不可超過6字 |
| ProductItem.UnitPrice | 必填 | Number | 單價 |
| ProductItem.Amount | 必填 | Number | 小計 |
| ProductItem.Remark | 選填 | String | 備註，不可超過40字 |
| ProductItem.TaxType | 選填 | Number | 課稅別，預設為應稅。1：應稅 2：零稅率 3：免稅 |
| SalesAmount | 必填 | Number | 應稅銷售額合計 |
| FreeTaxSalesAmount | 必填 | Number | 免稅銷售額合計 |
| ZeroTaxSalesAmount | 必填 | Number | 零稅率銷售額合計 |
| TaxType | 必填 | Number | 課稅別 |
| TaxRate | 必填 | String | 稅率 |
| TaxAmount | 必填 | Number | 營業稅額 |
| TotalAmount | 必填 | Number | 總計 |
| CustomsClearanceMark | 選填 | Number | 通關方式註記 |
| ZeroTaxRateReason | 選填 | Number | 零稅率原因 |
| PrinterType | 選填 | Number | 熱感應機型號代碼 |
| PrinterLang | 選填 | Number | 熱感應機編碼 |
| order_id | 選填 | String | 訂單編號，不可重複，不可超過40字 |
| DetailVat | 選填 | Number | 明細為含稅或未稅。0:未稅價 1：含稅價 |
| DetailAmountRound | 選填 | Number | 明細小計處理方式 |

#### 請求範例

```json
[
  {
    "InvoiceNumber": "MQ00000004",
    "InvoiceDate": "20220426",
    "InvoiceTime": "21:35:01",
    "BuyerIdentifier": "28080623",
    "BuyerName": "光貿科技有限公司",
    "BuyerAddress": "",
    "BuyerTelephoneNumber": "",
    "BuyerEmailAddress": "",
    "MainRemark": "",
    "CarrierType": "",
    "CarrierId1": "",
    "CarrierId2": "",
    "PrintMark": "Y",
    "NPOBAN": "",
    "RandomNumber": "6713",
    "PrinterType": "2",
    "ProductItem": [
      {
        "Description": "測試商品",
        "Quantity": "1",
        "UnitPrice": "699",
        "Amount": "699",
        "SequenceNumber": "1",
        "Remark": ""
      }
    ],
    "SalesAmount": "666",
    "FreeTaxSalesAmount": "0",
    "ZeroTaxSalesAmount": "0",
    "TaxType": "1",
    "TaxRate": "0.05",
    "TaxAmount": "33",
    "TotalAmount": "699",
    "order_id": "1122042600005"
  }
]
```

#### 回應範例

```json
{
  "code": 0,
  "msg": "",
  "data": [
    {
      "invoice_number": "MQ00000004",
      "barcode": "11104MQ000000046713",
      "qrcode_left": "MQ00000004111042667130000029a000002bb2808062312345678HgZwSAdJ5EbTjUOiKSmBDg==:**********:1:1:0:測試商品:1:699",
      "qrcode_right": "**",
      "base64_data": "G0AbQ............."
    }
  ]
}
```

---

## 狀態碼說明

### 發票/折讓上傳狀態

| 狀態碼 | 說明 |
|--------|------|
| 1 | 待處理 |
| 2 | 上傳中 |
| 3 | 已上傳 |
| 31 | 處理中 |
| 32 | 處理完成／待確認 |
| 91 | 錯誤 |
| 99 | 完成 |

### 課稅別

| 代碼 | 說明 |
|------|------|
| 1 | 應稅 |
| 2 | 零稅率 |
| 3 | 免稅 |
| 4 | 應稅(特種稅率) |
| 9 | 混合應稅與免稅或零稅率 |

### 字軌狀態

| 狀態碼 | 說明 |
|--------|------|
| 1 | 使用 |
| 2 | 停用 |
| 3 | 過期 |
| 9 | 用畢 |

### 期別對照

| 代碼 | 月份 |
|------|------|
| 0 | 01-02月 |
| 1 | 03-04月 |
| 2 | 05-06月 |
| 3 | 07-08月 |
| 4 | 09-10月 |
| 5 | 11-12月 |

---

> 構建於 apidoc 1.2.0 - 2025-11-20
