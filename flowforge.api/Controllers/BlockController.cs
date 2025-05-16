using Flowforge.Models;
using Microsoft.AspNetCore.Mvc;
using Flowforge.Repositories;

namespace Flowforge.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BlocksController : ControllerBase
{
    private readonly IBlockRepository _repository;

    public BlocksController(IBlockRepository repository)
    {
        _repository = repository;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Block>>> GetAll()
    {
        var blocks = await _repository.GetAllAsync();
        return Ok(blocks);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Block>> GetById(int id)
    {
        var block = await _repository.GetByIdAsync(id);
        if (block == null)
            return NotFound();
        return Ok(block);
    }

    [HttpPost]
    public async Task<ActionResult<Block>> Create(Block block)
    {
        var created = await _repository.AddAsync(block);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, Block block)
    {
        if (id != block.Id)
            return BadRequest();

        var updated = await _repository.UpdateAsync(block);
        if (!updated)
            return NotFound();

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _repository.DeleteAsync(id);
        if (!deleted)
            return NotFound();

        return NoContent();
    }
}