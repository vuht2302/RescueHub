using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class don_vi
{
    public Guid id { get; set; }

    public Guid to_chuc_id { get; set; }

    public Guid? parent_id { get; set; }

    public string code { get; set; } = null!;

    public string name { get; set; } = null!;

    public string? phone { get; set; }

    public string? email { get; set; }

    public string? address { get; set; }

    public bool is_active { get; set; }

    public DateTime created_at { get; set; }

    public DateTime updated_at { get; set; }

    public virtual ICollection<don_vi> Inverseparent { get; set; } = new List<don_vi>();

    public virtual ICollection<chien_dich_cuu_tro> chien_dich_cuu_tros { get; set; } = new List<chien_dich_cuu_tro>();

    public virtual ICollection<dia_diem> dia_diems { get; set; } = new List<dia_diem>();

    public virtual ICollection<nguoi_dung_vai_tro> nguoi_dung_vai_tros { get; set; } = new List<nguoi_dung_vai_tro>();

    public virtual ICollection<nguoi_dung> nguoi_dungs { get; set; } = new List<nguoi_dung>();

    public virtual don_vi? parent { get; set; }

    public virtual to_chuc to_chuc { get; set; } = null!;

    public virtual ICollection<vung_phu_trach> vung_phu_traches { get; set; } = new List<vung_phu_trach>();
}
