using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class audit_log
{
    public Guid id { get; set; }

    public string entity_type_code { get; set; } = null!;

    public Guid? entity_id { get; set; }

    public string action_code { get; set; } = null!;

    public Guid? performed_by_user_id { get; set; }

    public string? note { get; set; }

    public string? before_json { get; set; }

    public string? after_json { get; set; }

    public string? trace_id { get; set; }

    public string? request_id { get; set; }

    public string? ip_address { get; set; }

    public DateTime created_at { get; set; }

    public virtual app_user? performed_by_user { get; set; }
}
