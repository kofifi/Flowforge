using Flowforge.Models;
using Microsoft.AspNetCore.Mvc;
using Flowforge.Services;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Flowforge.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BlocksController : ControllerBase
{
    private readonly IBlockService _service;

    public BlocksController(IBlockService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Block>>> GetAll()
    {
        var blocks = await _service.GetAllAsync();
        return Ok(blocks);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Block>> GetById(int id)
    {
        var block = await _service.GetByIdAsync(id);
        if (block == null)
            return NotFound();
        return Ok(block);
    }

    [HttpPost]
    public async Task<ActionResult<Block>> Create(Block block)
    {
        var created = await _service.CreateAsync(block);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, Block block)
    {
        if (id != block.Id)
            return BadRequest();

        var updated = await _service.UpdateAsync(id, block);
        if (!updated)
            return NotFound();

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _service.DeleteAsync(id);
        if (!deleted)
            return NotFound();

        return NoContent();
    }
}