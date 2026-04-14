using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class nhat_ky_he_thong
{
    public Guid id { get; set; }

    public string entity_type { get; set; } = null!;

    public Guid? entity_id { get; set; }

    public string action_code { get; set; } = null!;

    public string? before_json { get; set; }

    public string? after_json { get; set; }

    public Guid? changed_by { get; set; }

    public DateTime changed_at { get; set; }

    public string? request_id { get; set; }

    public string? ip_address { get; set; }

    public string? device_info { get; set; }

    public virtual nguoi_dung? changed_byNavigation { get; set; }
}
