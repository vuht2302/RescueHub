using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class incident_requirement_skill
{
    public Guid id { get; set; }

    public Guid incident_id { get; set; }

    public Guid skill_id { get; set; }

    public string level_code { get; set; } = null!;

    public int required_count { get; set; }

    public virtual incident incident { get; set; } = null!;

    public virtual skill skill { get; set; } = null!;
}
