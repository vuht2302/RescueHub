using System;
using System.Collections.Generic;
using NetTopologySuite.Geometries;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class relief_request
{
    public Guid id { get; set; }

    public string code { get; set; } = null!;

    public string source_type_code { get; set; } = null!;

    public string requester_name { get; set; } = null!;

    public string requester_phone { get; set; } = null!;

    public Guid? linked_incident_id { get; set; }

    public Guid? campaign_id { get; set; }

    public string status_code { get; set; } = null!;

    public Guid? admin_area_id { get; set; }

    public string address_text { get; set; } = null!;

    public Point? geom { get; set; }

    public int household_count { get; set; }

    public string? note { get; set; }

    public DateTime created_at { get; set; }

    public DateTime updated_at { get; set; }

    public virtual admin_area? admin_area { get; set; }

    public virtual relief_campaign? campaign { get; set; }

    public virtual incident? linked_incident { get; set; }

    public virtual ICollection<relief_request_item> relief_request_items { get; set; } = new List<relief_request_item>();
}
