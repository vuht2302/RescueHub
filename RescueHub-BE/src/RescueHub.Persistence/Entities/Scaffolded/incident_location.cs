using System;
using System.Collections.Generic;
using NetTopologySuite.Geometries;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class incident_location
{
    public Guid id { get; set; }

    public Guid incident_id { get; set; }

    public Guid? admin_area_id { get; set; }

    public string address_text { get; set; } = null!;

    public string? landmark { get; set; }

    public decimal lat { get; set; }

    public decimal lng { get; set; }

    public Point geom { get; set; } = null!;

    public decimal? flood_depth_m { get; set; }

    public string? water_current_code { get; set; }

    public string? accessibility_code { get; set; }

    public DateTime created_at { get; set; }

    public virtual admin_area? admin_area { get; set; }

    public virtual incident incident { get; set; } = null!;
}
