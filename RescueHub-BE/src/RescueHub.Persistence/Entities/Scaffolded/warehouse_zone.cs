using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class warehouse_zone
{
    public Guid id { get; set; }

    public Guid warehouse_id { get; set; }

    public string code { get; set; } = null!;

    public string name { get; set; } = null!;

    public virtual warehouse warehouse { get; set; } = null!;

    public virtual ICollection<warehouse_bin> warehouse_bins { get; set; } = new List<warehouse_bin>();
}
