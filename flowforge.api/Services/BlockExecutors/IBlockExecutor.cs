using Flowforge.Models;
using System.Collections.Generic;

namespace Flowforge.Services;

public interface IBlockExecutor
{
    bool CanExecute(Block block);
    BlockExecutionResult Execute(Block block, Dictionary<string, string> variables);
}

public record BlockExecutionResult(string Description, bool Error);
