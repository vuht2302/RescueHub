using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class nang_luc_phuong_tien
{
    public Guid id { get; set; }

    public string code { get; set; } = null!;

    public string name { get; set; } = null!;

    public string? description { get; set; }

    public DateTime created_at { get; set; }

    public DateTime updated_at { get; set; }

    public virtual ICollection<phuong_tien_nang_luc> phuong_tien_nang_lucs { get; set; } = new List<phuong_tien_nang_luc>();

    public virtual ICollection<yeu_cau_nang_luc_phuong_tien_su_co> yeu_cau_nang_luc_phuong_tien_su_cos { get; set; } = new List<yeu_cau_nang_luc_phuong_tien_su_co>();
}
