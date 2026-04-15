using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class vehicle_capability
{
    public Guid id { get; set; }

    public string code { get; set; } = null!;

    public string name { get; set; } = null!;

    public string? description { get; set; }

    public virtual ICollection<incident_requirement_vehicle_capability> incident_requirement_vehicle_capabilities { get; set; } = new List<incident_requirement_vehicle_capability>();

    public virtual ICollection<vehicle> vehicles { get; set; } = new List<vehicle>();
}
