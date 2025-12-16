namespace worm_chat_blazor.Models;

public class WormChatRequest
{
    public string? Id { get; set; }
    public required string MailAddress { get; set; }
    public required string ChatText { get; set; }
}

public class WormChatResponse
{
    public required string Id { get; set; }
    public required string OutputText { get; set; }
}

public class ChatMessage
{
    public required string Role { get; set; }
    public required string Content { get; set; }
}
