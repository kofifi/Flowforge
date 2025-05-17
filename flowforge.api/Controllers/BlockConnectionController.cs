using Flowforge.Models;
using Flowforge.Services;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Flowforge.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BlockConnectionController : ControllerBase
{
    private readonly IBlockConnectionService _service;

    public BlockConnectionController(IBlockConnectionService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<BlockConnection>>> GetAll()
    {
        var connections = await _service.GetAllAsync();
        return Ok(connections);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<BlockConnection>> GetById(int id)
    {
        var connection = await _service.GetByIdAsync(id);
        if (connection == null)
            return NotFound();
        return Ok(connection);
    }

    [HttpPost]
    public async Task<ActionResult<BlockConnection>> Create(BlockConnection connection)
    {
        var created = await _service.CreateAsync(connection);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, BlockConnection connection)
    {
        if (id != connection.Id)
            return BadRequest();

        var updated = await _service.UpdateAsync(id, connection);
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