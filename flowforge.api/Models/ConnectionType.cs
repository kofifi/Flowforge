using System.Text.Json.Serialization;

namespace Flowforge.Models;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum ConnectionType
{
    Success,
    Error
}
