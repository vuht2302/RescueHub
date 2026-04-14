using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class workflow_process
{
    public Guid id { get; set; }

    public string code { get; set; } = null!;

    public string name { get; set; } = null!;

    public string entity_type { get; set; } = null!;

    public DateTime created_at { get; set; }

    public DateTime updated_at { get; set; }

    public virtual ICollection<workflow_state> workflow_states { get; set; } = new List<workflow_state>();

    public virtual ICollection<workflow_transition> workflow_transitions { get; set; } = new List<workflow_transition>();
}
