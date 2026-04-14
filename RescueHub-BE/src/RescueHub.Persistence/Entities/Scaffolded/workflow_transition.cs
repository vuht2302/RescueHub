using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class workflow_transition
{
    public Guid id { get; set; }

    public Guid workflow_process_id { get; set; }

    public Guid from_state_id { get; set; }

    public Guid to_state_id { get; set; }

    public string action_code { get; set; } = null!;

    public string action_name { get; set; } = null!;

    public bool requires_reason { get; set; }

    public bool requires_note { get; set; }

    public DateTime created_at { get; set; }

    public virtual workflow_state from_state { get; set; } = null!;

    public virtual workflow_state to_state { get; set; } = null!;

    public virtual workflow_process workflow_process { get; set; } = null!;
}
