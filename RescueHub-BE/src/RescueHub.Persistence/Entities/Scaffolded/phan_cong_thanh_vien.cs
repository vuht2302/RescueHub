using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class phan_cong_thanh_vien
{
    public Guid id { get; set; }

    public Guid phan_cong_doi_id { get; set; }

    public Guid thanh_vien_doi_id { get; set; }

    public string? mission_function_code { get; set; }

    public string? response_status_code { get; set; }

    public DateTime created_at { get; set; }

    public virtual phan_cong_doi phan_cong_doi { get; set; } = null!;

    public virtual thanh_vien_doi thanh_vien_doi { get; set; } = null!;
}
