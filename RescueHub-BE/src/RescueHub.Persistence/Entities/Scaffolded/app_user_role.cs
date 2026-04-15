using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class app_user_role
{
    public Guid user_id { get; set; }

    public Guid role_id { get; set; }

    public DateTime assigned_at { get; set; }

    public virtual app_role role { get; set; } = null!;

    public virtual app_user user { get; set; } = null!;
}
