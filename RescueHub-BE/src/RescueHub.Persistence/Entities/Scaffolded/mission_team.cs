using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class mission_team
{
    public Guid id { get; set; }

    public Guid mission_id { get; set; }

    public Guid team_id { get; set; }

    public bool is_primary_team { get; set; }

    public DateTime assigned_at { get; set; }

    public DateTime? accepted_at { get; set; }

    public DateTime? rejected_at { get; set; }

    public string? response_note { get; set; }

    public virtual mission mission { get; set; } = null!;

    public virtual team team { get; set; } = null!;
}
