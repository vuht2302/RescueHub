using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class lich_su_san_sang_thanh_vien
{
    public Guid id { get; set; }

    public Guid thanh_vien_doi_id { get; set; }

    public string status_code { get; set; } = null!;

    public DateTime from_at { get; set; }

    public DateTime? to_at { get; set; }

    public Guid? ly_do_id { get; set; }

    public string? note { get; set; }

    public DateTime created_at { get; set; }

    public virtual ly_do? ly_do { get; set; }

    public virtual thanh_vien_doi thanh_vien_doi { get; set; } = null!;
}
