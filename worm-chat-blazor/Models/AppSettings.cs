namespace worm_chat_blazor.Models;

public class AppSettings
{
    public string ApiBaseUrl { get; set; } = "";
    public string ApiKey { get; set; } = "";
    public int SessionTimeoutMinutes { get; set; } = 1440;
}
