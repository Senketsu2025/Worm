using System.Net.Http.Json;
using worm_chat_blazor.Models;

namespace worm_chat_blazor.Services;

public class WormChatService
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;

    public WormChatService(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _apiKey = configuration["ApiKey"] ?? "";
    }

    public async Task<WormChatResponse?> SendMessageAsync(WormChatRequest request)
    {
        var httpRequest = new HttpRequestMessage(HttpMethod.Post, "/api/PostWormAPI")
        {
            Content = JsonContent.Create(new
            {
                id = request.Id,
                mailAddress = request.MailAddress,
                chatText = request.ChatText
            })
        };

        if (!string.IsNullOrEmpty(_apiKey))
        {
            httpRequest.Headers.Add("x-functions-key", _apiKey);
        }

        var response = await _httpClient.SendAsync(httpRequest);

        if (!response.IsSuccessStatusCode)
        {
            var statusCode = (int)response.StatusCode;
            if (statusCode == 400)
            {
                var errorData = await response.Content.ReadAsStringAsync();
                throw new HttpRequestException($"リクエストが無効です: {errorData}");
            }
            else if (statusCode == 502)
            {
                throw new HttpRequestException("AIサービスとの通信中にエラーが発生しました");
            }
            else
            {
                throw new HttpRequestException("予期せぬエラーが発生しました");
            }
        }

        return await response.Content.ReadFromJsonAsync<WormChatResponse>();
    }
}
