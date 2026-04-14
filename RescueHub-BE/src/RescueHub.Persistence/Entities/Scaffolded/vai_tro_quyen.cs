using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class vai_tro_quyen
{
    public Guid id { get; set; }

    public Guid vai_tro_id { get; set; }

    public Guid quyen_id { get; set; }

    public DateTime created_at { get; set; }

    public virtual quyen quyen { get; set; } = null!;

    public virtual vai_tro vai_tro { get; set; } = null!;
}
