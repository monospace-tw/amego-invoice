/**
 * 光貿電子發票 API 範例 - Java
 * B2C - 開立發票
 */

import java.security.MessageDigest;
import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;

public class AmegoInvoice {
    public static void main(String[] args) {
        String APP_KEY = "sHeq7t8G1wiQvhAuIM27";

        // B2C - 開立發票 + 列印
        String sUrl = "https://invoice-api.amego.tw/json/f0401";

        // Unix Timesatmp 10位數，不含毫秒
        long nCurrent_Now_Time = System.currentTimeMillis() / 1000;

        String sApi_Data = "{\"OrderId\":\"A20200817105934\",\"BuyerIdentifier\":\"28080623\",\"BuyerName\":\"光貿科技有限公司\",\"NPOBAN\":\"\",\"ProductItem\":[{\"Description\":\"測試商品1\",\"Quantity\":\"1\",\"UnitPrice\":\"170\",\"Amount\":\"170\",\"Remark\":\"\",\"TaxType\":\"1\"},{\"Description\":\"會員折抵\",\"Quantity\":\"1\",\"UnitPrice\":\"-2\",\"Amount\":\"-2\",\"Remark\":\"\",\"TaxType\":\"1\"}],\"SalesAmount\":\"160\",\"FreeTaxSalesAmount\":\"0\",\"ZeroTaxSalesAmount\":\"0\",\"TaxType\":\"1\",\"TaxRate\":\"0.05\",\"TaxAmount\":\"8\",\"TotalAmount\":\"168\"}";

        // 計算簽名: md5(發票資料+時間戳記+APP KEY)
        String sHash_Text = sApi_Data + nCurrent_Now_Time + APP_KEY;

        String sSign = "";
        try {
            // md5 加密前，加密內容請先轉 UTF-8
            byte[] bytesOfMessage = sHash_Text.getBytes("UTF-8");
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] theMD5digest = md.digest(bytesOfMessage);
            StringBuilder strBuilder = new StringBuilder();
            for (byte b : theMD5digest) {
                strBuilder.append(String.format("%02x", b));
            }
            sSign = strBuilder.toString();
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
