using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class mission_support_request
{
    public Guid id { get; set; }

    public Guid mission_id { get; set; }

    public string support_type_code { get; set; } = null!;

    public string status_code { get; set; } = null!;

    public string reason_code { get; set; } = null!;

    public string? detail_note { get; set; }

    public Guid? requested_by_user_id { get; set; }

    public DateTime requested_at { get; set; }

    public Guid? decided_by_user_id { get; set; }

    public DateTime? decided_at { get; set; }

    public virtual app_user? decided_by_user { get; set; }

    public virtual mission mission { get; set; } = null!;

    public virtual app_user? requested_by_user { get; set; }
}
