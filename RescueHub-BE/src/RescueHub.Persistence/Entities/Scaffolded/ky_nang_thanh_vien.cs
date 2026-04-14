using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class ky_nang_thanh_vien
{
    public Guid id { get; set; }

    public Guid thanh_vien_doi_id { get; set; }

    public Guid ky_nang_id { get; set; }

    public Guid? cap_do_ky_nang_id { get; set; }

    public bool is_primary_skill { get; set; }

    public Guid? verified_by { get; set; }

    public DateTime? verified_at { get; set; }

    public DateOnly? expires_at { get; set; }

    public string? note { get; set; }

    public DateTime created_at { get; set; }

    public virtual cap_do_ky_nang? cap_do_ky_nang { get; set; }

    public virtual ky_nang ky_nang { get; set; } = null!;

    public virtual thanh_vien_doi thanh_vien_doi { get; set; } = null!;

    public virtual nguoi_dung? verified_byNavigation { get; set; }
}
