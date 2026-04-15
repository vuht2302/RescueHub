using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class user_notification
{
    public Guid id { get; set; }

    public Guid notification_id { get; set; }

    public Guid user_id { get; set; }

    public bool is_read { get; set; }

    public DateTime? read_at { get; set; }

    public virtual notification notification { get; set; } = null!;

    public virtual app_user user { get; set; } = null!;
}
