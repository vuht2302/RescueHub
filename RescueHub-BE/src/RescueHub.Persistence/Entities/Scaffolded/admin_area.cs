using System;
using System.Collections.Generic;
using NetTopologySuite.Geometries;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class admin_area
{
    public Guid id { get; set; }

    public string code { get; set; } = null!;

    public string name { get; set; } = null!;

    public string level_code { get; set; } = null!;

    public Guid? parent_id { get; set; }

    public MultiPolygon? geom { get; set; }

    public Point? centroid { get; set; }

    public DateTime created_at { get; set; }

    public virtual ICollection<admin_area> Inverseparent { get; set; } = new List<admin_area>();

    public virtual ICollection<flood_risk_zone> flood_risk_zones { get; set; } = new List<flood_risk_zone>();

    public virtual ICollection<household> households { get; set; } = new List<household>();

    public virtual ICollection<incident_location> incident_locations { get; set; } = new List<incident_location>();

    public virtual admin_area? parent { get; set; }

    public virtual ICollection<relief_campaign> relief_campaigns { get; set; } = new List<relief_campaign>();

    public virtual ICollection<relief_point> relief_points { get; set; } = new List<relief_point>();

    public virtual ICollection<relief_request> relief_requests { get; set; } = new List<relief_request>();

    public virtual ICollection<team> teams { get; set; } = new List<team>();

    public virtual ICollection<warehouse> warehouses { get; set; } = new List<warehouse>();
}
