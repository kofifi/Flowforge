namespace Flowforge.Models;

public enum HttpRequestAuthType
{
    none,
    bearer,
    basic,
    apiKeyHeader,
    apiKeyQuery
}

public class HttpRequestHeader
{
    public string Name { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
}

public class HttpRequestConfig
{
    public string Method { get; set; } = "GET";
    public string Url { get; set; } = string.Empty;
    public string? Body { get; set; }
    public List<HttpRequestHeader> Headers { get; set; } = new();
    public HttpRequestAuthType AuthType { get; set; } = HttpRequestAuthType.none;
    public string? BearerToken { get; set; }
    public string? BasicUsername { get; set; }
    public string? BasicPassword { get; set; }
    public string? ApiKeyName { get; set; }
    public string? ApiKeyValue { get; set; }
    public string? ResponseVariable { get; set; }
}

public enum ParserFormat
{
    json,
    xml
}

public class ParserMapping
{
    public string Path { get; set; } = string.Empty;
    public string Variable { get; set; } = string.Empty;
}

public class ParserConfig
{
    public ParserFormat Format { get; set; } = ParserFormat.json;
    public string SourceVariable { get; set; } = string.Empty;
    public List<ParserMapping> Mappings { get; set; } = new();
}
