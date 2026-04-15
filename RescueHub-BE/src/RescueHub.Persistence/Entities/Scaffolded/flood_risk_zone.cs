using System;
using System.Collections.Generic;
using NetTopologySuite.Geometries;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class flood_risk_zone
{
    public Guid id { get; set; }

    public string code { get; set; } = null!;

    public string name { get; set; } = null!;

    public Guid? admin_area_id { get; set; }

    public string risk_level_code { get; set; } = null!;

    public string? description { get; set; }

    public MultiPolygon geom { get; set; } = null!;

    public DateTime created_at { get; set; }

    public virtual admin_area? admin_area { get; set; }
}
