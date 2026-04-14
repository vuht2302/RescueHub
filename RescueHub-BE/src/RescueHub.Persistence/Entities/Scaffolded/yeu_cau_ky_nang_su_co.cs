using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class yeu_cau_ky_nang_su_co
{
    public Guid id { get; set; }

    public Guid su_co_id { get; set; }

    public Guid ky_nang_id { get; set; }

    public Guid? cap_do_ky_nang_id { get; set; }

    public int required_count { get; set; }

    public bool is_mandatory { get; set; }

    public DateTime created_at { get; set; }

    public virtual cap_do_ky_nang? cap_do_ky_nang { get; set; }

    public virtual ky_nang ky_nang { get; set; } = null!;

    public virtual su_co su_co { get; set; } = null!;
}
