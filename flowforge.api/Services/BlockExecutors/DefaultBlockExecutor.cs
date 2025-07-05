using Flowforge.Models;
using System.Collections.Generic;

namespace Flowforge.Services;

public class DefaultBlockExecutor : IBlockExecutor
{
    public bool CanExecute(Block block) => true;

    public BlockExecutionResult Execute(Block block, Dictionary<string, string> variables)
    {
        var name = string.IsNullOrWhiteSpace(block.Name)
            ? block.SystemBlock?.Type ?? block.Id.ToString()
            : block.Name;
        var description = block.SystemBlock?.Description ?? $"Executed block {name}";
        return new BlockExecutionResult(description, false);
    }
}
