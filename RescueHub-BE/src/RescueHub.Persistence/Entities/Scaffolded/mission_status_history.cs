using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class mission_status_history
{
    public Guid id { get; set; }

    public Guid mission_id { get; set; }

    public string? from_status_code { get; set; }

    public string to_status_code { get; set; } = null!;

    public string action_code { get; set; } = null!;

    public string? note { get; set; }

    public Guid? changed_by_user_id { get; set; }

    public DateTime changed_at { get; set; }

    public virtual app_user? changed_by_user { get; set; }

    public virtual mission mission { get; set; } = null!;
}
