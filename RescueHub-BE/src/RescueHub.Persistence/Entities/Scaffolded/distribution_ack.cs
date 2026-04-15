using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class distribution_ack
{
    public Guid id { get; set; }

    public Guid distribution_id { get; set; }

    public string ack_method_code { get; set; } = null!;

    public string? ack_code { get; set; }

    public string? ack_by_name { get; set; }

    public string? ack_phone { get; set; }

    public string? ack_note { get; set; }

    public DateTime ack_at { get; set; }

    public virtual distribution distribution { get; set; } = null!;
}
