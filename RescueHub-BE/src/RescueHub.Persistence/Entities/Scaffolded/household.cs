using System;
using System.Collections.Generic;
using NetTopologySuite.Geometries;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class household
{
    public Guid id { get; set; }

    public string code { get; set; } = null!;

    public string head_name { get; set; } = null!;

    public string? phone { get; set; }

    public Guid? admin_area_id { get; set; }

    public string address_text { get; set; } = null!;

    public Point? geom { get; set; }

    public int member_count { get; set; }

    public int vulnerable_count { get; set; }

    public virtual admin_area? admin_area { get; set; }

    public virtual ICollection<distribution> distributions { get; set; } = new List<distribution>();
}
