using System;
using System.Collections.Generic;
using NetTopologySuite.Geometries;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class vehicle
{
    public Guid id { get; set; }

    public string code { get; set; } = null!;

    public Guid vehicle_type_id { get; set; }

    public string display_name { get; set; } = null!;

    public string? plate_no { get; set; }

    public Guid? team_id { get; set; }

    public string status_code { get; set; } = null!;

    public int capacity_person { get; set; }

    public decimal capacity_weight_kg { get; set; }

    public Point? current_location { get; set; }

    public string? notes { get; set; }

    public DateTime created_at { get; set; }

    public virtual ICollection<mission_vehicle> mission_vehicles { get; set; } = new List<mission_vehicle>();

    public virtual team? team { get; set; }

    public virtual vehicle_type vehicle_type { get; set; } = null!;

    public virtual ICollection<vehicle_capability> vehicle_capabilities { get; set; } = new List<vehicle_capability>();
}
