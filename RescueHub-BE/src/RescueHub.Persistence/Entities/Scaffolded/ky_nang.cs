using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class ky_nang
{
    public Guid id { get; set; }

    public string code { get; set; } = null!;

    public string name { get; set; } = null!;

    public string? skill_domain_code { get; set; }

    public string? description { get; set; }

    public bool is_active { get; set; }

    public DateTime created_at { get; set; }

    public DateTime updated_at { get; set; }

    public virtual ICollection<ky_nang_thanh_vien> ky_nang_thanh_viens { get; set; } = new List<ky_nang_thanh_vien>();

    public virtual ICollection<yeu_cau_ky_nang_su_co> yeu_cau_ky_nang_su_cos { get; set; } = new List<yeu_cau_ky_nang_su_co>();
}
