using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class tep_tin_su_co
{
    public Guid id { get; set; }

    public Guid su_co_id { get; set; }

    public Guid tep_tin_id { get; set; }

    public string? media_role_code { get; set; }

    public DateTime? captured_at { get; set; }

    public Guid? uploaded_by { get; set; }

    public DateTime created_at { get; set; }

    public virtual su_co su_co { get; set; } = null!;

    public virtual tep_tin tep_tin { get; set; } = null!;

    public virtual nguoi_dung? uploaded_byNavigation { get; set; }
}
