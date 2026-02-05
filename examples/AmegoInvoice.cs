/**
 * 光貿電子發票 API 範例 - C#
 * B2C - 開立發票
 */

using System;
using System.Security.Cryptography;
using System.Text;
using System.Collections.Generic;
using System.Net.Http;
using System.Threading.Tasks;

public class AmegoInvoice
{
    public static async Task Main(string[] args)
    {
        string url = "https://invoice-api.amego.tw/json/f0401";
        string invoice = "12345678";
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
