using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Flowforge.Models;
using Microsoft.AspNetCore.WebUtilities;
using System.Text.Json.Serialization;

namespace Flowforge.Services;

public class HttpRequestBlockExecutor : IBlockExecutor
{
    private readonly IHttpClientFactory _httpClientFactory;

    public HttpRequestBlockExecutor(IHttpClientFactory httpClientFactory)
    {
        _httpClientFactory = httpClientFactory;
    }

    public bool CanExecute(Block block)
        => block.SystemBlock?.Type == "HttpRequest" && !string.IsNullOrWhiteSpace(block.JsonConfig);

    public BlockExecutionResult Execute(Block block, Dictionary<string, string> variables)
    {
        if (string.IsNullOrWhiteSpace(block.JsonConfig))
        {
          return new BlockExecutionResult($"HTTP request block '{block.Name}' has no configuration.", true);
        }

        HttpRequestConfig? config;
        try
        {
            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            };
            options.Converters.Add(new JsonStringEnumConverter(JsonNamingPolicy.CamelCase));
            config = JsonSerializer.Deserialize<HttpRequestConfig>(block.JsonConfig, options);
        }
        catch (Exception ex)
        {
            return new BlockExecutionResult($"Invalid HTTP config for '{block.Name}': {ex.Message}", true);
        }

        if (config == null || string.IsNullOrWhiteSpace(config.Url))
        {
            return new BlockExecutionResult($"HTTP request block '{block.Name}' is missing a URL.", true);
        }

        var method = new HttpMethod((config.Method ?? "GET").ToUpperInvariant());
        using var client = _httpClientFactory.CreateClient();
        using var request = new HttpRequestMessage(method, config.Url);

        if (config.Headers != null)
        {
            foreach (var header in config.Headers)
            {
                if (string.IsNullOrWhiteSpace(header?.Name)) continue;
                request.Headers.TryAddWithoutValidation(header.Name, header.Value ?? string.Empty);
            }
        }

        switch (config.AuthType)
        {
            case HttpRequestAuthType.bearer when !string.IsNullOrWhiteSpace(config.BearerToken):
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", config.BearerToken);
                break;
            case HttpRequestAuthType.basic:
                var user = config.BasicUsername ?? string.Empty;
                var pass = config.BasicPassword ?? string.Empty;
                var raw = Encoding.UTF8.GetBytes($"{user}:{pass}");
                request.Headers.Authorization = new AuthenticationHeaderValue("Basic", Convert.ToBase64String(raw));
                break;
            case HttpRequestAuthType.apiKeyHeader when !string.IsNullOrWhiteSpace(config.ApiKeyName):
                request.Headers.TryAddWithoutValidation(config.ApiKeyName, config.ApiKeyValue ?? string.Empty);
                break;
            case HttpRequestAuthType.apiKeyQuery when !string.IsNullOrWhiteSpace(config.ApiKeyName):
                var uriWithQuery = QueryHelpers.AddQueryString(config.Url, config.ApiKeyName, config.ApiKeyValue ?? string.Empty);
                request.RequestUri = new Uri(uriWithQuery);
                break;
        }

        if (method != HttpMethod.Get && !string.IsNullOrEmpty(config.Body))
        {
            request.Content = new StringContent(config.Body, Encoding.UTF8, "application/json");
        }

        try
        {
            var response = client.SendAsync(request).GetAwaiter().GetResult();
            var body = response.Content.ReadAsStringAsync().GetAwaiter().GetResult();

            variables["http.status"] = ((int)response.StatusCode).ToString();
            variables["http.body"] = body;
            variables["http.ok"] = response.IsSuccessStatusCode ? "true" : "false";
            if (!string.IsNullOrWhiteSpace(config.ResponseVariable))
            {
                var key = config.ResponseVariable.TrimStart('$');
                variables[key] = body;
            }

            var description = $"HTTP {method.Method} {request.RequestUri} => {(int)response.StatusCode}";
            var error = !response.IsSuccessStatusCode;
            return new BlockExecutionResult(description, error);
        }
        catch (Exception ex)
        {
            return new BlockExecutionResult($"HTTP request failed: {ex.Message}", true);
        }
    }
}
