using System.Collections.Generic;

namespace Flowforge.Models;

public class SwitchConfig
{
    /// <summary>
    /// Expression or variable reference (prefix with $) used to decide the branch.
    /// </summary>
    public string Expression { get; set; } = string.Empty;

    /// <summary>
    /// Case labels mapped to target handles (persisted on connections as Label).
    /// </summary>
    public List<string> Cases { get; set; } = new();
}
