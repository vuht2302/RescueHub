using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class bao_cao_hien_truong_tep_tin
{
    public Guid id { get; set; }

    public Guid bao_cao_hien_truong_id { get; set; }

    public Guid tep_tin_id { get; set; }

    public DateTime created_at { get; set; }

    public virtual bao_cao_hien_truong bao_cao_hien_truong { get; set; } = null!;

    public virtual tep_tin tep_tin { get; set; } = null!;
}
