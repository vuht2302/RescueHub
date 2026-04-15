using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class rescue_ack
{
    public Guid id { get; set; }

    public Guid incident_id { get; set; }

    public string ack_method_code { get; set; } = null!;

    public string? ack_by_name { get; set; }

    public string? ack_phone { get; set; }

    public string? note { get; set; }

    public DateTime ack_at { get; set; }

    public virtual incident incident { get; set; } = null!;
}
