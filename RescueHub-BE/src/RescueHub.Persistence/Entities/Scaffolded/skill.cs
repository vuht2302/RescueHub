using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class skill
{
    public Guid id { get; set; }

    public string code { get; set; } = null!;

    public string name { get; set; } = null!;

    public string? description { get; set; }

    public virtual ICollection<incident_requirement_skill> incident_requirement_skills { get; set; } = new List<incident_requirement_skill>();

    public virtual ICollection<team_member_skill> team_member_skills { get; set; } = new List<team_member_skill>();
}
