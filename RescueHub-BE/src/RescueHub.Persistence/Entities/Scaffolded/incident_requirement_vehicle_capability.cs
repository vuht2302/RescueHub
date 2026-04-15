using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class incident_requirement_vehicle_capability
{
    public Guid id { get; set; }

    public Guid incident_id { get; set; }

    public Guid vehicle_capability_id { get; set; }

    public int required_count { get; set; }

    public virtual incident incident { get; set; } = null!;

    public virtual vehicle_capability vehicle_capability { get; set; } = null!;
}
