using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class chung_chi_thanh_vien
{
    public Guid id { get; set; }

    public Guid thanh_vien_doi_id { get; set; }

    public Guid chung_chi_id { get; set; }

    public string? cert_no { get; set; }

    public DateOnly? issued_at { get; set; }

    public DateOnly? expires_at { get; set; }

    public Guid? tep_tin_id { get; set; }

    public DateTime created_at { get; set; }

    public virtual chung_chi chung_chi { get; set; } = null!;

    public virtual tep_tin? tep_tin { get; set; }

    public virtual thanh_vien_doi thanh_vien_doi { get; set; } = null!;
}
