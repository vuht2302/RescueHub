using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class mission_vehicle
{
    public Guid id { get; set; }

    public Guid mission_id { get; set; }

    public Guid vehicle_id { get; set; }

    public virtual mission mission { get; set; } = null!;

    public virtual vehicle vehicle { get; set; } = null!;
}
