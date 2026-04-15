using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class team_member_skill
{
    public Guid id { get; set; }

    public Guid team_member_id { get; set; }

    public Guid skill_id { get; set; }

    public string level_code { get; set; } = null!;

    public bool is_primary { get; set; }

    public virtual skill skill { get; set; } = null!;

    public virtual team_member team_member { get; set; } = null!;
}
