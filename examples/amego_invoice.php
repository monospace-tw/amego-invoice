<?php
/**
 * 光貿電子發票 API 範例 - PHP
 * B2C - 開立發票
 */

// API URL
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
