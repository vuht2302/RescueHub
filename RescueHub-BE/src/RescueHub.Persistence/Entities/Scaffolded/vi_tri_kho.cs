using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class vi_tri_kho
{
    public Guid id { get; set; }

    public Guid khu_kho_id { get; set; }

    public string bin_code { get; set; } = null!;

    public string bin_name { get; set; } = null!;

    public string? bin_type_code { get; set; }

    public decimal? capacity_weight_kg { get; set; }

    public decimal? capacity_volume_m3 { get; set; }

    public string status_code { get; set; } = null!;

    public DateTime created_at { get; set; }

    public DateTime updated_at { get; set; }

    public virtual ICollection<chi_tiet_phieu_kho> chi_tiet_phieu_khofrom_vi_tri_khos { get; set; } = new List<chi_tiet_phieu_kho>();

    public virtual ICollection<chi_tiet_phieu_kho> chi_tiet_phieu_khoto_vi_tri_khos { get; set; } = new List<chi_tiet_phieu_kho>();

    public virtual ICollection<dat_cho_ton_kho> dat_cho_ton_khos { get; set; } = new List<dat_cho_ton_kho>();

    public virtual khu_kho khu_kho { get; set; } = null!;

    public virtual ICollection<ton_kho> ton_khos { get; set; } = new List<ton_kho>();
}
