using Flowforge.Models;
using System.Collections.Generic;

namespace Flowforge.Services.Executors;

public interface IBlockExecutor
{
    string BlockType { get; }
    BlockExecutionResult Execute(Block block, Dictionary<string, string> variables);
}

