using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class doi_phuong_tien
{
    public Guid id { get; set; }

    public Guid doi_cuu_ho_id { get; set; }

    public Guid phuong_tien_id { get; set; }

    public DateTime effective_from { get; set; }

    public DateTime? effective_to { get; set; }

    public DateTime created_at { get; set; }

    public virtual doi_cuu_ho doi_cuu_ho { get; set; } = null!;

    public virtual phuong_tien phuong_tien { get; set; } = null!;
}
