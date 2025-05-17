using Flowforge.Models;
using Flowforge.Services;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Flowforge.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SystemBlockController : ControllerBase
{
    private readonly ISystemBlockService _service;

    public SystemBlockController(ISystemBlockService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<SystemBlock>>> GetAll()
    {
        var systemBlocks = await _service.GetAllAsync();
        return Ok(systemBlocks);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<SystemBlock>> GetById(int id)
    {
        var systemBlock = await _service.GetByIdAsync(id);
        if (systemBlock == null)
            return NotFound();
        return Ok(systemBlock);
    }

    [HttpPost]
    public async Task<ActionResult<SystemBlock>> Create(SystemBlock systemBlock)
    {
        var created = await _service.CreateAsync(systemBlock);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, SystemBlock systemBlock)
    {
        if (id != systemBlock.Id)
            return BadRequest();

        var updated = await _service.UpdateAsync(id, systemBlock);
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