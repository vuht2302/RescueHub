using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class mission_member
{
    public Guid id { get; set; }

    public Guid mission_id { get; set; }

    public Guid team_member_id { get; set; }

    public virtual mission mission { get; set; } = null!;

    public virtual team_member team_member { get; set; } = null!;
}
